import type { DatabaseConnection } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useProjectsStore } from '@/stores/projects'

/**
 * Andb Service - Programmatic API Wrapper
 * 
 * New approach: Direct integration with andb-core via IPC
 * No subprocess, no command injection risks
 */

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined

export interface ExportOptions {
  type: 'tables' | 'procedures' | 'functions' | 'triggers' | 'views'
  environment?: string
  outputPath?: string
  name?: string // Specific object name
}

export interface CompareOptions {
  type: 'tables' | 'procedures' | 'functions' | 'triggers' | 'views'
  sourceEnv: string
  targetEnv: string
  name?: string // Specific object name
}

export interface MigrateOptions {
  type: 'tables' | 'procedures' | 'functions' | 'triggers' | 'views'
  sourceEnv: string
  targetEnv: string
  name?: string
  status?: 'NEW' | 'UPDATED' | 'DEPRECATED'
  dryRun?: boolean
}

export interface ConnectionTestResult {
  success: boolean
  message?: string
  version?: string
}

export class Andb {
  /**
   * Helper to sanitize objects for IPC (removes Proxies, functions, etc)
   */
  private static sanitize<T>(obj: T): T {
    if (!obj) return obj
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch (e) {
      // Fallback to shallow clone if JSON fails (e.g. circular)
      return { ...obj }
    }
  }

  /**
   * Helper to get core settings from store
   */
  private static getCoreSettings() {
    try {
      const settingsStore = useSettingsStore()
      const projectsStore = useProjectsStore()

      const projectSettings = projectsStore.currentProject?.settings || {}
      const globalSettings = settingsStore.settings

      return {
        domainNormalization: projectSettings.domainNormalization || globalSettings.domainNormalization,
        isNotMigrateCondition: projectSettings.isNotMigrateCondition || globalSettings.isNotMigrateCondition
      }
    } catch (e) {
      // Pinia might not be ready in some edge cases
      return {}
    }
  }

  /**
   * Test if andb-core is available
   */
  static async test(): Promise<boolean> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.andbTest()
      return result.success && result.available === true
    } catch (error) {
      return false
    }
  }

  /**
   * Export database objects
   */
  static async export(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: ExportOptions
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'export',
        options: { ...options, ...this.getCoreSettings() }
      }))

      if (result.success) return result.data
      throw new Error(result.error || 'Export failed')
    } catch (error: any) {
      throw new Error(`Export failed: ${error.message}`)
    }
  }

  /**
   * Compare database objects between environments
   */
  static async compare(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: CompareOptions
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'compare',
        options: { ...options, ...this.getCoreSettings() }
      }))

      if (result.success) return result.data
      throw new Error(result.error || 'Compare failed')
    } catch (error: any) {
      throw new Error(`Compare failed: ${error.message}`)
    }
  }

  /**
   * Fetch saved comparison results without re-running
   */
  static async getSavedComparisonResults(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    type: string
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbGetSavedComparisonResults(this.sanitize({
        sourceConnection,
        targetConnection,
        type
      }))

      if (result.success) return result.data
      throw new Error(result.error || 'Failed to fetch saved results')
    } catch (error: any) {
      throw new Error(`Failed to fetch saved results: ${error.message}`)
    }
  }

  /**
   * Execute migration
   */
  static async migrate(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: MigrateOptions
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'migrate',
        options: { ...options, ...this.getCoreSettings() }
      }))

      if (result.success) return result.data
      throw new Error(result.error || 'Migration failed')
    } catch (error: any) {
      throw new Error(`Migration failed: ${error.message}`)
    }
  }

  /**
   * Generate Migration Script (SQL)
   */
  static async generate(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: any
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'generate',
        options: { ...options, ...this.getCoreSettings() }
      }))

      if (result.success) return result.data
      throw new Error(result.error || 'Generation failed')
    } catch (error: any) {
      throw new Error(`Generation failed: ${error.message}`)
    }
  }

  /**
   * Test a single database connection
   */
  static async testConnection(connection: DatabaseConnection): Promise<ConnectionTestResult> {
    if (!isElectron) return { success: false, message: 'Not in Electron' }
    try {
      const result = await window.electronAPI.testConnection(this.sanitize(connection))
      if (!result.message && (result as any).error) {
        result.message = (result as any).error
      }
      return result
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  /**
   * Get all registered schemas from core
   */
  static async getSchemas(): Promise<any> {
    if (!isElectron) return []
    try {
      const result = await window.electronAPI.andbGetSchemas()
      if (result.success) return result.data
      return []
    } catch (error) {
      return []
    }
  }

  /**
   * Clear connection data (force reload)
   */
  static async clearConnectionData(connection: DatabaseConnection): Promise<any> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.andbClearConnectionData(this.sanitize(connection))
      return (result as any).success ? (result as any).data : false
    } catch (error) {
      return false
    }
  }

  /**
   * Get snapshots for a table
   */
  static async getSnapshots(environment: string, database: string, type: string, name: string): Promise<any[]> {
    if (!isElectron) return []
    try {
      const result = await window.electronAPI.getSnapshots(environment, database, type, name)
      if (result.success) return result.data
      return []
    } catch (error) {
      return []
    }
  }

  /**
   * Get global snapshots list
   */
  static async getAllSnapshots(limit: number = 50): Promise<any[]> {
    if (!isElectron) return []
    try {
      const result = await window.electronAPI.getAllSnapshots(limit)
      if (result.success) return result.data
      return []
    } catch (error) {
      return []
    }
  }

  /**
   * Create a new snapshot for an object
   */
  static async createSnapshot(connection: DatabaseConnection, type: string, name: string): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await window.electronAPI.andbCreateSnapshot({
        connection: this.sanitize(connection),
        type,
        name
      })
      if (result.success) return result.data
      throw new Error(result.error || 'Failed to create snapshot')
    } catch (error: any) {
      throw new Error(`Snapshot failed: ${error.message}`)
    }
  }

  /**
   * Restore a snapshot to a connection
   */
  static async restoreSnapshot(connection: DatabaseConnection, snapshot: any): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await window.electronAPI.andbRestoreSnapshot({
        connection: this.sanitize(connection),
        snapshot
      })
      if (result.success) return result.data
      throw new Error(result.error || 'Failed to restore snapshot')
    } catch (error: any) {
      throw new Error(`Restore failed: ${error.message}`)
    }
  }

  /**
   * Open backup folder in system explorer
   */
  static async openBackupFolder(): Promise<boolean> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.openBackupFolder()
      return result.success
    } catch (error) {
      return false
    }
  }
}

export default Andb
