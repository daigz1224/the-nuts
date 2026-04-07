import type { Player } from '@/engine/game'
import { POSITION_NAMES_ZH } from '@/engine/positions'
import { CardFace } from '@/components/cards/CardFace'

interface HeroAreaProps {
  player: Player
  isCurrentTurn: boolean
  isWinner?: boolean
}

export function HeroArea({ player, isCurrentTurn, isWinner = false }: HeroAreaProps) {
  return (
    <div
      className={`
        flex flex-col items-center gap-1.5 sm:gap-2.5 px-4 sm:px-8 py-2 sm:py-4 rounded-2xl
        transition-all duration-200
        border
        ${isWinner
          ? 'border-yellow-500/60 bg-gradient-to-b from-yellow-900/25 to-yellow-950/10 shadow-[0_0_24px_rgba(255,215,0,0.3)]'
          : isCurrentTurn
            ? 'border-amber-600/40 bg-gradient-to-b from-amber-900/15 to-transparent shadow-[0_0_16px_rgba(255,215,0,0.15)]'
            : 'border-amber-800/20 bg-bg-surface/5'
        }
      `}
    >
      {/* Position badge */}
      {player.position && (
        <span className="text-[10px] font-mono text-text-secondary bg-bg-surface/60 px-2.5 py-0.5 rounded-full">
          {POSITION_NAMES_ZH[player.position]}
        </span>
      )}

      {/* Hole cards — large with breathing room, greyed out if folded */}
      <div className={`flex gap-2 sm:gap-3 py-0.5 sm:py-1 ${player.isFolded ? 'grayscale opacity-40' : ''}`}>
        {player.holeCards ? (
          <>
            <CardFace card={player.holeCards[0]} size="sm" className="sm:!w-[52px] sm:!h-[72px] sm:!text-lg" />
            <CardFace card={player.holeCards[1]} size="sm" className="sm:!w-[52px] sm:!h-[72px] sm:!text-lg" />
          </>
        ) : (
          <div className="h-[56px] sm:h-[72px]" />
        )}
      </div>

      {/* Folded label */}
      {player.isFolded && (
        <span className="text-[10px] text-red-400/70 font-mono">已弃牌</span>
      )}

      {/* Name + chips */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-text-accent">{player.avatar} {player.name}</span>
        <span className="text-sm font-mono text-chip">{player.chips.toLocaleString()}</span>
      </div>

      {/* Current bet — always reserve height to prevent layout shifts */}
      <span className={`text-xs font-mono ${player.currentBet > 0 ? 'text-pot' : 'text-transparent'}`}>
        {player.currentBet > 0 ? `下注: ${player.currentBet}` : '\u00A0'}
      </span>
    </div>
  )
}
