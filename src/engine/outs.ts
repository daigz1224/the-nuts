import type { Card } from './card'
import { createDeck } from './card'
import { evaluateBest } from './evaluator'
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

  const currentResult = evaluateBest([...holeCards, ...communityCards])
  const currentScore = currentResult.score

  const outs: Card[] = []

  for (const card of remaining) {
    const newScore = evaluateBest([...holeCards, ...communityCards, card]).score
    if (newScore > currentScore) {
      outs.push(card)
    }
  }

  const drawTypes = detectDrawTypes(holeCards, communityCards, currentResult.category)

  return {
    outs,
    outsCount: outs.length,
    drawTypes,
    improveProb: remaining.length > 0 ? outs.length / remaining.length : 0,
  }
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
      const present = new Set(ranks.filter(r => r >= low && r <= high))
      let gaps = 0
      for (let r = low; r <= high; r++) {
        if (!present.has(r)) gaps++
      }

      if (gaps === 1) {
        const missingRank = [low, low + 1, low + 2, low + 3, low + 4].find(r => !present.has(r))!
        if (missingRank === low || missingRank === high) {
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
