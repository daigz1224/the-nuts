import { motion, AnimatePresence } from 'framer-motion'
import type { Player } from '@/engine/game'
import { POSITION_NAMES_ZH } from '@/engine/positions'
import { CardFace } from '@/components/cards/CardFace'
import { ACTION_NAMES_ZH } from '@/engine/betting'
import { amountColorClass } from '@/components/common/bet-utils'

interface HeroAreaProps {
  player: Player
  isCurrentTurn: boolean
  isWinner?: boolean
  bigBlind: number
}

export function HeroArea({ player, isCurrentTurn, isWinner = false, bigBlind }: HeroAreaProps) {
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
        <AnimatePresence mode="popLayout">
          {player.holeCards ? (
            <>
              <motion.div
                key="card-0"
                initial={{ opacity: 0, x: -30, rotateY: 90 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.35, delay: 0 }}
              >
                <CardFace card={player.holeCards[0]} size="sm" className="sm:!w-[52px] sm:!h-[72px] sm:!text-lg" />
              </motion.div>
              <motion.div
                key="card-1"
                initial={{ opacity: 0, x: -30, rotateY: 90 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
              >
                <CardFace card={player.holeCards[1]} size="sm" className="sm:!w-[52px] sm:!h-[72px] sm:!text-lg" />
              </motion.div>
            </>
          ) : (
            <div className="h-[56px] sm:h-[72px]" />
          )}
        </AnimatePresence>
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

      {/* Last action / current bet — always reserve height */}
      <span className="text-xs font-mono h-4 flex items-center">
        {player.lastAction ? (
          <span className="text-text-secondary">
            {ACTION_NAMES_ZH[player.lastAction.type]}
            {player.lastAction.amount > 0 && (
              <span className={`ml-1 ${amountColorClass(player.lastAction.amount, bigBlind)}`}>{player.lastAction.amount}</span>
            )}
          </span>
        ) : player.currentBet > 0 ? (
          <span className={amountColorClass(player.currentBet, bigBlind)}>下注: {player.currentBet}</span>
        ) : (
          <span className="text-transparent">{'\u00A0'}</span>
        )}
      </span>
    </div>
  )
}
