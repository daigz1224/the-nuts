interface CardBackProps {
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  xs: 'w-[28px] h-[40px]',
  sm: 'w-[40px] h-[56px]',
  md: 'w-[52px] h-[72px]',
}

export function CardBack({ size = 'md', className = '' }: CardBackProps) {
  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-[var(--radius-card)]
        bg-gradient-to-br from-amber-800 to-amber-950
        ${size === 'xs' ? 'border' : 'border-2'} border-amber-600 shadow-md shadow-amber-900/30 select-none
        ${className}
      `}
    />
  )
}
