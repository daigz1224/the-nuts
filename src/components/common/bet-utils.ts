/** Classify a bet amount relative to the big blind */
export type BetSizeLevel = 'normal' | 'medium' | 'large'

export function betSizeLevel(amount: number, bigBlind: number): BetSizeLevel {
  if (amount >= bigBlind * 8) return 'large'
  if (amount >= bigBlind * 3) return 'medium'
  return 'normal'
}

/** Tailwind color class for a bet amount based on size */
export function amountColorClass(amount: number, bigBlind: number): string {
  const level = betSizeLevel(amount, bigBlind)
  if (level === 'large') return 'text-red-400 font-bold'
  if (level === 'medium') return 'text-amber-300 font-bold'
  return 'text-pot'
}
