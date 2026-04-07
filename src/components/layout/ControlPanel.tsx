import { ActionBar } from '@/components/actions/ActionBar'
import { ActionType, type AvailableActions } from '@/engine/betting'

interface ControlPanelProps {
  available: AvailableActions | null
  isPlayerTurn: boolean
  onAction: (action: ActionType, amount?: number) => void
}

export function ControlPanel({ available, isPlayerTurn, onAction }: ControlPanelProps) {
  return (
    <div className="h-[100px] bg-gradient-to-t from-bg-primary to-bg-secondary border-t border-amber-800/50 flex items-center justify-center px-4">
      {isPlayerTurn && available ? (
        <ActionBar available={available} onAction={onAction} />
      ) : (
        <span className="text-sm text-text-muted">
          等待中...
        </span>
      )}
    </div>
  )
}
