interface ButtonProps {
  variant?: 'fold' | 'call' | 'raise' | 'neutral'
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

const variantClasses: Record<string, string> = {
  fold: 'bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-red-100 border border-red-500/50',
  call: 'bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-blue-100 border border-blue-400/50',
  raise: 'bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-amber-950 border border-amber-400/50',
  neutral: 'bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-stone-100 border border-stone-500/50',
}

export function Button({ variant = 'neutral', onClick, disabled, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-[var(--radius-button)] px-5 py-2.5 font-bold text-sm tracking-wide
        transition-colors duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantClasses[variant]}
      `}
    >
      {children}
    </button>
  )
}
