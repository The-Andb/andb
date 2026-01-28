export interface Project {
  id: string
  name: string
  description: string
  icon?: string
  color?: string
  connectionIds: string[]
  pairIds: string[]
  isActive?: boolean
  enabledEnvironmentIds: string[]
  pinnedColumnTypes?: string[]
  settings?: {
    domainNormalization?: {
      pattern: string
      replacement: string
    }
    isNotMigrateCondition?: string
  }
  createdAt: string
  updatedAt: string
}
