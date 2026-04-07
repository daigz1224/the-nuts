export interface PotOddsResult {
  potOdds: number        // ratio: call / (pot + call), e.g. 0.25
  neededWinRate: number   // same as potOdds — minimum equity to break even
  isPositiveEV: boolean   // true if equity >= neededWinRate
  ev: number              // expected value in chips: equity * pot - (1 - equity) * callAmount
  evDescription: string   // human-readable description
}

/**
 * Calculate pot odds and determine if a call is +EV.
 *
 * @param pot - current pot size
 * @param callAmount - amount needed to call
 * @param equity - hero's effective equity (0-1), should include weighted tie share
 */
export function calculatePotOdds(
  pot: number,
  callAmount: number,
  equity: number,
): PotOddsResult {
  if (callAmount <= 0) {
    return {
      potOdds: 0,
      neededWinRate: 0,
      isPositiveEV: true,
      ev: 0,
      evDescription: '可以免费看牌',
    }
  }

  const potOdds = callAmount / (pot + callAmount)
  const neededWinRate = potOdds
  const isPositiveEV = equity >= neededWinRate

  // EV = equity * pot_won - (1-equity) * call_cost
  // pot_won = pot (what's already in) when we win, we also get our call back
  const ev = equity * pot - (1 - equity) * callAmount

  const eqPct = (equity * 100).toFixed(1)
  const neededPct = (neededWinRate * 100).toFixed(1)

  const evDescription = isPositiveEV
    ? `+EV（+${ev.toFixed(0)}）：权益 ${eqPct}% > 所需 ${neededPct}%`
    : `-EV（${ev.toFixed(0)}）：权益 ${eqPct}% < 所需 ${neededPct}%`

  return { potOdds, neededWinRate, isPositiveEV, ev, evDescription }
}
