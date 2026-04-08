import type { Card } from './card'
import { Deck } from './deck'
import { bestOfSeven } from './evaluator'
import { ActionType, getAvailableActions, resolveActionAmount, type AvailableActions } from './betting'
import { assignPositions, rotateBTN, getPreFlopOrder, getPostFlopOrder, Position } from './positions'
import { assignRandomProfiles, type AIProfile } from './ai'
import { shuffleArray } from './shuffle'

export enum GamePhase {
  Idle = 'idle',
  PreFlop = 'pre-flop',
  Flop = 'flop',
  Turn = 'turn',
  River = 'river',
  Showdown = 'showdown',
}

export const PHASE_NAMES_ZH: Record<GamePhase, string> = {
  [GamePhase.Idle]: '',
  [GamePhase.PreFlop]: '翻牌前',
  [GamePhase.Flop]: '翻牌',
  [GamePhase.Turn]: '转牌',
  [GamePhase.River]: '河牌',
  [GamePhase.Showdown]: '摊牌',
}

export interface Player {
  id: number
  name: string
  avatar: string
  chips: number
  holeCards: [Card, Card] | null
  position: Position | null
  isFolded: boolean
  isAllIn: boolean
  currentBet: number // bet in current betting round
  lastAction: { type: ActionType; amount: number } | null
}

export type HandHistoryEntry =
  | { type: 'action'; playerId: number; action: ActionType; amount: number; phase: GamePhase }
  | { type: 'phase'; phase: GamePhase; communityCards: Card[] }
  | { type: 'result'; winners: { playerId: number; amount: number }[] }

export interface GameState {
  phase: GamePhase
  players: Player[]
  deck: Deck
  communityCards: Card[]
  pot: number
  currentBet: number
  minRaise: number
  activePlayerIndex: number // index in actionOrder
  actionOrder: number[]    // player IDs in action order for current street
  btnSeatIndex: number
  smallBlind: number
  bigBlind: number
  handNumber: number
  positions: Map<number, Position>
  winners: { playerId: number; amount: number; hand?: string }[] | null
  actedThisRound: Set<number> // player IDs that have acted in current betting round
  aiProfiles: Map<number, AIProfile> // 每局随机分配的 AI 性格
  handHistory: HandHistoryEntry[]
}

const DEFAULT_SMALL_BLIND = 10
const DEFAULT_BIG_BLIND = 20
const DEFAULT_STARTING_CHIPS = 1000

// ---------------------------------------------------------------------------
// 涨盲机制 — 从 handNumber 派生盲注，无需额外状态
// ---------------------------------------------------------------------------

const BLIND_SCHEDULE = [
  { upToHand: 6,  sb: 10, bb: 20 },
  { upToHand: 12, sb: 15, bb: 30 },
  { upToHand: 18, sb: 20, bb: 40 },
  { upToHand: 24, sb: 30, bb: 60 },
  { upToHand: 30, sb: 50, bb: 100 },
]
const MAX_BLINDS = { sb: 75, bb: 150 }

export function getBlindsForHand(handNumber: number): { smallBlind: number; bigBlind: number } {
  for (const level of BLIND_SCHEDULE) {
    if (handNumber <= level.upToHand) {
      return { smallBlind: level.sb, bigBlind: level.bb }
    }
  }
  return { smallBlind: MAX_BLINDS.sb, bigBlind: MAX_BLINDS.bb }
}

// ---------------------------------------------------------------------------
// 锦标赛结果检测
// ---------------------------------------------------------------------------

export type TournamentResult = 'playing' | 'victory' | 'defeated'

export function getTournamentResult(players: Player[]): TournamentResult {
  const activePlayers = players.filter(p => p.chips > 0)
  if (activePlayers.length <= 1 && activePlayers[0]?.id === 0) return 'victory'
  if (players[0].chips === 0) return 'defeated'
  return 'playing'
}

const NPC_DATA = [
  { name: '吉安娜', avatar: '❄️' },
  { name: '萨尔',   avatar: '⚡' },
  { name: '古尔丹', avatar: '🔥' },
  { name: '雷克萨', avatar: '🐻' },
  { name: '乌瑟尔', avatar: '🛡️' },
]

