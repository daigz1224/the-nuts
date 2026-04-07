import type { Card } from './card'

export enum HandCategory {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export interface HandResult {
  category: HandCategory
  /** Single numeric value for total ordering. Higher = better hand. */
  score: number
  /** The 5 cards that make the hand */
  bestFive: Card[]
  /** Chinese description, e.g. "两对，A和K" */
  description: string
}

export const CATEGORY_NAMES_ZH: Record<HandCategory, string> = {
  [HandCategory.HighCard]: '高牌',
  [HandCategory.OnePair]: '一对',
  [HandCategory.TwoPair]: '两对',
  [HandCategory.ThreeOfAKind]: '三条',
  [HandCategory.Straight]: '顺子',
  [HandCategory.Flush]: '同花',
  [HandCategory.FullHouse]: '葫芦',
  [HandCategory.FourOfAKind]: '四条',
  [HandCategory.StraightFlush]: '同花顺',
  [HandCategory.RoyalFlush]: '皇家同花顺',
}

/** Base for score encoding. Rank values go 2-14, so base 15 avoids collisions. */
const BASE = 15
const BASE5 = BASE ** 5 // category multiplier

/**
 * Encode hand score: category * 15^5 + k1*15^4 + k2*15^3 + k3*15^2 + k4*15 + k5
 * This produces a single number where any higher-category hand always beats lower,
 * and within the same category, kickers break ties.
 */
export function encodeScore(category: HandCategory, kickers: number[]): number {
  let score = category * BASE5
  for (let i = 0; i < kickers.length && i < 5; i++) {
    score += kickers[i] * (BASE ** (4 - i))
  }
  return score
}
