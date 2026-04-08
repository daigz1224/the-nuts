import { motion, AnimatePresence } from 'framer-motion'
import { ChipStack } from '@/components/common/ChipStack'

interface PotProps {
  amount: number
}

export function Pot({ amount }: PotProps) {
  return (
    <AnimatePresence>
      {amount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 bg-amber-900/60 border border-amber-700/50 px-3 py-1 rounded-full"
        >
          <span className="text-xs text-amber-200">底池</span>
          <ChipStack amount={amount} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
