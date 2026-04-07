import type { Card } from './card'
import { Rank } from './card'
import { Position } from './positions'

export interface HandStrengthResult {
  tier: number // 1-5
  tierLabel: string
  handName: string
  positionAdvice: string
}

/**
 * Evaluate pre-flop hand strength based on classic starting hand tiers.
 * Considers pocket pair rank, suited/offsuit, and position.
 */
export function evaluatePreFlopStrength(
  holeCards: [Card, Card],
  position: Position | null,
): HandStrengthResult {
  const [c1, c2] = holeCards
  const highRank = Math.max(c1.rank, c2.rank)
  const lowRank = Math.min(c1.rank, c2.rank)
  const isSuited = c1.suit === c2.suit
  const isPair = c1.rank === c2.rank

  const tier = getHandTier(highRank, lowRank, isSuited, isPair)
  const tierLabel = TIER_LABELS[tier]
  const handName = getHandName(highRank, lowRank, isSuited, isPair)
  const positionAdvice = getPositionAdvice(tier, position)

  return { tier, tierLabel, handName, positionAdvice }
}

function getHandTier(high: number, low: number, suited: boolean, pair: boolean): number {
  if (pair) {
    if (high >= Rank.Queen) return 1  // QQ, KK, AA
    if (high >= Rank.Jack) return 2   // JJ
    if (high >= Rank.Ten) return 2    // TT
    if (high >= Rank.Seven) return 3  // 77-99
    return 4                          // 22-66
  }

  // Ace-high hands
  if (high === Rank.Ace) {
    if (low === Rank.King && suited) return 1   // AKs
    if (low === Rank.King) return 2             // AKo
    if (low === Rank.Queen && suited) return 2  // AQs
    if (low === Rank.Queen) return 3            // AQo
    if (low === Rank.Jack && suited) return 2   // AJs
    if (low === Rank.Ten && suited) return 3    // ATs
    if (suited) return 4                        // Axs
    return 5                                    // Axo
  }

  // King-high
  if (high === Rank.King) {
    if (low === Rank.Queen && suited) return 3  // KQs
    if (low === Rank.Jack && suited) return 3   // KJs
    if (low >= Rank.Ten && suited) return 4     // KTs
    return 5
  }

  // Queen-high
  if (high === Rank.Queen) {
    if (low === Rank.Jack && suited) return 3   // QJs
    if (low === Rank.Ten && suited) return 4    // QTs
    return 5
  }

  // Suited connectors
  if (suited && high - low === 1 && low >= Rank.Five) return 4  // 56s-JTs

  // Suited one-gappers
  if (suited && high - low === 2 && low >= Rank.Five) return 4  // 57s-J9s

  return 5
}

const TIER_LABELS: Record<number, string> = {
  1: '超强牌',
  2: '强牌',
  3: '可玩牌',
  4: '投机牌',
  5: '弱牌',
}

function getHandName(high: number, low: number, suited: boolean, pair: boolean): string {
  const rankNames: Record<number, string> = {
    14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
    9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
  }
  const h = rankNames[high]
  const l = rankNames[low]

  if (pair) return `${h}${l}`
  return `${h}${l}${suited ? 's' : 'o'}`
}

function getPositionAdvice(tier: number, position: Position | null): string {
  if (!position) return ''

  const posName = POSITION_ZH[position]

  switch (position) {
    case Position.UTG:
      if (tier <= 2) return `${posName}：可以加注入池`
      if (tier === 3) return `${posName}：谨慎跟注或弃牌`
      return `${posName}：建议弃牌`

    case Position.MP:
      if (tier <= 2) return `${posName}：加注入池`
      if (tier === 3) return `${posName}：可以跟注`
      return `${posName}：建议弃牌`

    case Position.CO:
      if (tier <= 3) return `${posName}：加注入池`
      if (tier === 4) return `${posName}：可以跟注或小加注`
      return `${posName}：建议弃牌`

    case Position.BTN:
      if (tier <= 3) return `${posName}：加注入池`
      if (tier === 4) return `${posName}：可以跟注偷盲`
      return `${posName}：视情况弃牌或跟注`

    case Position.SB:
      if (tier <= 3) return `${posName}：加注入池`
      if (tier === 4) return `${posName}：可以跟注`
      return `${posName}：建议弃牌`

    case Position.BB:
      if (tier <= 3) return `${posName}：加注`
      if (tier === 4) return `${posName}：已投入盲注，可以跟注`
      return `${posName}：被加注时考虑弃牌`
  }
}

const POSITION_ZH: Record<Position, string> = {
  [Position.BTN]: '庄位',
  [Position.SB]: '小盲',
  [Position.BB]: '大盲',
  [Position.UTG]: '枪口',
  [Position.MP]: '中位',
  [Position.CO]: '关位',
}
