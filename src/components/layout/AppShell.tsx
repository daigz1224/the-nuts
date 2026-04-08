import { motion } from 'framer-motion'
import { ControlPanel } from './ControlPanel'
import { PokerTable } from '@/components/table/PokerTable'
import { TopHud } from '@/components/hud/TopHud'
import { ShowdownResult } from '@/components/table/ShowdownResult'
import { HandHistory } from '@/components/table/HandHistory'
import { useGameStore } from '@/store/game-store'
import { GamePhase, getCurrentPlayerId, getPlayerAvailableActions } from '@/engine/game'
import { Button } from '@/components/common/Button'

export function AppShell() {
  const gameState = useGameStore(s => s.gameState)
  const startNewHand = useGameStore(s => s.startNewHand)
  const playerAct = useGameStore(s => s.playerAct)
  const isProcessingAI = useGameStore(s => s.isProcessingAI)
  const resetGame = useGameStore(s => s.resetGame)

  const currentPlayerId = getCurrentPlayerId(gameState)
  const isPlayerTurn = currentPlayerId === 0
  const available = isPlayerTurn ? getPlayerAvailableActions(gameState, 0) : null

  const isIdle = gameState.phase === GamePhase.Idle
  const isShowdown = gameState.phase === GamePhase.Showdown

  return (
    <div className="relative flex flex-col h-dvh overflow-hidden bg-bg-primary">
      {/* Top HUD — fixed-height zone so table never shifts vertically */}
      {!isIdle && (
        <div className="shrink-0 h-[28vh] max-h-[200px] min-h-[100px] relative">
          <div className="absolute inset-x-0 top-0 z-20">
            <TopHud gameState={gameState} isProcessingAI={isProcessingAI} />
          </div>
        </div>
      )}

      {/* Table area — justify-start prevents re-centering jitter when content height changes */}
      <div className={`flex-1 flex flex-col items-center px-2 sm:px-4 relative min-h-0 overflow-y-auto
                       ${isIdle ? 'justify-center p-2 sm:p-4' : 'justify-start pb-2'}`}>
        {isIdle ? (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold text-text-accent font-[--font-title] drop-shadow-[0_2px_4px_rgba(255,215,0,0.3)]">
              The Nuts
            </h1>
            <p className="text-sm text-text-secondary font-[--font-title]">德州扑克概率训练器</p>
            {gameState.handNumber > 0 && (
              <p className="text-xs text-text-muted font-mono">
                第 {gameState.handNumber + 1} 手 · 筹码 {gameState.players[0].chips}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="call" onClick={startNewHand}>
                {gameState.handNumber > 0 ? '继续下一手' : '开始新手牌'}
              </Button>
              {gameState.handNumber > 0 && (
                <Button variant="neutral" onClick={resetGame}>
                  重新开始
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <PokerTable gameState={gameState} currentPlayerId={currentPlayerId} />

            {/* Showdown result — inside scroll area */}
            {isShowdown && (
              <motion.div
                className="mt-3 flex flex-col items-center gap-3 w-full max-w-[600px]"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <ShowdownResult gameState={gameState} />
                <HandHistory gameState={gameState} />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Bottom action area — auto height with iOS safe-area padding */}
      {!isIdle && (
        <div className="shrink-0 border-t border-amber-800/30 flex flex-col items-center justify-end"
             style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
          {isShowdown ? (
            <div className="flex justify-center pt-3 pb-2 px-4">
              <Button variant="call" onClick={startNewHand}>
                开始新手牌
              </Button>
            </div>
          ) : (
            <ControlPanel
              available={available}
              isPlayerTurn={isPlayerTurn && !isProcessingAI}
              onAction={playerAct}
              pot={gameState.pot}
              bigBlind={gameState.bigBlind}
            />
          )}
        </div>
      )}
    </div>
  )
}
