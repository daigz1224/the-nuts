export interface PotOddsResult {
  potOdds: number        // ratio: call / (pot + call), e.g. 0.25
  neededWinRate: number   // same as potOdds — minimum win rate to break even
  isPositiveEV: boolean   // true if currentWinRate >= neededWinRate
  evDescription: string   // human-readable description
}

/**
 * Calculate pot odds and determine if a call is +EV.
 *
 * @param pot - current pot size
 * @param callAmount - amount needed to call
 * @param currentWinRate - hero's estimated win rate (0-1), from Monte Carlo
 */
export function calculatePotOdds(
  pot: number,
  callAmount: number,
  currentWinRate: number,
): PotOddsResult {
  if (callAmount <= 0) {
    return {
      potOdds: 0,
      neededWinRate: 0,
      isPositiveEV: true,
      evDescription: '可以免费看牌',
    }
  }

  const potOdds = callAmount / (pot + callAmount)
  const neededWinRate = potOdds
  const isPositiveEV = currentWinRate >= neededWinRate

  const winPct = (currentWinRate * 100).toFixed(1)
  const neededPct = (neededWinRate * 100).toFixed(1)

  const evDescription = isPositiveEV
    ? `+EV：胜率 ${winPct}% > 所需 ${neededPct}%`
    : `-EV：胜率 ${winPct}% < 所需 ${neededPct}%`

  return { potOdds, neededWinRate, isPositiveEV, evDescription }
}
