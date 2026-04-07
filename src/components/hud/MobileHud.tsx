import { useState, useEffect } from 'react'
import type { GameState } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import { calculateEquity, type EquityResult } from '@/engine/equity'
import { evaluatePreFlopStrength } from '@/engine/hand-strength'
import { calculatePotOdds } from '@/engine/pot-odds'
import { HudPanel } from './HudPanel'

interface MobileHudProps {
  gameState: GameState
}

export function MobileHud({ gameState }: MobileHudProps) {
  const [expanded, setExpanded] = useState(false)
  const [equity, setEquity] = useState<EquityResult | null>(null)

  const player = gameState.players[0]
  const phase = gameState.phase
  const isActive = phase !== GamePhase.Idle && player.holeCards && !player.isFolded

  // Calculate equity for summary
  useEffect(() => {
    if (!isActive || !player.holeCards) {
      setEquity(null)
      return
    }
    const timeout = setTimeout(() => {
      const numOpponents = gameState.players.filter(p => !p.isFolded && p.id !== 0).length
      setEquity(calculateEquity(player.holeCards!, gameState.communityCards, numOpponents, 1500))
    }, 50)
    return () => clearTimeout(timeout)
  }, [phase, player.holeCards, gameState.communityCards.length, player.isFolded])

  if (!isActive || !player.holeCards) return null

  const winPct = equity ? Math.round(equity.winRate * 100) : null
  const callAmount = gameState.currentBet - player.currentBet
  const potOdds = callAmount > 0 && equity
    ? calculatePotOdds(gameState.pot, callAmount, equity.winRate)
    : null
  const handStrength = phase === GamePhase.PreFlop
    ? evaluatePreFlopStrength(player.holeCards, player.position)
    : null

  return (
    <div className="lg:hidden bg-bg-secondary/95 border-t border-amber-800/40 backdrop-blur-sm">
      {/* Summary bar — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 cursor-pointer"
      >
        <div className="flex items-center gap-3 text-xs">
          {handStrength && (
            <span className="text-text-secondary">{handStrength.handName} <span className="text-text-muted">{handStrength.tierLabel}</span></span>
          )}
          {winPct !== null && (
            <span className={`font-mono font-bold ${winPct >= 50 ? 'text-green-400' : winPct >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {winPct}%
            </span>
          )}
          {potOdds && (
            <span className={`font-bold ${potOdds.isPositiveEV ? 'text-green-400' : 'text-red-400'}`}>
              {potOdds.isPositiveEV ? '+EV' : '-EV'}
            </span>
          )}
        </div>
        <span className="text-text-muted text-[10px]">
          {expanded ? '收起 ▼' : '详情 ▲'}
        </span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto">
          <HudPanel gameState={gameState} />
        </div>
      )}
    </div>
  )
}
