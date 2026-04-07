import { describe, it, expect } from 'vitest'
import { calculateEquity } from '../equity'
import { stringToCard } from '../card'
import type { Card } from '../card'

function cards(...strs: string[]): Card[] {
  return strs.map(stringToCard)
}

function hole(a: string, b: string): [Card, Card] {
  return [stringToCard(a), stringToCard(b)]
}

describe('calculateEquity', () => {
  it('returns valid percentages that sum to ~1', () => {
    const result = calculateEquity(hole('As', 'Kh'), [], 1, 500)
    const total = result.winRate + result.tieRate + result.lossRate
    expect(total).toBeCloseTo(1, 1)
    expect(result.sampleSize).toBe(500)
  })

  it('AA vs 1 opponent preflop should have ~80%+ equity', () => {
    const result = calculateEquity(hole('As', 'Ah'), [], 1, 2000)
    expect(result.winRate).toBeGreaterThan(0.7)
  })

  it('72o vs 1 opponent should have low equity', () => {
    const result = calculateEquity(hole('7h', '2c'), [], 1, 2000)
    expect(result.winRate).toBeLessThan(0.5)
  })

  it('works on flop with community cards', () => {
    const community = cards('Ks', 'Qh', '3d')
    const result = calculateEquity(hole('As', 'Kh'), community, 1, 1000)
    expect(result.winRate).toBeGreaterThan(0.5)
    expect(result.sampleSize).toBe(1000)
  })

  it('works on turn with 4 community cards', () => {
    const community = cards('Ks', 'Qh', '3d', 'Jc')
    const result = calculateEquity(hole('As', 'Kh'), community, 1, 1000)
    expect(result.winRate).toBeGreaterThan(0.5)
  })

  it('handles multiple opponents', () => {
    const result = calculateEquity(hole('As', 'Ah'), [], 5, 1000)
    // AA vs 5 opponents still strong but lower than vs 1
    expect(result.winRate).toBeGreaterThan(0.4)
    expect(result.winRate).toBeLessThan(0.95)
  })
})
