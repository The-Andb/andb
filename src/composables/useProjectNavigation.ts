import { Database, Link, GitCompare, Table, Eye, Zap, Globe, HardDrive, Variable, Play } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { Andb } from '@/utils/andb'

export interface NodeItem {
  id: string
  name: string
  type: string
  icon?: any
  contextType?: string
  children?: NodeItem[]
  expanded?: boolean
  selected?: boolean
  count?: number
  description?: string
  environment?: string
  database?: string
  ddlType?: string
  inProject?: boolean
  typeId?: string
  [key: string]: any
}

export interface NavigationContext {
  projectId?: string
  environment?: string
  database?: string
  typeId?: string
}

export const useProjectNavigation = () => {
  const appStore = useAppStore()
  const projectsStore = useProjectsStore()

  const loadNodeChildren = async (item: any, currentType: string, _context: NavigationContext = {}) => {
    let items: NodeItem[] = []
    let nextType = ''
    let title = item.name

    const project = projectsStore.currentProject

    switch (currentType) {
      case 'projects':
        nextType = 'categories'
        items = [
          { id: 'schema', name: 'Schema', icon: Database, contextType: 'categories', type: 'categories' },
          { id: 'connections', name: 'Connections', icon: Link, count: project?.connectionIds.length || 0, contextType: 'categories', type: 'categories' },
          { id: 'pairs', name: 'Sync Pairs', icon: GitCompare, count: project?.pairIds.length || 0, contextType: 'categories', type: 'categories' }
        ]
        break

      case 'categories':
        if (item.id === 'schema') {
          nextType = 'environments'
          title = 'Environments'
          const pairsStore = useConnectionPairsStore()
          const envs = project?.enabledEnvironmentIds || ['DEV', 'STAGE', 'UAT', 'PROD']
          items = envs.map(envId => {
            const envObj = pairsStore.environments.find(e => e.id === String(envId))
            return {
              id: envId,
              name: envObj ? envObj.name : (envId === 'DEV' ? 'DEV' : envId === 'STAGE' ? 'STAGE' : envId === 'PROD' ? 'PROD' : String(envId)),
              icon: Globe,
              contextType: 'environments',
              type: 'environments'
            }
          })
        } else if (item.id === 'connections') {
          nextType = 'connection'
          title = 'Connections'
          items = appStore.connections
            .filter(c => project?.connectionIds.includes(c.id))
            .map(c => ({
              id: c.id,
              name: c.name,
              icon: HardDrive,
              type: 'connection',
              isTerminal: true,
              rawData: c
            }))
        } else if (item.id === 'pairs') {
          const pairsStore = useConnectionPairsStore()
          nextType = 'pair_details'
          title = 'Sync Pairs'
          items = pairsStore.connectionPairs
            .filter(p => project?.pairIds.includes(p.id))
            .map(p => ({
              id: p.id,
              name: p.name,
              icon: GitCompare,
              type: 'pair_details',
              description: p.sourceEnv + ' → ' + p.targetEnv,
              isTerminal: false,
              rawData: p
            }))
        }
        break

      case 'environments':
        nextType = 'databases'
        title = item.name + ' Bases'
        items = appStore.connections
          .filter(c => project?.connectionIds.includes(c.id) && (c.environment === item.id || c.environment === item.name))
          .map(c => ({
            id: c.id,
            name: c.database,
            icon: Database,
            environment: item.name, // Use the name for downstream lookups
            type: 'databases',
            rawData: c
          }))
        break

      case 'databases':
        nextType = 'types'
        title = 'Object Types'
        items = [
          { id: item.id + '_tables', name: 'Tables', icon: Table, type: 'types', typeId: 'tables', parentConn: item.rawData },
          { id: item.id + '_views', name: 'Views', icon: Eye, type: 'types', typeId: 'views', parentConn: item.rawData },
          { id: item.id + '_pointers', name: 'Functions', icon: Variable, type: 'types', typeId: 'functions', parentConn: item.rawData },
          { id: item.id + '_triggers', name: 'Triggers', icon: Zap, type: 'types', typeId: 'triggers', parentConn: item.rawData },
          { id: item.id + '_procedures', name: 'Procedures', icon: Play, type: 'types', typeId: 'procedures', parentConn: item.rawData }
        ]
        break

      case 'pair_details':
        nextType = 'pair_types'
        title = item.name
        items = [
          { id: item.id + '_tables', name: 'Tables', icon: Table, type: 'pair_types', typeId: 'tables', pair: item.rawData },
          { id: item.id + '_views', name: 'Views', icon: Eye, type: 'pair_types', typeId: 'views', pair: item.rawData },
          { id: item.id + '_functions', name: 'Functions', icon: Variable, type: 'pair_types', typeId: 'functions', pair: item.rawData },
          { id: item.id + '_triggers', name: 'Triggers', icon: Zap, type: 'pair_types', typeId: 'triggers', pair: item.rawData },
          { id: item.id + '_procedures', name: 'Procedures', icon: Play, type: 'pair_types', typeId: 'procedures', pair: item.rawData }
        ]
        break

      case 'pair_types':
        nextType = 'pair_objects'
        title = String(item.name)
        try {
          // Fetch existing comparison results
          const appStore = useAppStore()
          const pair = item.pair
          const sourceConn = appStore.connections.find(c => c.id === pair.sourceConnectionId || c.environment === pair.sourceEnv)
          const targetConn = appStore.connections.find(c => c.id === pair.targetConnectionId || c.environment === pair.targetEnv)

          if (sourceConn && targetConn) {
            const results = await Andb.getSavedComparisonResults(sourceConn, targetConn, item.typeId)
            items = results.map((res: any) => ({
              id: pair.id + '_' + item.typeId + '_' + res.name,
              name: res.name,
              icon: item.icon,
              type: 'pair_object',
              description: res.status,
              isTerminal: true,
              rawData: {
                ...res,
                pair,
                sourceLabel: sourceConn.name,
                targetLabel: targetConn.name,
                sourceIsDump: sourceConn.type === 'dump',
                targetIsDump: targetConn.type === 'dump'
              }
            }))
          }
        } catch (e) {
          console.error('Failed to load pair objects:', e)
          items = []
        }
        break

      case 'types':
        nextType = 'objects'
        title = String(item.name)

        try {
          const schemas = await Andb.getSchemas()

          // Use .find() because schemas is an Array of environments
          const envName = item.parentConn?.environment
          const envData = Array.isArray(schemas)
            ? schemas.find((e: any) => e.name === envName || e.id === envName)
            : schemas[envName]

          const dbName = item.parentConn?.database
          const dbData = envData?.databases
            ? envData.databases.find((d: any) => d.name === dbName)
            : (envData ? envData[dbName] : null)

          const typeData = dbData ? dbData[item.typeId] : []

          if (typeData && Array.isArray(typeData)) {
            items = typeData.map((objName: string) => ({
              id: item.parentConn.id + '_' + item.typeId + '_' + objName,
              name: objName,
              icon: item.icon,
              type: 'object',
              isTerminal: true,
              rawData: { ...item.parentConn, objectName: objName, objectType: item.typeId }
            }))
          } else {
            items = []
          }
        } catch (e) {
          console.error('Failed to fetch real objects:', e)
          items = []
        }
        break
    }

    return { items, nextType, title }
  }

  return {
    loadNodeChildren
  }
}
