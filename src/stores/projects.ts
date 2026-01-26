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
  const init = async () => {
    const savedProjects = await storage.getProjects()

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
    const lastSelected = await storage.get('settings').then(s => s?.lastSelectedProjectId)

    // 5. Data Sanitization (Fix duplicate IDs from previous bugs)
    // If multiple projects share 'default' ID, only the first one stays 'default'
    let defaultCount = 0
    projects.value = projects.value.map(p => {
      if (p.id === 'default') {
        defaultCount++
        if (defaultCount > 1) {
          return { ...p, id: generateId() }
        }
      }
      return p
    })

    if (lastSelected && projects.value.some(p => p.id === lastSelected)) {
      selectedProjectId.value = lastSelected
    } else {
      selectedProjectId.value = projects.value[0]?.id || 'default'
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
      // @ts-ignore
      await storage.updateSettings({ lastSelectedProjectId: newId })

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
      ...project
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
      selectedProjectId.value = projects.value[0]?.id || 'default'
    }
  }

  const selectProject = (id: string) => {
    if (projects.value.some(p => p.id === id)) {
      selectedProjectId.value = id
    }
  }

  const duplicateProject = (id: string) => {
    const source = projects.value.find(p => p.id === id)
    if (!source) return

    const newProject: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId(), // OVERWRITE the ID from source
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projects.value.push(newProject)
    return newProject
  }

  const addItemToProject = (type: 'connection' | 'pair', itemId: string) => {
    if (!selectedProjectId.value) return
    const project = projects.value.find(p => p.id === selectedProjectId.value)
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

    // 1. Check if Demo Project already exists to avoid duplicates
    const existingDemo = projects.value.find(p => p.name === 'Andb Live Demo')
    if (existingDemo) {
      selectProject(existingDemo.id)
      return connectionPairsStore.connectionPairs.find(p => existingDemo.pairIds.includes(p.id))
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
    })

    const targetConn = appStore.addConnection({
      name: 'Demo Target (SQL)',
      host: './ui/public/demo/demo-target.sql',
      port: 3306,
      database: 'demo_target',
      username: 'demo',
      environment: 'PROD',
      status: 'idle',
      type: 'dump'
    })

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

    // 1. Create Project
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
    })

    const targetConn = appStore.addConnection({
      name: `Target: ${targetFileName}`,
      host: targetPath,
      port: 3306,
      database: 'target',
      username: 'dump',
      environment: 'PROD',
      status: 'idle',
      type: 'dump'
    })

    quickProject.connectionIds = [sourceConn.id, targetConn.id]

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

    quickProject.pairIds = [quickPair.id]

    // 4. Set context
    selectProject(quickProject.id)

    return quickPair
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
    reloadData: init,
    viewMode
  }
})
