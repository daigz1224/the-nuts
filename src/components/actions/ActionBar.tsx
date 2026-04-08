import { useState } from 'react'
import { ActionType, ACTION_NAMES_ZH, type AvailableActions } from '@/engine/betting'
import { Button } from '@/components/common/Button'
import { BetSlider } from './BetSlider'
import { betSizeLevel } from '@/components/common/bet-utils'

interface ActionBarProps {
  available: AvailableActions
  onAction: (action: ActionType, amount?: number) => void
  pot?: number
  bigBlind: number
}

export function ActionBar({ available, onAction, pot = 0, bigBlind }: ActionBarProps) {
  const [showSlider, setShowSlider] = useState(false)

  if (showSlider) {
    return (
      <BetSlider
        min={available.minBet}
        max={available.maxBet}
        pot={pot}
        onConfirm={(amount) => {
          setShowSlider(false)
          onAction(available.canBet ? ActionType.Bet : ActionType.Raise, amount)
        }}
        onCancel={() => setShowSlider(false)}
      />
    )
  }

  const sizeLevel = available.canCall ? betSizeLevel(available.callAmount, bigBlind) : 'normal'

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      {/* Call amount warning banner — only for medium/large bets */}
      {available.canCall && available.callAmount > 0 && sizeLevel !== 'normal' ? (
        <div className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
          sizeLevel === 'large'
            ? 'bg-red-900/40 text-red-300 border border-red-500/40'
            : 'bg-amber-900/40 text-amber-300 border border-amber-500/30'
        }`}>
          需跟注 {available.callAmount}
          <span className="ml-1.5 text-3xs opacity-70">
            ({(available.callAmount / bigBlind).toFixed(1)}x BB)
          </span>
        </div>
      ) : (
        <span className={`text-2xs font-mono ${available.canCall && available.callAmount > 0 ? 'text-text-secondary' : 'text-transparent'}`}>
          {available.canCall && available.callAmount > 0
            ? <>需跟注 <span className="text-text-accent font-bold">{available.callAmount}</span></>
            : '\u00A0'}
        </span>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 items-stretch justify-center w-full">
        {available.canFold && (
          <Button variant="fold" className="flex-1" onClick={() => onAction(ActionType.Fold)}>
            {ACTION_NAMES_ZH[ActionType.Fold]}
          </Button>
        )}

        {available.canCheck && (
          <Button variant="call" className="flex-1" onClick={() => onAction(ActionType.Check)}>
            {ACTION_NAMES_ZH[ActionType.Check]}
          </Button>
        )}

        {available.canCall && (
          <Button variant="call" className="flex-1" onClick={() => onAction(ActionType.Call)}>
            {ACTION_NAMES_ZH[ActionType.Call]}
          </Button>
        )}

        {(available.canBet || available.canRaise) && (
          <Button variant="raise" className="flex-1" onClick={() => setShowSlider(true)}>
            {available.canBet ? ACTION_NAMES_ZH[ActionType.Bet] : ACTION_NAMES_ZH[ActionType.Raise]}
          </Button>
        )}

        <Button
          variant="allin"
          className="flex-1"
          onClick={() => onAction(ActionType.AllIn, available.maxBet)}
        >
          {ACTION_NAMES_ZH[ActionType.AllIn]}
        </Button>
      </div>
    </div>
  )
}
