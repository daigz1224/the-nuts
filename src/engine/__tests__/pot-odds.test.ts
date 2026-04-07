import { describe, it, expect } from 'vitest'
import { calculatePotOdds } from '../pot-odds'

describe('calculatePotOdds', () => {
  it('calculates correct pot odds', () => {
    // Pot 100, call 50: odds = 50/150 = 33.3%
    const result = calculatePotOdds(100, 50, 0.4)
    expect(result.potOdds).toBeCloseTo(0.333, 2)
    expect(result.neededWinRate).toBeCloseTo(0.333, 2)
  })

  it('identifies +EV call', () => {
    // Need 33% to call, have 40% equity
    const result = calculatePotOdds(100, 50, 0.4)
    expect(result.isPositiveEV).toBe(true)
    expect(result.evDescription).toContain('+EV')
  })

  it('identifies -EV call', () => {
    // Need 33% to call, have 20% equity
    const result = calculatePotOdds(100, 50, 0.2)
    expect(result.isPositiveEV).toBe(false)
    expect(result.evDescription).toContain('-EV')
  })

  it('handles free check (callAmount = 0)', () => {
    const result = calculatePotOdds(100, 0, 0.1)
    expect(result.potOdds).toBe(0)
    expect(result.isPositiveEV).toBe(true)
    expect(result.evDescription).toContain('免费看牌')
  })

  it('handles large pot with small call', () => {
    // Pot 1000, call 10: odds = 10/1010 ≈ 1%
    const result = calculatePotOdds(1000, 10, 0.05)
    expect(result.potOdds).toBeCloseTo(0.0099, 2)
    expect(result.isPositiveEV).toBe(true)
  })
})
