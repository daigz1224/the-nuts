export enum ActionType {
  Fold = 'fold',
  Check = 'check',
  Call = 'call',
  Bet = 'bet',
  Raise = 'raise',
  AllIn = 'all-in',
}

export const ACTION_NAMES_ZH: Record<ActionType, string> = {
  [ActionType.Fold]: '弃牌',
  [ActionType.Check]: '过牌',
  [ActionType.Call]: '跟注',
  [ActionType.Bet]: '下注',
  [ActionType.Raise]: '加注',
  [ActionType.AllIn]: '全下',
}

export interface PlayerAction {
  playerId: number
  action: ActionType
  amount: number // 0 for fold/check
}

export interface AvailableActions {
  canFold: boolean
  canCheck: boolean
  canCall: boolean
  callAmount: number
  canBet: boolean
  canRaise: boolean
  minBet: number    // minimum bet or raise-to amount
  maxBet: number    // maximum (all-in)
}

/**
 * Determine what actions are available to a player.
 */
export function getAvailableActions(
  playerChips: number,
  currentBet: number,
  playerBetThisRound: number,
  minRaise: number,
  bigBlind: number,
): AvailableActions {
  const toCall = currentBet - playerBetThisRound

  // If player can't even call, they can only fold or go all-in
  if (playerChips <= toCall) {
    return {
      canFold: true,
      canCheck: false,
      canCall: false,
      callAmount: 0,
      canBet: false,
      canRaise: false,
      minBet: playerChips + playerBetThisRound,
      maxBet: playerChips + playerBetThisRound,
    }
  }

  const canCheck = toCall === 0
  const canCall = toCall > 0

  // Minimum raise-to: current bet + minRaise increment
  // If no bet yet, minimum bet is big blind
  const minRaiseTo = currentBet === 0
    ? bigBlind
    : currentBet + minRaise

  const maxRaiseTo = playerChips + playerBetThisRound

  // Can only raise/bet if they have enough chips beyond calling
  const canBetOrRaise = maxRaiseTo >= minRaiseTo

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount: toCall,
    canBet: canBetOrRaise && currentBet === 0,
    canRaise: canBetOrRaise && currentBet > 0,
    minBet: minRaiseTo,
    maxBet: maxRaiseTo,
  }
}

/**
 * Apply an action and return the chip changes.
 * Returns the total amount the player puts in this action (above their prior bet this round).
 */
export function resolveActionAmount(
  action: ActionType,
  amount: number,
  playerChips: number,
  currentBet: number,
  playerBetThisRound: number,
): { chipsSpent: number; newBet: number } {
  switch (action) {
    case ActionType.Fold:
    case ActionType.Check:
      return { chipsSpent: 0, newBet: playerBetThisRound }

    case ActionType.Call: {
      const toCall = Math.min(currentBet - playerBetThisRound, playerChips)
      return { chipsSpent: toCall, newBet: playerBetThisRound + toCall }
    }

    case ActionType.Bet:
    case ActionType.Raise: {
      // `amount` is the raise-to total, not the increment
      const totalToAdd = amount - playerBetThisRound
      const actual = Math.min(totalToAdd, playerChips)
      return { chipsSpent: actual, newBet: playerBetThisRound + actual }
    }

    case ActionType.AllIn: {
      return { chipsSpent: playerChips, newBet: playerBetThisRound + playerChips }
    }
  }
}
