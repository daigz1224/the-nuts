import { motion } from 'framer-motion'
import { Button } from '@/components/common/Button'

interface TournamentEndScreenProps {
  result: 'victory' | 'defeated'
  handNumber: number
  onReset: () => void
}

export function TournamentEndScreen({ result, handNumber, onReset }: TournamentEndScreenProps) {
  const isVictory = result === 'victory'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-5"
    >
      <span className="text-5xl">{isVictory ? '🏆' : '💀'}</span>

      <h1 className={`text-2xl font-bold font-[--font-title] ${
        isVictory ? 'text-yellow-300' : 'text-red-400'
      }`}>
        {isVictory ? '恭喜！你赢得了锦标赛！' : '你已被淘汰'}
      </h1>

      <div className={`text-center py-3 px-6 rounded-xl border ${
        isVictory
          ? 'bg-yellow-900/20 border-yellow-500/40'
          : 'bg-red-900/20 border-red-500/40'
      }`}>
        <p className="text-sm text-text-secondary">
          {isVictory
            ? `经过 ${handNumber} 手牌，你击败了所有对手`
            : `坚持了 ${handNumber} 手牌`
          }
        </p>
      </div>

      <Button variant={isVictory ? 'call' : 'neutral'} onClick={onReset}>
        重新开始
      </Button>
    </motion.div>
  )
}
