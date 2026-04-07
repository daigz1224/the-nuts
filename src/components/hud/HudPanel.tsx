import type { GameState } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import type { Card } from '@/engine/card'
import type { EquityResult } from '@/engine/equity'
import { calculateOuts, type OutsResult } from '@/engine/outs'
import { evaluatePreFlopStrength, type HandStrengthResult } from '@/engine/hand-strength'
import { calculatePotOdds, type PotOddsResult } from '@/engine/pot-odds'
import { bestOfSeven, evaluateFive } from '@/engine/evaluator'
import type { HandResult } from '@/engine/hand-rank'
import { CardFace } from '@/components/cards/CardFace'
import { EquityBar } from './EquityBar'
import { HandStrengthBadge } from './HandStrengthBadge'
import { OddsDisplay } from './OddsDisplay'

interface HudPanelProps {
  gameState: GameState
  equity: EquityResult | null
  isCalculating?: boolean
}

export function HudPanel({ gameState, equity, isCalculating = false }: HudPanelProps) {
  const player = gameState.players[0]
  const phase = gameState.phase
  const isActive = phase !== GamePhase.Idle && player.holeCards && !player.isFolded

  if (!isActive || !player.holeCards) {
    return <IdleHud />
  }

  // Pre-flop hand strength
  const handStrength: HandStrengthResult | null =
    phase === GamePhase.PreFlop
      ? evaluatePreFlopStrength(player.holeCards, player.position)
      : null

  // Current hand evaluation (post-flop)
  let currentHand: HandResult | null = null
  if (gameState.communityCards.length >= 5) {
    currentHand = bestOfSeven([...player.holeCards, ...gameState.communityCards.slice(0, 5)])
  } else if (gameState.communityCards.length >= 3) {
    // On flop (5 cards) or turn (6 cards), evaluate best available
    const all = [...player.holeCards, ...gameState.communityCards]
    if (all.length === 7) {
      currentHand = bestOfSeven(all)
    } else if (all.length === 6) {
      // 6 cards: find best 5
      let best: HandResult | null = null
      for (let skip = 0; skip < 6; skip++) {
        const five = all.filter((_, i) => i !== skip)
        const result = evaluateFive(five)
        if (!best || result.score > best.score) best = result
      }
      currentHand = best
    } else if (all.length === 5) {
      currentHand = evaluateFive(all)
    }
  }

  // Outs (flop/turn only)
  const outs: OutsResult | null =
    gameState.communityCards.length >= 3 && gameState.communityCards.length <= 4
      ? calculateOuts(player.holeCards, gameState.communityCards)
      : null

  // Pot odds
  const callAmount = gameState.currentBet - player.currentBet
  const potOdds: PotOddsResult | null =
    callAmount > 0 && equity
      ? calculatePotOdds(gameState.pot, callAmount, equity.winRate)
      : null

  return (
    <div className="flex flex-col gap-3">
      {/* Pre-flop: Hand Strength */}
      {handStrength && (
        <Section title="起手牌">
          <HandStrengthBadge
            tier={handStrength.tier}
            tierLabel={handStrength.tierLabel}
            handName={handStrength.handName}
          />
          <p className="text-[11px] text-text-secondary mt-1">
            {handStrength.positionAdvice}
          </p>
        </Section>
      )}

      {/* Post-flop: Current Hand */}
      {currentHand && (
        <Section title="当前牌力">
          <div className="text-sm font-bold text-text-accent">
            {currentHand.description}
          </div>
        </Section>
      )}

      {/* Equity */}
      <Section title="">
        {isCalculating ? (
          <div className="text-[11px] text-text-muted">计算胜率中...</div>
        ) : equity ? (
          <EquityBar winRate={equity.winRate} tieRate={equity.tieRate} />
        ) : null}
      </Section>

      {/* Outs */}
      {outs && outs.outsCount > 0 && (
        <Section title="Outs">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-mono font-bold text-text-accent">
              {outs.outsCount} 张
            </span>
            <span className="text-[11px] text-text-secondary">
              改善概率 {Math.round(outs.improveProb * 100)}%
            </span>
          </div>
          {outs.drawTypes.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {outs.drawTypes.map((type, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-bg-card px-1.5 py-0.5 rounded text-text-secondary"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
          <OutsCards outs={outs.outs} />
        </Section>
      )}

      {/* Pot Odds */}
      {potOdds && (
        <Section title="底池赔率">
          <OddsDisplay
            potOdds={potOdds.potOdds}
            neededWinRate={potOdds.neededWinRate}
            currentWinRate={equity?.winRate ?? 0}
            isPositiveEV={potOdds.isPositiveEV}
            evDescription={potOdds.evDescription}
          />
        </Section>
      )}

      {/* Showdown */}
      {phase === GamePhase.Showdown && currentHand && (
        <Section title="本手结果">
          <div className="text-sm text-text-accent">
            {currentHand.description}
          </div>
          {gameState.winners?.map((w, i) => (
            <div key={i} className="text-[11px] text-text-secondary">
              {gameState.players[w.playerId].name} 赢得 {w.amount}
              {w.hand && ` — ${w.hand}`}
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-default/30 pt-2">
      {title && (
        <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

const SUIT_ORDER: Record<string, number> = { s: 0, h: 1, d: 2, c: 3 }

function OutsCards({ outs }: { outs: Card[] }) {
  const sorted = [...outs].sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank
    return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
  })

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {sorted.map((card, i) => (
        <CardFace key={i} card={card} size="xxs" />
      ))}
    </div>
  )
}

function IdleHud() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-text-muted">
        开始游戏后，这里将显示实时概率数据、手牌评估和下注建议。
      </p>
      <div className="border-t border-border-default/30 pt-2">
        <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">学习要点</div>
        <ul className="text-[11px] text-text-secondary space-y-1">
          <li>- 胜率：你赢下底池的概率</li>
          <li>- Outs：能改善你牌力的牌</li>
          <li>- 底池赔率：是否值得跟注</li>
          <li>- +EV：长期盈利的决策</li>
        </ul>
      </div>
    </div>
  )
}
