import { motion, AnimatePresence } from 'framer-motion'
import type { Card } from '@/engine/card'
import { cardToString } from '@/engine/card'
import { CardFace } from '@/components/cards/CardFace'

interface CommunityCardsProps {
  cards: Card[]
}

export function CommunityCards({ cards }: CommunityCardsProps) {
  return (
    <div className="flex gap-1 sm:gap-2 justify-center">
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => (
          <motion.div
            key={cardToString(card)}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: i < 3 ? i * 0.1 : 0 }}
          >
            <CardFace card={card} size="sm" />
          </motion.div>
        ))}
      </AnimatePresence>
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-[40px] h-[56px] rounded-[var(--radius-card)] border border-dashed border-amber-700/30"
        />
      ))}
    </div>
  )
}
