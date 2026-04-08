import { create } from 'zustand'
import {
  type GameState,
  GamePhase,
  createInitialState,
  startNewHand,
  handleAction,
  getCurrentPlayerId,
  getPlayerAvailableActions,
} from '@/engine/game'
import { ActionType } from '@/engine/betting'
import { getAIDecision, type AIContext } from '@/engine/ai'

const AI_DELAY_MS = 600
const STORAGE_KEY = 'the-nuts-save'

interface SavedData {
  chipCounts: number[]
  handNumber: number
}

interface GameStore {
  gameState: GameState
  isProcessingAI: boolean
  eliminatedThisHand: number[]  // player IDs eliminated after last hand
  chipsBeforeHand: number[]     // snapshot for elimination detection

  startNewHand: () => void
  playerAct: (action: ActionType, amount?: number) => void
  processAITurns: () => Promise<void>
  resetGame: () => void
}

function createStateWithSavedChips(): GameState {
  const state = createInitialState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return state
    const saved: SavedData = JSON.parse(raw)
    if (
      Array.isArray(saved.chipCounts) &&
      saved.chipCounts.length === state.players.length &&
      saved.chipCounts.every((c: unknown) => typeof c === 'number' && c >= 0)
    ) {
      state.players.forEach((p, i) => { p.chips = saved.chipCounts[i] })
      state.handNumber = saved.handNumber ?? 0
    }
  } catch {
    // Corrupted data — use defaults
  }
  return state
}

function saveChips(gameState: GameState) {
  try {
    const data: SavedData = {
      chipCounts: gameState.players.map(p => p.chips),
      handNumber: gameState.handNumber,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createStateWithSavedChips(),
  isProcessingAI: false,
  eliminatedThisHand: [],
  chipsBeforeHand: [],

  startNewHand: () => {
    const { gameState } = get()
    // Snapshot chips before the hand for elimination detection
    const chipsBeforeHand = gameState.players.map(p => p.chips)
    set({
      gameState: startNewHand(gameState),
      eliminatedThisHand: [],
      chipsBeforeHand,
    })
    // After dealing, process AI turns if AI acts first
    get().processAITurns()
  },

  resetGame: () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    set({ gameState: createInitialState(), isProcessingAI: false, eliminatedThisHand: [], chipsBeforeHand: [] })
  },

  playerAct: (action: ActionType, amount: number = 0) => {
    const { gameState } = get()
    const currentId = getCurrentPlayerId(gameState)
    if (currentId !== 0) return // not player's turn

    const newState = handleAction(gameState, 0, action, amount)
    set({ gameState: newState })

    // processAITurns handles saving when the hand ends
    get().processAITurns()
  },

  processAITurns: async () => {
    const { isProcessingAI } = get()
    if (isProcessingAI) return

    set({ isProcessingAI: true })

    const processNext = async () => {
      const { gameState } = get()
      if (gameState.phase === GamePhase.Showdown || gameState.phase === GamePhase.Idle) {
        // Detect eliminated players
        const { chipsBeforeHand } = get()
        const eliminated = gameState.players
          .filter(p => p.id !== 0 && chipsBeforeHand[p.id] > 0 && p.chips === 0)
          .map(p => p.id)
        set({ isProcessingAI: false, eliminatedThisHand: eliminated })
        saveChips(gameState)
        return
      }

      const currentId = getCurrentPlayerId(gameState)
      if (currentId === null) {
        set({ isProcessingAI: false })
        return
      }

      // If it's the human player's turn, stop processing
      if (currentId === 0) {
        set({ isProcessingAI: false })
        return
      }

      // Build AI context from game state
      const player = gameState.players[currentId]
      const profile = gameState.aiProfiles.get(currentId)!
      const available = getPlayerAvailableActions(gameState, currentId)

      const context: AIContext = {
        holeCards: player.holeCards!,
        communityCards: gameState.communityCards,
        position: player.position!,
        pot: gameState.pot,
        bigBlind: gameState.bigBlind,
      }

      const decision = getAIDecision(profile, context, available)

      await new Promise(resolve => setTimeout(resolve, AI_DELAY_MS))

      set(state => ({
        gameState: handleAction(state.gameState, currentId, decision.action, decision.amount),
      }))

      // Continue processing next AI
      await processNext()
    }

    await processNext()
  },

}))
