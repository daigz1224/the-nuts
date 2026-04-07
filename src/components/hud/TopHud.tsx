import { useState, useEffect } from 'react'
import type { GameState } from '@/engine/game'
import { GamePhase, PHASE_NAMES_ZH } from '@/engine/game'
import { calculateEquity, type EquityResult } from '@/engine/equity'
import { HudPanel } from './HudPanel'

interface TopHudProps {
  gameState: GameState
  isProcessingAI?: boolean
}

export function TopHud({ gameState, isProcessingAI = false }: TopHudProps) {
  // Default collapsed on small screens to save vertical space
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 640)
  const [equity, setEquity] = useState<EquityResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const player = gameState.players[0]
  const phase = gameState.phase
  const isActive = phase !== GamePhase.Idle && player.holeCards && !player.isFolded
  const numOpponents = gameState.players.filter(p => !p.isFolded && p.id !== 0).length

  useEffect(() => {
    if (!isActive || !player.holeCards) {
      setEquity(null)
      return
    }

    setIsCalculating(true)
    const timeout = setTimeout(() => {
      const result = calculateEquity(player.holeCards!, gameState.communityCards, numOpponents, 3000)
      setEquity(result)
      setIsCalculating(false)
    }, 50)

    return () => clearTimeout(timeout)
  }, [phase, player.holeCards, gameState.communityCards.length, player.isFolded, numOpponents])

  const handInfo = gameState.handNumber > 0 ? `#${gameState.handNumber}` : ''
  const phaseLabel = PHASE_NAMES_ZH[phase] || ''
  const expanded = !collapsed && isActive

  return (
    <div className="flex justify-center">
      <div className="relative bg-bg-secondary/95 border border-t-0 border-amber-800/40
                      shadow-lg shadow-black/20 rounded-b-2xl
                      w-[90%] sm:w-[420px] max-w-[480px]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-2 px-3 py-1 cursor-pointer
                     hover:bg-bg-surface/30 transition-colors"
        >
          <span className="text-[10px] font-mono text-text-muted shrink-0">
            {handInfo}{handInfo && phaseLabel ? ' · ' : ''}{phaseLabel}
          </span>
          {isProcessingAI && (
            <span className="text-[10px] text-text-muted animate-pulse">思考中…</span>
          )}
          <span className="ml-auto text-[10px] text-text-muted shrink-0">
            {collapsed ? '▼ 概率' : '▲ 收起'}
          </span>
        </button>

        {expanded && (
          <div className="border-t border-amber-800/20 px-3 py-2 max-h-[calc(28vh-2rem)] overflow-y-auto rounded-b-2xl">
            <HudPanel gameState={gameState} equity={equity} isCalculating={isCalculating} />
          </div>
        )}
      </div>
    </div>
  )
}
