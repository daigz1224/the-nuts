import { useState } from 'react'
import { ActionType, ACTION_NAMES_ZH, type AvailableActions } from '@/engine/betting'
import { Button } from '@/components/common/Button'
import { BetSlider } from './BetSlider'

interface ActionBarProps {
  available: AvailableActions
  onAction: (action: ActionType, amount?: number) => void
}

export function ActionBar({ available, onAction }: ActionBarProps) {
  const [showSlider, setShowSlider] = useState(false)

  if (showSlider) {
    return (
      <BetSlider
        min={available.minBet}
        max={available.maxBet}
        onConfirm={(amount) => {
          setShowSlider(false)
          onAction(available.canBet ? ActionType.Bet : ActionType.Raise, amount)
        }}
        onCancel={() => setShowSlider(false)}
      />
    )
  }

  return (
    <div className="flex gap-2 items-center justify-center">
      {available.canFold && (
        <Button variant="fold" onClick={() => onAction(ActionType.Fold)}>
          {ACTION_NAMES_ZH[ActionType.Fold]}
        </Button>
      )}

      {available.canCheck && (
        <Button variant="call" onClick={() => onAction(ActionType.Check)}>
          {ACTION_NAMES_ZH[ActionType.Check]}
        </Button>
      )}

      {available.canCall && (
        <Button variant="call" onClick={() => onAction(ActionType.Call)}>
          {ACTION_NAMES_ZH[ActionType.Call]} {available.callAmount}
        </Button>
      )}

      {(available.canBet || available.canRaise) && (
        <Button variant="raise" onClick={() => setShowSlider(true)}>
          {available.canBet ? ACTION_NAMES_ZH[ActionType.Bet] : ACTION_NAMES_ZH[ActionType.Raise]}
        </Button>
      )}

      <Button
        variant="raise"
        onClick={() => onAction(ActionType.AllIn, available.maxBet)}
      >
        {ACTION_NAMES_ZH[ActionType.AllIn]}
      </Button>
    </div>
  )
}
