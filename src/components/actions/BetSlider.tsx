import { useState } from 'react'

interface BetSliderProps {
  min: number
  max: number
  pot: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

interface Preset {
  label: string
  value: number
}

function getPresets(min: number, max: number, pot: number): Preset[] {
  const presets: Preset[] = []

  // Common bet sizing presets relative to pot
  const potPresets = [
    { label: '½ 底池', factor: 0.5 },
    { label: '¾ 底池', factor: 0.75 },
    { label: '1x 底池', factor: 1 },
    { label: '2x 底池', factor: 2 },
  ]

  for (const p of potPresets) {
    const val = Math.round(pot * p.factor)
    if (val >= min && val <= max) {
      // Avoid duplicates near min
      if (presets.length === 0 || Math.abs(val - presets[presets.length - 1].value) > max * 0.02) {
        presets.push({ label: p.label, value: val })
      }
    }
  }

  return presets
}

export function BetSlider({ min, max, pot, onConfirm, onCancel }: BetSliderProps) {
  const [value, setValue] = useState(min)

  const clamp = (v: number) => Math.max(min, Math.min(max, v))

  const adjust = (delta: number) => {
    setValue(prev => clamp(prev + delta))
  }

  const presets = getPresets(min, max, pot)
  // Step: use big blind (typically min raise increment) or 1% of range, whichever is larger
  const step = Math.max(1, Math.round((max - min) * 0.01))

  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[600px]">
      {/* Preset buttons */}
      {presets.length > 0 && (
        <div className="flex gap-1.5 justify-center">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setValue(p.value)}
              className={`
                text-[11px] px-2.5 py-1 rounded-full cursor-pointer
                border transition-colors
                ${value === p.value
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-bg-surface/60 text-text-secondary border-amber-800/40 hover:border-amber-600/60'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Slider + fine-tune controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => adjust(-step)}
          className="w-8 h-8 rounded-full bg-bg-surface border border-amber-800/40
                     text-text-primary font-bold text-lg flex items-center justify-center
                     cursor-pointer hover:bg-bg-card active:scale-95 shrink-0"
        >
          −
        </button>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          className="flex-1 accent-amber-500 h-2"
        />

        <button
          onClick={() => adjust(step)}
          className="w-8 h-8 rounded-full bg-bg-surface border border-amber-800/40
                     text-text-primary font-bold text-lg flex items-center justify-center
                     cursor-pointer hover:bg-bg-card active:scale-95 shrink-0"
        >
          +
        </button>
      </div>

      {/* Value display + action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 cursor-pointer"
        >
          取消
        </button>

        <span className="font-mono text-lg font-bold text-text-accent">
          {value}
        </span>

        <button
          onClick={() => onConfirm(value)}
          className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5
                     rounded-[var(--radius-button)] font-bold cursor-pointer
                     transition-colors active:scale-95"
        >
          确认加注
        </button>
      </div>
    </div>
  )
}
