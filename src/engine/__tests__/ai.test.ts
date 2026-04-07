import { describe, it, expect } from 'vitest'
import { getSimpleAIDecision } from '../ai'
import { ActionType, type AvailableActions } from '../betting'

function makeAvailable(overrides: Partial<AvailableActions> = {}): AvailableActions {
  return {
    canFold: true,
    canCheck: false,
    canCall: true,
    callAmount: 20,
    canBet: false,
    canRaise: true,
    minBet: 40,
    maxBet: 1000,
    ...overrides,
  }
}

describe('getSimpleAIDecision', () => {
  it('returns a valid action type', () => {
    const decision = getSimpleAIDecision(makeAvailable())
    expect(Object.values(ActionType)).toContain(decision.action)
  })

  it('never folds when check is available', () => {
    const available = makeAvailable({ canCheck: true, canCall: false })
    for (let i = 0; i < 100; i++) {
      const d = getSimpleAIDecision(available)
      expect(d.action).not.toBe(ActionType.Fold)
    }
  })

  it('raise amount is at least minBet', () => {
    for (let i = 0; i < 100; i++) {
      const d = getSimpleAIDecision(makeAvailable())
      if (d.action === ActionType.Raise || d.action === ActionType.Bet) {
        expect(d.amount).toBeGreaterThanOrEqual(40)
      }
    }
  })

  it('handles short stack (only fold or all-in)', () => {
    const available = makeAvailable({
      canCheck: false,
      canCall: false,
      canRaise: false,
      canBet: false,
      minBet: 30,
      maxBet: 30,
    })
    for (let i = 0; i < 50; i++) {
      const d = getSimpleAIDecision(available)
      expect([ActionType.Fold, ActionType.AllIn]).toContain(d.action)
    }
  })
})
