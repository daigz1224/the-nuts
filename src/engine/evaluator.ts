import type { Card } from './card'
import { Rank, RANK_NAMES_ZH } from './card'
import {
  HandCategory,
  type HandResult,
  CATEGORY_NAMES_ZH,
  encodeScore,
} from './hand-rank'

function rankName(rank: Rank): string {
  return RANK_NAMES_ZH[rank]
}

/** Evaluate exactly 5 cards. Cards need not be sorted. */
export function evaluateFive(cards: Card[]): HandResult {
  if (cards.length !== 5) throw new Error('evaluateFive requires exactly 5 cards')

  // Sort descending by rank
  const sorted = [...cards].sort((a, b) => b.rank - a.rank)
  const ranks = sorted.map(c => c.rank)

  // Check flush
  const isFlush = sorted.every(c => c.suit === sorted[0].suit)

  // Check straight
  const { isStraight, straightHigh } = detectStraight(ranks)

  // Count rank frequencies
  const freq = new Map<Rank, number>()
  for (const r of ranks) {
    freq.set(r, (freq.get(r) || 0) + 1)
  }

  // Sort frequency entries: by count desc, then by rank desc
  const freqEntries = [...freq.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return b[0] - a[0]
  })

  const counts = freqEntries.map(e => e[1])

  // Determine category and build result
  if (isFlush && isStraight) {
    if (straightHigh === Rank.Ace) {
      return {
        category: HandCategory.RoyalFlush,
        score: encodeScore(HandCategory.RoyalFlush, [Rank.Ace]),
        bestFive: sorted,
        description: CATEGORY_NAMES_ZH[HandCategory.RoyalFlush],
      }
    }
    return {
      category: HandCategory.StraightFlush,
      score: encodeScore(HandCategory.StraightFlush, [straightHigh]),
      bestFive: sortForStraight(sorted, straightHigh),
      description: `${CATEGORY_NAMES_ZH[HandCategory.StraightFlush]}，${rankName(straightHigh as Rank)}高`,
    }
  }

  if (counts[0] === 4) {
    const quadRank = freqEntries[0][0]
    const kicker = freqEntries[1][0]
    return {
      category: HandCategory.FourOfAKind,
      score: encodeScore(HandCategory.FourOfAKind, [quadRank, kicker]),
      bestFive: sorted,
      description: `${CATEGORY_NAMES_ZH[HandCategory.FourOfAKind]}，${rankName(quadRank)}`,
    }
  }

  if (counts[0] === 3 && counts[1] === 2) {
    const tripsRank = freqEntries[0][0]
    const pairRank = freqEntries[1][0]
    return {
      category: HandCategory.FullHouse,
      score: encodeScore(HandCategory.FullHouse, [tripsRank, pairRank]),
      bestFive: sorted,
      description: `${CATEGORY_NAMES_ZH[HandCategory.FullHouse]}，${rankName(tripsRank)}满${rankName(pairRank)}`,
    }
  }

  if (isFlush) {
    return {
      category: HandCategory.Flush,
      score: encodeScore(HandCategory.Flush, ranks),
      bestFive: sorted,
      description: `${CATEGORY_NAMES_ZH[HandCategory.Flush]}，${rankName(ranks[0] as Rank)}高`,
    }
  }

  if (isStraight) {
    return {
      category: HandCategory.Straight,
      score: encodeScore(HandCategory.Straight, [straightHigh]),
      bestFive: sortForStraight(sorted, straightHigh),
      description: `${CATEGORY_NAMES_ZH[HandCategory.Straight]}，${rankName(straightHigh as Rank)}高`,
    }
  }

  if (counts[0] === 3) {
    const tripsRank = freqEntries[0][0]
    const kickers = freqEntries.slice(1).map(e => e[0])
    return {
      category: HandCategory.ThreeOfAKind,
      score: encodeScore(HandCategory.ThreeOfAKind, [tripsRank, ...kickers]),
      bestFive: sorted,
      description: `${CATEGORY_NAMES_ZH[HandCategory.ThreeOfAKind]}，${rankName(tripsRank)}`,
    }
  }

  if (counts[0] === 2 && counts[1] === 2) {
    const highPair = freqEntries[0][0]
    const lowPair = freqEntries[1][0]
    const kicker = freqEntries[2][0]
    return {
      category: HandCategory.TwoPair,
      score: encodeScore(HandCategory.TwoPair, [highPair, lowPair, kicker]),
      bestFive: sorted,
      description: `${CATEGORY_NAMES_ZH[HandCategory.TwoPair]}，${rankName(highPair)}和${rankName(lowPair)}`,
    }
  }

  if (counts[0] === 2) {
    const pairRank = freqEntries[0][0]
    const kickers = freqEntries.slice(1).map(e => e[0])
    return {
      category: HandCategory.OnePair,
      score: encodeScore(HandCategory.OnePair, [pairRank, ...kickers]),
      bestFive: sorted,
      description: `${CATEGORY_NAMES_ZH[HandCategory.OnePair]}，${rankName(pairRank)}`,
    }
  }

  // High card
  return {
    category: HandCategory.HighCard,
    score: encodeScore(HandCategory.HighCard, ranks),
    bestFive: sorted,
    description: `${CATEGORY_NAMES_ZH[HandCategory.HighCard]}，${rankName(ranks[0] as Rank)}`,
  }
}

