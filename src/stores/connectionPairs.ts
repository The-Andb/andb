import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAppStore } from './app'
import { useProjectsStore } from './projects'
import { storage } from '../utils/storage-ipc'


export interface Environment {
  id: string
  name: string
  description: string
  enabled: boolean
  order: number
}

export interface ConnectionPair {
  id: string
  name: string
  sourceEnv: string
  targetEnv: string
  sourceConnectionId?: string
  targetConnectionId?: string
  description: string
  isDefault: boolean
  status: 'idle' | 'testing' | 'success' | 'failed'
}

export const useConnectionPairsStore = defineStore('connectionPairs', () => {
  // State
  const environments = ref<Environment[]>([])
  const connectionPairs = ref<ConnectionPair[]>([])

  // Initialize
  const init = async () => {
    const savedEnvironments = await storage.getEnvironments()
    if (savedEnvironments.length > 0) {
      // Emergency Migration: Convert numeric IDs to Tags if they exist
      const idMap: Record<string, string> = { '1': 'DEV', '2': 'STAGE', '3': 'UAT', '4': 'PROD' }
      environments.value = savedEnvironments.map(e => ({
        ...e,
        id: idMap[e.id] || e.id,
        name: idMap[e.id] || e.name
      }))
    } else {
      environments.value = [
        { id: 'DEV', name: 'DEV', description: 'Development environment', enabled: true, order: 1 },
        { id: 'STAGE', name: 'STAGE', description: 'Staging environment', enabled: true, order: 2 },
        { id: 'UAT', name: 'UAT', description: 'User Acceptance Testing', enabled: true, order: 3 },
        { id: 'PROD', name: 'PROD', description: 'Production environment', enabled: true, order: 4 }
      ]
    }

    const savedPairs = await storage.getConnectionPairs()
    if (savedPairs.length > 0) {
      connectionPairs.value = savedPairs

      // Migration: Claim orphan pairs for "The Base One"
      const projectsStore = useProjectsStore()
      if (projectsStore.projects.length === 0) {
        await projectsStore.reloadData()
      }

      const allLinkedPairIds = new Set<string>()
      projectsStore.projects.forEach(p => {
        p.pairIds.forEach(id => allLinkedPairIds.add(id))
      })

      const orphanPairIds = connectionPairs.value
        .filter(p => !allLinkedPairIds.has(p.id))
        .map(p => p.id)

      if (orphanPairIds.length > 0) {
        const defaultProject = projectsStore.projects.find(p => p.id === 'default')
        if (defaultProject) {
          defaultProject.pairIds.push(...orphanPairIds)
          storage.saveProjects(projectsStore.projects)
        }
      }

    } else {
      connectionPairs.value = [
        {
          id: '1',
          name: 'DEV to STAGE',
          sourceEnv: 'DEV',
          targetEnv: 'STAGE',
          description: 'Development to staging migration',
          isDefault: true,
          status: 'idle'
        },
        {
          id: '2',
          name: 'STAGE to UAT',
          sourceEnv: 'STAGE',
          targetEnv: 'UAT',
          description: 'Staging to UAT testing',
          isDefault: false,
          status: 'idle'
        },
        {
          id: '3',
          name: 'UAT to PROD',
          sourceEnv: 'UAT',
          targetEnv: 'PROD',
          description: 'UAT to production deployment',
          isDefault: false,
          status: 'idle'
        }
      ]

      // Auto-assign demo pairs to default project if new
      const projectsStore = useProjectsStore()
      if (projectsStore.projects.length === 0) {
        await projectsStore.reloadData()
      }
      const defaultProject = projectsStore.projects.find(p => p.id === 'default')
      if (defaultProject && defaultProject.pairIds.length === 0) {
        defaultProject.pairIds = connectionPairs.value.map(p => p.id)
        storage.saveProjects(projectsStore.projects)
      }
    }

    // Set default selection
    const defaultPair = connectionPairs.value.find(p => p.isDefault)
    if (defaultPair) {
      selectedPairId.value = defaultPair.id
    }
  }

  // Call init
  init()

  const selectedPairId = ref('1') // Default to first pair


  // Watch and auto-save to storage
  watch(
    environments,
    newEnvs => {
      storage.saveEnvironments(newEnvs)
    },
    { deep: true }
  )

  watch(
    connectionPairs,
    newPairs => {
      storage.saveConnectionPairs(newPairs)
    },
    { deep: true }
  )

  // Getters
  const enabledEnvironments = computed(() => {
    const projectsStore = useProjectsStore()
    const project = projectsStore.currentProject

    if (project && project.enabledEnvironmentIds) {
      return environments.value.filter(env => project.enabledEnvironmentIds.includes(env.id))
    }

    // Fallback to global enabled state if no project or legacy data
    return environments.value.filter(env => env.enabled)
  })

  const availablePairs = computed(() => {
    const projectsStore = useProjectsStore()
    const project = projectsStore.currentProject
    if (!project) return []

    // 1. Get environments enabled for this project and sort by order
    const sortedEnvs = [...enabledEnvironments.value].sort((a, b) => a.order - b.order)

    if (sortedEnvs.length < 2) return []

    // 2. Auto-generate sequential "One Way" migrate pairs
    // Logic: Env[i] -> Env[i+1] (Low order to High order)
    const autoPairs: ConnectionPair[] = []
    const appStore = useAppStore()

    for (let i = 0; i < sortedEnvs.length - 1; i++) {
      const source = sortedEnvs[i]
      const target = sortedEnvs[i + 1]

      // Look for a custom override pair if it exists (for specific connection mapping)
      const existing = connectionPairs.value.find(p => p.sourceEnv === source.id && p.targetEnv === target.id)

      // Auto-pick logic for specific connection IDs
      const autoSourceConn = appStore.connections.find(c => c.environment === source.id)?.id || ''
      const autoTargetConn = appStore.connections.find(c => c.environment === target.id)?.id || ''

      autoPairs.push({
        id: existing?.id || `auto-${source.id}-${target.id}`,
        name: existing?.name || `${source.name} to ${target.name}`,
        sourceEnv: source.id,
        targetEnv: target.id,
        sourceConnectionId: existing?.sourceConnectionId || autoSourceConn,
        targetConnectionId: existing?.targetConnectionId || autoTargetConn,
        description: existing?.description || `Auto-generated migration path from ${source.name} to ${target.name}`,
        isDefault: existing?.isDefault || i === 0,
        status: existing?.status || 'idle'
      })
    }

    return autoPairs
  })

  // Auto-select first pair if current one becomes invalid (e.g. project switch)
  watch(() => availablePairs.value, (newPairs) => {
    if (newPairs.length > 0) {
      if (!newPairs.some(p => p.id === selectedPairId.value)) {
        selectedPairId.value = newPairs[0].id
      }
    } else {
      selectedPairId.value = ''
    }
  }, { immediate: true })



  const defaultPair = computed(() => {
    return connectionPairs.value.find(pair => pair.isDefault)
  })

  const selectedPair = computed(() => {
    return connectionPairs.value.find(pair => pair.id === selectedPairId.value)
  })

  const getPairsBySource = computed(() => {
    return (sourceEnv: string) => connectionPairs.value.filter(p => p.sourceEnv === sourceEnv)
  })

  const getPairsByTarget = computed(() => {
    return (targetEnv: string) => connectionPairs.value.filter(p => p.targetEnv === targetEnv)
  })

  const activePair = computed(() => {
    try {
      if (!connectionPairs.value) return null
      if (!selectedPairId || !selectedPairId.value) return null

      const pair = connectionPairs.value.find(p => p.id === selectedPairId.value)
      if (!pair) return null

      const appStore = useAppStore()
      if (!appStore || !appStore.connections) return null

      let source = null
      if (pair.sourceConnectionId) {
        source = appStore.connections.find(c => c.id === pair.sourceConnectionId)
      }
      if (!source) {
        source = appStore.connections.find(c => c.environment === pair.sourceEnv)
      }

      let target = null
      if (pair.targetConnectionId) {
        target = appStore.connections.find(c => c.id === pair.targetConnectionId)
      }
      if (!target) {
        target = appStore.connections.find(c => c.environment === pair.targetEnv)
      }

      if (!source || !target) return null

      return {
        ...pair,
        source,
        target
      }
    } catch (e: any) {
      if (window.electronAPI) {
        window.electronAPI.log.send('error', 'Error calculating activePair in connectionPairs store', e.message)
      }
      return null
    }
  })

  // Actions
  const setSelectedPair = (pairId: string) => {
    const pair = connectionPairs.value.find(p => p.id === pairId)
    if (pair) {
      selectedPairId.value = pairId
    } else {
      selectedPairId.value = ''
    }
  }

  const addEnvironment = (environment: Omit<Environment, 'id'>) => {
    const newEnv: Environment = {
      ...environment,
      id: Date.now().toString()
    }
    environments.value.push(newEnv)
  }

  const updateEnvironment = (id: string, updates: Partial<Environment>) => {
    const index = environments.value.findIndex(env => env.id === id)
    if (index !== -1) {
      environments.value[index] = { ...environments.value[index], ...updates }
    }
  }

  const removeEnvironment = (id: string) => {
    const env = environments.value.find(e => e.id === id)
    if (env && !['DEV', 'STAGE', 'UAT', 'PROD'].includes(env.name.toUpperCase())) {
      environments.value = environments.value.filter(e => e.id !== id)
    }
  }

  const addConnectionPair = (pair: Omit<ConnectionPair, 'id'>) => {
    const newPair: ConnectionPair = {
      ...pair,
      id: Date.now().toString()
    }
    connectionPairs.value.push(newPair)

    // Register to current project
    const projectsStore = useProjectsStore()
    projectsStore.addItemToProject('pair', newPair.id)

    return newPair
  }

  const updateConnectionPair = (id: string, updates: Partial<ConnectionPair>) => {
    const index = connectionPairs.value.findIndex(pair => pair.id === id)
    if (index !== -1) {
      connectionPairs.value[index] = { ...connectionPairs.value[index], ...updates }
    }
  }

  const removeConnectionPair = (id: string) => {
    const projectsStore = useProjectsStore()
    const currentProjectId = projectsStore.selectedProjectId

    // 1. Unlink from Current Project
    if (currentProjectId) {
      const currentProject = projectsStore.projects.find(p => p.id === currentProjectId)
      if (currentProject) {
        currentProject.pairIds = currentProject.pairIds.filter(pid => pid !== id)
        // Trigger save via watcher
      }
    }

    // 2. User requested NO Garbage Collection.
  }

  const setDefaultPair = (pairId: string) => {
    // Remove default from all other pairs
    connectionPairs.value.forEach(pair => {
      pair.isDefault = false
    })

    // Set this pair as default
    const pair = connectionPairs.value.find(p => p.id === pairId)
    if (pair) {
      pair.isDefault = true
      // Auto-select default pair
      selectedPairId.value = pairId
    }
  }

  const testConnectionPair = async (pairId: string) => {
    const pair = connectionPairs.value.find(p => p.id === pairId)
    if (!pair) return

    pair.status = 'testing'

    try {
      const appStore = useAppStore()

      // Find actual connections for this pair's environments
      let sourceConn = null
      if (pair.sourceConnectionId) {
        sourceConn = appStore.connections.find(c => c.id === pair.sourceConnectionId)
      }
      if (!sourceConn) {
        sourceConn = appStore.connections.find(c => c.environment === pair.sourceEnv)
      }

      let targetConn = null
      if (pair.targetConnectionId) {
        targetConn = appStore.connections.find(c => c.id === pair.targetConnectionId)
      }
      if (!targetConn) {
        targetConn = appStore.connections.find(c => c.environment === pair.targetEnv)
      }

      if (!sourceConn || !targetConn) {
        pair.status = 'failed'
        return
      }

      // Test both connections with a minimum delay for better UX (avoid flicker on local)
      const minDelay = new Promise(resolve => setTimeout(resolve, 800))

      const [sourceSuccess, targetSuccess] = await Promise.all([
        appStore.testConnection(sourceConn.id),
        appStore.testConnection(targetConn.id),
        minDelay
      ])

      pair.status = (sourceSuccess && targetSuccess) ? 'success' : 'failed'
    } catch (error: any) {
      pair.status = 'failed'
      if (window.electronAPI) {
        window.electronAPI.log.send('error', `Connection pair test error for pair ${pair.name}`, error.message)
      }
    }
  }

  const reorderEnvironments = (newOrder: Environment[]) => {
    environments.value = newOrder.map((env, index) => ({
      ...env,
      order: index + 1
    }))
  }

  const resetEnvironments = async () => {
    environments.value = [
      { id: 'DEV', name: 'DEV', description: 'Development environment', enabled: true, order: 1 },
      { id: 'STAGE', name: 'STAGE', description: 'Staging environment', enabled: true, order: 2 },
      { id: 'UAT', name: 'UAT', description: 'UAT environment', enabled: true, order: 3 },
      { id: 'PROD', name: 'PROD', description: 'Production environment', enabled: true, order: 4 }
    ]
    await storage.saveEnvironments(environments.value)
  }

  const resetConnectionPairs = async () => {
    connectionPairs.value = [
      {
        id: '1',
        name: 'DEV to STAGE',
        sourceEnv: 'DEV',
        targetEnv: 'STAGE',
        description: 'Development to staging migration',
        isDefault: true,
        status: 'idle'
      },
      {
        id: '2',
        name: 'STAGE to UAT',
        sourceEnv: 'STAGE',
        targetEnv: 'UAT',
        description: 'Staging to UAT testing',
        isDefault: false,
        status: 'idle'
      },
      {
        id: '3',
        name: 'UAT to PROD',
        sourceEnv: 'UAT',
        targetEnv: 'PROD',
        description: 'UAT to production deployment',
        isDefault: false,
        status: 'idle'
      }
    ]
    await storage.saveConnectionPairs(connectionPairs.value)
  }


  return {
    // State
    environments,
    connectionPairs,
    selectedPairId,

    // Getters
    enabledEnvironments,
    availablePairs,
    defaultPair,
    selectedPair,
    activePair,
    getPairsBySource,
    getPairsByTarget,

    // Actions
    setSelectedPair,
    selectPair: setSelectedPair,
    addEnvironment,
    updateEnvironment,
    removeEnvironment,
    addConnectionPair,
    addPair: addConnectionPair,
    updateConnectionPair,
    removeConnectionPair,
    setDefaultPair,
    testConnectionPair,
    reorderEnvironments,
    resetEnvironments,
    resetConnectionPairs,
    toggleProjectEnvironment: (envId: string, isEnabled: boolean) => {
      const projectsStore = useProjectsStore()
      const project = projectsStore.currentProject
      if (!project) return

      let ids = [...project.enabledEnvironmentIds]
      if (isEnabled) {
        if (!ids.includes(envId)) ids.push(envId)
      } else {
        ids = ids.filter(id => id !== envId)
      }

      // Update via store action to ensure persistence
      projectsStore.updateProject(project.id, { enabledEnvironmentIds: ids })
    },
    reloadData: init
  }
})
