import type { Player } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import { ACTION_NAMES_ZH } from '@/engine/betting'
import { POSITION_NAMES_ZH } from '@/engine/positions'
import { CardFace } from '@/components/cards/CardFace'
import { amountColorClass } from '@/components/common/bet-utils'

interface OpponentRowProps {
  opponents: Player[]
  currentPlayerId: number | null
  gamePhase: GamePhase
  winnerIds?: Set<number>
  bigBlind: number
}

export function OpponentRow({ opponents, currentPlayerId, gamePhase, winnerIds, bigBlind }: OpponentRowProps) {
  const isShowdown = gamePhase === GamePhase.Showdown

  return (
    <div className="flex justify-center gap-1 sm:gap-2 px-2 py-1">
      {opponents.map(player => {
        const isActive = currentPlayerId === player.id
        const showCards = isShowdown && player.holeCards && !player.isFolded
        const isWinner = isShowdown && winnerIds?.has(player.id)

        return (
          <div
            key={player.id}
            className={`
              flex flex-col items-center gap-0.5 px-1.5 sm:px-2 py-1.5 rounded-lg min-w-0
              transition-all duration-200
              ${player.isFolded && !isShowdown ? 'opacity-30' : ''}
              ${player.isFolded && isShowdown ? 'opacity-40' : ''}
              ${isWinner ? 'ring-2 ring-inset ring-yellow-400 bg-yellow-900/30 shadow-[0_0_12px_rgba(255,215,0,0.4)]' : ''}
              ${isActive && !isWinner ? 'ring-1 ring-inset ring-amber-400 bg-amber-900/30 shadow-[0_0_8px_rgba(255,215,0,0.2)]' : ''}
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

            {/* Last action / bet status */}
            <span className="text-[8px] font-mono h-3 flex items-center">
              {player.isFolded ? (
                <span className="text-red-400/70">已弃牌</span>
              ) : player.isAllIn ? (
                <span className="font-bold text-action-raise">全下</span>
              ) : player.lastAction && !isShowdown ? (
                <span className="text-text-muted">
                  {ACTION_NAMES_ZH[player.lastAction.type]}
                  {player.lastAction.amount > 0 && (
                    <span className={`ml-0.5 ${amountColorClass(player.lastAction.amount, bigBlind)}`}>
                      {player.lastAction.amount}
                    </span>
                  )}
                </span>
              ) : player.currentBet > 0 ? (
                <span className={amountColorClass(player.currentBet, bigBlind)}>{player.currentBet}</span>
              ) : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}
