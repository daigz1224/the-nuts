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

  it('returns improveProb as ratio of outs to remaining cards', () => {
    const community = cards('3h', '7h', '2c')
    const result = calculateOuts(hole('Ah', 'Kh'), community)
    // 52 - 5 known = 47 remaining
    if (result.outsCount > 0) {
      expect(result.improveProb).toBeCloseTo(result.outsCount / 47, 5)
    }
  })
})
