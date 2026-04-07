import { describe, it, expect } from 'vitest'
import {
  Position,
  assignPositions,
  rotateBTN,
  getPreFlopOrder,
  getPostFlopOrder,
} from '../positions'

describe('assignPositions', () => {
  it('assigns all 6 positions for 6-max', () => {
    const seats = [0, 1, 2, 3, 4, 5]
    const positions = assignPositions(0, seats)
    expect(positions.size).toBe(6)
    expect(positions.get(0)).toBe(Position.BTN)
    expect(positions.get(1)).toBe(Position.SB)
    expect(positions.get(2)).toBe(Position.BB)
    expect(positions.get(3)).toBe(Position.UTG)
    expect(positions.get(4)).toBe(Position.MP)
    expect(positions.get(5)).toBe(Position.CO)
  })

  it('wraps around correctly', () => {
    const seats = [0, 1, 2, 3, 4, 5]
    const positions = assignPositions(3, seats)
    expect(positions.get(3)).toBe(Position.BTN)
    expect(positions.get(4)).toBe(Position.SB)
    expect(positions.get(5)).toBe(Position.BB)
    expect(positions.get(0)).toBe(Position.UTG)
    expect(positions.get(1)).toBe(Position.MP)
    expect(positions.get(2)).toBe(Position.CO)
  })

  it('handles fewer players', () => {
    const seats = [0, 2, 4]
    const positions = assignPositions(0, seats)
    expect(positions.size).toBe(3)
    expect(positions.get(0)).toBe(Position.BTN)
    expect(positions.get(2)).toBe(Position.SB)
    expect(positions.get(4)).toBe(Position.BB)
  })
})

describe('rotateBTN', () => {
  it('advances to next seat', () => {
    expect(rotateBTN(0, [0, 1, 2, 3, 4, 5])).toBe(1)
    expect(rotateBTN(3, [0, 1, 2, 3, 4, 5])).toBe(4)
  })

  it('wraps around', () => {
    expect(rotateBTN(5, [0, 1, 2, 3, 4, 5])).toBe(0)
  })

  it('skips missing seats', () => {
    expect(rotateBTN(1, [0, 1, 4, 5])).toBe(4)
  })
})

describe('getPreFlopOrder', () => {
  it('returns UTG first, BB last for 6-max', () => {
    const seats = [0, 1, 2, 3, 4, 5]
    const positions = assignPositions(0, seats)
    const order = getPreFlopOrder(positions)
    expect(order).toEqual([3, 4, 5, 0, 1, 2])
  })
})

describe('getPostFlopOrder', () => {
  it('returns SB first, BTN last for 6-max', () => {
    const seats = [0, 1, 2, 3, 4, 5]
    const positions = assignPositions(0, seats)
    const order = getPostFlopOrder(positions)
    expect(order).toEqual([1, 2, 3, 4, 5, 0])
  })
})
