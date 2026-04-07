import type { Player } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import { POSITION_NAMES_ZH } from '@/engine/positions'
import { CardFace } from '@/components/cards/CardFace'
import { CardBack } from '@/components/cards/CardBack'
import { ChipStack } from '@/components/common/ChipStack'

interface PlayerSeatProps {
  player: Player
  isCurrentTurn: boolean
  isHuman: boolean
  gamePhase: GamePhase
  compact?: boolean
}

export function PlayerSeat({ player, isCurrentTurn, isHuman, gamePhase, compact = false }: PlayerSeatProps) {
  const isShowdown = gamePhase === GamePhase.Showdown
  const showCards = isHuman || isShowdown
  const cardSize = compact && !isHuman ? 'xs' as const : 'sm' as const

  return (
    <div
      className={`
        flex flex-col items-center ${compact ? 'gap-0.5 p-1' : 'gap-1 p-2'} rounded-[var(--radius-surface)]
        transition-all duration-200
        ${player.isFolded ? 'opacity-30' : ''}
        ${isCurrentTurn ? 'ring-2 ring-amber-400 bg-amber-900/30 shadow-[0_0_12px_rgba(255,215,0,0.3)]' : ''}
      `}
    >
      {/* Position badge */}
      {player.position && (
        <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-mono text-text-secondary bg-bg-surface px-1 py-0.5 rounded`}>
          {POSITION_NAMES_ZH[player.position]}
        </span>
      )}

      {/* Hole cards */}
      <div className="flex gap-0.5">
        {player.holeCards && !player.isFolded ? (
          showCards ? (
            <>
              <CardFace card={player.holeCards[0]} size={cardSize} />
              <CardFace card={player.holeCards[1]} size={cardSize} />
            </>
          ) : (
            <>
              <CardBack size={cardSize} />
              <CardBack size={cardSize} />
            </>
          )
        ) : (
          <div className={compact && !isHuman ? 'w-[60px] h-[40px]' : 'w-[84px] h-[56px]'} />
        )}
      </div>

      {/* Name */}
      <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium ${isHuman ? 'text-text-accent' : 'text-text-primary'}`}>
        {player.name}
      </span>

      {/* Chips */}
      <ChipStack amount={player.chips} className={compact ? 'text-xs' : ''} />

      {/* Current bet */}
      {player.currentBet > 0 && (
        <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-mono text-pot`}>
          {compact ? player.currentBet : `下注: ${player.currentBet}`}
        </span>
      )}

      {/* All-in indicator */}
      {player.isAllIn && (
        <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-bold text-action-raise`}>全下</span>
      )}
    </div>
  )
}
