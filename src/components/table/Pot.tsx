import { ChipStack } from '@/components/common/ChipStack'

interface PotProps {
  amount: number
}

export function Pot({ amount }: PotProps) {
  if (amount === 0) return null

  return (
    <div className="flex items-center gap-1.5 bg-amber-900/60 border border-amber-700/50 px-3 py-1 rounded-full">
      <span className="text-xs text-amber-200">底池</span>
      <ChipStack amount={amount} />
    </div>
  )
}
