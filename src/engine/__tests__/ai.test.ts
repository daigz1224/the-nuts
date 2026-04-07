import { describe, it, expect } from 'vitest'
import {
  getAIDecision,
  assignRandomProfiles,
  PROFILE_POOL,
  evaluatePreFlopStrength,
  evaluatePostFlopStrength,
  detectDraws,
  AIStyle,
  type AIProfile,
  type AIContext,
} from '../ai'
import { ActionType, type AvailableActions } from '../betting'
import { Rank, Suit, type Card } from '../card'
import { Position } from '../positions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit }
}

function makeAvailable(overrides: Partial<AvailableActions> = {}): AvailableActions {
  return {
    canFold: true,
    canCheck: false,
    canCall: true,
    callAmount: 20,
    canBet: false,
    canRaise: true,
    minBet: 40,
    maxBet: 1000,
    ...overrides,
  }
}

function makeContext(overrides: Partial<AIContext> = {}): AIContext {
  return {
    holeCards: [card(Rank.Ace, Suit.Spades), card(Rank.King, Suit.Spades)],
    communityCards: [],
    position: Position.BTN,
    pot: 30,
    bigBlind: 20,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Character profiles
// ---------------------------------------------------------------------------

// Helper: get a profile by style from the pool
function profileByStyle(style: AIStyle): AIProfile {
  return PROFILE_POOL.find(p => p.style === style)!
}

describe('assignRandomProfiles', () => {
  it('assigns a profile to each AI player', () => {
    const profiles = assignRandomProfiles([1, 2, 3, 4, 5])
    expect(profiles.size).toBe(5)
    for (let id = 1; id <= 5; id++) {
      expect(profiles.get(id)).toBeDefined()
    }
  })

  it('assigns all 5 distinct styles', () => {
    const profiles = assignRandomProfiles([1, 2, 3, 4, 5])
    const styles = new Set([...profiles.values()].map(p => p.style))
    expect(styles.size).toBe(5)
  })

  it('produces different orderings across calls (statistical)', () => {
    const results = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const profiles = assignRandomProfiles([1, 2, 3, 4, 5])
      const key = [1, 2, 3, 4, 5].map(id => profiles.get(id)!.style).join(',')
      results.add(key)
    }
    // With 120 permutations, 20 trials should produce at least 2 distinct orderings
    expect(results.size).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// Pre-flop hand strength
// ---------------------------------------------------------------------------

describe('evaluatePreFlopStrength', () => {
  it('AA is the strongest hand (1.0)', () => {
    const s = evaluatePreFlopStrength([card(Rank.Ace, Suit.Spades), card(Rank.Ace, Suit.Hearts)])
    expect(s).toBe(1.0)
  })

  it('22 is weakest pair (0.5)', () => {
    const s = evaluatePreFlopStrength([card(Rank.Two, Suit.Spades), card(Rank.Two, Suit.Hearts)])
    expect(s).toBe(0.5)
  })

  it('pairs are ranked: AA > KK > QQ > 22', () => {
    const aa = evaluatePreFlopStrength([card(Rank.Ace, Suit.Spades), card(Rank.Ace, Suit.Hearts)])
    const kk = evaluatePreFlopStrength([card(Rank.King, Suit.Spades), card(Rank.King, Suit.Hearts)])
    const qq = evaluatePreFlopStrength([card(Rank.Queen, Suit.Spades), card(Rank.Queen, Suit.Hearts)])
    const tt = evaluatePreFlopStrength([card(Rank.Two, Suit.Spades), card(Rank.Two, Suit.Hearts)])
    expect(aa).toBeGreaterThan(kk)
    expect(kk).toBeGreaterThan(qq)
    expect(qq).toBeGreaterThan(tt)
  })

  it('suited hands are stronger than offsuit', () => {
    const suited = evaluatePreFlopStrength([card(Rank.Ace, Suit.Spades), card(Rank.King, Suit.Spades)])
    const offsuit = evaluatePreFlopStrength([card(Rank.Ace, Suit.Spades), card(Rank.King, Suit.Hearts)])
    expect(suited).toBeGreaterThan(offsuit)
  })

  it('72o is trash (< 0.2)', () => {
    const s = evaluatePreFlopStrength([card(Rank.Seven, Suit.Spades), card(Rank.Two, Suit.Hearts)])
    expect(s).toBeLessThan(0.2)
  })

  it('connected hands get a bonus', () => {
    const connected = evaluatePreFlopStrength([card(Rank.Nine, Suit.Spades), card(Rank.Eight, Suit.Hearts)])
    const gapped = evaluatePreFlopStrength([card(Rank.Nine, Suit.Spades), card(Rank.Six, Suit.Hearts)])
    expect(connected).toBeGreaterThan(gapped)
  })
})

// ---------------------------------------------------------------------------
// Post-flop hand strength
// ---------------------------------------------------------------------------

describe('evaluatePostFlopStrength', () => {
  it('top pair is stronger than unconnected high card', () => {
    const community: Card[] = [
      card(Rank.King, Suit.Diamonds),
      card(Rank.Seven, Suit.Clubs),
      card(Rank.Three, Suit.Hearts),
    ]
    const topPair = evaluatePostFlopStrength(
      [card(Rank.King, Suit.Spades), card(Rank.Queen, Suit.Spades)],
      community,
    )
    const highCard = evaluatePostFlopStrength(
      [card(Rank.Ace, Suit.Spades), card(Rank.Jack, Suit.Spades)],
      community,
    )
    expect(topPair).toBeGreaterThan(highCard)
  })

  it('flush > straight > three of a kind > two pair > pair', () => {
    const community: Card[] = [
      card(Rank.Ten, Suit.Hearts),
      card(Rank.Nine, Suit.Hearts),
      card(Rank.Eight, Suit.Hearts),
      card(Rank.Two, Suit.Clubs),
      card(Rank.Three, Suit.Diamonds),
    ]
    const flush = evaluatePostFlopStrength(
      [card(Rank.King, Suit.Hearts), card(Rank.Four, Suit.Hearts)],
      community,
    )
    const straight = evaluatePostFlopStrength(
      [card(Rank.Jack, Suit.Spades), card(Rank.Seven, Suit.Clubs)],
      community,
    )
    const trips = evaluatePostFlopStrength(
      [card(Rank.Ten, Suit.Spades), card(Rank.Ten, Suit.Clubs)],
      community,
    )
    expect(flush).toBeGreaterThan(straight)
    expect(straight).toBeGreaterThan(trips)
  })
})

// ---------------------------------------------------------------------------
// Draw detection
// ---------------------------------------------------------------------------

describe('detectDraws', () => {
  it('detects flush draw', () => {
    const hole: [Card, Card] = [card(Rank.Ace, Suit.Hearts), card(Rank.King, Suit.Spades)]
    const community = [
      card(Rank.Ten, Suit.Hearts),
      card(Rank.Five, Suit.Hearts),
      card(Rank.Two, Suit.Hearts),
    ]
    const { flushDraw } = detectDraws(hole, community)
    expect(flushDraw).toBe(true)
  })

  it('no flush draw without hole card contribution', () => {
    const hole: [Card, Card] = [card(Rank.Ace, Suit.Spades), card(Rank.King, Suit.Spades)]
    const community = [
      card(Rank.Ten, Suit.Hearts),
      card(Rank.Five, Suit.Hearts),
      card(Rank.Two, Suit.Hearts),
      card(Rank.Three, Suit.Hearts),
    ]
    const { flushDraw } = detectDraws(hole, community)
    expect(flushDraw).toBe(false) // already a made flush on board
  })

  it('detects straight draw', () => {
    const hole: [Card, Card] = [card(Rank.Jack, Suit.Spades), card(Rank.Ten, Suit.Hearts)]
    const community = [
      card(Rank.Nine, Suit.Clubs),
      card(Rank.Eight, Suit.Diamonds),
      card(Rank.Two, Suit.Hearts),
    ]
    const { straightDraw } = detectDraws(hole, community)
    expect(straightDraw).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AI decision — behavioral tests
// ---------------------------------------------------------------------------

describe('getAIDecision', () => {
  it('returns a valid action type', () => {
    const profile = profileByStyle(AIStyle.TAG)
    const decision = getAIDecision(profile, makeContext(), makeAvailable())
    expect(Object.values(ActionType)).toContain(decision.action)
  })

  it('never folds when check is available and hand is decent', () => {
    const profile = profileByStyle(AIStyle.TAG)
    const available = makeAvailable({ canCheck: true, canCall: false })
    for (let i = 0; i < 100; i++) {
      const d = getAIDecision(profile, makeContext(), available)
      expect(d.action).not.toBe(ActionType.Fold)
    }
  })

  it('Rock folds more often than Maniac with a marginal hand', () => {
    const rock = profileByStyle(AIStyle.Rock)
    const maniac = profileByStyle(AIStyle.Maniac)
    // 85o — marginal hand: Rock should fold, Maniac often enters
    const marginalCtx = makeContext({
      holeCards: [card(Rank.Eight, Suit.Spades), card(Rank.Five, Suit.Hearts)],
    })
    const available = makeAvailable({ callAmount: 40 })

    let rockFolds = 0
    let maniacFolds = 0
    const N = 500
    for (let i = 0; i < N; i++) {
      if (getAIDecision(rock, marginalCtx, available).action === ActionType.Fold) rockFolds++
      if (getAIDecision(maniac, marginalCtx, available).action === ActionType.Fold) maniacFolds++
    }

    expect(rockFolds).toBeGreaterThan(maniacFolds)
  })

  it('CallingStation rarely folds when facing a bet with bottom pair', () => {
    const station = profileByStyle(AIStyle.CallingStation)
    // Bottom pair — weak but "has something"
    const ctx = makeContext({
      holeCards: [card(Rank.Three, Suit.Spades), card(Rank.Nine, Suit.Hearts)],
      communityCards: [
        card(Rank.King, Suit.Diamonds),
        card(Rank.Three, Suit.Clubs),
        card(Rank.Seven, Suit.Hearts),
      ],
    })
    const available = makeAvailable({ callAmount: 20 })

    let folds = 0
    const N = 300
    for (let i = 0; i < N; i++) {
      if (getAIDecision(station, ctx, available).action === ActionType.Fold) folds++
    }
    // CallingStation (foldToBet=0.12) should rarely fold bottom pair
    expect(folds / N).toBeLessThan(0.15)
  })

  it('TAG raises pre-flop with premium hands', () => {
    const tag = profileByStyle(AIStyle.TAG) // TAG
    const ctx = makeContext({
      holeCards: [card(Rank.Ace, Suit.Spades), card(Rank.Ace, Suit.Hearts)],
    })
    const available = makeAvailable()

    let raises = 0
    const N = 200
    for (let i = 0; i < N; i++) {
      const d = getAIDecision(tag, ctx, available)
      if (d.action === ActionType.Raise || d.action === ActionType.Bet) raises++
    }
    // TAG should raise AA > 60% of the time
    expect(raises / N).toBeGreaterThan(0.60)
  })

  it('raise amount is within valid range', () => {
    const profile = profileByStyle(AIStyle.TAG)
    const available = makeAvailable()
    for (let i = 0; i < 100; i++) {
      const d = getAIDecision(profile, makeContext(), available)
      if (d.action === ActionType.Raise || d.action === ActionType.Bet) {
        expect(d.amount).toBeGreaterThanOrEqual(available.minBet)
        expect(d.amount).toBeLessThanOrEqual(available.maxBet)
      }
    }
  })

  it('handles short stack (only fold or all-in)', () => {
    const profile = profileByStyle(AIStyle.TAG)
    const available = makeAvailable({
      canCheck: false,
      canCall: false,
      canRaise: false,
      canBet: false,
      minBet: 30,
      maxBet: 30,
    })
    for (let i = 0; i < 50; i++) {
      const d = getAIDecision(profile, makeContext(), available)
      expect([ActionType.Fold, ActionType.AllIn]).toContain(d.action)
    }
  })

  it('folds more when facing large bet with weak hand', () => {
    const tag = profileByStyle(AIStyle.TAG) // TAG
    const weakCtx = makeContext({
      holeCards: [card(Rank.Four, Suit.Spades), card(Rank.Three, Suit.Hearts)],
      communityCards: [
        card(Rank.King, Suit.Diamonds),
        card(Rank.Queen, Suit.Clubs),
        card(Rank.Jack, Suit.Hearts),
      ],
    })

    const smallBet = makeAvailable({ callAmount: 20 })
    const largeBet = makeAvailable({ callAmount: 200 })

    let smallFolds = 0
    let largeFolds = 0
    const N = 300
    for (let i = 0; i < N; i++) {
      if (getAIDecision(tag, weakCtx, smallBet).action === ActionType.Fold) smallFolds++
      if (getAIDecision(tag, weakCtx, largeBet).action === ActionType.Fold) largeFolds++
    }

    expect(largeFolds).toBeGreaterThan(smallFolds)
  })
})
