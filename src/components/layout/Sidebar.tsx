import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/game-store'
import { GamePhase } from '@/engine/game'
import { calculateEquity, type EquityResult } from '@/engine/equity'
import { HudPanel } from '@/components/hud/HudPanel'

export function Sidebar() {
  const gameState = useGameStore(s => s.gameState)
  const [equity, setEquity] = useState<EquityResult | null>(null)

  const player = gameState.players[0]
  const phase = gameState.phase
  const isActive = phase !== GamePhase.Idle && player.holeCards && !player.isFolded

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

  return (
    <aside className="hidden lg:flex w-[280px] bg-bg-secondary border-r border-amber-800/40 p-4 flex-col gap-4 shrink-0 overflow-y-auto">
      <HudPanel gameState={gameState} equity={equity} />
    </aside>
  )
}
