import { describe, it, expect } from 'vitest'
import { Suit, Rank, createDeck, cardToString, stringToCard } from '../card'

describe('createDeck', () => {
  it('creates 52 cards', () => {
    expect(createDeck()).toHaveLength(52)
  })

  it('has all unique cards', () => {
    const deck = createDeck()
    const strings = deck.map(cardToString)
    const unique = new Set(strings)
    expect(unique.size).toBe(52)
  })

  it('contains all suits', () => {
    const deck = createDeck()
    const suits = new Set(deck.map(c => c.suit))
    expect(suits).toEqual(new Set([Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]))
  })

  it('contains all ranks', () => {
    const deck = createDeck()
    const ranks = new Set(deck.map(c => c.rank))
    expect(ranks.size).toBe(13)
    expect(ranks.has(Rank.Two)).toBe(true)
    expect(ranks.has(Rank.Ace)).toBe(true)
  })
})

describe('cardToString / stringToCard', () => {
  it('round-trips correctly', () => {
    const deck = createDeck()
    for (const card of deck) {
      const str = cardToString(card)
      const parsed = stringToCard(str)
      expect(parsed).toEqual(card)
    }
  })

  it('formats known cards correctly', () => {
    expect(cardToString({ rank: Rank.Ace, suit: Suit.Spades })).toBe('As')
    expect(cardToString({ rank: Rank.Ten, suit: Suit.Diamonds })).toBe('Td')
    expect(cardToString({ rank: Rank.Two, suit: Suit.Clubs })).toBe('2c')
    expect(cardToString({ rank: Rank.King, suit: Suit.Hearts })).toBe('Kh')
  })

  it('parses known strings correctly', () => {
    expect(stringToCard('As')).toEqual({ rank: Rank.Ace, suit: Suit.Spades })
    expect(stringToCard('Td')).toEqual({ rank: Rank.Ten, suit: Suit.Diamonds })
    expect(stringToCard('2c')).toEqual({ rank: Rank.Two, suit: Suit.Clubs })
  })

  it('throws on invalid strings', () => {
    expect(() => stringToCard('')).toThrow()
    expect(() => stringToCard('X')).toThrow()
    expect(() => stringToCard('Ax')).toThrow()
    expect(() => stringToCard('1s')).toThrow()
  })
})
