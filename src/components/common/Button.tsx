interface ButtonProps {
  variant?: 'fold' | 'call' | 'raise' | 'allin' | 'neutral'
  onClick: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

type Variant = NonNullable<ButtonProps['variant']>

const variantClasses: Record<Variant, string> = {
  fold: `bg-transparent text-stone-300 border border-stone-500/60
         hover:bg-stone-700/40 hover:text-stone-100`,
  call: `bg-emerald-700 text-white border border-emerald-500/30
         hover:bg-emerald-600 shadow-[0_2px_12px_rgba(16,185,129,0.15)]`,
  raise: `bg-amber-600 text-white border border-amber-400/30
          hover:bg-amber-500 shadow-[0_2px_12px_rgba(245,158,11,0.2)]`,
  allin: `bg-red-700 text-white border border-red-400/30
          hover:bg-red-600 shadow-[0_2px_16px_rgba(239,68,68,0.25)]`,
  neutral: `bg-stone-700 text-stone-100 border border-stone-500/40
            hover:bg-stone-600`,
}

export function Button({ variant = 'neutral', onClick, disabled, className = '', children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-xl px-3 sm:px-5 py-2.5 font-bold text-sm tracking-wide
        transition-all duration-150 cursor-pointer text-center
        active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
