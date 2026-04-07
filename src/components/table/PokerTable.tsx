import type { GameState } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import { OpponentRow } from './OpponentRow'
import { HeroArea } from './HeroArea'
import { CommunityCards } from './CommunityCards'
import { Pot } from './Pot'

interface PokerTableProps {
  gameState: GameState
  currentPlayerId: number | null
}

export function PokerTable({ gameState, currentPlayerId }: PokerTableProps) {
  const hero = gameState.players[0]
  const opponents = gameState.players.filter(p => p.id !== 0)

  const winnerIds = gameState.phase === GamePhase.Showdown && gameState.winners
    ? new Set(gameState.winners.map(w => w.playerId))
    : undefined

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-[600px] mx-auto">
      {/* Opponents row */}
      <OpponentRow
        opponents={opponents}
        currentPlayerId={currentPlayerId}
        gamePhase={gameState.phase}
        winnerIds={winnerIds}
      />

      {/* Divider */}
      <div className="w-full h-px bg-amber-800/30" />

      {/* Board area — pot + community cards */}
      <div className="flex flex-col items-center gap-2 py-2 px-4 rounded-xl bg-bg-table/30 border border-amber-800/20 w-full">
        <Pot amount={gameState.pot} />
        <CommunityCards cards={gameState.communityCards} />
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-amber-800/30" />

      {/* Hero area */}
      <HeroArea
        player={hero}
        isCurrentTurn={currentPlayerId === 0}
        gamePhase={gameState.phase}
        isWinner={winnerIds?.has(0)}
      />
    </div>
  )
}
