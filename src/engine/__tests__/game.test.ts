import { describe, it, expect } from 'vitest'
import {
  GamePhase,
  createInitialState,
  startNewHand,
  handleAction,
  getCurrentPlayerId,
  getPlayerAvailableActions,
} from '../game'
import { ActionType } from '../betting'
import { Position } from '../positions'

describe('createInitialState', () => {
  it('creates 6 players', () => {
    const state = createInitialState()
    expect(state.players).toHaveLength(6)
  })

  it('starts in idle phase', () => {
    const state = createInitialState()
    expect(state.phase).toBe(GamePhase.Idle)
  })

  it('gives each player starting chips', () => {
    const state = createInitialState()
    for (const p of state.players) {
      expect(p.chips).toBe(1000)
    }
  })
})

describe('startNewHand', () => {
  it('transitions to PreFlop', () => {
    const state = startNewHand(createInitialState())
    expect(state.phase).toBe(GamePhase.PreFlop)
  })

  it('deals 2 hole cards to each active player', () => {
    const state = startNewHand(createInitialState())
    for (const p of state.players) {
      if (!p.isFolded) {
        expect(p.holeCards).toHaveLength(2)
      }
    }
  })

  it('posts blinds correctly', () => {
    const state = startNewHand(createInitialState())
    const sbPlayer = state.players.find(p => p.position === Position.SB)!
    const bbPlayer = state.players.find(p => p.position === Position.BB)!

    expect(sbPlayer.chips).toBe(990) // 1000 - 10
    expect(bbPlayer.chips).toBe(980) // 1000 - 20
    expect(state.pot).toBe(30) // 10 + 20
  })

  it('sets current bet to big blind', () => {
    const state = startNewHand(createInitialState())
    expect(state.currentBet).toBe(20)
  })

  it('assigns all positions', () => {
    const state = startNewHand(createInitialState())
    expect(state.positions.size).toBe(6)
  })

  it('increments hand number', () => {
    const state = startNewHand(createInitialState())
    expect(state.handNumber).toBe(1)
  })

  it('first to act is UTG', () => {
    const state = startNewHand(createInitialState())
    const currentId = getCurrentPlayerId(state)
    const currentPlayer = state.players[currentId!]
    expect(currentPlayer.position).toBe(Position.UTG)
  })
})

describe('handleAction', () => {
  function setupHand() {
    return startNewHand(createInitialState())
  }

  it('fold removes player from hand', () => {
    let state = setupHand()
    const pid = getCurrentPlayerId(state)!
    state = handleAction(state, pid, ActionType.Fold)
    expect(state.players[pid].isFolded).toBe(true)
  })

  it('call matches current bet', () => {
    let state = setupHand()
    const pid = getCurrentPlayerId(state)!
    const chipsBefore = state.players[pid].chips
    state = handleAction(state, pid, ActionType.Call)
    expect(state.players[pid].chips).toBe(chipsBefore - 20) // call BB of 20
    expect(state.pot).toBe(50) // 30 (blinds) + 20 (call)
  })

  it('raise increases current bet', () => {
    let state = setupHand()
    const pid = getCurrentPlayerId(state)!
    state = handleAction(state, pid, ActionType.Raise, 60)
    expect(state.currentBet).toBe(60)
    expect(state.players[pid].currentBet).toBe(60)
  })

  it('everyone folds to one player awards pot', () => {
    let state = setupHand()

    // All players fold except one
    while (state.phase !== GamePhase.Showdown) {
      const pid = getCurrentPlayerId(state)
      if (pid === null) break
      state = handleAction(state, pid, ActionType.Fold)
    }

    expect(state.phase).toBe(GamePhase.Showdown)
    expect(state.winners).not.toBeNull()
    expect(state.winners!.length).toBe(1)
  })

  it('full hand to showdown with all calls', () => {
    let state = setupHand()

    // Everyone calls/checks through all streets
    let iterations = 0
    while (state.phase !== GamePhase.Showdown && iterations < 100) {
      const pid = getCurrentPlayerId(state)
      if (pid === null) break

      const actions = getPlayerAvailableActions(state, pid)
      if (actions.canCheck) {
        state = handleAction(state, pid, ActionType.Check)
      } else if (actions.canCall) {
        state = handleAction(state, pid, ActionType.Call)
      } else {
        state = handleAction(state, pid, ActionType.Fold)
      }
      iterations++
    }

    expect(state.phase).toBe(GamePhase.Showdown)
    expect(state.communityCards).toHaveLength(5)
    expect(state.winners).not.toBeNull()
    expect(state.winners!.length).toBeGreaterThanOrEqual(1)
  })

  it('chip conservation: total chips constant after showdown', () => {
    let state = setupHand()
    const totalBefore = state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot

    // Play through the hand
    let iterations = 0
    while (state.phase !== GamePhase.Showdown && iterations < 100) {
      const pid = getCurrentPlayerId(state)
      if (pid === null) break

      const actions = getPlayerAvailableActions(state, pid)
      if (actions.canCheck) {
        state = handleAction(state, pid, ActionType.Check)
      } else if (actions.canCall) {
        state = handleAction(state, pid, ActionType.Call)
      } else {
        state = handleAction(state, pid, ActionType.Fold)
      }
      iterations++
    }

    const totalAfter = state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
    expect(totalAfter).toBe(totalBefore)
  })

  it('ignores action from wrong player', () => {
    let state = setupHand()
    const currentId = getCurrentPlayerId(state)!
    const wrongId = (currentId + 1) % 6
    const before = { ...state }
    state = handleAction(state, wrongId, ActionType.Fold)
    expect(state.phase).toBe(before.phase)
  })

  it('advances through flop, turn, river', () => {
    let state = setupHand()
    const phases: GamePhase[] = []

    let iterations = 0
    while (state.phase !== GamePhase.Showdown && iterations < 100) {
      if (!phases.includes(state.phase)) phases.push(state.phase)
      const pid = getCurrentPlayerId(state)
      if (pid === null) break

      const actions = getPlayerAvailableActions(state, pid)
      if (actions.canCheck) {
        state = handleAction(state, pid, ActionType.Check)
      } else if (actions.canCall) {
        state = handleAction(state, pid, ActionType.Call)
      } else {
        state = handleAction(state, pid, ActionType.Fold)
      }
      iterations++
    }

    expect(phases).toContain(GamePhase.PreFlop)
    // Should pass through at least flop
    expect(state.communityCards.length).toBe(5)
  })

  it('BTN rotates between hands', () => {
    let state = createInitialState()
    state = startNewHand(state)
    const firstBTN = state.btnSeatIndex

    // Play through the hand quickly
    let iterations = 0
    while (state.phase !== GamePhase.Showdown && iterations < 100) {
      const pid = getCurrentPlayerId(state)
      if (pid === null) break
      state = handleAction(state, pid, ActionType.Fold)
      iterations++
    }

    state = startNewHand(state)
    expect(state.btnSeatIndex).not.toBe(firstBTN)
  })
})
