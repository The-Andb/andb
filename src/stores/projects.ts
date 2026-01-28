import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '../utils/storage-ipc'
import type { Project } from '@/types/project'
import { useAppStore } from './app'
import { useConnectionPairsStore } from './connectionPairs'
import { useConsoleStore } from './console'
import { useOperationsStore } from './operations'


export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([])
  const selectedProjectId = ref<string | null>(null)
  const viewMode = ref<'list' | 'grid' | 'columns' | 'detail'>('grid')

  // Initialize
  let initPromise: Promise<void> | null = null

  const init = async () => {
    // If already initializing, return the existing promise
    if (initPromise) return initPromise

    initPromise = (async () => {
      const savedProjects = await storage.getProjects()
      console.log('[Projects] Init - Loaded projects:', savedProjects?.length, savedProjects)

      // 1. Load existing projects
      if (savedProjects && savedProjects.length > 0) {
        const envIdMap: Record<string, string> = {
          '1': 'DEV',
          '2': 'STAGE',
          '3': 'UAT',
          '4': 'PROD'
        }

        projects.value = savedProjects.map(p => {
          let envs = Array.isArray(p.enabledEnvironmentIds) ? p.enabledEnvironmentIds.map(String) : ['DEV', 'STAGE', 'PROD']

          // Migrate numeric IDs to Named IDs
          envs = envs.map(id => envIdMap[id] || id)

          return {
            ...p,
            connectionIds: Array.isArray(p.connectionIds) ? p.connectionIds : [],
            pairIds: Array.isArray(p.pairIds) ? p.pairIds : [],
            enabledEnvironmentIds: envs
          }
        })
      }

      // 2. Ensure Default Project
      if (!projects.value.some(p => p.id === 'default')) {
        projects.value.push({
          id: 'default',
          name: 'The Base One',
          description: 'System default project',
          connectionIds: [],
          pairIds: [],
          enabledEnvironmentIds: ['DEV', 'STAGE', 'PROD'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      // 4. Set Selection
      const settings = await storage.getSettings()
      let lastSelected = settings?.lastSelectedProjectId

      // Simplicity Fallback: Direct LocalStorage read for Dev Mode
      let lastSelectedName: string | null = null
      if ((!lastSelected || lastSelected === 'default') && typeof window !== 'undefined') {
        const directSave = localStorage.getItem('andb_last_pid')
        if (directSave) {
          console.log('[Projects] Recovered ID from direct storage:', directSave)
          lastSelected = directSave
        }
        lastSelectedName = localStorage.getItem('andb_last_pname')
      }

      console.log('[Projects] Init - Last Selected ID:', lastSelected)

      // 5. Data Sanitization (Fix duplicate IDs from previous bugs)
      // If multiple projects share 'default' ID, only the first one stays 'default'
      let defaultCount = 0
      projects.value = projects.value.map(p => {
        // De-duplicate connectionIds and pairIds for every project
        const cleanConnectionIds = [...new Set(p.connectionIds || [])]
        const cleanPairIds = [...new Set(p.pairIds || [])]

        let newId = p.id
        if (p.id === 'default') {
          defaultCount++
          if (defaultCount > 1) {
            newId = generateId()
          }
        }

        return {
          ...p,
          id: newId,
          connectionIds: cleanConnectionIds,
          pairIds: cleanPairIds
        }
      })

      // Robust Selection Logic
      let found = false

      // Attempt 1: Match by ID
      if (lastSelected && projects.value.some(p => p.id === lastSelected)) {
        selectedProjectId.value = lastSelected
        found = true
      }

      // Attempt 2: Match by Name (Heuristic Recovery) - If user was on "Andb Live Demo", keep them there even if ID changed
      if (!found && projects.value.length > 0) {
        // Try to recover by name if ID failed (e.g. demo project recreated with new ID)
        const targetName = lastSelectedName || lastSelected // lastSelected might be a name if user hacked localstorage, or just try it

        const nameMatch = projects.value.find(p => p.name === targetName)
        if (nameMatch) {
          console.log('[Projects] Recovered selection by Name:', targetName, '->', nameMatch.id)
          selectedProjectId.value = nameMatch.id
          found = true
        }
      }

      // Final Fallback
      if (!found) {
        selectedProjectId.value = projects.value[0]?.id || 'default'
      }

      // 6. Ensure isActive flag is consistent with selectedProjectId
      projects.value.forEach(p => {
        p.isActive = p.id === selectedProjectId.value
      })
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  }

  // Call init
  init()

  // Watchers
  watch(
    projects,
    newProjects => {
      storage.saveProjects(newProjects)
    },
    { deep: true }
  )

  watch(selectedProjectId, async (newId) => {
    if (newId) {
      console.log('[Projects] Selected Project Changed:', newId)
      try {
        // @ts-ignore
        await storage.updateSettings({ lastSelectedProjectId: newId })
        console.log('[Projects] Persisted selection setting:', newId)

        // Simplicity Fallback: Direct LocalStorage save for Dev Mode
        if (typeof window !== 'undefined') {
          localStorage.setItem('andb_last_pid', newId)
          // Save Name too for heuristic recovery
          const p = projects.value.find(proj => proj.id === newId)
          if (p) localStorage.setItem('andb_last_pname', p.name)
        }
      } catch (err) {
        console.error('[Projects] Failed to persist selection:', err)
      }

      // DECOUPLING & INDEPENDENCE: Sync satellite stores
      const appStore = useAppStore()
      const connectionPairsStore = useConnectionPairsStore()
      const consoleStore = useConsoleStore()
      const operationsStore = useOperationsStore()

      // 1. Reset Global Connection Selection (Prevents Schema Tab leaking)
      appStore.selectedConnectionId = ''

      // 2. Reset Active Compare Pair (Prevents Compare Tab leaking)
      connectionPairsStore.selectPair('')

      // 3. Clear Logs (Ensures fresh start for the new project context)
      consoleStore.clearLogs()

      // 4. Clear ongoing UI operations (Keep context clean)
      operationsStore.clearOperations()
    }
  })

  // Getters
  const currentProject = computed(() => {
    return projects.value.find(p => p.id === selectedProjectId.value) || null
  })

  /**
   * Safe UUID generator with fallbacks
   */
  const generateId = () => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID()
      }
      return 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    } catch (e) {
      return 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    }
  }

  // Actions
  function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const newProject: Project = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...project,
      isActive: false // Default to false
    }

    projects.value.push(newProject)
    return newProject
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = {
        ...projects.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  const removeProject = (id: string) => {
    if (id === 'default') return // Cannot remove default project

    // Check if we are deleting the currently selected project
    const wasSelected = selectedProjectId.value === id

    projects.value = projects.value.filter(p => p.id !== id)

    if (wasSelected) {
      // Find another project to select, or fallback to default
      const nextId = projects.value[0]?.id || 'default'
      selectProject(nextId)
    }
  }

  const selectProject = (id: string) => {
    if (projects.value.some(p => p.id === id)) {
      selectedProjectId.value = id

      // Update isActive flag for all projects
      projects.value.forEach(p => {
        p.isActive = p.id === id
      })
    }
  }

  const duplicateProject = (id: string) => {
    const source = projects.value.find(p => p.id === id)
    if (!source) return

    const newProject: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId(), // OVERWRITE the ID from source
      name: `${source.name} (Copy)`,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projects.value.push(newProject)
    return newProject
  }

  const addItemToProject = (type: 'connection' | 'pair', itemId: string, projectId?: string) => {
    const targetId = projectId || selectedProjectId.value
    if (!targetId) return
    const project = projects.value.find(p => p.id === targetId)
    if (project) {
      if (type === 'connection' && !project.connectionIds.includes(itemId)) {
        project.connectionIds.push(itemId)
      } else if (type === 'pair' && !project.pairIds.includes(itemId)) {
        project.pairIds.push(itemId)
      }
    }
  }

  const removeItemFromProject = (type: 'connection' | 'pair', itemId: string) => {
    projects.value.forEach(p => {
      if (type === 'connection') {
        p.connectionIds = p.connectionIds.filter(id => id !== itemId)
      } else {
        p.pairIds = p.pairIds.filter(id => id !== itemId)
      }
    })
  }

  async function setupDemo() {
    const appStore = useAppStore()
    const connectionPairsStore = useConnectionPairsStore()

    // 0. Ensure initialization is complete
    await init()

    // 1. Check if Demo Project already exists to avoid duplicates
    // We check by name AND a sanity check on connectionIds length to prevent claiming an empty shell
    const existingDemo = projects.value.find(p => p.name === 'Andb Live Demo')
    if (existingDemo) {
      if (existingDemo.connectionIds.length > 0 && existingDemo.pairIds.length > 0) {
        selectProject(existingDemo.id)
        return connectionPairsStore.connectionPairs.find(p => existingDemo.pairIds.includes(p.id))
      }
      // If it exists but is broken/empty, we might want to repair it or ignore it.
      // For safety, let's just select it to avoid creating another one "Andb Live Demo (Copy)" or similar.
      selectProject(existingDemo.id)
      return undefined
    }

    // 1. Create Demo Project
    const demoProject = addProject({
      name: 'Andb Live Demo',
      description: 'Safe playground using SQL dump files',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV', 'PROD']
    })

    // 2. Create Demo Connections
    const sourceConn = appStore.addConnection({
      name: 'Demo Source (SQL)',
      host: './ui/public/demo/demo-source.sql',
      port: 3306,
      database: 'demo_source',
      username: 'demo',
      environment: 'DEV',
      status: 'idle',
      type: 'dump'
    }, demoProject.id)

    const targetConn = appStore.addConnection({
      name: 'Demo Target (SQL)',
      host: './ui/public/demo/demo-target.sql',
      port: 3306,
      database: 'demo_target',
      username: 'demo',
      environment: 'PROD',
      status: 'idle',
      type: 'dump'
    }, demoProject.id)

    // Link connections to demo project
    demoProject.connectionIds = [sourceConn.id, targetConn.id]

    // 3. Create Demo Pair
    const demoPair = connectionPairsStore.addPair({
      name: 'Demo Flow',
      description: 'Compare source dump vs target dump',
      sourceConnectionId: sourceConn.id,
      targetConnectionId: targetConn.id,
      sourceEnv: 'DEV',
      targetEnv: 'PROD',
      status: 'success',
      isDefault: false
    })

    demoProject.pairIds = [demoPair.id]

    // 4. Switch to Demo Project
    selectProject(demoProject.id)

    return demoPair
  }

  async function createQuickDumpPair(sourcePath: string, targetPath: string, name?: string) {
    const appStore = useAppStore()
    const connectionPairsStore = useConnectionPairsStore()

    const projectName = name || `Quick Compare ${new Date().toLocaleTimeString()}`

    // Extract file names for labels
    const sourceFileName = sourcePath.split(/[/\\]/).pop() || 'Source'
    const targetFileName = targetPath.split(/[/\\]/).pop() || 'Target'

    // 1. Check if an identical project already exists
    const existingProject = projects.value.find(p =>
      p.name === projectName &&
      p.description.includes(sourceFileName) &&
      p.description.includes(targetFileName)
    )

    if (existingProject) {
      selectProject(existingProject.id)
      const pair = connectionPairsStore.connectionPairs.find(p => existingProject.pairIds.includes(p.id))
      if (pair) return pair
    }

    // 2. Create Project
    const quickProject = addProject({
      name: projectName,
      description: `Comparison between ${sourceFileName} and ${targetFileName}`,
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV', 'PROD']
    })

    // 2. Create Connections
    const sourceConn = appStore.addConnection({
      name: `Source: ${sourceFileName}`,
      host: sourcePath,
      port: 3306,
      database: 'source',
      username: 'dump',
      environment: 'DEV',
      status: 'idle',
      type: 'dump'
    }, quickProject.id)

    const targetConn = appStore.addConnection({
      name: `Target: ${targetFileName}`,
      host: targetPath,
      port: 3306,
      database: 'target',
      username: 'dump',
      environment: 'PROD',
      status: 'idle',
      type: 'dump'
    }, quickProject.id)

    // Ensure they are linked (addConnection already does this, but being explicit)
    if (!quickProject.connectionIds.includes(sourceConn.id)) quickProject.connectionIds.push(sourceConn.id)
    if (!quickProject.connectionIds.includes(targetConn.id)) quickProject.connectionIds.push(targetConn.id)

    // 3. Create Pair
    const quickPair = connectionPairsStore.addPair({
      name: 'Migration Flow',
      description: `${sourceFileName} → ${targetFileName}`,
      sourceConnectionId: sourceConn.id,
      targetConnectionId: targetConn.id,
      sourceEnv: 'DEV',
      targetEnv: 'PROD',
      status: 'success',
      isDefault: false
    })

    if (!quickProject.pairIds.includes(quickPair.id)) quickProject.pairIds.push(quickPair.id)

    // 4. Set context
    selectProject(quickProject.id)

    return quickPair
  }

  /**
   * Deep cleanup of duplicates and orphaned data
   */
  async function cleanGarbageConnections() {
    const appStore = useAppStore()
    const connectionPairsStore = useConnectionPairsStore()

    const normalizeDumpPath = (path: string) => {
      if (!path) return ''
      // Normalize dump paths: get filename or handle common demo paths
      const filename = path.split(/[/\\]/).pop() || path
      return filename.toLowerCase().trim()
    }

    // 1. De-duplicate Connections
    const connGroups: Record<string, any> = {}
    const connMap: Record<string, string> = {}

    appStore.connections.forEach(conn => {
      const host = conn.type === 'dump' ? normalizeDumpPath(conn.host) : (conn.host || '').toLowerCase().trim()
      const key = `${conn.environment}|${conn.name.toLowerCase().trim()}|${host}|${conn.port}|${(conn.database || '').toLowerCase().trim()}|${(conn.username || '').toLowerCase().trim()}`

      if (!connGroups[key]) {
        connGroups[key] = conn
        connMap[conn.id] = conn.id
      } else {
        connMap[conn.id] = connGroups[key].id
      }
    })

    appStore.connections = Object.values(connGroups)

    // 2. Update Pairs and De-duplicate
    connectionPairsStore.connectionPairs.forEach(pair => {
      if (pair.sourceConnectionId && connMap[pair.sourceConnectionId]) {
        pair.sourceConnectionId = connMap[pair.sourceConnectionId]
      }
      if (pair.targetConnectionId && connMap[pair.targetConnectionId]) {
        pair.targetConnectionId = connMap[pair.targetConnectionId]
      }
    })

    const pairGroups: Record<string, any> = {}
    const pairMap: Record<string, string> = {}

    connectionPairsStore.connectionPairs.forEach(pair => {
      const key = `${pair.name.toLowerCase().trim()}|${pair.sourceConnectionId}|${pair.targetConnectionId}|${pair.sourceEnv}|${pair.targetEnv}`
      if (!pairGroups[key]) {
        pairGroups[key] = pair
        pairMap[pair.id] = pair.id
      } else {
        pairMap[pair.id] = pairGroups[key].id
      }
    })

    connectionPairsStore.connectionPairs = Object.values(pairGroups)

    // 3. Update Projects
    projects.value.forEach(p => {
      p.connectionIds = [...new Set((p.connectionIds || []).map(id => connMap[id] || id))]
      p.pairIds = [...new Set((p.pairIds || []).map(id => pairMap[id] || id))]
    })

    // 4. PERSIST CHANGES EXPLICITLY TO DISK
    // This prevents race conditions where reloadData() might pull stale data
    await Promise.all([
      storage.saveConnections(appStore.connections),
      storage.saveConnectionPairs(connectionPairsStore.connectionPairs),
      storage.saveProjects(projects.value),
      storage.updateSettings({ lastSelectedProjectId: selectedProjectId.value || undefined })
    ])
  }

  return {
    projects,
    selectedProjectId,
    currentProject,
    addProject,
    updateProject,
    duplicateProject,
    removeProject,
    selectProject,
    addItemToProject,
    removeItemFromProject,
    setupDemo,
    createQuickDumpPair,
    cleanGarbageConnections,
    reloadData: init,
    viewMode
  }
})
