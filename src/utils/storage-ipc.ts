import type { DatabaseConnection } from '@/stores/app'
import type { ConnectionPair, Environment } from '@/stores/connectionPairs'
import type { Project } from '@/types/project'
import type { ConnectionTemplate } from '@/stores/connectionTemplates'

interface AppSchema {
  connections: DatabaseConnection[]
  connectionPairs: ConnectionPair[]
  environments: Environment[]
  projects: Project[]
  connectionTemplates: ConnectionTemplate[]
  settings: {
    sidebarCollapsed: boolean
    lastSelectedConnectionId: string
    lastSelectedProjectId?: string
    projectManagerMode?: boolean
    autoCollapseColumns?: boolean
    theme: 'light' | 'dark' | 'system'
    language: 'en' | 'vi'
    buttonStyle: 'full' | 'minimal' | 'icons'
    navStyle: 'vertical-list' | 'horizontal-tabs'
    fontSize: number
    fontSizes: {
      main: number
      menu: number
      button: number
      ddlHeader: number
      schema: number
      ddlName: number
      code: number
    }
    fontFamilies: {
      general: string
      code: string
    }
    fontSizeProfile?: 'small' | 'medium' | 'large' | 'custom'
    lastCustomFontSizes?: {
      main: number
      menu: number
      button: number
      ddlHeader: number
      schema: number
      ddlName: number
      code: number
    }
  }
}

// Helper to get storage from window
const getStorage = () => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI.storage
  }

  // Web/Dev Mode Fallback (LocalStorage)
  return {
    get: async (key: string) => {
      try {
        const value = localStorage.getItem(`andb_${key}`)
        console.log(`[Storage] GET ${key}:`, value ? 'Found' : 'Null', value ? JSON.parse(value) : '')
        return { success: true, data: value ? JSON.parse(value) : null }
      } catch (e: any) {
        console.error('LocalStorage Get Error:', e)
        return { success: false, error: e.message }
      }
    },
    set: async (key: string, value: any) => {
      try {
        console.log(`[Storage] SET ${key}:`, value)
        localStorage.setItem(`andb_${key}`, JSON.stringify(value))
        return { success: true }
      } catch (e: any) {
        console.error('LocalStorage Set Error:', e)
        return { success: false, error: e.message }
      }
    },
    delete: async (key: string) => {
      localStorage.removeItem(`andb_${key}`)
      return { success: true }
    },
    has: async (key: string) => {
      return { success: true, data: localStorage.getItem(`andb_${key}`) !== null }
    },
    clear: async () => {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('andb_')) localStorage.removeItem(k)
      })
      return { success: true }
    }
  }
}

