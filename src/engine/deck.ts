import { type Card, createDeck } from './card'

export class Deck {
  private cards: Card[]
  private index: number

  constructor() {
    this.cards = createDeck()
    this.index = 0
  }

  /** Fisher-Yates shuffle */
  shuffle(): void {
    this.index = 0
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = this.cards[i]
      this.cards[i] = this.cards[j]
      this.cards[j] = tmp
    }
  }

  deal(): Card {
    if (this.index >= this.cards.length) {
      throw new Error('Deck exhausted')
    }
    return this.cards[this.index++]
  }

  dealMultiple(n: number): Card[] {
    const result: Card[] = []
    for (let i = 0; i < n; i++) {
      result.push(this.deal())
    }
    return result
  }

  /** Burn one card (advance index without returning) */
  burn(): void {
    if (this.index >= this.cards.length) {
      throw new Error('Deck exhausted')
    }
    this.index++
  }

  remaining(): number {
    return this.cards.length - this.index
  }

  reset(): void {
    this.cards = createDeck()
    this.index = 0
  }
}
