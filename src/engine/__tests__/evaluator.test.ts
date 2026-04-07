import { describe, it, expect } from 'vitest'
import { evaluateFive, bestOfSeven } from '../evaluator'
import { stringToCard } from '../card'
import { HandCategory } from '../hand-rank'

function cards(strs: string[]) {
  return strs.map(stringToCard)
}

describe('evaluateFive', () => {
  // --- Category detection ---

  it('detects Royal Flush', () => {
    const r = evaluateFive(cards(['Ah', 'Kh', 'Qh', 'Jh', 'Th']))
    expect(r.category).toBe(HandCategory.RoyalFlush)
    expect(r.description).toContain('皇家同花顺')
  })

  it('detects Straight Flush', () => {
    const r = evaluateFive(cards(['9h', '8h', '7h', '6h', '5h']))
    expect(r.category).toBe(HandCategory.StraightFlush)
    expect(r.description).toContain('同花顺')
  })

  it('detects Straight Flush wheel (A-2-3-4-5 suited)', () => {
    const r = evaluateFive(cards(['Ah', '2h', '3h', '4h', '5h']))
    expect(r.category).toBe(HandCategory.StraightFlush)
  })

  it('detects Four of a Kind', () => {
    const r = evaluateFive(cards(['As', 'Ah', 'Ad', 'Ac', 'Kh']))
    expect(r.category).toBe(HandCategory.FourOfAKind)
    expect(r.description).toContain('四条')
  })

  it('detects Full House', () => {
    const r = evaluateFive(cards(['As', 'Ah', 'Ad', 'Kc', 'Kh']))
    expect(r.category).toBe(HandCategory.FullHouse)
    expect(r.description).toContain('葫芦')
  })

  it('detects Flush', () => {
    const r = evaluateFive(cards(['Ah', 'Kh', '9h', '7h', '2h']))
    expect(r.category).toBe(HandCategory.Flush)
    expect(r.description).toContain('同花')
  })

  it('detects Straight', () => {
    const r = evaluateFive(cards(['9h', '8s', '7d', '6c', '5h']))
    expect(r.category).toBe(HandCategory.Straight)
    expect(r.description).toContain('顺子')
  })

  it('detects Wheel straight (A-2-3-4-5)', () => {
    const r = evaluateFive(cards(['Ah', '2s', '3d', '4c', '5h']))
    expect(r.category).toBe(HandCategory.Straight)
  })

  it('detects Three of a Kind', () => {
    const r = evaluateFive(cards(['As', 'Ah', 'Ad', 'Kc', '9h']))
    expect(r.category).toBe(HandCategory.ThreeOfAKind)
    expect(r.description).toContain('三条')
  })

  it('detects Two Pair', () => {
    const r = evaluateFive(cards(['As', 'Ah', 'Kd', 'Kc', '9h']))
    expect(r.category).toBe(HandCategory.TwoPair)
    expect(r.description).toContain('两对')
  })

  it('detects One Pair', () => {
    const r = evaluateFive(cards(['As', 'Ah', 'Kd', '9c', '7h']))
    expect(r.category).toBe(HandCategory.OnePair)
    expect(r.description).toContain('一对')
  })

  it('detects High Card', () => {
    const r = evaluateFive(cards(['Ah', 'Ks', '9d', '7c', '2h']))
    expect(r.category).toBe(HandCategory.HighCard)
    expect(r.description).toContain('高牌')
  })

  // --- Ranking comparisons ---

  it('Royal Flush > Straight Flush', () => {
    const royal = evaluateFive(cards(['Ah', 'Kh', 'Qh', 'Jh', 'Th']))
    const sf = evaluateFive(cards(['9h', '8h', '7h', '6h', '5h']))
    expect(royal.score).toBeGreaterThan(sf.score)
  })

  it('Straight Flush > Four of a Kind', () => {
    const sf = evaluateFive(cards(['9h', '8h', '7h', '6h', '5h']))
    const quads = evaluateFive(cards(['As', 'Ah', 'Ad', 'Ac', 'Kh']))
    expect(sf.score).toBeGreaterThan(quads.score)
  })

  it('Four of a Kind > Full House', () => {
    const quads = evaluateFive(cards(['As', 'Ah', 'Ad', 'Ac', 'Kh']))
    const fh = evaluateFive(cards(['Ks', 'Kh', 'Kd', 'Qc', 'Qh']))
    expect(quads.score).toBeGreaterThan(fh.score)
  })

  it('Full House > Flush', () => {
    const fh = evaluateFive(cards(['Ks', 'Kh', 'Kd', 'Qc', 'Qh']))
    const flush = evaluateFive(cards(['Ah', 'Kh', '9h', '7h', '2h']))
    expect(fh.score).toBeGreaterThan(flush.score)
  })

  it('Flush > Straight', () => {
    const flush = evaluateFive(cards(['Ah', 'Kh', '9h', '7h', '2h']))
    const straight = evaluateFive(cards(['Ah', 'Ks', 'Qd', 'Jc', 'Th']))
    expect(flush.score).toBeGreaterThan(straight.score)
  })

  it('Straight > Three of a Kind', () => {
    const straight = evaluateFive(cards(['Ah', 'Ks', 'Qd', 'Jc', 'Th']))
    const trips = evaluateFive(cards(['As', 'Ah', 'Ad', 'Kc', '9h']))
    expect(straight.score).toBeGreaterThan(trips.score)
  })

  it('Three of a Kind > Two Pair', () => {
    const trips = evaluateFive(cards(['As', 'Ah', 'Ad', 'Kc', '9h']))
    const twoPair = evaluateFive(cards(['As', 'Ah', 'Kd', 'Kc', '9h']))
    expect(trips.score).toBeGreaterThan(twoPair.score)
  })

  it('Two Pair > One Pair', () => {
    const twoPair = evaluateFive(cards(['As', 'Ah', 'Kd', 'Kc', '9h']))
    const onePair = evaluateFive(cards(['As', 'Ah', 'Kd', '9c', '7h']))
    expect(twoPair.score).toBeGreaterThan(onePair.score)
  })

  it('One Pair > High Card', () => {
    const onePair = evaluateFive(cards(['As', 'Ah', 'Kd', '9c', '7h']))
    const highCard = evaluateFive(cards(['Ah', 'Ks', '9d', '7c', '2h']))
    expect(onePair.score).toBeGreaterThan(highCard.score)
  })

  // --- Kicker comparisons within same category ---

  it('higher straight beats lower straight', () => {
    const high = evaluateFive(cards(['Ah', 'Ks', 'Qd', 'Jc', 'Th']))
    const low = evaluateFive(cards(['9h', '8s', '7d', '6c', '5h']))
    expect(high.score).toBeGreaterThan(low.score)
  })

  it('wheel is lowest straight', () => {
    const wheel = evaluateFive(cards(['Ah', '2s', '3d', '4c', '5h']))
    const sixHigh = evaluateFive(cards(['6h', '5s', '4d', '3c', '2h']))
    expect(sixHigh.score).toBeGreaterThan(wheel.score)
  })

  it('same pair, better kicker wins', () => {
    const betterKicker = evaluateFive(cards(['As', 'Ah', 'Kd', 'Qc', '9h']))
    const worseKicker = evaluateFive(cards(['As', 'Ah', 'Kd', 'Jc', '9h']))
    expect(betterKicker.score).toBeGreaterThan(worseKicker.score)
  })

  it('higher pair beats lower pair', () => {
    const aces = evaluateFive(cards(['As', 'Ah', '7d', '5c', '3h']))
    const kings = evaluateFive(cards(['Ks', 'Kh', 'Ad', 'Qc', 'Jh']))
    expect(aces.score).toBeGreaterThan(kings.score)
  })

  it('higher two pair beats lower two pair', () => {
    const aK = evaluateFive(cards(['As', 'Ah', 'Kd', 'Kc', '2h']))
    const aQ = evaluateFive(cards(['As', 'Ah', 'Qd', 'Qc', 'Kh']))
    expect(aK.score).toBeGreaterThan(aQ.score)
  })

  it('two pair with better kicker wins', () => {
    const betterK = evaluateFive(cards(['As', 'Ah', 'Kd', 'Kc', 'Qh']))
    const worseK = evaluateFive(cards(['As', 'Ah', 'Kd', 'Kc', 'Jh']))
    expect(betterK.score).toBeGreaterThan(worseK.score)
  })

  it('higher flush beats lower flush', () => {
    const aceFlush = evaluateFive(cards(['Ah', 'Kh', '9h', '7h', '2h']))
    const kingFlush = evaluateFive(cards(['Kd', 'Qd', '9d', '7d', '2d']))
    expect(aceFlush.score).toBeGreaterThan(kingFlush.score)
  })

  it('flush second card tiebreak', () => {
    const better = evaluateFive(cards(['Ah', 'Kh', '9h', '7h', '2h']))
    const worse = evaluateFive(cards(['Ad', 'Qd', '9d', '7d', '2d']))
    expect(better.score).toBeGreaterThan(worse.score)
  })

  it('full house trips rank takes priority', () => {
    const aFull = evaluateFive(cards(['As', 'Ah', 'Ad', '2c', '2h']))
    const kFull = evaluateFive(cards(['Ks', 'Kh', 'Kd', 'Ac', 'Ah']))
    expect(aFull.score).toBeGreaterThan(kFull.score)
  })

  it('four of a kind rank comparison', () => {
    const aceQuads = evaluateFive(cards(['As', 'Ah', 'Ad', 'Ac', '2h']))
    const kingQuads = evaluateFive(cards(['Ks', 'Kh', 'Kd', 'Kc', 'Ah']))
    expect(aceQuads.score).toBeGreaterThan(kingQuads.score)
  })

  // --- Split pot (equal hands) ---

  it('identical high cards have equal scores', () => {
    const a = evaluateFive(cards(['Ah', 'Ks', '9d', '7c', '2h']))
    const b = evaluateFive(cards(['Ad', 'Kh', '9s', '7h', '2d']))
    expect(a.score).toBe(b.score)
  })

  it('identical straights have equal scores', () => {
    const a = evaluateFive(cards(['9h', '8s', '7d', '6c', '5h']))
    const b = evaluateFive(cards(['9d', '8h', '7s', '6h', '5d']))
    expect(a.score).toBe(b.score)
  })

  it('identical full houses have equal scores', () => {
    const a = evaluateFive(cards(['As', 'Ah', 'Ad', 'Kc', 'Kh']))
    const b = evaluateFive(cards(['Ac', 'Ad', 'Ah', 'Ks', 'Kd']))
    expect(a.score).toBe(b.score)
  })

  // --- bestFive correctness ---

  it('bestFive contains 5 cards', () => {
    const r = evaluateFive(cards(['Ah', 'Ks', '9d', '7c', '2h']))
    expect(r.bestFive).toHaveLength(5)
  })

  // --- Edge cases ---

  it('A-K-Q-J-T is a straight, not just high cards', () => {
    const r = evaluateFive(cards(['As', 'Kh', 'Qd', 'Jc', 'Th']))
    expect(r.category).toBe(HandCategory.Straight)
  })

  it('K-Q-J-T-9 is a straight', () => {
    const r = evaluateFive(cards(['Ks', 'Qh', 'Jd', 'Tc', '9h']))
    expect(r.category).toBe(HandCategory.Straight)
  })

  it('A-2-3-4-6 is NOT a straight', () => {
    const r = evaluateFive(cards(['As', '2h', '3d', '4c', '6h']))
    expect(r.category).toBe(HandCategory.HighCard)
  })

  it('higher straight flush beats lower straight flush', () => {
    const high = evaluateFive(cards(['Kh', 'Qh', 'Jh', 'Th', '9h']))
    const low = evaluateFive(cards(['9d', '8d', '7d', '6d', '5d']))
    expect(high.score).toBeGreaterThan(low.score)
  })

  it('straight flush wheel is lowest straight flush', () => {
    const wheel = evaluateFive(cards(['Ah', '2h', '3h', '4h', '5h']))
    const sixHigh = evaluateFive(cards(['6d', '5d', '4d', '3d', '2d']))
    expect(sixHigh.score).toBeGreaterThan(wheel.score)
  })

  it('three of a kind kicker comparison', () => {
    const better = evaluateFive(cards(['As', 'Ah', 'Ad', 'Kc', 'Qh']))
    const worse = evaluateFive(cards(['As', 'Ah', 'Ad', 'Kc', 'Jh']))
    expect(better.score).toBeGreaterThan(worse.score)
  })

  it('throws on wrong number of cards', () => {
    expect(() => evaluateFive(cards(['As', 'Ah', 'Ad']))).toThrow()
  })
})

