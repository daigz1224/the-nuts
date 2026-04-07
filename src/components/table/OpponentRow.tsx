import type { Player } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import { POSITION_NAMES_ZH } from '@/engine/positions'
import { CardFace } from '@/components/cards/CardFace'

interface OpponentRowProps {
  opponents: Player[]
  currentPlayerId: number | null
  gamePhase: GamePhase
  winnerIds?: Set<number>
}

export function OpponentRow({ opponents, currentPlayerId, gamePhase, winnerIds }: OpponentRowProps) {
  const isShowdown = gamePhase === GamePhase.Showdown

  return (
    <div className="flex justify-center gap-1 sm:gap-2 flex-wrap px-2">
      {opponents.map(player => {
        const isActive = currentPlayerId === player.id
        const showCards = isShowdown && player.holeCards && !player.isFolded
        const isWinner = isShowdown && winnerIds?.has(player.id)

        return (
          <div
            key={player.id}
            className={`
              flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px]
              transition-all duration-200
              ${player.isFolded && !isShowdown ? 'opacity-30' : ''}
              ${player.isFolded && isShowdown ? 'opacity-40' : ''}
              ${isWinner ? 'ring-2 ring-yellow-400 bg-yellow-900/30 shadow-[0_0_12px_rgba(255,215,0,0.4)]' : ''}
              ${isActive && !isWinner ? 'ring-1 ring-amber-400 bg-amber-900/30 shadow-[0_0_8px_rgba(255,215,0,0.2)]' : ''}
            `}
          >
            {/* Position badge */}
            {player.position && (
              <span className="text-[8px] font-mono text-text-muted">
                {POSITION_NAMES_ZH[player.position]}
              </span>
            )}

            {/* Name */}
            <span className={`text-[11px] font-medium truncate max-w-[60px] ${isWinner ? 'text-yellow-300' : 'text-text-primary'}`}>
              {isWinner ? '👑' : player.avatar} {player.name}
            </span>

            {/* Showdown cards */}
            {showCards && player.holeCards && (
              <div className="flex gap-0.5 my-0.5">
                <CardFace card={player.holeCards[0]} size="xs" />
                <CardFace card={player.holeCards[1]} size="xs" />
              </div>
            )}

            {/* Chips */}
            <span className="text-[10px] font-mono text-chip">
              {player.chips.toLocaleString()}
            </span>

            {/* Bet or status */}
            {player.isAllIn && (
              <span className="text-[8px] font-bold text-action-raise">全下</span>
            )}
            {player.currentBet > 0 && !player.isAllIn && (
              <span className="text-[8px] font-mono text-pot">
                {player.currentBet}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
