interface OddsDisplayProps {
  potOdds: number
  neededWinRate: number
  currentWinRate: number
  isPositiveEV: boolean
  evDescription: string
}

export function OddsDisplay({
  potOdds,
  neededWinRate,
  currentWinRate,
  isPositiveEV,
  evDescription,
}: OddsDisplayProps) {
  const neededPct = Math.round(neededWinRate * 100)
  const currentPct = Math.round(currentWinRate * 100)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-text-secondary">底池赔率</span>
        <span className="font-mono text-text-primary">
          需 {neededPct}%
        </span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span className="text-text-secondary">当前胜率</span>
        <span className="font-mono text-text-primary">{currentPct}%</span>
      </div>
      <div className={`text-xs font-bold px-2 py-1 rounded text-center ${
        isPositiveEV
          ? 'bg-green-500/20 text-green-300'
          : 'bg-red-500/20 text-red-300'
      }`}>
        {isPositiveEV ? '+EV 可以跟注' : '-EV 考虑弃牌'}
      </div>
    </div>
  )
}
