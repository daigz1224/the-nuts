import type { Card } from './card'
import { Suit } from './card'
import type { AvailableActions } from './betting'
import { ActionType } from './betting'
import { evaluateBest } from './evaluator'
import { HandCategory } from './hand-rank'
import { Position } from './positions'
import { shuffleArray } from './shuffle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum AIStyle {
  Rock = 'rock',             // 紧-被动（岩石）
  TAG = 'tag',               // 紧-激进
  LAG = 'lag',               // 松-激进
  CallingStation = 'calling-station', // 松-被动（跟注站）
  Maniac = 'maniac',         // 疯狂型
  Nit = 'nit',               // 超紧型（铁公鸡）
  Shark = 'shark',           // 平衡高手（鲨鱼）
  Bully = 'bully',           // 压迫型（恶霸）
  SemiBluffer = 'semi-bluffer', // 半诈唬型
  TightPassive = 'tight-passive', // 紧被动
  LoosePassive = 'loose-passive', // 松被动
  Gambler = 'gambler',       // 赌徒型
}

export interface AIProfile {
  style: AIStyle
  /** 入池率 0-1 — 自愿放钱进底池的频率 */
  vpip: number
  /** 翻前加注率 0-1 — 进入底池时选择加注的频率 */
  pfr: number
  /** 翻后激进度 0-1 */
  aggression: number
  /** 诈唬频率 0-1 */
  bluffFreq: number
  /** 面对下注时弃牌倾向 0-1 */
  foldToBet: number
}

export interface AIContext {
  holeCards: [Card, Card]
  communityCards: Card[]
  position: Position
  pot: number
  bigBlind: number
}

export interface AIDecision {
  action: ActionType
  amount: number
}

// ---------------------------------------------------------------------------
// Character profiles — 每个 NPC 有固定风格
// ---------------------------------------------------------------------------

/** 性格模板池 — 每局随机分配给 NPC（12 种风格） */
export const PROFILE_POOL: AIProfile[] = [
  // ── 原有 5 种 ──
  { style: AIStyle.TAG,            vpip: 0.23, pfr: 0.70, aggression: 0.60, bluffFreq: 0.15, foldToBet: 0.45 }, // 紧凶
  { style: AIStyle.Rock,           vpip: 0.16, pfr: 0.55, aggression: 0.35, bluffFreq: 0.05, foldToBet: 0.55 }, // 岩石
  { style: AIStyle.Maniac,         vpip: 0.52, pfr: 0.55, aggression: 0.75, bluffFreq: 0.35, foldToBet: 0.10 }, // 疯狂
  { style: AIStyle.CallingStation, vpip: 0.42, pfr: 0.12, aggression: 0.15, bluffFreq: 0.05, foldToBet: 0.08 }, // 跟注站
  { style: AIStyle.LAG,            vpip: 0.30, pfr: 0.65, aggression: 0.55, bluffFreq: 0.20, foldToBet: 0.32 }, // 松凶
  // ── 新增 7 种 ──
  { style: AIStyle.Nit,            vpip: 0.12, pfr: 0.45, aggression: 0.25, bluffFreq: 0.02, foldToBet: 0.65 }, // 超紧，只玩超强牌
  { style: AIStyle.Shark,          vpip: 0.26, pfr: 0.72, aggression: 0.65, bluffFreq: 0.18, foldToBet: 0.40 }, // 平衡高手
  { style: AIStyle.Bully,          vpip: 0.35, pfr: 0.60, aggression: 0.70, bluffFreq: 0.25, foldToBet: 0.22 }, // 压迫型
  { style: AIStyle.SemiBluffer,    vpip: 0.28, pfr: 0.50, aggression: 0.45, bluffFreq: 0.30, foldToBet: 0.28 }, // 半诈唬型
  { style: AIStyle.TightPassive,   vpip: 0.18, pfr: 0.30, aggression: 0.20, bluffFreq: 0.03, foldToBet: 0.50 }, // 紧被动
  { style: AIStyle.LoosePassive,   vpip: 0.45, pfr: 0.15, aggression: 0.20, bluffFreq: 0.08, foldToBet: 0.15 }, // 松被动
  { style: AIStyle.Gambler,        vpip: 0.48, pfr: 0.45, aggression: 0.50, bluffFreq: 0.28, foldToBet: 0.20 }, // 赌徒
]

