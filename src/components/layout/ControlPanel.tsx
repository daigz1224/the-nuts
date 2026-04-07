import { ActionBar } from '@/components/actions/ActionBar'
import { ActionType, type AvailableActions } from '@/engine/betting'

interface ControlPanelProps {
  available: AvailableActions | null
  isPlayerTurn: boolean
  onAction: (action: ActionType, amount?: number) => void
  pot?: number
}

export function ControlPanel({ available, isPlayerTurn, onAction, pot = 0 }: ControlPanelProps) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-end px-4 pb-2">
      {isPlayerTurn && available ? (
        <div className="w-full max-w-[600px]">
          <ActionBar available={available} onAction={onAction} pot={pot} />
        </div>
      ) : (
        <span className="text-sm text-text-muted py-2">
          等待中...
        </span>
      )}
    </div>
  )
}
