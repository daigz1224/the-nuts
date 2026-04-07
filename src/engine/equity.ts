import type { Card } from './card'
import { createDeck } from './card'
import { bestOfSeven } from './evaluator'

export interface EquityResult {
  winRate: number
  tieRate: number
  lossRate: number
  /** Effective equity: winRate + weighted tieRate (tie pot share) */
  equity: number
  sampleSize: number
}

/**
 * Monte Carlo equity calculator.
 * Simulates random runouts to estimate win/tie/loss rates.
 */
export function calculateEquity(
  holeCards: [Card, Card],
  communityCards: Card[],
  numOpponents: number,
  simulations: number = 3000,
): EquityResult {
  const knownCards = new Set(
    [...holeCards, ...communityCards].map(c => `${c.rank}-${c.suit}`)
  )

  // Build the remaining deck
  const remaining = createDeck().filter(
    c => !knownCards.has(`${c.rank}-${c.suit}`)
  )

  const cardsToBoard = 5 - communityCards.length
  const cardsNeeded = cardsToBoard + numOpponents * 2

  if (remaining.length < cardsNeeded) {
    return { winRate: 0, tieRate: 0, lossRate: 0, equity: 0, sampleSize: 0 }
  }

  let wins = 0
  let ties = 0
  let losses = 0
  let tieShareSum = 0 // Sum of (1/numTiedPlayers) across tie simulations

  for (let sim = 0; sim < simulations; sim++) {
    // Fisher-Yates partial shuffle — only shuffle the first `cardsNeeded` positions
    const deck = [...remaining]
    for (let i = 0; i < cardsNeeded && i < deck.length; i++) {
      const j = i + Math.floor(Math.random() * (deck.length - i))
      const tmp = deck[i]
      deck[i] = deck[j]
      deck[j] = tmp
    }

    let idx = 0

    // Complete the board
    const board = [...communityCards]
    for (let i = 0; i < cardsToBoard; i++) {
      board.push(deck[idx++])
    }

    // Evaluate hero hand
    const heroSeven = [...holeCards, ...board]
    const heroResult = bestOfSeven(heroSeven)

    // Evaluate opponents
    let heroWins = true
    let tiedCount = 1 // hero counts as 1

    for (let opp = 0; opp < numOpponents; opp++) {
      const oppCards: [Card, Card] = [deck[idx++], deck[idx++]]
      const oppSeven = [...oppCards, ...board]
      const oppResult = bestOfSeven(oppSeven)

      if (oppResult.score > heroResult.score) {
        heroWins = false
        tiedCount = 0
        break
      } else if (oppResult.score === heroResult.score) {
        tiedCount++
      }
    }

    if (!heroWins) {
      losses++
    } else if (tiedCount > 1) {
      ties++
      tieShareSum += 1 / tiedCount
    } else {
      wins++
    }
  }

  const winRate = wins / simulations
  const tieRate = ties / simulations
  const lossRate = losses / simulations
  // Effective equity: full credit for wins + proportional share for ties
  const equity = winRate + (ties > 0 ? tieShareSum / simulations : 0)

  return {
    winRate,
    tieRate,
    lossRate,
    equity,
    sampleSize: simulations,
  }
}
