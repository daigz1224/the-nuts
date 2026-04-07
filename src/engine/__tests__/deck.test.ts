import { describe, it, expect } from 'vitest'
import { Deck } from '../deck'
import { cardToString } from '../card'

describe('Deck', () => {
  it('starts with 52 cards', () => {
    const deck = new Deck()
    expect(deck.remaining()).toBe(52)
  })

  it('deals cards in sequence', () => {
    const deck = new Deck()
    const first = deck.deal()
    const second = deck.deal()
    expect(deck.remaining()).toBe(50)
    expect(cardToString(first)).not.toBe(cardToString(second))
  })

  it('dealMultiple returns correct count', () => {
    const deck = new Deck()
    const cards = deck.dealMultiple(5)
    expect(cards).toHaveLength(5)
    expect(deck.remaining()).toBe(47)
  })

  it('throws when deck is exhausted', () => {
    const deck = new Deck()
    deck.dealMultiple(52)
    expect(() => deck.deal()).toThrow('Deck exhausted')
  })

  it('burn advances index without returning a card', () => {
    const deck = new Deck()
    const before = deck.remaining()
    deck.burn()
    expect(deck.remaining()).toBe(before - 1)
  })

  it('burn throws when exhausted', () => {
    const deck = new Deck()
    deck.dealMultiple(52)
    expect(() => deck.burn()).toThrow('Deck exhausted')
  })

  it('shuffle changes card order', () => {
    const deck = new Deck()
    const original = deck.dealMultiple(52).map(cardToString)

    deck.reset()
    deck.shuffle()
    const shuffled = deck.dealMultiple(52).map(cardToString)

    // Extremely unlikely to be identical after shuffle
    expect(shuffled).not.toEqual(original)
    // But should contain the same cards
    expect([...shuffled].sort()).toEqual([...original].sort())
  })

  it('shuffle resets deal index', () => {
    const deck = new Deck()
    deck.dealMultiple(10)
    expect(deck.remaining()).toBe(42)
    deck.shuffle()
    expect(deck.remaining()).toBe(52)
  })
})
