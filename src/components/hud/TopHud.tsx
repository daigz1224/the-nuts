import { useState, useEffect } from 'react'
import type { GameState } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import { calculateEquity, type EquityResult } from '@/engine/equity'
import { HudPanel } from './HudPanel'

interface TopHudProps {
  gameState: GameState
}

export function TopHud({ gameState }: TopHudProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [equity, setEquity] = useState<EquityResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const player = gameState.players[0]
  const phase = gameState.phase
  const isActive = phase !== GamePhase.Idle && player.holeCards && !player.isFolded

  // Equity calculation lives here — survives collapse/expand
  useEffect(() => {
    if (!isActive || !player.holeCards) {
      setEquity(null)
      return
    }

    setIsCalculating(true)
    const timeout = setTimeout(() => {
      const numOpponents = gameState.players.filter(p => !p.isFolded && p.id !== 0).length
      const result = calculateEquity(player.holeCards!, gameState.communityCards, numOpponents, 3000)
      setEquity(result)
      setIsCalculating(false)
    }, 50)

    return () => clearTimeout(timeout)
  }, [phase, player.holeCards, gameState.communityCards.length, player.isFolded])

  if (!isActive) return null

  return (
    <div className="flex justify-center">
      <div className="bg-bg-secondary/95 border border-t-0 border-amber-800/40
                      rounded-b-2xl shadow-lg shadow-black/20
                      w-[90%] sm:w-[420px] max-w-[480px]">
        {/* Toggle bar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-4 py-1 cursor-pointer
                     hover:bg-bg-surface/30 transition-colors text-[10px] text-text-muted
                     rounded-b-2xl"
        >
          <span className="font-[--font-title] text-xs text-text-accent">概率分析</span>
          <span>{collapsed ? '▼ 展开' : '▲ 收起'}</span>
        </button>

        {/* HUD content — notch body */}
        {!collapsed && (
          <div className="px-4 pb-3">
            <HudPanel gameState={gameState} equity={equity} isCalculating={isCalculating} />
          </div>
        )}
      </div>
    </div>
  )
}
