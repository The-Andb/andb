// TypeScript type definitions for Electron IPC APIs

export interface DatabaseConnection {
  host: string
  port: number
  database: string
  username: string
  password?: string
}

export interface CommandResult {
  success: boolean
  data?: string
  error?: string
}

export interface ConnectionTestResult {
  success: boolean
  message?: string
  stdout?: string
  stderr?: string
  error?: string
  version?: string
}

declare global {
  interface Window {
    electronAPI: {
      platform: string

      // andb-core CLI
      executeAndbCommand: (command: string, args: string[]) => Promise<CommandResult>
      testConnection: (connection: DatabaseConnection) => Promise<ConnectionTestResult>

      // Database/Storage operations
      getMigrationHistory: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addMigration: (migration: any) => Promise<{ success: boolean; id?: number; error?: string }>
      updateMigrationStatus: (id: number, status: string, error?: string) => Promise<{ success: boolean; error?: string }>

      getComparisonHistory: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addComparison: (comparison: any) => Promise<{ success: boolean; id?: number; error?: string }>

      getExportLogs: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addExportLog: (log: any) => Promise<{ success: boolean; id?: number; error?: string }>

      getAuditLogs: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addAuditLog: (log: any) => Promise<{ success: boolean; id?: number; error?: string }>

      getDatabaseStats: () => Promise<{ success: boolean; data?: any; error?: string }>
      databaseCleanup: (daysToKeep?: number) => Promise<{ success: boolean; error?: string }>

      // andb-core operations (new programmatic approach)
      andbExecute: (args: {
        sourceConnection: DatabaseConnection
        targetConnection: DatabaseConnection
        operation: 'export' | 'compare' | 'migrate' | 'generate'
        options: any
      }) => Promise<{ success: boolean; data?: any; error?: string }>

      andbTest: () => Promise<{ success: boolean; available?: boolean; error?: string }>

      andbGetSchemas: (args?: any) => Promise<{ success: boolean; data?: any; error?: string }>
      andbGetSavedComparisonResults: (args: {
        sourceConnection: any
        targetConnection: any
        type: string
      }) => Promise<{ success: boolean; data?: any; error?: string }>
      andbClearConnectionData: (connection: any) => Promise<{ success: boolean; error?: string }>
      getSnapshots: (environment: string, database: string, type: string, name: string) => Promise<{ success: boolean; data?: any; error?: string }>
      getAllSnapshots: (limit?: number) => Promise<{ success: boolean; data?: any; error?: string }>
      andbCreateSnapshot: (args: { connection: any; type: string; name: string }) => Promise<{ success: boolean; data?: any; error?: string }>
      andbRestoreSnapshot: (args: { connection: any; snapshot: any }) => Promise<{ success: boolean; data?: any; error?: string }>
      openBackupFolder: () => Promise<{ success: boolean; error?: string }>
      getReportList: () => Promise<{ success: boolean; data?: any[]; error?: string }>
      getReportContent: (filename: string) => Promise<{ success: boolean; data?: string; error?: string }>

      loadMockCompareData: () => Promise<{ success: boolean; message?: string; error?: string }>

      storage: {
        get: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>
        set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
        delete: (key: string) => Promise<{ success: boolean; error?: string }>
        has: (key: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
        clear: () => Promise<{ success: boolean; error?: string }>
      }

      log: {
        send: (level: 'info' | 'warn' | 'error', message: string, data?: any) => Promise<void>
        write: (content: string) => Promise<void>
      }

      updater: {
        checkForUpdates: () => Promise<{ success: boolean; result?: any; error?: string }>
        downloadUpdate: () => Promise<{ success: boolean; result?: any; error?: string }>
        quitAndInstall: () => Promise<void>
        debugTestUpdate: (status: string) => Promise<void>
        onUpdateStatus: (callback: (response: any) => void) => void
        offUpdateStatus: () => void
      }
    }
  }
}

export { }

