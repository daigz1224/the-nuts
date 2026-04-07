import type { GameState } from '@/engine/game'
import { bestOfSeven } from '@/engine/evaluator'

interface ShowdownResultProps {
  gameState: GameState
}

export function ShowdownResult({ gameState }: ShowdownResultProps) {
  const hero = gameState.players[0]
  const winners = gameState.winners ?? []
  const heroWon = winners.some(w => w.playerId === 0)
  const heroFolded = hero.isFolded

  // If hero folded, evaluate what they would have had
  let foldAnalysis: { handDesc: string; wouldHaveWon: boolean } | null = null
  if (heroFolded && hero.holeCards && gameState.communityCards.length === 5) {
    const heroResult = bestOfSeven([...hero.holeCards, ...gameState.communityCards])
    const bestWinnerScore = Math.max(
      ...winners.map(w => {
        const p = gameState.players[w.playerId]
        if (p.holeCards) {
          return bestOfSeven([...p.holeCards, ...gameState.communityCards]).score
        }
        return 0
      })
    )
    foldAnalysis = {
      handDesc: heroResult.description,
      wouldHaveWon: heroResult.score > bestWinnerScore,
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Winner announcement */}
      {winners.map((w, i) => (
        <div
          key={i}
          className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-600/40 rounded-lg px-4 py-2"
        >
          <span className="text-lg">👑</span>
          <div>
            <span className="text-sm font-bold text-yellow-300">
              {gameState.players[w.playerId].name}
            </span>
            <span className="text-sm text-text-primary"> 赢得 </span>
            <span className="text-sm font-bold text-chip">{w.amount}</span>
            <span className="text-sm text-text-primary"> 筹码</span>
            {w.hand && (
              <span className="text-xs text-text-secondary ml-2">— {w.hand}</span>
            )}
          </div>
        </div>
      ))}

      {/* Hero won */}
      {heroWon && (
        <div className="text-xs text-green-400 font-bold">
          恭喜！你赢下了这手牌！
        </div>
      )}

      {/* Hero folded — show analysis */}
      {heroFolded && foldAnalysis && (
        <div className={`w-full rounded-lg px-4 py-3 text-center ${
          foldAnalysis.wouldHaveWon
            ? 'bg-red-900/20 border border-red-700/30'
            : 'bg-green-900/20 border border-green-700/30'
        }`}>
          <div className="text-xs text-text-muted mb-1">弃牌复盘</div>
          <div className="text-sm text-text-primary">
            你弃掉的牌最终会组成 <span className="font-bold text-text-accent">{foldAnalysis.handDesc}</span>
          </div>
          <div className={`text-xs font-bold mt-1 ${
            foldAnalysis.wouldHaveWon ? 'text-red-400' : 'text-green-400'
          }`}>
            {foldAnalysis.wouldHaveWon
              ? '可惜！你本可以赢下这手牌'
              : '正确的弃牌！继续留在牌局会输更多'
            }
          </div>
        </div>
      )}
    </div>
  )
}
