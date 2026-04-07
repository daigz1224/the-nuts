export enum Position {
  BTN = 'BTN',
  SB = 'SB',
  BB = 'BB',
  UTG = 'UTG',
  MP = 'MP',
  CO = 'CO',
}

export const POSITION_NAMES_ZH: Record<Position, string> = {
  [Position.BTN]: '庄位',
  [Position.SB]: '小盲',
  [Position.BB]: '大盲',
  [Position.UTG]: '枪口',
  [Position.MP]: '中位',
  [Position.CO]: '关位',
}

/** 6-max position order starting from BTN seat, going clockwise */
const POSITION_ORDER: Position[] = [
  Position.SB,
  Position.BB,
  Position.UTG,
  Position.MP,
  Position.CO,
  Position.BTN,
]

/**
 * Assign positions to active seats given the BTN seat index.
 * Returns a map of seatIndex -> Position.
 */
export function assignPositions(
  btnSeatIndex: number,
  activeSeats: number[],
): Map<number, Position> {
  const result = new Map<number, Position>()
  const n = activeSeats.length
  if (n < 2) return result

  // Find BTN in active seats
  const btnIdx = activeSeats.indexOf(btnSeatIndex)
  if (btnIdx === -1) return result

  result.set(activeSeats[btnIdx], Position.BTN)

  // Assign positions clockwise from BTN
  const positions = n <= 2
    ? [Position.SB] // heads-up: BTN is also dealer and SB
    : POSITION_ORDER.slice(0, n - 1)

  for (let i = 0; i < positions.length; i++) {
    const seatIdx = activeSeats[(btnIdx + 1 + i) % n]
    result.set(seatIdx, positions[i])
  }

  return result
}

/**
 * Advance BTN to the next active seat.
 */
export function rotateBTN(currentBTN: number, activeSeats: number[]): number {
  const sorted = [...activeSeats].sort((a, b) => a - b)
  const idx = sorted.indexOf(currentBTN)
  return sorted[(idx + 1) % sorted.length]
}

/**
 * Get the pre-flop action order (UTG first, BB last).
 * Returns seat indices in action order.
 */
export function getPreFlopOrder(
  positions: Map<number, Position>,
): number[] {
  const order: Position[] = [
    Position.UTG, Position.MP, Position.CO,
    Position.BTN, Position.SB, Position.BB,
  ]

  const result: number[] = []
  for (const pos of order) {
    for (const [seat, p] of positions) {
      if (p === pos) result.push(seat)
    }
  }
  return result
}

/**
 * Get the post-flop action order (SB first, BTN last).
 * Returns seat indices in action order.
 */
export function getPostFlopOrder(
  positions: Map<number, Position>,
): number[] {
  const order: Position[] = [
    Position.SB, Position.BB, Position.UTG,
    Position.MP, Position.CO, Position.BTN,
  ]

  const result: number[] = []
  for (const pos of order) {
    for (const [seat, p] of positions) {
      if (p === pos) result.push(seat)
    }
  }
  return result
}