/** 为一组 AI 玩家随机分配性格 */
export function assignRandomProfiles(aiPlayerIds: number[]): Map<number, AIProfile> {
  const shuffled = shuffleArray(PROFILE_POOL)
  const map = new Map<number, AIProfile>()
  aiPlayerIds.forEach((id, i) => {
    map.set(id, shuffled[i % shuffled.length])
  })
  return map
}

// ---------------------------------------------------------------------------
// Position modifier — 位置修正
// ---------------------------------------------------------------------------

const POSITION_MODIFIERS: Record<Position, number> = {
  [Position.UTG]: 0.60,
  [Position.MP]: 0.75,
  [Position.CO]: 1.10,
  [Position.BTN]: 1.30,
  [Position.SB]: 0.85,
  [Position.BB]: 1.00,
}

function getPositionModifier(position: Position): number {
  return POSITION_MODIFIERS[position] ?? 1.0
}

/** 翻后弃牌位置折扣 — 后位更不愿意弃牌 */
const POSITION_FOLD_MODIFIERS: Record<Position, number> = {
  [Position.UTG]: 1.10,  // 前位更容易弃
  [Position.MP]: 1.00,   // 基准
  [Position.CO]: 0.85,   // 位置好，少弃牌
  [Position.BTN]: 0.75,  // 最佳位置，最抗弃牌
  [Position.SB]: 1.05,   // 翻后位置差
  [Position.BB]: 0.90,   // 已投入盲注，稍抗弃
}

// ---------------------------------------------------------------------------
// Pre-flop hand strength — 起手牌评分 (0-1)
// ---------------------------------------------------------------------------

export function evaluatePreFlopStrength(holeCards: [Card, Card]): number {
  const r1 = Math.max(holeCards[0].rank, holeCards[1].rank)
  const r2 = Math.min(holeCards[0].rank, holeCards[1].rank)
  const isPair = r1 === r2
  const isSuited = holeCards[0].suit === holeCards[1].suit
  const gap = r1 - r2

  let score: number

  if (isPair) {
    // 22=0.50, AA=1.0
    score = 0.50 + ((r1 - 2) / 12) * 0.50
  } else {
    // 非对子：基于两张牌点数
    // min(2+3)=5 → 0.05, max(A+K)=27 → 0.85
    score = 0.05 + ((r1 + r2 - 5) / 22) * 0.80

    if (isSuited) score += 0.06
    if (gap === 1) score += 0.04      // 连张
    else if (gap === 2) score += 0.02  // 一间隔
    else if (gap >= 5) score -= 0.05   // 大间隔惩罚
  }

  return Math.max(0, Math.min(1, score))
}

// ---------------------------------------------------------------------------
// Post-flop hand strength — 翻后牌力评估 (0-1)
// ---------------------------------------------------------------------------

const HAND_STRENGTH_BASE: Record<HandCategory, number> = {
  [HandCategory.HighCard]: 0.10,
  [HandCategory.OnePair]: 0.30,
  [HandCategory.TwoPair]: 0.52,
  [HandCategory.ThreeOfAKind]: 0.65,
  [HandCategory.Straight]: 0.78,
  [HandCategory.Flush]: 0.84,
  [HandCategory.FullHouse]: 0.90,
  [HandCategory.FourOfAKind]: 0.96,
  [HandCategory.StraightFlush]: 0.98,
  [HandCategory.RoyalFlush]: 1.00,
}

/** 根据已有公共牌评估当前牌力 */
export function evaluatePostFlopStrength(holeCards: [Card, Card], communityCards: Card[]): number {
  const allCards = [...holeCards, ...communityCards]
  const result = evaluateBest(allCards)

  let strength = HAND_STRENGTH_BASE[result.category]

  // 一对时额外判断：是否用到手牌、是否顶对
  if (result.category === HandCategory.OnePair && communityCards.length > 0) {
    // 找出对子的点数
    const pairRank = result.bestFive.find((c, i, arr) =>
      arr.some((c2, j) => j !== i && c2.rank === c.rank),
    )?.rank

    if (pairRank !== undefined) {
      const holeContributes = holeCards.some(c => c.rank === pairRank)
      if (!holeContributes) {
        strength -= 0.10 // 公共牌对子，很弱
      } else {
        const maxBoard = Math.max(...communityCards.map(c => c.rank))
        if (pairRank > maxBoard) strength += 0.08  // 超对
        else if (pairRank === maxBoard) strength += 0.05  // 顶对
      }
    }
  }

  // 高牌时根据是否有 A/K 微调
  if (result.category === HandCategory.HighCard) {
    const highRank = Math.max(holeCards[0].rank, holeCards[1].rank)
    if (highRank >= 14) strength += 0.04 // Ace high
    else if (highRank >= 13) strength += 0.02 // King high
  }

  return Math.max(0, Math.min(1, strength))
}

