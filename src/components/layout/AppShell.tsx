import { ControlPanel } from './ControlPanel'
import { PokerTable } from '@/components/table/PokerTable'
import { TopHud } from '@/components/hud/TopHud'
import { ShowdownResult } from '@/components/table/ShowdownResult'
import { useGameStore } from '@/store/game-store'
import { GamePhase, getCurrentPlayerId, getPlayerAvailableActions } from '@/engine/game'
import { Button } from '@/components/common/Button'

export function AppShell() {
  const gameState = useGameStore(s => s.gameState)
  const startNewHand = useGameStore(s => s.startNewHand)
  const playerAct = useGameStore(s => s.playerAct)
  const isProcessingAI = useGameStore(s => s.isProcessingAI)

  const currentPlayerId = getCurrentPlayerId(gameState)
  const isPlayerTurn = currentPlayerId === 0
  const available = isPlayerTurn ? getPlayerAvailableActions(gameState, 0) : null

  const isIdle = gameState.phase === GamePhase.Idle
  const isShowdown = gameState.phase === GamePhase.Showdown

  return (
    <div className="flex flex-col min-h-full bg-bg-primary">
      {/* Top bar: phase indicator on left, HUD notch in center */}
      {!isIdle && (
        <div className="relative shrink-0">
          {/* Phase indicator — visible on both sides of the notch */}
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="text-xs text-text-muted font-mono">
              {gameState.handNumber > 0 && `#${gameState.handNumber}`}
              {gameState.phase !== GamePhase.Idle && ` · ${gameState.phase}`}
            </span>
            {isProcessingAI && (
              <span className="text-[10px] text-text-muted">AI 思考中...</span>
            )}
          </div>
          {/* HUD notch */}
          <TopHud gameState={gameState} />
        </div>
      )}

      {/* Main table area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">

        {isIdle ? (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold text-text-accent font-[--font-title] drop-shadow-[0_2px_4px_rgba(255,215,0,0.3)]">
              The Nuts
            </h1>
            <p className="text-sm text-text-secondary font-[--font-title]">德州扑克概率训练器</p>
            <Button variant="call" onClick={startNewHand}>
              开始新手牌
            </Button>
          </div>
        ) : (
          <>
            <PokerTable gameState={gameState} currentPlayerId={currentPlayerId} />

            {/* Showdown result */}
            {isShowdown && (
              <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-[600px]">
                <ShowdownResult gameState={gameState} />
                <Button variant="call" onClick={startNewHand}>
                  开始新手牌
                </Button>
              </div>
            )}

          </>
        )}
      </div>

      {/* Control panel */}
      {!isIdle && !isShowdown && (
        <ControlPanel
          available={available}
          isPlayerTurn={isPlayerTurn && !isProcessingAI}
          onAction={playerAct}
        />
      )}
    </div>
  )
}
