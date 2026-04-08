import { describe, it, expect } from 'vitest'
import { calculateOuts } from '../outs'
import { stringToCard } from '../card'
import type { Card } from '../card'

function cards(...strs: string[]): Card[] {
  return strs.map(stringToCard)
}

function hole(a: string, b: string): [Card, Card] {
  return [stringToCard(a), stringToCard(b)]
}

describe('calculateOuts', () => {
  it('returns empty for pre-flop (< 3 community cards)', () => {
    const result = calculateOuts(hole('As', 'Kh'), [])
    expect(result.outsCount).toBe(0)
  })

  it('detects flush draw outs on flop', () => {
    // 4 hearts: Ah, Kh + 3h, 7h, 2c → need any heart for flush
    const community = cards('3h', '7h', '2c')
    const result = calculateOuts(hole('Ah', 'Kh'), community)
    // Should have outs (any remaining heart improves us)
    expect(result.outsCount).toBeGreaterThan(0)
    expect(result.drawTypes).toContain('同花听牌')
  })

  it('works on turn (4 community cards)', () => {
    const community = cards('3h', '7h', '2c', 'Td')
    const result = calculateOuts(hole('Ah', 'Kh'), community)
    expect(result.outsCount).toBeGreaterThanOrEqual(0)
    expect(result.improveProb).toBeGreaterThanOrEqual(0)
    expect(result.improveProb).toBeLessThanOrEqual(1)
  })

  it('detects no draw for made hand', () => {
    // Full house on flop — already very strong
    const community = cards('As', 'Ad', 'Kd')
    const result = calculateOuts(hole('Ah', 'Ks'), community)
    // May still have outs (e.g., quad draw), but drawTypes should not show straight/flush draws
    expect(result.drawTypes).not.toContain('同花听牌')
    expect(result.drawTypes).not.toContain('两头顺听牌')
  })

  it('sorts outs by improvement — straight-completing 9 before high cards', () => {
    // 7h 8c vs 3h Jc Td → a 9 makes 7-8-9-T-J straight
    const community = cards('3h', 'Jc', 'Td')
    const result = calculateOuts(hole('7h', '8c'), community)

    expect(result.drawTypes).toContain('卡顺听牌')

    // Find the 9s — they should be near the front (straight = huge improvement)
    const firstNineIndex = result.outs.findIndex(c => c.rank === 9)
    expect(firstNineIndex).toBeGreaterThanOrEqual(0) // 9 is an out
    expect(firstNineIndex).toBeLessThan(8) // should be in first 8 outs, not buried at the end

    // Also verify high-card-only improvements (like A or K) come after straight outs
    const firstAceIndex = result.outs.findIndex(c => c.rank === 14)
    if (firstAceIndex >= 0 && firstNineIndex >= 0) {
      expect(firstNineIndex).toBeLessThan(firstAceIndex)
    }
  })

  it('returns improveProb as ratio of outs to remaining cards', () => {
    const community = cards('3h', '7h', '2c')
    const result = calculateOuts(hole('Ah', 'Kh'), community)
    // 52 - 5 known = 47 remaining
    if (result.outsCount > 0) {
      expect(result.improveProb).toBeCloseTo(result.outsCount / 47, 5)
    }
  })
})