describe('bestOfSeven', () => {
  it('finds the best 5-card hand from 7', () => {
    // Hand: As Kh, Board: Qs Jd Th 3c 2s => straight A-K-Q-J-T
    const r = bestOfSeven(cards(['As', 'Kh', 'Qs', 'Jd', 'Th', '3c', '2s']))
    expect(r.category).toBe(HandCategory.Straight)
  })

  it('finds flush hidden in 7 cards', () => {
    // 5 hearts among 7 cards
    const r = bestOfSeven(cards(['Ah', 'Kh', '9h', '7h', '2h', 'Qs', 'Jd']))
    expect(r.category).toBe(HandCategory.Flush)
  })

  it('finds full house over two pair', () => {
    // Pair of A + pair of K + pair of Q, plus a 3rd A => full house aces over kings
    const r = bestOfSeven(cards(['As', 'Ah', 'Ad', 'Kc', 'Kh', 'Qs', '2d']))
    expect(r.category).toBe(HandCategory.FullHouse)
  })

  it('board plays as best hand', () => {
    // Board is a straight, hole cards don't help
    const r = bestOfSeven(cards(['2s', '3h', 'Ts', 'Jd', 'Qh', 'Kc', 'As']))
    expect(r.category).toBe(HandCategory.Straight)
  })

  it('picks higher full house when two are possible', () => {
    // AAA + KK is better than KKK + AA won't happen with 7 cards...
    // But AAK KK with a third A: As Ah Ad Ks Kh 9c 2d => AAA + KK
    const r = bestOfSeven(cards(['As', 'Ah', 'Ad', 'Ks', 'Kh', '9c', '2d']))
    expect(r.category).toBe(HandCategory.FullHouse)
    expect(r.description).toContain('A')
  })

  it('returns correct bestFive from 7 cards', () => {
    const r = bestOfSeven(cards(['As', 'Ah', '7d', '5c', '3h', 'Kd', '2s']))
    expect(r.bestFive).toHaveLength(5)
    expect(r.category).toBe(HandCategory.OnePair)
  })

  it('throws on wrong number of cards', () => {
    expect(() => bestOfSeven(cards(['As', 'Ah', 'Ad']))).toThrow()
  })

  it('four of a kind in 7 cards', () => {
    const r = bestOfSeven(cards(['As', 'Ah', 'Ad', 'Ac', 'Kh', 'Qd', '2c']))
    expect(r.category).toBe(HandCategory.FourOfAKind)
  })

  it('straight flush in 7 cards with distractors', () => {
    const r = bestOfSeven(cards(['9h', '8h', '7h', '6h', '5h', 'As', 'Kd']))
    expect(r.category).toBe(HandCategory.StraightFlush)
  })

  it('royal flush in 7 cards', () => {
    const r = bestOfSeven(cards(['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2s', '3d']))
    expect(r.category).toBe(HandCategory.RoyalFlush)
  })

  it('chooses flush over straight when both possible', () => {
    // 5 diamonds including a straight possibility but flush is better
    const r = bestOfSeven(cards(['Ad', 'Kd', 'Qd', 'Jd', '3d', 'Ts', '9h']))
    expect(r.category).toBe(HandCategory.Flush)
  })
})
