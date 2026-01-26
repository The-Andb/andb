import { describe, it, expect, beforeEach } from 'vitest'
import { MillerStackHelper } from '../helper'
import { ColumnNode } from '../types'

describe('MillerStackHelper', () => {
  let col0: ColumnNode
  let col1: ColumnNode
  let col2: ColumnNode
  let col3: ColumnNode

  beforeEach(() => {
    col0 = new ColumnNode({
      id: 'col0', level: 0, title: 'Root',
      items: [
        { id: 'item0-1', name: 'Item 0-1', selected: true, type: 'projects', rawData: {} },
        { id: 'item0-2', name: 'Item 0-2', type: 'projects', rawData: {} }
      ],
      selectedId: 'item0-1'
    })

    col1 = new ColumnNode({
      id: 'col1', level: 1, title: 'Level 1',
      items: [
        { id: 'item1-1', name: 'Item 1-1', selected: true, type: 'environments', rawData: {} },
        { id: 'item1-2', name: 'Item 1-2', type: 'environments', rawData: {} }
      ],
      selectedId: 'item1-1'
    })

    col2 = new ColumnNode({
      id: 'col2', level: 2, title: 'Level 2',
      items: [
        { id: 'item2-1', name: 'Item 2-1', selected: true, type: 'databases', rawData: {} },
        { id: 'item2-2', name: 'Item 2-2', type: 'databases', rawData: {} }
      ],
      selectedId: 'item2-1'
    })

    col3 = new ColumnNode({
      id: 'col3', level: 3, title: 'Level 3',
      items: [
        { id: 'item3-1', name: 'Item 3-1', type: 'tables', rawData: {} }
      ]
    })
  })

  describe('Complex Stacking & Unstacking', () => {
    it('Scenario: Chain Stacking (0 -> 1 -> 2 -> 3)', () => {
      MillerStackHelper.stackIntoPrevious(col0, col1)
      MillerStackHelper.stackIntoPrevious(col1, col2)
      MillerStackHelper.stackIntoPrevious(col2, col3)

      const item0 = col0.items.find(i => i.id === 'item0-1')!
      expect(item0.children?.length).toBeGreaterThan(0)

      const item1 = item0.children!.find(i => i.id === 'item1-1')!
      expect(item1.children?.length).toBeGreaterThan(0)

      const item2 = item1.children!.find(i => i.id === 'item2-1')!
      expect(item2.children?.length).toBeGreaterThan(0)
      expect(item2.children![0].id).toBe('item3-1')

      expect(col1.isAcquired).toBe(true)
      expect(col2.isAcquired).toBe(true)
      expect(col3.isAcquired).toBe(true)
      expect(col0.isStacked).toBe(true)
    })

    it('Scenario: Partial Unstacking from Middle (A -> B -> C, then release C)', () => {
      MillerStackHelper.stackIntoPrevious(col0, col1)
      MillerStackHelper.stackIntoPrevious(col1, col2)

      expect(col1.isAcquired).toBe(true)
      expect(col2.isAcquired).toBe(true)

      const released = MillerStackHelper.unstackLast(col1)
      expect(released?.id).toBe('col2')
      expect(col2.isAcquired).toBe(false)
      expect(col1.isAcquired).toBe(true)

      const item1 = col1.items.find(i => i.id === 'item1-1')!
      expect(item1.children).toEqual([])
    })

    it('Scenario: Recursive Unstack All', () => {
      MillerStackHelper.stackIntoPrevious(col0, col1)
      MillerStackHelper.stackIntoPrevious(col1, col2)
      MillerStackHelper.stackIntoPrevious(col2, col3)

      const released = MillerStackHelper.unstackAll(col0)

      expect(released.length).toBe(3)
      expect(col1.isAcquired).toBe(false)
      expect(col2.isAcquired).toBe(false)
      expect(col3.isAcquired).toBe(false)

      expect(col0.items[0].children).toEqual([])
    })
  })
})
