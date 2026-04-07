import { ActionType, type AvailableActions } from './betting'

export interface AIDecision {
  action: ActionType
  amount: number
}

/** Simple AI: 60% call/check, 25% raise, 15% fold (never folds if check is available) */
export function getSimpleAIDecision(available: AvailableActions): AIDecision {
  const roll = Math.random()

  // If can check, never fold
  if (available.canCheck) {
    if (roll < 0.75) {
      return { action: ActionType.Check, amount: 0 }
    }
    if (available.canBet) {
      return { action: ActionType.Bet, amount: available.minBet }
    }
    return { action: ActionType.Check, amount: 0 }
  }

  // If can call
  if (available.canCall) {
    if (roll < 0.15) {
      return { action: ActionType.Fold, amount: 0 }
    }
    if (roll < 0.75) {
      return { action: ActionType.Call, amount: 0 }
    }
    if (available.canRaise) {
      return { action: ActionType.Raise, amount: available.minBet }
    }
    return { action: ActionType.Call, amount: 0 }
  }

  // Short stack: can only fold or all-in
  if (roll < 0.5) {
    return { action: ActionType.Fold, amount: 0 }
  }
  return { action: ActionType.AllIn, amount: available.maxBet }
}
