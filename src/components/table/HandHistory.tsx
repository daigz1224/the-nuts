import type { GameState, HandHistoryEntry } from '@/engine/game'
import { PHASE_NAMES_ZH } from '@/engine/game'
import { ACTION_NAMES_ZH } from '@/engine/betting'
import { CardFace } from '@/components/cards/CardFace'

interface HandHistoryProps {
  gameState: GameState
}

export function HandHistory({ gameState }: HandHistoryProps) {
  const { handHistory, players } = gameState
  if (!handHistory || handHistory.length === 0) return null

  return (
    <div className="bg-bg-surface/40 rounded-xl border border-amber-800/20 overflow-hidden w-full">
      <div className="px-3 py-1.5 border-b border-amber-800/20">
        <span className="text-2xs font-mono text-text-muted">本手回顾</span>
      </div>
      <div className="max-h-[180px] overflow-y-auto scrollbar-hide">
        <div className="divide-y divide-amber-800/10">
          {handHistory.map((entry, idx) => (
            <HistoryRow key={idx} entry={entry} players={players} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoryRow({ entry, players }: { entry: HandHistoryEntry; players: GameState['players'] }) {
  if (entry.type === 'action') {
    const player = players[entry.playerId]
    const actionLabel = ACTION_NAMES_ZH[entry.action]
    return (
      <div className="flex items-center gap-2 px-3 py-1 text-2xs">
        <span className="shrink-0">{player.avatar}</span>
        <span className={`font-medium ${entry.playerId === 0 ? 'text-text-accent' : 'text-text-primary'}`}>
          {player.name}
        </span>
        <span className="text-text-secondary">
          {actionLabel}
          {entry.amount > 0 && <span className="font-mono ml-1 text-pot">{entry.amount}</span>}
        </span>
      </div>
    )
  }

  if (entry.type === 'phase') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface/30">
        <span className="text-3xs font-mono text-text-muted">
          — {PHASE_NAMES_ZH[entry.phase]} —
        </span>
        <div className="flex gap-0.5">
          {entry.communityCards.map((card, i) => (
            <CardFace key={i} card={card} size="xxs" />
          ))}
        </div>
      </div>
    )
  }

  if (entry.type === 'result') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/10">
        <span className="text-3xs">🏆</span>
        {entry.winners.map((w, i) => {
          const player = players[w.playerId]
          return (
            <span key={i} className="text-2xs">
              <span className="font-medium text-yellow-300">{player.avatar} {player.name}</span>
              <span className="text-text-secondary"> 赢得 </span>
              <span className="font-mono font-bold text-chip">{w.amount}</span>
            </span>
          )
        })}
      </div>
    )
  }

  return null
}