export function createInitialState(): GameState {
  const shuffledNpcs = shuffleArray(NPC_DATA)

  const players: Player[] = [
    { id: 0, name: '旅行者', avatar: '🎴', chips: DEFAULT_STARTING_CHIPS, holeCards: null, position: null, isFolded: false, isAllIn: false, currentBet: 0, lastAction: null },
    ...shuffledNpcs.map((npc, i) => ({
      id: i + 1,
      name: npc.name,
      avatar: npc.avatar,
      chips: DEFAULT_STARTING_CHIPS,
      holeCards: null as [Card, Card] | null,
      position: null as Position | null,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      lastAction: null,
    })),
  ]

  // 随机分配 AI 性格
  const aiPlayerIds = players.filter(p => p.id !== 0).map(p => p.id)
  const aiProfiles = assignRandomProfiles(aiPlayerIds)

  return {
    phase: GamePhase.Idle,
    players,
    deck: new Deck(),
    communityCards: [],
    pot: 0,
    currentBet: 0,
    minRaise: DEFAULT_BIG_BLIND,
    activePlayerIndex: 0,
    actionOrder: [],
    btnSeatIndex: 0,
    smallBlind: DEFAULT_SMALL_BLIND,
    bigBlind: DEFAULT_BIG_BLIND,
    handNumber: 0,
    positions: new Map(),
    winners: null,
    actedThisRound: new Set(),
    aiProfiles,
    handHistory: [],
  }
}

export function startNewHand(state: GameState): GameState {
  // Tournament end check: stop if human eliminated or is the last one standing
  const result = getTournamentResult(state.players)
  if (result !== 'playing') return { ...state, phase: GamePhase.Idle }

  const activeSeats = state.players
    .filter(p => p.chips > 0)
    .map(p => p.id)

  if (activeSeats.length < 2) return { ...state, phase: GamePhase.Idle }

  // Rotate BTN
  const btnSeatIndex = state.handNumber === 0
    ? activeSeats[0]
    : rotateBTN(state.btnSeatIndex, activeSeats)

  // Assign positions
  const positions = assignPositions(btnSeatIndex, activeSeats)

  // Reset players
  const players = state.players.map(p => ({
    ...p,
    holeCards: null as [Card, Card] | null,
    position: positions.get(p.id) || null,
    isFolded: !activeSeats.includes(p.id),
    isAllIn: false,
    currentBet: 0,
    lastAction: null,
  }))

  // Create and shuffle deck
  const deck = new Deck()
  deck.shuffle()

  // Deal hole cards
  for (const p of players) {
    if (!p.isFolded) {
      const c1 = deck.deal()
      const c2 = deck.deal()
      p.holeCards = [c1, c2]
    }
  }

  // Dynamic blinds based on hand number
  const newHandNumber = state.handNumber + 1
  const { smallBlind, bigBlind } = getBlindsForHand(newHandNumber)

  // Post blinds
  let pot = 0
  for (const p of players) {
    if (p.position === Position.SB) {
      const sb = Math.min(smallBlind, p.chips)
      p.chips -= sb
      p.currentBet = sb
      pot += sb
      if (p.chips === 0) p.isAllIn = true
    }
    if (p.position === Position.BB) {
      const bb = Math.min(bigBlind, p.chips)
      p.chips -= bb
      p.currentBet = bb
      pot += bb
      if (p.chips === 0) p.isAllIn = true
    }
  }

  const actionOrder = getPreFlopOrder(positions)
    .filter(id => !players[id].isFolded && !players[id].isAllIn)

  return {
    ...state,
    phase: GamePhase.PreFlop,
    players,
    deck,
    communityCards: [],
    pot,
    currentBet: bigBlind,
    minRaise: bigBlind,
    smallBlind,
    bigBlind,
    activePlayerIndex: 0,
    actionOrder,
    btnSeatIndex,
    handNumber: newHandNumber,
    positions,
    winners: null,
    actedThisRound: new Set(),
    handHistory: [],
  }
}

export function getCurrentPlayerId(state: GameState): number | null {
  if (state.phase === GamePhase.Idle || state.phase === GamePhase.Showdown) return null
  if (state.activePlayerIndex >= state.actionOrder.length) return null
  return state.actionOrder[state.activePlayerIndex]
}

