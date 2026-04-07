export enum Suit {
  Spades = 's',
  Hearts = 'h',
  Diamonds = 'd',
  Clubs = 'c',
}

export enum Rank {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14,
}

export interface Card {
  rank: Rank
  suit: Suit
}

const RANK_CHARS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}

const CHAR_TO_RANK: Record<string, Rank> = {
  '2': Rank.Two, '3': Rank.Three, '4': Rank.Four, '5': Rank.Five,
  '6': Rank.Six, '7': Rank.Seven, '8': Rank.Eight, '9': Rank.Nine,
  'T': Rank.Ten, 'J': Rank.Jack, 'Q': Rank.Queen, 'K': Rank.King, 'A': Rank.Ace,
}

const CHAR_TO_SUIT: Record<string, Suit> = {
  's': Suit.Spades, 'h': Suit.Hearts, 'd': Suit.Diamonds, 'c': Suit.Clubs,
}

export const RANK_NAMES_ZH: Record<Rank, string> = {
  [Rank.Two]: '2',
  [Rank.Three]: '3',
  [Rank.Four]: '4',
  [Rank.Five]: '5',
  [Rank.Six]: '6',
  [Rank.Seven]: '7',
  [Rank.Eight]: '8',
  [Rank.Nine]: '9',
  [Rank.Ten]: '10',
  [Rank.Jack]: 'J',
  [Rank.Queen]: 'Q',
  [Rank.King]: 'K',
  [Rank.Ace]: 'A',
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Spades]: '♠',
  [Suit.Hearts]: '♥',
  [Suit.Diamonds]: '♦',
  [Suit.Clubs]: '♣',
}

/** Compact notation: "As" = Ace of spades, "Td" = Ten of diamonds */
export function cardToString(card: Card): string {
  return RANK_CHARS[card.rank] + card.suit
}

export function stringToCard(str: string): Card {
  if (str.length !== 2) throw new Error(`Invalid card string: ${str}`)
  const rank = CHAR_TO_RANK[str[0]]
  const suit = CHAR_TO_SUIT[str[1]]
  if (rank === undefined || suit === undefined) {
    throw new Error(`Invalid card string: ${str}`)
  }
  return { rank, suit }
}

/** Create an ordered 52-card deck */
export function createDeck(): Card[] {
  const cards: Card[] = []
  const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
  for (const suit of suits) {
    for (let rank = Rank.Two; rank <= Rank.Ace; rank++) {
      cards.push({ rank, suit })
    }
  }
  return cards
}
