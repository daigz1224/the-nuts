interface EquityBarProps {
  winRate: number // 0-1
  tieRate: number // 0-1
  label?: string
}

export function EquityBar({ winRate, tieRate, label = '胜率' }: EquityBarProps) {
  const winPct = Math.round(winRate * 100)
  const tiePct = Math.round(tieRate * 100)

  // Color: red < 30%, yellow 30-50%, green > 50%
  const barColor =
    winPct >= 50 ? 'bg-green-500' :
    winPct >= 30 ? 'bg-yellow-500' :
    'bg-red-500'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] text-text-secondary">{label}</span>
        <span className="text-sm font-mono font-bold text-text-accent">
          {winPct}%
          {tiePct > 0 && <span className="text-text-muted text-[10px] ml-1">(+{tiePct}% 平)</span>}
        </span>
      </div>
      <div className="h-2 bg-bg-card rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(winPct + tiePct, 100)}%` }}
        />
      </div>
    </div>
  )
}
