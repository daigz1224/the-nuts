import type { GameState } from '@/engine/game'
import { GamePhase } from '@/engine/game'
import type { Card } from '@/engine/card'
import type { EquityResult } from '@/engine/equity'
import { calculateOuts } from '@/engine/outs'
import { evaluatePreFlopStrength, type HandStrengthResult } from '@/engine/hand-strength'
import { calculatePotOdds, type PotOddsResult } from '@/engine/pot-odds'
import { evaluateBest } from '@/engine/evaluator'
import type { HandResult } from '@/engine/hand-rank'
import { CardFace } from '@/components/cards/CardFace'

export interface HudPanelProps {
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
  const currentHand: HandResult | null =
    gameState.communityCards.length >= 3
      ? evaluateBest([...player.holeCards, ...gameState.communityCards].slice(0, 7))
      : null

  // Outs (flop/turn only)
  const outs =
    gameState.communityCards.length >= 3 && gameState.communityCards.length <= 4
      ? calculateOuts(player.holeCards, gameState.communityCards)
      : null

  // Pot odds
  const callAmount = gameState.currentBet - player.currentBet
  const potOdds: PotOddsResult | null =
    callAmount > 0 && equity
      ? calculatePotOdds(gameState.pot, callAmount, equity.equity)
      : null

  const winPct = equity ? Math.round(equity.winRate * 100) : null
  const tiePct = equity ? Math.round(equity.tieRate * 100) : null
  const barColor = winPct === null ? 'bg-stone-500' : winPct >= 50 ? 'bg-green-500' : winPct >= 30 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex flex-col gap-1.5">
      {/* Row 1: Hand name + tier badge */}
      {handStrength && (
        <Row>
          <span className="font-mono font-bold text-text-accent">{handStrength.handName}</span>
          <TierPill tier={handStrength.tier} label={handStrength.tierLabel} />
          <span className="text-text-muted ml-auto text-[10px] truncate max-w-[45%] text-right">{handStrength.positionAdvice}</span>
        </Row>
      )}

      {/* Row 1b: Post-flop current hand */}
      {currentHand && !handStrength && (
        <Row>
          <span className="font-bold text-text-accent">{currentHand.description}</span>
        </Row>
      )}

      {/* Row 2: Equity bar — compact inline */}
      <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] text-text-muted w-6 shrink-0">胜率</span>
          <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min((winPct ?? 0) + (tiePct ?? 0), 100)}%` }}
            />
          </div>
          {isCalculating ? (
            <span className="text-[10px] text-text-muted w-16 text-right">计算中…</span>
          ) : winPct !== null ? (
            <span className="font-mono font-bold text-[11px] text-text-accent w-16 text-right">
              {winPct}%{tiePct && tiePct > 0 ? <span className="text-text-muted"> +{tiePct}%</span> : ''}
            </span>
          ) : null}
      </div>

      {/* Row 3: Pot odds — single line */}
      {potOdds && (
        <Row className={potOdds.isPositiveEV ? 'bg-green-500/10 rounded px-1.5 -mx-1.5' : 'bg-red-500/10 rounded px-1.5 -mx-1.5'}>
          <span className={`text-[11px] font-bold ${potOdds.isPositiveEV ? 'text-green-400' : 'text-red-400'}`}>
            {potOdds.isPositiveEV ? '+EV' : '-EV'}
          </span>
          <span className="text-[10px] text-text-secondary">
            赔率 {(1 / potOdds.potOdds - 1).toFixed(1)}:1
          </span>
          <span className="text-[10px] text-text-muted ml-auto">
            需 {Math.round(potOdds.neededWinRate * 100)}% / 有 {Math.round(equity!.equity * 100)}%
          </span>
          <span className={`text-[10px] font-mono ${potOdds.ev >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {potOdds.ev >= 0 ? '+' : ''}{potOdds.ev.toFixed(0)}
          </span>
        </Row>
      )}

      {/* Row 4: Outs */}
      {outs && outs.outsCount > 0 && (
        <div>
          <Row>
            <span className="text-[10px] text-text-muted">Outs</span>
            <span className="font-mono font-bold text-[11px] text-text-accent">{outs.outsCount}张</span>
            <span className="text-[10px] text-text-muted">≈{Math.round(outs.improveProb * 100)}%</span>
            {outs.drawTypes.length > 0 && (
              <span className="text-[10px] text-text-secondary ml-auto truncate max-w-[40%] text-right">
                {outs.drawTypes.join(' · ')}
              </span>
            )}
          </Row>
          <OutsCards outs={outs.outs} />
        </div>
      )}

      {/* Showdown — just show hero's hand; full results in ShowdownResult */}
      {phase === GamePhase.Showdown && currentHand && (
        <Row>
          <span className="font-bold text-text-accent">{currentHand.description}</span>
          <span className="text-text-muted ml-auto text-[10px]">详见下方结算</span>
        </Row>
      )}
    </div>
  )
}

/** Generic compact row */
function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 py-0.5 text-[11px] ${className}`}>
      {children}
    </div>
  )
}

const TIER_COLORS: Record<number, string> = {
  1: 'bg-amber-500/25 text-amber-300',
  2: 'bg-blue-500/25 text-blue-300',
  3: 'bg-green-500/25 text-green-300',
  4: 'bg-stone-500/25 text-stone-300',
  5: 'bg-red-500/25 text-red-300',
}

function TierPill({ tier, label }: { tier: number; label: string }) {
  return (
    <span className={`text-[9px] px-1.5 py-px rounded-full font-medium ${TIER_COLORS[tier] || TIER_COLORS[5]}`}>
      {label}
    </span>
  )
}

const SUIT_ORDER: Record<string, number> = { s: 0, h: 1, d: 2, c: 3 }
const MAX_OUTS_SHOWN = 16

function OutsCards({ outs }: { outs: Card[] }) {
  const sorted = [...outs].sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank
    return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
  })

  const shown = sorted.slice(0, MAX_OUTS_SHOWN)
  const overflow = sorted.length - MAX_OUTS_SHOWN

  return (
    <div className="flex items-center gap-0.5 mt-0.5 overflow-hidden">
      {shown.map((card, i) => (
        <CardFace key={i} card={card} size="xxs" />
      ))}
      {overflow > 0 && (
        <span className="text-[9px] text-text-muted shrink-0 ml-0.5">+{overflow}</span>
      )}
    </div>
  )
}

function IdleHud() {
  return (
    <div className="text-[11px] text-text-muted space-y-1">
      <p>开始游戏后显示实时概率数据。</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-text-secondary">
        <span>胜率</span>
        <span>Outs</span>
        <span>底池赔率</span>
        <span>+EV / -EV</span>
      </div>
    </div>
  )
}
