import type { Card } from '@/engine/card'
import { CardFace } from '@/components/cards/CardFace'

interface CommunityCardsProps {
  cards: Card[]
}

export function CommunityCards({ cards }: CommunityCardsProps) {
  return (
    <div className="flex gap-1 sm:gap-2 justify-center">
      {cards.map((card, i) => (
        <CardFace key={i} card={card} size="sm" />
      ))}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-[40px] h-[56px] rounded-[var(--radius-card)] border border-dashed border-amber-700/30"
        />
      ))}
    </div>
  )
}
