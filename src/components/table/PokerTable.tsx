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
    <div className="flex flex-col items-center gap-1 sm:gap-3 w-full max-w-[600px] mx-auto">
      {/* Opponents row */}
      <OpponentRow
        opponents={opponents}
        currentPlayerId={currentPlayerId}
        gamePhase={gameState.phase}
        winnerIds={winnerIds}
        bigBlind={gameState.bigBlind}
      />

      {/* Board area — pot + community cards */}
      <div className="flex flex-col items-center gap-1.5 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl bg-bg-table/30 border border-amber-800/20 w-full">
        <Pot amount={gameState.pot} />
        <CommunityCards cards={gameState.communityCards} />
      </div>

      {/* Hero area */}
      <HeroArea
        player={hero}
        isCurrentTurn={currentPlayerId === 0}
        isWinner={winnerIds?.has(0)}
        bigBlind={gameState.bigBlind}
      />
    </div>
  )
}
