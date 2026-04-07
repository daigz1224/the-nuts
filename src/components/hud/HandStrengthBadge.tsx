interface HandStrengthBadgeProps {
  tier: number
  tierLabel: string
  handName: string
}

const TIER_COLORS: Record<number, string> = {
  1: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  2: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  3: 'bg-green-500/20 text-green-300 border-green-500/40',
  4: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
  5: 'bg-red-500/20 text-red-300 border-red-500/40',
}

export function HandStrengthBadge({ tier, tierLabel, handName }: HandStrengthBadgeProps) {
  const colorClass = TIER_COLORS[tier] || TIER_COLORS[5]

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${colorClass}`}>
      <span className="font-mono font-bold text-sm">{handName}</span>
      <span className="text-[10px]">{tierLabel}</span>
    </div>
  )
}