export function getPlayerAvailableActions(state: GameState, playerId: number): AvailableActions {
  const player = state.players[playerId]
  return getAvailableActions(
    player.chips,
    state.currentBet,
    player.currentBet,
    state.minRaise,
    state.bigBlind,
  )
}

export function handleAction(
  state: GameState,
  playerId: number,
  action: ActionType,
  amount: number = 0,
): GameState {
  const currentId = getCurrentPlayerId(state)
  if (currentId !== playerId) return state

  const player = { ...state.players[playerId] }
  const players = [...state.players]
  players[playerId] = player

  const { chipsSpent, newBet } = resolveActionAmount(
    action, amount, player.chips, state.currentBet, player.currentBet,
  )

  player.chips -= chipsSpent
  player.currentBet = newBet
  player.lastAction = { type: action, amount: chipsSpent }

  let { pot, currentBet, minRaise } = state
  pot += chipsSpent

  if (action === ActionType.Fold) {
    player.isFolded = true
  }

  if (player.chips === 0 && action !== ActionType.Fold && action !== ActionType.Check) {
    player.isAllIn = true
  }

  // Update current bet and min raise
  if (action === ActionType.Bet || action === ActionType.Raise || action === ActionType.AllIn) {
    if (newBet > currentBet) {
      const raiseIncrement = newBet - currentBet
      if (raiseIncrement >= minRaise) {
        minRaise = raiseIncrement
      }
      currentBet = newBet
    }
  }

  const actedThisRound = new Set(state.actedThisRound)
  actedThisRound.add(playerId)

  // Record action in hand history
  const handHistory = [...state.handHistory, {
    type: 'action' as const,
    playerId,
    action,
    amount: chipsSpent,
    phase: state.phase,
  }]

  let newState: GameState = {
    ...state,
    players,
    pot,
    currentBet,
    minRaise,
    actedThisRound,
    activePlayerIndex: state.activePlayerIndex + 1,
    handHistory,
  }

  // Check if only one player remains
  const activePlayers = newState.players.filter(p => !p.isFolded)
  if (activePlayers.length === 1) {
    return awardPotToLastPlayer(newState, activePlayers[0].id)
  }

  // Check if betting round is complete
  if (isBettingRoundComplete(newState)) {
    // If all but one are all-in, deal remaining community cards and go to showdown
    const canAct = newState.players.filter(p => !p.isFolded && !p.isAllIn)
    if (canAct.length <= 1) {
      return dealRemainingAndShowdown(newState)
    }
    return advancePhase(newState)
  }

  // Skip players who are folded or all-in
  newState = skipInactivePlayers(newState)

  // If we've gone through everyone, check again
  if (newState.activePlayerIndex >= newState.actionOrder.length) {
    if (isBettingRoundComplete(newState)) {
      const canAct = newState.players.filter(p => !p.isFolded && !p.isAllIn)
      if (canAct.length <= 1) {
        return dealRemainingAndShowdown(newState)
      }
      return advancePhase(newState)
    }

    // Round not complete (a raise happened) — rebuild action order with
    // ALL players who still need to act (haven't matched the current bet),
    // using proper positional order
    const posOrder = newState.phase === GamePhase.PreFlop
      ? getPreFlopOrder(newState.positions)
      : getPostFlopOrder(newState.positions)
    const needToAct = posOrder.filter(id => {
      const p = newState.players[id]
      return !p.isFolded && !p.isAllIn && p.currentBet < newState.currentBet
    })
    newState = {
      ...newState,
      actionOrder: needToAct,
      activePlayerIndex: 0,
    }
    newState = skipInactivePlayers(newState)
  }

  return newState
}

function isBettingRoundComplete(state: GameState): boolean {
  const activePlayers = state.players.filter(p => !p.isFolded && !p.isAllIn)

  // All active players must have acted
  for (const p of activePlayers) {
    if (!state.actedThisRound.has(p.id)) return false
  }

  // All active players must have matched the current bet
  for (const p of activePlayers) {
    if (p.currentBet < state.currentBet) return false
  }

  return true
}

