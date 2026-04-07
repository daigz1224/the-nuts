import { describe, it, expect } from 'vitest'
import {
  ActionType,
  getAvailableActions,
  resolveActionAmount,
} from '../betting'

describe('getAvailableActions', () => {
  const BB = 20

  it('allows check or bet when no bet outstanding', () => {
    const actions = getAvailableActions(1000, 0, 0, BB, BB)
    expect(actions.canCheck).toBe(true)
    expect(actions.canCall).toBe(false)
    expect(actions.canBet).toBe(true)
    expect(actions.canRaise).toBe(false)
    expect(actions.minBet).toBe(BB)
    expect(actions.maxBet).toBe(1000)
  })

  it('allows fold, call, or raise when bet exists', () => {
    const actions = getAvailableActions(1000, 40, 0, 40, BB)
    expect(actions.canFold).toBe(true)
    expect(actions.canCheck).toBe(false)
    expect(actions.canCall).toBe(true)
    expect(actions.callAmount).toBe(40)
    expect(actions.canRaise).toBe(true)
    expect(actions.minBet).toBe(80) // 40 + 40 min raise
  })

  it('only fold or all-in when chips <= call amount', () => {
    const actions = getAvailableActions(30, 50, 0, 50, BB)
    expect(actions.canFold).toBe(true)
    expect(actions.canCheck).toBe(false)
    expect(actions.canCall).toBe(false)
    expect(actions.canRaise).toBe(false)
    // Can go all-in for 30
    expect(actions.minBet).toBe(30)
    expect(actions.maxBet).toBe(30)
  })

  it('accounts for chips already bet this round', () => {
    // Player already put 20 in, current bet is 40, so they need 20 more to call
    const actions = getAvailableActions(980, 40, 20, 40, BB)
    expect(actions.callAmount).toBe(20)
    expect(actions.canCall).toBe(true)
  })

  it('min raise is current bet + min raise increment', () => {
    // Bet is 100, min raise was 60 (someone raised from 40 to 100)
    const actions = getAvailableActions(1000, 100, 0, 60, BB)
    expect(actions.minBet).toBe(160) // 100 + 60
  })
})

describe('resolveActionAmount', () => {
  it('fold costs nothing', () => {
    const r = resolveActionAmount(ActionType.Fold, 0, 1000, 50, 0)
    expect(r.chipsSpent).toBe(0)
    expect(r.newBet).toBe(0)
  })

  it('check costs nothing', () => {
    const r = resolveActionAmount(ActionType.Check, 0, 1000, 0, 0)
    expect(r.chipsSpent).toBe(0)
    expect(r.newBet).toBe(0)
  })

  it('call matches the current bet', () => {
    const r = resolveActionAmount(ActionType.Call, 0, 1000, 50, 0)
    expect(r.chipsSpent).toBe(50)
    expect(r.newBet).toBe(50)
  })

  it('call with partial existing bet', () => {
    const r = resolveActionAmount(ActionType.Call, 0, 1000, 50, 20)
    expect(r.chipsSpent).toBe(30)
    expect(r.newBet).toBe(50)
  })

  it('call all-in when short', () => {
    const r = resolveActionAmount(ActionType.Call, 0, 30, 50, 0)
    expect(r.chipsSpent).toBe(30)
    expect(r.newBet).toBe(30)
  })

  it('raise to specified amount', () => {
    // Raise to 100 when already put in 0
    const r = resolveActionAmount(ActionType.Raise, 100, 1000, 50, 0)
    expect(r.chipsSpent).toBe(100)
    expect(r.newBet).toBe(100)
  })

  it('bet specified amount', () => {
    const r = resolveActionAmount(ActionType.Bet, 50, 1000, 0, 0)
    expect(r.chipsSpent).toBe(50)
    expect(r.newBet).toBe(50)
  })

  it('all-in uses all chips', () => {
    const r = resolveActionAmount(ActionType.AllIn, 0, 500, 100, 0)
    expect(r.chipsSpent).toBe(500)
    expect(r.newBet).toBe(500)
  })
})