export const storage = {
  // Helper for strict deduplication
  _deduplicateConnections(connections: DatabaseConnection[]): DatabaseConnection[] {
    const seen = new Set<string>()
    return connections.filter(conn => {
      // Create a unique hash for the connection content
      // Note: We ignore 'id' for the hash to find semantic duplicates
      // We normalize strings to lowercase/trimmed to be safe
      const key = [
        conn.name,
        conn.host,
        conn.port,
        conn.database,
        conn.username,
        conn.environment
      ].map(v => String(v || '').trim().toLowerCase()).join('|')

      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  },

  // ==================== Connections ====================
  async getConnections(): Promise<DatabaseConnection[]> {
    const result = await getStorage().get('connections')
    const raw = result.success ? (result.data || []) : []
    return this._deduplicateConnections(raw)
  },

  async saveConnections(connections: DatabaseConnection[]): Promise<void> {
    const clean = this._deduplicateConnections(connections)
    await getStorage().set('connections', JSON.parse(JSON.stringify(clean)))
  },

  async addConnection(connection: DatabaseConnection): Promise<void> {
    const connections = await this.getConnections()
    connections.push(connection)
    await this.saveConnections(connections)
  },

  async updateConnection(id: string, updates: Partial<DatabaseConnection>): Promise<void> {
    const connections = await this.getConnections()
    const index = connections.findIndex(c => c.id === id)
    if (index !== -1) {
      connections[index] = { ...connections[index], ...updates }
      await this.saveConnections(connections)
    }
  },

  async removeConnection(id: string): Promise<void> {
    const connections = await this.getConnections()
    const filtered = connections.filter(c => c.id !== id)
    await this.saveConnections(filtered)
  },

  // ==================== Connection Pairs ====================
  async getConnectionPairs(): Promise<ConnectionPair[]> {
    const result = await getStorage().get('connectionPairs')
    return result.success ? (result.data || []) : []
  },

  async saveConnectionPairs(pairs: ConnectionPair[]): Promise<void> {
    await getStorage().set('connectionPairs', JSON.parse(JSON.stringify(pairs)))
  },

  async addConnectionPair(pair: ConnectionPair): Promise<void> {
    const pairs = await this.getConnectionPairs()
    pairs.push(pair)
    await this.saveConnectionPairs(pairs)
  },

  async updateConnectionPair(id: string, updates: Partial<ConnectionPair>): Promise<void> {
    const pairs = await this.getConnectionPairs()
    const index = pairs.findIndex(p => p.id === id)
    if (index !== -1) {
      pairs[index] = { ...pairs[index], ...updates }
      await this.saveConnectionPairs(pairs)
    }
  },

  async removeConnectionPair(id: string): Promise<void> {
    const pairs = await this.getConnectionPairs()
    const filtered = pairs.filter(p => p.id !== id)
    await this.saveConnectionPairs(filtered)
  },

  // ==================== Environments ====================
  async getEnvironments(): Promise<Environment[]> {
    const result = await getStorage().get('environments')
    // Return defaults if empty
    if (!result.success || !result.data || result.data.length === 0) {
      return [
        { id: 'DEV', name: 'DEV', description: 'Development environment', enabled: true, order: 1 },
        { id: 'STAGE', name: 'STAGE', description: 'Staging environment', enabled: true, order: 2 },
        { id: 'UAT', name: 'UAT', description: 'UAT environment', enabled: true, order: 3 },
        { id: 'PROD', name: 'PROD', description: 'Production environment', enabled: true, order: 4 }
      ]
    }
    return result.data
  },

  async saveEnvironments(environments: Environment[]): Promise<void> {
    await getStorage().set('environments', JSON.parse(JSON.stringify(environments)))
  },

  async updateEnvironment(id: string, updates: Partial<Environment>): Promise<void> {
    const envs = await this.getEnvironments()
    const index = envs.findIndex(e => e.id === id)
    if (index !== -1) {
      envs[index] = { ...envs[index], ...updates }
      await this.saveEnvironments(envs)
    }
  },

  // ==================== Projects ====================
  async getProjects(): Promise<Project[]> {
    const result = await getStorage().get('projects')
    return result.success ? (result.data || []) : []
  },

  async saveProjects(projects: Project[]): Promise<void> {
    await getStorage().set('projects', JSON.parse(JSON.stringify(projects)))
  },

  async addProject(project: Project): Promise<void> {
    const projects = await this.getProjects()
    projects.push(project)
    await this.saveProjects(projects)
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const projects = await this.getProjects()
    const index = projects.findIndex(p => p.id === id)
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates }
      await this.saveProjects(projects)
    }
  },

  async removeProject(id: string): Promise<void> {
    const projects = await this.getProjects()
    const filtered = projects.filter(p => p.id !== id)
    await this.saveProjects(filtered)
  },

  // ==================== Settings ====================

  async getSettings() {
    const result = await getStorage().get('settings')
    const defaults = {
      sidebarCollapsed: false,
      lastSelectedConnectionId: '',
      lastSelectedProjectId: 'default',
      projectManagerMode: false,
      theme: 'system' as const,

      language: 'en' as const,
      buttonStyle: 'full' as const,
      navStyle: 'vertical-list' as const,
      fontSize: 13,
      fontSizes: {
        main: 13,
        menu: 12,
        button: 11,
        ddlHeader: 16,
        schema: 12,
        ddlName: 14,
        code: 12
      },
      fontFamilies: {
        general: "'Inter', sans-serif",
        code: "'JetBrains Mono', monospace"
      },
      fontSizeProfile: 'medium' as 'small' | 'medium' | 'large' | 'custom'
    }
    return result.success ? { ...defaults, ...result.data } : defaults
  },

  async saveSettings(settings: AppSchema['settings']): Promise<void> {
    await getStorage().set('settings', settings)
  },

  async updateSettings(updates: Partial<AppSchema['settings']>): Promise<void> {
    const settings = await this.getSettings()
    await this.saveSettings({ ...settings, ...updates })
  },

  // ==================== Connection Templates ====================
  async getConnectionTemplates(): Promise<ConnectionTemplate[]> {
    const result = await getStorage().get('connectionTemplates')
    return result.success ? (result.data || []) : []
  },

  async saveConnectionTemplates(templates: ConnectionTemplate[]): Promise<void> {
    await getStorage().set('connectionTemplates', JSON.parse(JSON.stringify(templates)))
  },

  // ==================== Generic Store Access ====================
  async get<K extends keyof AppSchema>(key: K): Promise<AppSchema[K] | undefined> {
    const result = await getStorage().get(key)
    return result.success ? result.data : undefined
  },

  async set<K extends keyof AppSchema>(key: K, value: AppSchema[K]): Promise<void> {
    await getStorage().set(key, value)
  },

  async has(key: keyof AppSchema): Promise<boolean> {
    const result = await getStorage().has(key)
    return result.success ? result.data : false
  },

  async delete(key: keyof AppSchema): Promise<void> {
    await getStorage().delete(key)
  },

  async clear(): Promise<void> {
    await getStorage().clear()
  }
}

export default storage
