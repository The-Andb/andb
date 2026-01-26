import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock browser globals before stores are imported
if (typeof window === 'undefined') {
  (global as any).window = {
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    electronAPI: {
      storage: {
        get: vi.fn().mockResolvedValue({ success: true, data: {} }),
        set: vi.fn().mockResolvedValue({ success: true }),
        delete: vi.fn().mockResolvedValue({ success: true }),
      }
    }
  };
  (global as any).matchMedia = (global as any).window.matchMedia;
}

import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '../projects'
import { useAppStore } from '../app'
import { useConnectionPairsStore } from '../connectionPairs'

// Mock storage-ipc
vi.mock('@/utils/storage-ipc', () => ({
  storage: {
    getProjects: vi.fn().mockResolvedValue([]),
    getConnections: vi.fn().mockResolvedValue([]),
    getConnectionPairs: vi.fn().mockResolvedValue([]),
    getEnvironments: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue({}),
    saveProjects: vi.fn().mockResolvedValue({}),
    saveConnections: vi.fn().mockResolvedValue({}),
    saveConnectionPairs: vi.fn().mockResolvedValue({}),
    saveEnvironments: vi.fn().mockResolvedValue({}),
  }
}))

// Mock andb utility
vi.mock('@/utils/andb', () => ({
  default: {
    getSchemas: vi.fn().mockResolvedValue([]),
    testConnection: vi.fn().mockResolvedValue(true)
  }
}))

import { nextTick } from 'vue'

describe('Project Isolation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should filter connections and pairs based on the selected project', async () => {
    const projectsStore = useProjectsStore()
    const appStore = useAppStore()
    const pairsStore = useConnectionPairsStore()

    // Setup 2 projects
    const p1Id = 'project-1'
    const p2Id = 'project-2'

    projectsStore.projects = [
      {
        id: p1Id, name: 'Project 1', connectionIds: ['conn-1'], pairIds: ['pair-1'],
        enabledEnvironmentIds: ['DEV'], createdAt: '', updatedAt: '', description: ''
      },
      {
        id: p2Id, name: 'Project 2', connectionIds: ['conn-2'], pairIds: ['pair-2'],
        enabledEnvironmentIds: ['DEV'], createdAt: '', updatedAt: '', description: ''
      }
    ]

    // Setup connections
    appStore.connections = [
      { id: 'conn-1', name: 'Conn 1', environment: 'DEV', host: '', port: 0, database: 'db1', username: '', password: '', status: 'idle' },
      { id: 'conn-2', name: 'Conn 2', environment: 'DEV', host: '', port: 0, database: 'db2', username: '', password: '', status: 'idle' }
    ]

    // Setup pairs
    pairsStore.connectionPairs = [
      { id: 'pair-1', name: 'Pair 1', sourceEnv: 'DEV', targetEnv: 'PROD', description: '', isDefault: true, status: 'idle' },
      { id: 'pair-2', name: 'Pair 2', sourceEnv: 'DEV', targetEnv: 'PROD', description: '', isDefault: false, status: 'idle' }
    ]

    // 1. Select Project 1
    projectsStore.selectedProjectId = p1Id

    expect(appStore.filteredConnections.length).toBe(1)
    expect(appStore.filteredConnections[0].id).toBe('conn-1')

    expect(pairsStore.availablePairs.length).toBe(1)
    expect(pairsStore.availablePairs[0].id).toBe('pair-1')

    // 2. Select Project 2
    projectsStore.selectedProjectId = p2Id

    expect(appStore.filteredConnections.length).toBe(1)
    expect(appStore.filteredConnections[0].id).toBe('conn-2')

    expect(pairsStore.availablePairs.length).toBe(1)
    expect(pairsStore.availablePairs[0].id).toBe('pair-2')
  })

  it('should auto-select the first valid connection when project changes', async () => {
    const projectsStore = useProjectsStore()
    const appStore = useAppStore()

    const p1Id = 'project-1'
    const p2Id = 'project-2'

    projectsStore.projects = [
      { id: p1Id, name: 'P1', connectionIds: ['c1'], pairIds: [], enabledEnvironmentIds: [], createdAt: '', updatedAt: '', description: '' },
      { id: p2Id, name: 'P2', connectionIds: ['c2'], pairIds: [], enabledEnvironmentIds: [], createdAt: '', updatedAt: '', description: '' }
    ]

    appStore.connections = [
      { id: 'c1', name: 'C1', environment: 'DEV', host: '', port: 0, database: 'db1', username: '', password: '', status: 'idle' },
      { id: 'c2', name: 'C2', environment: 'DEV', host: '', port: 0, database: 'db2', username: '', password: '', status: 'idle' }
    ]

    // Start with P1 selected
    projectsStore.selectedProjectId = p1Id
    appStore.selectedConnectionId = 'c1'

    // Switch to P2
    projectsStore.selectedProjectId = p2Id

    // The watcher in appStore should have triggered
    await nextTick()
    expect(appStore.selectedConnectionId).toBe('c2')
  })
})
