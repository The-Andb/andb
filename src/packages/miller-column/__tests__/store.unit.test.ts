import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMillerStore } from '../store'
import { ColumnNode } from '../types'

describe('Miller Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty columns', () => {
    const store = useMillerStore()
    expect(store.columns).toEqual([])
    expect(store.visibleColumns).toEqual([])
  })

  it('should select a node and add a new column', async () => {
    const store = useMillerStore()
    const mockFetcher = vi.fn().mockResolvedValue([
      { id: 'child-1', name: 'Child 1', type: 'item', rawData: {} }
    ])

    const rootCol = new ColumnNode({
      id: 'root',
      level: 0,
      title: 'Root',
      items: [{ id: 'node-1', name: 'Node 1', type: 'folder', rawData: {} }]
    })
    store.columns = [rootCol]

    await store.selectNode(rootCol.items[0], 0, mockFetcher)

    expect(store.columns.length).toBe(2)
    expect(store.columns[1].title).toBe('Node 1')
    expect(store.columns[1].items.length).toBe(1)
    expect(rootCol.selectedId).toBe('node-1')
  })

  it('should truncate forward chain when selecting at an earlier level', async () => {
    const store = useMillerStore()
    const mockFetcher = vi.fn().mockResolvedValue([])

    store.columns = [
      new ColumnNode({ id: 'c0', level: 0, title: 'C0', items: [{ id: 'n0', name: 'N0', type: 'item', rawData: {} }] }),
      new ColumnNode({ id: 'c1', level: 1, title: 'C1', items: [{ id: 'n1', name: 'N1', type: 'item', rawData: {} }] }),
      new ColumnNode({ id: 'c2', level: 2, title: 'C2', items: [{ id: 'n2', name: 'N2', type: 'item', rawData: {} }] })
    ]

    await store.selectNode(store.columns[0].items[0], 0, mockFetcher)

    expect(store.columns.length).toBe(1) // Next col empty so not pushed
  })

  it('should jump to a specific level', () => {
    const store = useMillerStore()
    store.columns = [
      new ColumnNode({ id: 'c0', level: 0, title: 'C0', items: [] }),
      new ColumnNode({ id: 'c1', level: 1, title: 'C1', items: [] }),
      new ColumnNode({ id: 'c2', level: 2, title: 'C2', items: [] })
    ]

    store.jumpToLevel(1)
    expect(store.columns.length).toBe(2)
    expect(store.columns[1].level).toBe(1)
  })
})
