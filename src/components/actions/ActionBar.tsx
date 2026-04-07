import { useState } from 'react'
import { ActionType, ACTION_NAMES_ZH, type AvailableActions } from '@/engine/betting'
import { Button } from '@/components/common/Button'
import { BetSlider } from './BetSlider'

interface ActionBarProps {
  available: AvailableActions
  onAction: (action: ActionType, amount?: number) => void
  pot?: number
}

export function ActionBar({ available, onAction, pot = 0 }: ActionBarProps) {
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

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      {/* Call amount hint — always reserve height */}
      <span className={`text-[11px] font-mono ${available.canCall && available.callAmount > 0 ? 'text-text-secondary' : 'text-transparent'}`}>
        {available.canCall && available.callAmount > 0
          ? <>需跟注 <span className="text-text-accent font-bold">{available.callAmount}</span></>
          : '\u00A0'}
      </span>

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
