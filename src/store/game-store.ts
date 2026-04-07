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
import { getSimpleAIDecision } from '@/engine/ai'

const AI_DELAY_MS = 600

interface GameStore {
  gameState: GameState
  isProcessingAI: boolean

  startNewHand: () => void
  playerAct: (action: ActionType, amount?: number) => void
  processAITurns: () => Promise<void>
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialState(),
  isProcessingAI: false,

  startNewHand: () => {
    set(state => ({
      gameState: startNewHand(state.gameState),
    }))
    // After dealing, process AI turns if AI acts first
    get().processAITurns()
  },

  playerAct: (action: ActionType, amount: number = 0) => {
    const { gameState } = get()
    const currentId = getCurrentPlayerId(gameState)
    if (currentId !== 0) return // not player's turn

    set({ gameState: handleAction(gameState, 0, action, amount) })

    // After player acts, process AI turns
    get().processAITurns()
  },

  processAITurns: async () => {
    const { isProcessingAI } = get()
    if (isProcessingAI) return

    set({ isProcessingAI: true })

    const processNext = async () => {
      const { gameState } = get()
      if (gameState.phase === GamePhase.Showdown || gameState.phase === GamePhase.Idle) {
        set({ isProcessingAI: false })
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

      // AI decision
      const available = getPlayerAvailableActions(gameState, currentId)
      const decision = getSimpleAIDecision(available)

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