// ---------------------------------------------------------------------------
// Draw detection — 听牌检测
// ---------------------------------------------------------------------------

interface DrawInfo {
  flushDraw: boolean
  straightDraw: boolean
}

export function detectDraws(holeCards: [Card, Card], communityCards: Card[]): DrawInfo {
  if (communityCards.length < 3) return { flushDraw: false, straightDraw: false }

  const allCards = [...holeCards, ...communityCards]

  // 同花听牌：4 张同花色且手牌参与
  const suitCounts = new Map<Suit, number>()
  for (const c of allCards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) || 0) + 1)
  }
  const flushDraw = [...suitCounts.entries()].some(
    ([suit, count]) => count === 4 && holeCards.some(hc => hc.suit === suit),
  )

  // 顺子听牌：4 张连续且手牌参与
  const uniqueRanks = [...new Set(allCards.map(c => c.rank))].sort((a, b) => a - b)
  let straightDraw = false
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    if (uniqueRanks[i + 3] - uniqueRanks[i] <= 4) {
      const lo = uniqueRanks[i]
      const hi = uniqueRanks[i + 3]
      if (holeCards.some(hc => hc.rank >= lo && hc.rank <= hi)) {
        straightDraw = true
        break
      }
    }
  }

  return { flushDraw, straightDraw }
}

/** 听牌额外加分 */
function getDrawBonus(holeCards: [Card, Card], communityCards: Card[]): number {
  const { flushDraw, straightDraw } = detectDraws(holeCards, communityCards)
  let bonus = 0
  if (flushDraw) bonus += 0.18     // ~35% to complete on flop, ~19% on turn
  if (straightDraw) bonus += 0.12  // open-ended ~31%, gutshot ~17%
  return bonus
}

// ---------------------------------------------------------------------------
// Bet sizing — 下注额计算
// ---------------------------------------------------------------------------

function computeBetSize(
  profile: AIProfile,
  pot: number,
  available: AvailableActions,
  bigBlind: number,
  isPreFlop: boolean,
): number {
  let amount: number

  if (isPreFlop) {
    // 翻前开池大小
    const multiplier =
      profile.style === AIStyle.Maniac ? 3.5 + Math.random() * 1.5
        : profile.aggression > 0.5 ? 2.5 + Math.random() * 1.0
          : 2.5 + Math.random() * 0.5
    amount = Math.round(bigBlind * multiplier)
  } else {
    // 翻后下注：按底池比例
    const potFraction =
      profile.style === AIStyle.Maniac ? 0.65 + Math.random() * 0.35
        : profile.aggression > 0.5 ? 0.45 + Math.random() * 0.25
          : 0.33 + Math.random() * 0.17
    amount = Math.round(pot * potFraction)
  }

  return Math.max(available.minBet, Math.min(amount, available.maxBet))
}

// ---------------------------------------------------------------------------
// Main decision function
// ---------------------------------------------------------------------------

export function getAIDecision(
  profile: AIProfile,
  context: AIContext,
  available: AvailableActions,
): AIDecision {
  const isPreFlop = context.communityCards.length === 0
  const handStrength = isPreFlop
    ? evaluatePreFlopStrength(context.holeCards)
    : evaluatePostFlopStrength(context.holeCards, context.communityCards)

  const drawBonus = isPreFlop ? 0 : getDrawBonus(context.holeCards, context.communityCards)
  const effectiveStrength = Math.min(1, handStrength + drawBonus)
  const posMod = getPositionModifier(context.position)

  // Short stack: 只能 fold 或 all-in
  if (!available.canCall && !available.canCheck && !available.canBet && !available.canRaise) {
    const threshold = 1 - profile.vpip * posMod
    if (effectiveStrength > threshold * 0.8) {
      return { action: ActionType.AllIn, amount: available.maxBet }
    }
    return { action: ActionType.Fold, amount: 0 }
  }

  if (isPreFlop) {
    return preFlopDecision(profile, effectiveStrength, posMod, available, context)
  }
  return postFlopDecision(profile, effectiveStrength, available, context)
}