/** Evaluate 5, 6, or 7 cards, return the best 5-card hand */
export function evaluateBest(cards: Card[]): HandResult {
  if (cards.length < 5 || cards.length > 7) throw new Error('evaluateBest requires 5-7 cards')
  if (cards.length === 5) return evaluateFive(cards)
  if (cards.length === 7) return bestOfSeven(cards)

  // 6 cards: C(6,5) = 6 combinations
  let best: HandResult | null = null
  for (let skip = 0; skip < 6; skip++) {
    const five = cards.filter((_, i) => i !== skip)
    const result = evaluateFive(five)
    if (!best || result.score > best.score) best = result
  }
  return best!
}

/** Evaluate 7 cards, return the best 5-card hand */
export function bestOfSeven(sevenCards: Card[]): HandResult {
  if (sevenCards.length !== 7) throw new Error('bestOfSeven requires exactly 7 cards')

  let best: HandResult | null = null

  // Enumerate all C(7,5) = 21 combinations
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      // Exclude cards at index i and j
      const five = sevenCards.filter((_, idx) => idx !== i && idx !== j)
      const result = evaluateFive(five)
      if (best === null || result.score > best.score) {
        best = result
      }
    }
  }

  return best!
}

// --- helpers ---

function detectStraight(ranksDesc: number[]): { isStraight: boolean; straightHigh: number } {
  // Normal straight check: each card is exactly 1 less than the previous
  let isNormal = true
  for (let i = 1; i < ranksDesc.length; i++) {
    if (ranksDesc[i - 1] - ranksDesc[i] !== 1) {
      isNormal = false
      break
    }
  }
  if (isNormal) {
    return { isStraight: true, straightHigh: ranksDesc[0] }
  }

  // Wheel (A-2-3-4-5): ranks sorted desc would be [14, 5, 4, 3, 2]
  if (
    ranksDesc[0] === Rank.Ace &&
    ranksDesc[1] === Rank.Five &&
    ranksDesc[2] === Rank.Four &&
    ranksDesc[3] === Rank.Three &&
    ranksDesc[4] === Rank.Two
  ) {
    return { isStraight: true, straightHigh: Rank.Five }
  }

  return { isStraight: false, straightHigh: 0 }
}

/** Re-sort cards for straight display (Ace goes low in a wheel) */
function sortForStraight(sorted: Card[], highCard: number): Card[] {
  if (highCard === Rank.Five) {
    // Wheel: move Ace to end
    const ace = sorted.find(c => c.rank === Rank.Ace)!
    const rest = sorted.filter(c => c.rank !== Rank.Ace)
    return [...rest, ace]
  }
  return sorted
}
