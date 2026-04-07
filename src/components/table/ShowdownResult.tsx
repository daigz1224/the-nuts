import type { GameState } from '@/engine/game'
import { bestOfSeven } from '@/engine/evaluator'
import type { HandResult } from '@/engine/hand-rank'
import { CardFace } from '@/components/cards/CardFace'
import type { Card } from '@/engine/card'

interface ShowdownResultProps {
  gameState: GameState
}

interface PlayerHandResult {
  playerId: number
  name: string
  avatar: string
  holeCards: [Card, Card]
  hand: HandResult
  winAmount: number
  isHero: boolean
  isFolded: boolean
}

export function ShowdownResult({ gameState }: ShowdownResultProps) {
  const winners = gameState.winners ?? []
  const winnerSet = new Set(winners.map(w => w.playerId))
  const heroWon = winnerSet.has(0)
  const hero = gameState.players[0]
  const heroFolded = hero.isFolded

  // Evaluate all non-folded players' hands and rank them
  const rankings: PlayerHandResult[] = gameState.players
    .filter(p => !p.isFolded && p.holeCards)
    .map(p => {
      const hand = bestOfSeven([...p.holeCards!, ...gameState.communityCards])
      const win = winners.find(w => w.playerId === p.id)
      return {
        playerId: p.id,
        name: p.name,
        avatar: p.avatar,
        holeCards: p.holeCards as [Card, Card],
        hand,
        winAmount: win?.amount ?? 0,
        isHero: p.id === 0,
        isFolded: false,
      }
    })
    .sort((a, b) => b.hand.score - a.hand.score)

  // Fold analysis for hero
  let foldAnalysis: { hand: HandResult; wouldHaveWon: boolean } | null = null
  if (heroFolded && hero.holeCards && gameState.communityCards.length === 5) {
    const heroHand = bestOfSeven([...hero.holeCards, ...gameState.communityCards])
    const bestWinnerScore = Math.max(...winners.map(w => {
      const p = gameState.players[w.playerId]
      return p.holeCards ? bestOfSeven([...p.holeCards, ...gameState.communityCards]).score : 0
    }))
    foldAnalysis = {
      hand: heroHand,
      wouldHaveWon: heroHand.score > bestWinnerScore,
    }
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Winner banner */}
      <div className={`text-center py-2 px-4 rounded-xl border ${
        heroWon
          ? 'bg-green-900/25 border-green-500/40'
          : 'bg-yellow-900/25 border-yellow-600/40'
      }`}>
        <div className="text-lg font-bold mb-0.5">
          {heroWon ? (
            <span className="text-green-400">🎉 你赢了！</span>
          ) : (
            <span className="text-yellow-300">
              👑 {winners.map(w => `${gameState.players[w.playerId].avatar} ${gameState.players[w.playerId].name}`).join('、')} 获胜
            </span>
          )}
        </div>
        <div className="text-sm text-text-secondary">
          {winners.map(w => (
            <span key={w.playerId}>
              赢得 <span className="font-bold text-chip">{w.amount}</span> 筹码
              {w.hand && <span className="text-text-muted"> — {w.hand}</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Hand rankings — all contenders */}
      <div className="bg-bg-surface/40 rounded-xl border border-amber-800/20 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-amber-800/20">
          <span className="text-[11px] font-mono text-text-muted">摊牌排名</span>
        </div>
        <div className="divide-y divide-amber-800/10">
          {rankings.map((r, idx) => {
            const isWinner = winnerSet.has(r.playerId)
            return (
              <div
                key={r.playerId}
                className={`flex items-center gap-2 px-3 py-1.5 ${
                  isWinner ? 'bg-yellow-900/15' : ''
                } ${r.isHero ? 'bg-amber-800/10' : ''}`}
              >
                {/* Rank */}
                <span className={`text-xs font-mono w-5 shrink-0 ${isWinner ? 'text-yellow-400 font-bold' : 'text-text-muted'}`}>
                  {isWinner ? '👑' : `#${idx + 1}`}
                </span>

                {/* Hole cards */}
                <div className="flex gap-0.5 shrink-0">
                  <CardFace card={r.holeCards[0]} size="xxs" />
                  <CardFace card={r.holeCards[1]} size="xxs" />
                </div>

                {/* Name */}
                <span className={`text-xs font-medium truncate ${
                  r.isHero ? 'text-text-accent' : isWinner ? 'text-yellow-300' : 'text-text-primary'
                }`}>
                  {r.avatar} {r.name}{r.isHero ? ' (你)' : ''}
                </span>

                {/* Hand description */}
                <span className={`text-[11px] ml-auto shrink-0 ${isWinner ? 'font-bold text-yellow-300' : 'text-text-secondary'}`}>
                  {r.hand.description}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hero fold analysis */}
      {heroFolded && foldAnalysis && (
        <div className={`rounded-xl px-4 py-3 text-center border ${
          foldAnalysis.wouldHaveWon
            ? 'bg-red-900/20 border-red-700/30'
            : 'bg-green-900/20 border-green-700/30'
        }`}>
          <div className="text-[10px] text-text-muted mb-1">弃牌复盘</div>
          <div className="text-sm text-text-primary">
            你弃掉的牌最终会组成 <span className="font-bold text-text-accent">{foldAnalysis.hand.description}</span>
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
