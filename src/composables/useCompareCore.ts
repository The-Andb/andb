import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useConsoleStore } from '@/stores/console'
import { useOperationsStore } from '@/stores/operations'
import Andb from '@/utils/andb'

export function useCompareCore() {
  const { t } = useI18n()
  const connectionPairsStore = useConnectionPairsStore()
  const consoleStore = useConsoleStore()
  const operationsStore = useOperationsStore()

  // State
  const loading = ref(false)
  const loadingAction = ref<'fetch' | 'compare' | null>(null)
  const statusMessage = ref('')
  const error = ref<string | null>(null)

  // Result Buckets
  const tableResults = ref<any[]>([])
  const procedureResults = ref<any[]>([])
  const functionResults = ref<any[]>([])
  const viewResults = ref<any[]>([])
  const triggerResults = ref<any[]>([])

  // Computed: Active Pair Shortcuts
  const activePair = computed(() => connectionPairsStore.activePair)
  const sourceName = computed(() => activePair.value?.source?.name || 'Source')
  const targetName = computed(() => activePair.value?.target?.name || 'Target')

  // Computed: Dump Detection
  const isSourceDump = computed(() => {
    const conn = activePair.value?.source
    if (!conn) return false
    return conn.type === 'dump' || conn.host?.toLowerCase().endsWith('.sql') || conn.host?.includes('.sql')
  })

  const isTargetDump = computed(() => {
    const conn = activePair.value?.target
    if (!conn) return false
    return conn.type === 'dump' || conn.host?.toLowerCase().endsWith('.sql') || conn.host?.includes('.sql')
  })

  // Computed: Consolidated Results
  const allResults = computed(() => {
    const all = [
      ...tableResults.value.map(i => ({ ...i, type: 'tables' })),
      ...procedureResults.value.map(i => ({ ...i, type: 'procedures' })),
      ...functionResults.value.map(i => ({ ...i, type: 'functions' })),
      ...viewResults.value.map(i => ({ ...i, type: 'views' })),
      ...triggerResults.value.map(i => ({ ...i, type: 'triggers' }))
    ]

    return all.sort((a, b) => {
      // Priority: Modified (0) > Missing (1) > Extra (2) > Equal (3)
      const getPriority = (s: string) => {
        s = s?.toLowerCase()
        if (s === 'different' || s === 'updated' || s === 'modified') return 0
        if (s === 'missing_in_target' || s === 'new' || s === 'missing') return 1
        if (s === 'missing_in_source' || s === 'deprecated') return 2
        if (s === 'equal' || s === 'same') return 3
        return 4
      }

      const priA = getPriority(a.status)
      const priB = getPriority(b.status)

      if (priA !== priB) return priA - priB
      return a.name.localeCompare(b.name)
    })
  })

  const hasResults = computed(() => allResults.value.length > 0)
  const totalChanges = computed(() => allResults.value.filter(i => i.status !== 'equal' && i.status !== 'same').length)

  // Actions
  const resetResults = () => {
    tableResults.value = []
    procedureResults.value = []
    functionResults.value = []
    viewResults.value = []
    triggerResults.value = []
    error.value = null
  }

  const runComparison = async (refresh = false, filterType?: string, filterName?: string) => {
    if (!activePair.value) return

    loading.value = true
    loadingAction.value = refresh ? 'fetch' : 'compare'
    statusMessage.value = t('compare.initializing')
    consoleStore.clearLogs()
    error.value = null

    try {
      const { source, target } = activePair.value

      // Determine Scope
      let objTypes: ('tables' | 'procedures' | 'functions' | 'triggers' | 'views')[] = ['tables', 'procedures', 'functions', 'triggers', 'views']
      const compareName = filterName

      if (filterName && filterType) {
        // Single Object Scope
        objTypes = [filterType.toLowerCase() as any]
        consoleStore.addLog(`Comparing single object: ${filterName} (${filterType})`, 'info')
        statusMessage.value = t('compare.analyzingItem', { name: filterName })
      } else if (filterType && filterType !== 'all') {
        // Category Scope
        objTypes = [filterType.toLowerCase() as any]
        consoleStore.addLog(`Comparing category: ${filterType}`, 'info')
        statusMessage.value = t('compare.analyzingItem', { name: filterType })
      } else {
        // Full Scope
        consoleStore.addLog(`Starting comparison between ${source.name} (${source.host}) and ${target.name} (${target.host})`, 'info')
        statusMessage.value = t('compare.analyzing')
      }

      // Step 1: Export (Backend Fetch)
      if (refresh) {
        consoleStore.setVisibility(true)

        // Full Fetch -> Cache Clear
        if (!filterName && (!filterType || filterType === 'all')) {
          statusMessage.value = t('compare.cleaning')
          consoleStore.addLog('Cleaning up local cache for fresh fetch...', 'warn')
          await Promise.all([
            Andb.clearConnectionData(source),
            Andb.clearConnectionData(target)
          ])
        }

        statusMessage.value = t('compare.exporting')

        // Log commands
        for (const type of objTypes) {
          // These are purely visual logs for the user to trust what's happening
          consoleStore.addLog(`andb export --source ${source.environment} --type ${type}` + (compareName ? ` --name ${compareName}` : ''), 'cmd')
          consoleStore.addLog(`andb export --source ${target.environment} --type ${type}` + (compareName ? ` --name ${compareName}` : ''), 'cmd')
        }

        // Execute Exports Parallel
        await Promise.all([
          ...objTypes.map(type => Andb.export(source, target, {
            type,
            environment: source.environment,
            name: compareName
          })),
          ...objTypes.map(type => Andb.export(source, target, {
            type,
            environment: target.environment,
            name: compareName
          }))
        ])
      }

      // Step 2: Compare (Backend Analysis)
      statusMessage.value = t('compare.comparingObjects')

      const opId = operationsStore.addOperation({
        type: 'compare',
        status: 'running',
        startTime: new Date(),
        // sourceEnv & targetEnv are optional in Operation interface but good to have if we extended it, 
        // but looking at store definition they are top level props.
        // Let's match the interface defined in operations.ts:
        // type: 'compare' | 'migrate' | ...
        sourceEnv: source.environment,
        targetEnv: target.environment,
        connectionId: source.id, // Linking to source
        metadata: {
          sourceName: source.name,
          targetName: target.name,
          filterType: filterType || 'all',
          filterName: filterName
        }
      })

      try {
        const results = await Promise.all(
          objTypes.map(type => Andb.compare(source, target, {
            type,
            sourceEnv: source.environment,
            targetEnv: target.environment,
            name: compareName // If filtering by name
          }))
        )

        // Step 3: Hydrate Results
        objTypes.forEach((type, index) => {
          const data = results[index]
          if (type === 'tables') tableResults.value = data
          else if (type === 'procedures') procedureResults.value = data
          else if (type === 'functions') functionResults.value = data
          else if (type === 'views') viewResults.value = data
          else if (type === 'triggers') triggerResults.value = data
        })

        operationsStore.completeOperation(opId, true, {
          summary: `Comparison completed. Found ${totalChanges.value} changes.`
        })

        if (!hasResults.value) {
          statusMessage.value = 'No objects found.'
        } else {
          statusMessage.value = ''
        }
      } catch (err: any) {
        operationsStore.completeOperation(opId, false, { error: err.message })
        throw err
      }
    } catch (e: any) {
      console.error('Comparison Error:', e)
      error.value = e.message || 'Comparison failed'
      consoleStore.addLog(`Error: ${e.message}`, 'error')
    } finally {
      loading.value = false
      loadingAction.value = null
    }
  }

  return {
    // State
    loading,
    loadingAction,
    statusMessage,
    error,

    // Result Refs (exposed for granularity if needed)
    tableResults,
    procedureResults,
    functionResults,
    viewResults,
    triggerResults,

    // Computed
    allResults,
    hasResults,
    totalChanges,
    activePair,
    sourceName,
    targetName,
    isSourceDump,
    isTargetDump,

    // Actions
    runComparison,
    resetResults
  }
}
