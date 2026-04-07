import { describe, it, expect } from 'vitest'
import { evaluatePreFlopStrength } from '../hand-strength'
import { stringToCard } from '../card'
import type { Card } from '../card'
import { Position } from '../positions'

function hole(a: string, b: string): [Card, Card] {
  return [stringToCard(a), stringToCard(b)]
}

describe('evaluatePreFlopStrength', () => {
  it('AA is tier 1', () => {
    const result = evaluatePreFlopStrength(hole('As', 'Ah'), Position.UTG)
    expect(result.tier).toBe(1)
    expect(result.tierLabel).toBe('超强牌')
  })

  it('KK is tier 1', () => {
    const result = evaluatePreFlopStrength(hole('Ks', 'Kh'), Position.MP)
    expect(result.tier).toBe(1)
  })

  it('AKs is tier 1', () => {
    const result = evaluatePreFlopStrength(hole('As', 'Ks'), Position.CO)
    expect(result.tier).toBe(1)
  })

  it('AKo is tier 2', () => {
    const result = evaluatePreFlopStrength(hole('As', 'Kh'), Position.BTN)
    expect(result.tier).toBe(2)
  })

  it('JJ is tier 2', () => {
    const result = evaluatePreFlopStrength(hole('Js', 'Jh'), Position.UTG)
    expect(result.tier).toBe(2)
  })

  it('77 is tier 3', () => {
    const result = evaluatePreFlopStrength(hole('7s', '7h'), Position.CO)
    expect(result.tier).toBe(3)
  })

  it('22 is tier 4', () => {
    const result = evaluatePreFlopStrength(hole('2s', '2h'), Position.BTN)
    expect(result.tier).toBe(4)
  })

  it('72o is tier 5', () => {
    const result = evaluatePreFlopStrength(hole('7h', '2c'), Position.UTG)
    expect(result.tier).toBe(5)
    expect(result.tierLabel).toBe('弱牌')
  })

  it('provides position-specific advice for UTG', () => {
    const result = evaluatePreFlopStrength(hole('7h', '2c'), Position.UTG)
    expect(result.positionAdvice).toContain('弃牌')
  })

  it('provides position-specific advice for BTN with speculative hand', () => {
    const result = evaluatePreFlopStrength(hole('5s', '5h'), Position.BTN)
    expect(result.positionAdvice).toContain('跟注')
  })

  it('generates correct hand name', () => {
    expect(evaluatePreFlopStrength(hole('As', 'Ks'), Position.UTG).handName).toBe('AKs')
    expect(evaluatePreFlopStrength(hole('As', 'Kh'), Position.UTG).handName).toBe('AKo')
    expect(evaluatePreFlopStrength(hole('Qs', 'Qh'), Position.UTG).handName).toBe('QQ')
  })
})
