import type { Player } from '@/engine/game'

interface EliminationBannerProps {
  eliminatedIds: number[]
  players: Player[]
}

/** Rendered inside AppShell's motion.div — parent already handles fade-in animation */
export function EliminationBanner({ eliminatedIds, players }: EliminationBannerProps) {
  if (eliminatedIds.length === 0) return null

  const remainingCount = players.filter(p => p.chips > 0).length

  return (
    <div className="text-center py-2.5 px-4 rounded-xl border bg-red-900/25 border-red-500/40 w-full">
      {eliminatedIds.map(id => {
        const p = players[id]
        return (
          <div key={id} className="text-sm font-bold text-red-300">
            💀 {p.avatar} {p.name} 已被淘汰！
          </div>
        )
      })}
      <div className="text-xs text-text-muted mt-1">
        剩余 {remainingCount} 名玩家
      </div>
    </div>
  )
}
