interface ChipStackProps {
  amount: number
  className?: string
}

export function ChipStack({ amount, className = '' }: ChipStackProps) {
  return (
    <span className={`font-mono text-chip text-sm font-medium ${className}`}>
      {amount.toLocaleString()}
    </span>
  )
}
