import type { Card } from '@/engine/card'
import { Suit, RANK_NAMES_ZH, SUIT_SYMBOLS } from '@/engine/card'

interface CardFaceProps {
  card: Card
  size?: 'xxs' | 'xs' | 'sm' | 'md'
  className?: string
}

const suitColorClass: Record<Suit, string> = {
  [Suit.Spades]: 'text-suit-spade',
  [Suit.Hearts]: 'text-suit-heart',
  [Suit.Diamonds]: 'text-suit-diamond',
  [Suit.Clubs]: 'text-suit-club',
}

const sizeClasses = {
  xxs: 'w-[20px] h-[28px]',
  xs: 'w-[28px] h-[40px]',
  sm: 'w-[40px] h-[56px]',
  md: 'w-[52px] h-[72px]',
}

const rankSizeClasses = {
  xxs: 'text-5xs',
  xs: 'text-xs',
  sm: 'text-base',
  md: 'text-lg',
}

const suitSizeClasses = {
  xxs: 'text-4xs',
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-2xl',
}

export function CardFace({ card, size = 'md', className = '' }: CardFaceProps) {
  const rankStr = RANK_NAMES_ZH[card.rank]
  const suitStr = SUIT_SYMBOLS[card.suit]
  const colorClass = suitColorClass[card.suit]

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-[var(--radius-card)]
        bg-amber-50 ${size === 'xs' || size === 'xxs' ? 'border' : 'border-2'} border-amber-600
        flex flex-col items-center justify-between
        py-0.5 px-0.5 shadow-md shadow-amber-900/30 select-none
        ${className}
      `}
    >
      <div className={`font-mono font-bold leading-none ${rankSizeClasses[size]} ${colorClass}`}>
        {rankStr}
      </div>
      <div className={`${suitSizeClasses[size]} leading-none ${colorClass}`}>
        {suitStr}
      </div>
    </div>
  )
}
