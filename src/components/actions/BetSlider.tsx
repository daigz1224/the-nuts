import { useState } from 'react'

interface BetSliderProps {
  min: number
  max: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function BetSlider({ min, max, onConfirm, onCancel }: BetSliderProps) {
  const [value, setValue] = useState(min)

  return (
    <div className="flex flex-col gap-2 bg-bg-surface p-3 rounded-[var(--radius-surface)]">
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          className="flex-1 accent-action-raise"
        />
        <span className="font-mono text-sm text-text-accent w-16 text-right">
          {value}
        </span>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 cursor-pointer"
        >
          取消
        </button>
        <button
          onClick={() => onConfirm(value)}
          className="text-xs bg-action-raise text-white px-3 py-1 rounded-[var(--radius-button)] font-medium cursor-pointer"
        >
          确认 {value}
        </button>
      </div>
    </div>
  )
}