// ---------------------------------------------------------------------------
// Pre-flop decision
// ---------------------------------------------------------------------------

function preFlopDecision(
  profile: AIProfile,
  strength: number,
  posMod: number,
  available: AvailableActions,
  context: AIContext,
): AIDecision {
  // 入池门槛 = 1 - vpip * 位置修正
  const baseThreshold = 1 - profile.vpip * posMod

  // 面对加注时提高门槛
  const betPressure = available.callAmount / (context.bigBlind * 3)
  const threshold = baseThreshold + Math.max(0, betPressure - 1) * 0.15

  // 加一点随机噪声，避免完全确定性决策
  const noise = (Math.random() - 0.5) * 0.10

  if (strength > threshold + noise) {
    // 进入底池
    if (Math.random() < profile.pfr && (available.canRaise || available.canBet)) {
      const amount = computeBetSize(profile, context.pot, available, context.bigBlind, true)
      const action = available.canRaise ? ActionType.Raise : ActionType.Bet
      return { action, amount }
    }
    // 跟注
    if (available.canCall) return { action: ActionType.Call, amount: 0 }
    if (available.canCheck) return { action: ActionType.Check, amount: 0 }
  }

  // 不入池
  if (available.canCheck) return { action: ActionType.Check, amount: 0 }
  return { action: ActionType.Fold, amount: 0 }
}

// ---------------------------------------------------------------------------
// Post-flop decision
// ---------------------------------------------------------------------------

function postFlopDecision(
  profile: AIProfile,
  strength: number,
  available: AvailableActions,
  context: AIContext,
): AIDecision {
  // --- 没有面对下注（可以 check 或主动 bet）---
  if (available.canCheck) {
    if (strength > 0.65) {
      // 强牌：按激进度决定是否下注
      if (Math.random() < profile.aggression && available.canBet) {
        return {
          action: ActionType.Bet,
          amount: computeBetSize(profile, context.pot, available, context.bigBlind, false),
        }
      }
      return { action: ActionType.Check, amount: 0 }
    }

    if (strength > 0.40) {
      // 中等牌力：偶尔下注
      if (Math.random() < profile.aggression * 0.3 && available.canBet) {
        return {
          action: ActionType.Bet,
          amount: computeBetSize(profile, context.pot, available, context.bigBlind, false),
        }
      }
      return { action: ActionType.Check, amount: 0 }
    }

    // 弱牌：偶尔诈唬
    if (Math.random() < profile.bluffFreq && available.canBet) {
      return {
        action: ActionType.Bet,
        amount: computeBetSize(profile, context.pot, available, context.bigBlind, false),
      }
    }
    return { action: ActionType.Check, amount: 0 }
  }

  // --- 面对下注 ---

  const betPressure = available.callAmount / Math.max(context.pot, 1)

  // 强牌：加注或跟注（门槛 0.45，覆盖两对、强顶对等中上牌力）
  if (strength > 0.45) {
    if (Math.random() < profile.aggression && available.canRaise) {
      return {
        action: ActionType.Raise,
        amount: computeBetSize(profile, context.pot, available, context.bigBlind, false),
      }
    }
    if (available.canCall) return { action: ActionType.Call, amount: 0 }
  }

  // 中等及弱牌：根据 foldToBet 性格决定是否弃牌
  // 底池赔率折扣：底池越大，跟注相对越便宜，越不该弃
  const potOddsDiscount = 1 - available.callAmount / (context.pot + available.callAmount + 1)
  // 位置折扣：后位（BTN/CO）更不愿意弃牌
  const posFoldMod = POSITION_FOLD_MODIFIERS[context.position] ?? 1.0
  const foldProb = profile.foldToBet * (1 - strength) * (0.5 + betPressure) * potOddsDiscount * posFoldMod

  if (Math.random() < foldProb) {
    // 偶尔诈唬加注代替弃牌
    if (Math.random() < profile.bluffFreq * 0.3 && available.canRaise) {
      return {
        action: ActionType.Raise,
        amount: computeBetSize(profile, context.pot, available, context.bigBlind, false),
      }
    }
    return { action: ActionType.Fold, amount: 0 }
  }

  // 不弃牌则跟注
  if (available.canCall) return { action: ActionType.Call, amount: 0 }
  return { action: ActionType.Fold, amount: 0 }
}