function skipInactivePlayers(state: GameState): GameState {
  let idx = state.activePlayerIndex
  while (idx < state.actionOrder.length) {
    const pid = state.actionOrder[idx]
    const p = state.players[pid]
    if (!p.isFolded && !p.isAllIn) break
    idx++
  }
  return { ...state, activePlayerIndex: idx }
}

function advancePhase(state: GameState): GameState {
  // Reset betting state for new street
  const players = state.players.map(p => ({ ...p, currentBet: 0, lastAction: null }))
  const { deck } = state
  const communityCards = [...state.communityCards]

  let phase: GamePhase

  switch (state.phase) {
    case GamePhase.PreFlop:
      deck.burn()
      communityCards.push(...deck.dealMultiple(3))
      phase = GamePhase.Flop
      break
    case GamePhase.Flop:
      deck.burn()
      communityCards.push(deck.deal())
      phase = GamePhase.Turn
      break
    case GamePhase.Turn:
      deck.burn()
      communityCards.push(deck.deal())
      phase = GamePhase.River
      break
    case GamePhase.River:
      return resolveShowdown({ ...state, players, communityCards })
    default:
      return state
  }

  const actionOrder = getPostFlopOrder(state.positions)
    .filter(id => !players[id].isFolded && !players[id].isAllIn)

  // Record phase change in history
  const handHistory = [...state.handHistory, {
    type: 'phase' as const,
    phase,
    communityCards: [...communityCards],
  }]

  return {
    ...state,
    phase,
    players,
    deck,
    communityCards,
    currentBet: 0,
    minRaise: state.bigBlind,
    activePlayerIndex: 0,
    actionOrder,
    actedThisRound: new Set(),
    handHistory,
  }
}

function dealRemainingAndShowdown(state: GameState): GameState {
  const { deck } = state
  const communityCards = [...state.communityCards]

  while (communityCards.length < 5) {
    if (communityCards.length === 0) {
      deck.burn()
      communityCards.push(...deck.dealMultiple(3))
    } else {
      deck.burn()
      communityCards.push(deck.deal())
    }
  }

  const players = state.players.map(p => ({ ...p, currentBet: 0 }))

  return resolveShowdown({ ...state, players, deck, communityCards })
}

function resolveShowdown(state: GameState): GameState {
  const contenders = state.players.filter(p => !p.isFolded && p.holeCards)

  if (contenders.length === 0) return { ...state, phase: GamePhase.Showdown }

  // Evaluate hands
  const results = contenders.map(p => {
    const seven = [...p.holeCards!, ...state.communityCards]
    const result = bestOfSeven(seven)
    return { playerId: p.id, result }
  })

  // Find best score
  const bestScore = Math.max(...results.map(r => r.result.score))
  const winnerResults = results.filter(r => r.result.score === bestScore)

  // Split pot among winners
  const share = Math.floor(state.pot / winnerResults.length)
  const remainder = state.pot - share * winnerResults.length

  const players = [...state.players]
  const winners: { playerId: number; amount: number; hand: string }[] = []

  winnerResults.forEach((w, i) => {
    const winAmount = share + (i === 0 ? remainder : 0)
    players[w.playerId] = {
      ...players[w.playerId],
      chips: players[w.playerId].chips + winAmount,
    }
    winners.push({
      playerId: w.playerId,
      amount: winAmount,
      hand: w.result.description,
    })
  })

  // Record result in history
  const handHistory = [...state.handHistory, {
    type: 'result' as const,
    winners: winners.map(w => ({ playerId: w.playerId, amount: w.amount })),
  }]

  return {
    ...state,
    phase: GamePhase.Showdown,
    players,
    pot: 0,
    winners,
    handHistory,
  }
}

function awardPotToLastPlayer(state: GameState, playerId: number): GameState {
  const players = [...state.players]
  players[playerId] = {
    ...players[playerId],
    chips: players[playerId].chips + state.pot,
  }

  // Record result in history
  const handHistory = [...state.handHistory, {
    type: 'result' as const,
    winners: [{ playerId, amount: state.pot }],
  }]

  return {
    ...state,
    phase: GamePhase.Showdown,
    players,
    pot: 0,
    winners: [{ playerId, amount: state.pot }],
    handHistory,
  }
}
