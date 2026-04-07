import { useGameStore } from '@/store/game-store'
import { HudPanel } from '@/components/hud/HudPanel'

export function Sidebar() {
  const gameState = useGameStore(s => s.gameState)

  return (
    <aside className="hidden lg:flex w-[280px] bg-bg-secondary border-r border-amber-800/40 p-4 flex-col gap-4 shrink-0 overflow-y-auto">
      <HudPanel gameState={gameState} />
    </aside>
  )
}
