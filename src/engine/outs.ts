import type { Card } from './card'
import { createDeck } from './card'
import { bestOfSeven, evaluateFive } from './evaluator'
import { HandCategory } from './hand-rank'

export interface OutsResult {
  outs: Card[]
  outsCount: number
  drawTypes: string[]
  improveProb: number // probability of improving on next card
}

/**
 * Calculate outs — cards that improve the current hand.
 * Only applicable on flop (3 community) or turn (4 community).
 */
export function calculateOuts(
  holeCards: [Card, Card],
  communityCards: Card[],
): OutsResult {
  if (communityCards.length < 3 || communityCards.length > 4) {
    return { outs: [], outsCount: 0, drawTypes: [], improveProb: 0 }
  }

  const knownCards = new Set(
    [...holeCards, ...communityCards].map(c => `${c.rank}-${c.suit}`)
  )

  const remaining = createDeck().filter(
    c => !knownCards.has(`${c.rank}-${c.suit}`)
  )

  // Current hand category
  const currentCategory = communityCards.length >= 5
    ? bestOfSeven([...holeCards, ...communityCards.slice(0, 5)]).category
    : evaluatePartialCategory(holeCards, communityCards)

  const outs: Card[] = []

  for (const card of remaining) {
    const newCommunity = [...communityCards, card]

    let newCategory: HandCategory
    if (newCommunity.length >= 5) {
      newCategory = bestOfSeven([...holeCards, ...newCommunity.slice(0, 5)]).category
    } else {
      newCategory = evaluatePartialCategory(holeCards, newCommunity)
    }

    // Only count as an out if the hand CATEGORY improves
    // (e.g., high card → pair, pair → two pair, draw → flush/straight)
    if (newCategory > currentCategory) {
      outs.push(card)
    }
  }

  // Detect draw types
  const drawTypes = detectDrawTypes(holeCards, communityCards, currentCategory)

  return {
    outs,
    outsCount: outs.length,
    drawTypes,
    improveProb: remaining.length > 0 ? outs.length / remaining.length : 0,
  }
}

function evaluatePartialCategory(holeCards: [Card, Card], communityCards: Card[]): HandCategory {
  const all = [...holeCards, ...communityCards]
  if (all.length >= 7) {
    return bestOfSeven(all.slice(0, 7)).category
  }
  if (all.length === 6) {
    let best: HandCategory = HandCategory.HighCard
    let bestScore = 0
    for (let skip = 0; skip < 6; skip++) {
      const five = all.filter((_, i) => i !== skip)
      const result = evaluateFive(five)
      if (result.score > bestScore) {
        bestScore = result.score
        best = result.category
      }
    }
    return best
  }
  if (all.length === 5) {
    return evaluateFive(all).category
  }
  return HandCategory.HighCard
}

/**
 * Detect draw types from the current hand.
 */
function detectDrawTypes(
  holeCards: [Card, Card],
  communityCards: Card[],
  currentCategory: HandCategory,
): string[] {
  const all = [...holeCards, ...communityCards]
  const draws: string[] = []

  // Flush draw: 4 cards of same suit
  const suitCounts = new Map<string, number>()
  for (const c of all) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) || 0) + 1)
  }
  for (const count of suitCounts.values()) {
    if (count === 4 && currentCategory < HandCategory.Flush) {
      draws.push('同花听牌')
      break
    }
  }

  // Straight draw detection
  const uniqueRanks = [...new Set(all.map(c => c.rank))].sort((a, b) => a - b)

  if (currentCategory < HandCategory.Straight) {
    // Open-ended straight draw: 4 consecutive ranks with room on both sides
    // Gutshot: 4 ranks with one gap
    const { openEnded, gutshot } = detectStraightDraws(uniqueRanks)
    if (openEnded) draws.push('两头顺听牌')
    else if (gutshot) draws.push('卡顺听牌')
  }

  if (draws.length === 0 && currentCategory <= HandCategory.OnePair) {
    draws.push('无听牌')
  }

  return draws
}

function detectStraightDraws(sortedRanks: number[]): { openEnded: boolean; gutshot: boolean } {
  // Check all windows of 5 consecutive rank values
  let openEnded = false
  let gutshot = false

  // Add Ace as low (1) for wheel detection
  const ranks = [...sortedRanks]
  if (ranks.includes(14)) {
    ranks.unshift(1)
  }

  for (let low = 1; low <= 10; low++) {
    const high = low + 4
    const inWindow = ranks.filter(r => r >= low && r <= high).length

    if (inWindow === 4) {
      // Check if it's open-ended (both ends open) or gutshot (one gap in middle)
      const present = new Set(ranks.filter(r => r >= low && r <= high))
      let gaps = 0
      for (let r = low; r <= high; r++) {
        if (!present.has(r)) gaps++
      }

      if (gaps === 1) {
        // Check if the missing card is at the edge or middle
        const missingRank = [low, low + 1, low + 2, low + 3, low + 4].find(r => !present.has(r))!
        if (missingRank === low || missingRank === high) {
          // Edge missing — could be open-ended if not at board boundary
          if (missingRank > 1 && missingRank < 14) {
            openEnded = true
          } else {
            gutshot = true
          }
        } else {
          gutshot = true
        }
      }
    }
  }

  return { openEnded, gutshot }
}
