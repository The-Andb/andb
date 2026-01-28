<template>
  <div class="flex w-full h-full overflow-hidden bg-white dark:bg-gray-950">
    <!-- Column Navigator Viewport (Wrapped in the New Abstract Component) -->
    <div 
      class="flex-none flex overflow-hidden h-full scroll-smooth transition-all duration-300 ease-out"
      :class="previewObject ? 'max-w-[80%] border-r border-gray-100 dark:border-white/5' : 'flex-1'"
    >
        <MillerColumnsView 
            ref="millerViewRef"
            class="h-full w-full"
            :initial-nodes="rootNodes"
            :fetcher="millerFetcher"
            :auto-collapse="appStore.autoCollapseColumns"
            root-title="Active Bases"
            @select="handleAbstractSelect"
        >
            <template #header-actions="{ column }">
                <div v-if="column.id === 'root'" class="flex items-center">
                    <button 
                      @click.stop="addNewProject"
                      class="flex items-center gap-1.5 px-2 py-1 bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-all active:scale-95"
                      title="Add New Base"
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                    <!-- Quick Dump Compare -->
                    <button 
                      @click.stop="isQuickDumpModalOpen = true"
                      class="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all active:scale-95 ml-1"
                      title="Quick Dump Compare"
                    >
                      <Zap class="w-3 h-3 fill-indigo-500/20" />
                    </button>
                    <!-- Try Live Demo Button -->
                    <button 
                      @click.stop="handleSetupDemo"
                      class="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all active:scale-95 ml-1"
                      title="Try Live Demo"
                      :disabled="isDemoSettingUp"
                    >
                      <Play v-if="!isDemoSettingUp" class="w-3 h-3" />
                      <RefreshIcon v-else class="w-3 h-3 animate-spin" />
                    </button>
                </div>
            </template>

            <template #node-actions="{ node }">
                <div v-if="node.type === 'projects'" class="flex items-center gap-2">
                    <button 
                      @click.stop="cloneProject(node)"
                      class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-primary-500 transition-colors"
                      title="Clone Base"
                    >
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click.stop="deleteProject(node)"
                      class="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Base"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                </div>
                <!-- Refresh Button for Database/Types -->
                <div v-else-if="node.type === 'databases' || node.type === 'types'" class="flex items-center gap-1.5">
                    <span v-if="isDumpNode(node)" class="px-1 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 text-[7px] font-black border border-orange-200 dark:border-orange-800/20">STATIC</span>
                    <button 
                      @click.stop="refreshConnection(node)"
                      class="p-1 rounded transition-colors"
                      :class="[
                        isDumpNode(node)
                          ? 'text-orange-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/40' 
                          : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/40'
                      ]"
                      :title="isDumpNode(node) ? 'Reload File' : 'Refresh from Database'"
                    >
                      <RefreshIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshingNodeId === node.id }" />
                    </button>
                </div>
            </template>
        </MillerColumnsView>
    </div>
    
    <div v-if="previewCode || previewObject" class="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-white/5 shadow-2xl z-10 transition-all duration-500 animate-in slide-in-from-right-4">
      <template v-if="previewLoading">
        <div class="flex-1 flex flex-col items-center justify-center text-gray-400">
           <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-xs font-bold uppercase tracking-widest">Loading content...</p>
        </div>
      </template>
      <template v-else-if="previewObject && (previewCode || previewObject.ddl || previewObject.content || previewObject.type === 'databases')">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-gray-900/50 backdrop-blur shrink-0 transition-colors">
             <div class="flex items-center gap-2 overflow-hidden">
                <div class="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500">
                    <component :is="previewObject.icon || Table" class="w-4 h-4" />
                </div>
                <div class="flex flex-col min-w-0">
                    <span class="text-[10px] uppercase font-black tracking-widest text-gray-400 leading-none mb-0.5">{{ previewObject.ddlType || (previewObject.type === 'databases' ? 'Database' : 'Object') }}</span>
                    <span class="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">{{ previewObject.name }}</span>
                </div>
             </div>
             <div class="flex items-center gap-2">
                  <button 
                     v-if="previewObject.type === 'pair_object' && previewObject.rawData?.status !== 'equal' && !previewObject.rawData?.targetIsDump && previewObject.rawData?.parentConn?.type !== 'dump'"
                     @click="openMigrateModal(previewObject.rawData)"
                     class="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95 mr-2"
                  >
                     <Zap class="w-3.5 h-3.5 fill-current" />
                     <span>Migrate</span>
                  </button>
                  <button 
                    @click="refreshObject" 
                    :disabled="previewLoading" 
                    class="p-2 rounded-lg transition-colors" 
                    :class="isDumpNode(previewObject) ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800'"
                    :title="isDumpNode(previewObject) ? 'Re-parse Dump File' : 'Fetch latest from DB'"
                  >
                     <RefreshIcon class="w-4 h-4" :class="{ 'animate-spin': previewLoading }" />
                  </button>
                  <button @click="closePreview" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                     <X class="w-4 h-4" />
                  </button>
             </div>
        </div>
        
        <div class="flex-1 overflow-hidden relative">
            <!-- Diff View (Compare Mode) -->
            <MirrorDiffView 
               v-if="previewObject.type === 'pair_object'"
               :source-ddl="previewObject.rawData?.diff?.source"
               :target-ddl="previewObject.rawData?.diff?.target"
               :source-label="previewObject.rawData?.sourceLabel || 'Source'"
               :target-label="previewObject.rawData?.targetLabel || 'Target'"
               :status="previewObject.rawData?.status || 'unknown'"
               class="h-full"
            />
            
            <!-- Rich Database Overview (Cards + Stats) -->
            <div v-else-if="previewObject?.type === 'databases' && !previewObject.showDiagram" class="h-full flex flex-col p-8 overflow-y-auto bg-gray-50/30 dark:bg-transparent">
                <div class="flex items-center justify-between mb-8">
                    <div>
                      <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ previewObject.name }}</h2>
                      <p class="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">{{ previewObject.environment || 'Active environment' }} • Database Overview</p>
                    </div>
                    <button 
                      @click="refreshConnection(previewObject)"
                      class="flex items-center gap-2 px-6 py-3 rounded-2xl transition-all"
                      :class="[
                        isDumpNode(previewObject)
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-95'
                          : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 active:scale-95'
                      ]"
                    >
                      <RefreshIcon class="w-4 h-4" :class="{ 'animate-spin': refreshingNodeId === previewObject.id }" />
                      <span class="text-xs font-black uppercase tracking-widest">{{ isDumpNode(previewObject) ? 'Re-parse File' : 'Fetch from DB' }}</span>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div 
                      v-for="cat in databaseMetrics" :key="cat.type"
                      class="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-primary-500/30 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all cursor-pointer"
                    >
                      <div class="flex items-center justify-between mb-4">
                          <div class="p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-500 rounded-2xl group-hover:scale-110 transition-transform">
                            <component :is="cat.icon" class="w-6 h-6" />
                          </div>
                          <div class="text-right">
                            <div class="text-2xl font-black text-gray-900 dark:text-white">{{ cat.count }}</div>
                            <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Items</div>
                          </div>
                      </div>
                      <h3 class="font-black text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center justify-between">
                        {{ cat.type }}
                        <ChevronRight class="w-3 h-3 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                      </h3>
                    </div>
                </div>

                <!-- Schema Visualization Tooltip -->
                 <div class="mt-8">
                  <button 
                      @click="previewObject.showDiagram = true" 
                      class="w-full p-8 border-2 border-dashed border-gray-100 dark:border-gray-800 hover:border-primary-500/30 rounded-3xl text-center group transition-all"
                  >
                      <Network class="w-10 h-10 mx-auto mb-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                      <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Interactive ERD</h4>
                      <p class="text-xs text-gray-400 mt-1">Visualize tables and relationships</p>
                  </button>
                </div>
            </div>

            <!-- ERD View (Database Selection) -->
            <SchemaDiagram 
               v-else-if="previewObject?.type === 'databases' && previewObject.showDiagram"
               :tables="previewDatabaseTables"
               class="h-full"
            />

            <!-- Standard DDL Viewer (Object Selection) -->
            <DDLCodeViewer 
               v-else-if="previewCode || (previewObject.ddl && previewObject.type !== 'migration_terminal')"
               :code="previewCode || previewObject.ddl" 
               :language="previewObject.language || 'sql'"
               :object-name="previewObject.name"
               :ddl-type="previewObject.ddlType || (previewObject.rawData?.objectType || 'Object')"
               :is-dump="isDumpNode(previewObject)"
               class="h-full"
            />

            <!-- Inline Migration Terminal View -->
            <MigrationConfirm
               v-else-if="previewObject.type === 'migration_terminal'"
               :is-open="true"
               :inline="true"
               :loading="isMigrating"
               :item="migratingItem"
               :source-name="previewObject?.rawData?.sourceLabel || 'Source'"
               :target-name="previewObject?.rawData?.targetLabel || 'Target'"
               :sql-script="migrationSql"
               :fetching-sql="fetchingMigrationSql"
               @close="closeMigrationView"
               @confirm="confirmMigration"
            />
            
            <!-- Raw content fallback -->
            <div v-else-if="previewObject.content" class="h-full overflow-auto p-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                <pre>{{ previewObject.content }}</pre>
            </div>
        </div>
      </template>

      <!-- Fallback / ERD Preview -->
      <template v-else-if="previewObject">
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900/50">
              <div class="mb-4 text-gray-400">
                  <Database class="w-12 h-12 opacity-20" />
              </div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ previewObject.name }}</h3>
              <p class="text-sm text-gray-500 max-w-sm">Previewing detailed attributes for this database entity.</p>
          </div>
      </template>
    </div>
    
    <!-- Empty State -->
    <div v-else class="flex-1 h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-950/50 border-l border-gray-200 dark:border-gray-800 relative overflow-hidden min-w-0">
      <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" 
           style="background-image: radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0); background-size: 32px 32px;">
      </div>
      <div class="relative flex flex-col items-center justify-center text-center p-12 w-full animate-in fade-in zoom-in-95 duration-700">
        <LayoutGrid class="w-16 h-16 relative opacity-20 dark:opacity-10 mb-8" />
        <p class="text-[10px] font-bold uppercase tracking-widest opacity-30">Select an object to inspect</p>
      </div>
    </div>

    <!-- Quick Dump Modal -->
    <QuickDumpPairModal :is-open="isQuickDumpModalOpen" @close="isQuickDumpModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue'
const { ref, onMounted, watch, computed, nextTick } = Vue
import DDLCodeViewer from '@/components/ddl/DDLCodeViewer.vue'
import MirrorDiffView from '@/components/compare/MirrorDiffView.vue'
import SchemaDiagram from '@/components/ddl/SchemaDiagram.vue'
import MigrationConfirm from '@/components/compare/MigrationConfirm.vue'
import QuickDumpPairModal from './QuickDumpPairModal.vue'
import Andb from '@/utils/andb'
import { 
  Database,
  Table,
  LayoutGrid,
  RefreshCw as RefreshIcon,
  X,
  Folder,
  Plus,
  Trash2,
  Copy,
  Zap,
  Eye,
  Variable,
  Play,
  Network,
  ChevronRight
} from 'lucide-vue-next'

// Package Import
import MillerColumnsView from '@/packages/miller-column/MillerColumnsView.vue'
import { useProjectNavigationStore } from '@/stores/projectNavigation'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'
import { useMillerStore } from '@/packages/miller-column/store'
import { type MillerNode } from '@/packages/miller-column/types'

const navStore = useProjectNavigationStore()
const projectsStore = useProjectsStore()
const appStore = useAppStore()
const millerStore = useMillerStore()

const previewObject = ref<any>(null)
const previewCode = ref('')
const previewLoading = ref(false)
const previewDatabaseTables = ref<any[]>([])

const migratingItem = ref<any>(null)
const isMigrating = ref<boolean>(false)
const migrationSql = ref('')
const fetchingMigrationSql = ref(false)
const refreshingNodeId = ref<string | null>(null)
const databaseMetrics = ref<{ type: string, count: number, icon: any }[]>([])
const isQuickDumpModalOpen = ref(false)

const isDumpNode = (node: any) => {
  if (!node) return false
  const raw = node.rawData || {}
  
  // 1. Direct connection type
  if (raw.type === 'dump' || raw.driver === 'dump') return true
  
  // 2. Parent connection type (for types/objects)
  if (raw.parentConn?.type === 'dump' || raw.parentConn?.driver === 'dump') return true
  
  // 3. File extension check
  if (raw.host?.toLowerCase()?.endsWith('.sql') || raw.host?.includes('.sql')) return true
  if (raw.parentConn?.host?.toLowerCase()?.endsWith('.sql') || raw.parentConn?.host?.includes('.sql')) return true
  
  // 4. Comparison view (pair_object) specific flags
  if (raw.sourceIsDump || raw.targetIsDump) return true
  
  return false
}

const rootNodes = computed(() => projectsStore.projects
  .filter(p => p.id !== 'miller-sample-blueprint')
  .map(p => ({
    id: p.id,
    name: p.name || 'Untitled Base',
    type: 'projects',
    icon: Folder,
    rawData: p,
    isTerminal: false
})))

// Watch project list changes to refresh Miller root
watch(() => projectsStore.projects, async () => {
    await navStore.loadRoot(projectsStore.selectedProjectId || undefined)
}, { deep: true })

const emit = defineEmits(['update-breadcrumbs', 'open', 'create-project'])

// Manage Breadcrumbs sync with Projects.vue
watch(() => navStore.columns, (cols) => {
    const crumbs = cols.map(c => ({
        name: c.title,
        level: c.level,
        id: c.id
    }))
    emit('update-breadcrumbs', crumbs)
}, { deep: true, immediate: true })

const jumpToBreadcrumb = (crumb: any) => {
    millerStore.jumpToLevel(crumb.level)
}

defineExpose({
    jumpToBreadcrumb
})

const handleAbstractSelect = async (node: MillerNode, level: number, skipFetch?: boolean) => {
  // 1. CLEAR PREVIOUS STATE
  previewCode.value = ''
  previewDatabaseTables.value = []
  databaseMetrics.value = []

  // Ensure selection syncs with logic store if needed
  await millerStore.selectNode(node, level, millerFetcher, { skipFetch })

  // 2. TRIGGER TERMINAL OR HYBRID PREVIEWS
  if (node.isTerminal || node.type === 'object' || node.type === 'pair_object') {
     previewLoading.value = true
     previewObject.value = node

     if (node.type === 'pair_object') {
        // Data is already in rawData from Andb.getSavedComparisonResults
        previewLoading.value = false
     } else {
        // Normal object: fetch real DDL
        try {
          const raw = node.rawData as any
          if (raw && raw.objectName && raw.objectType) {
            const schemas = await Andb.getSchemas()
            
            // Shared lookup logic (same as nav)
            const envData = Array.isArray(schemas) 
              ? schemas.find((e: any) => e.name === raw.environment || e.id === raw.environment)
              : schemas[raw.environment]
            
            const dbData = envData?.databases 
              ? envData.databases.find((d: any) => d.name === raw.database)
              : (envData ? envData[raw.database] : null)

            const typeDict = dbData ? dbData[raw.objectType + '_ddl'] : null
            
            if (typeDict && typeDict[raw.objectName]) {
              previewCode.value = typeDict[raw.objectName]
            } else {
              previewCode.value = `/* DDL not found in exported schemas for ${node.name} */`
            }
          } else {
            previewCode.value = `/* No metadata available for ${node.name} */`
          }
        } catch (e) {
          console.error('Failed to fetch DDL:', e)
          previewCode.value = `/* Error loading DDL for ${node.name} */`
        } finally {
          previewLoading.value = false
        }
     }
  } else if (node.type === 'databases') {
      // HYBRID: Open column AND show Dashboard
      previewLoading.value = true
      previewObject.value = node
      try {
        const conn = node.rawData as any
        const schemas = await Andb.getSchemas()
        
        // Correct lookup for Array-based schemas
        const envData = Array.isArray(schemas) 
          ? schemas.find((e: any) => e.name === conn.environment || e.id === conn.environment)
          : schemas[conn.environment]
        
        const dbData = envData?.databases 
          ? envData.databases.find((d: any) => d.name === conn.database)
          : (envData ? envData[conn.database] : null)
        
        if (dbData) {
          // Calculate Metrics
          const categories = [
             { key: 'tables', icon: Table },
             { key: 'views', icon: Eye },
             { key: 'procedures', icon: Play },
             { key: 'functions', icon: Variable },
             { key: 'triggers', icon: Zap }
          ]
          databaseMetrics.value = categories.map(cat => ({
            type: cat.key.toUpperCase(),
            count: (dbData[cat.key] || []).length,
            icon: cat.icon
          })).filter(c => c.count > 0)

          if (dbData.tables) {
            const typeDict = dbData['tables' + '_ddl'] || {}
            previewDatabaseTables.value = dbData.tables.map((tableName: string) => ({ 
              name: tableName, 
              ddl: typeDict[tableName] || `/* DDL not found for ${tableName} */` 
            }))
          }
        } else {
            // Auto fetch if no data in cache
            refreshConnection(node)
        }
      } catch (e) {
        console.error('Failed to load database overview:', e)
      } finally {
        previewLoading.value = false
      }
   }

  // Handle project switching in store logic
  if (node.type === 'projects') {
    projectsStore.selectProject(node.id)
  }
}

const openMigrateModal = async (item: any) => {
  migratingItem.value = item
  
  // Switch preview to migration mode
  const prevType = previewObject.value?.type
  previewObject.value = {
    ...previewObject.value,
    type: 'migration_terminal',
    prevType: prevType
  }

  fetchingMigrationSql.value = true
  migrationSql.value = ''
  
  try {
    const pair = item.pair
    const source = appStore.connections.find(c => c.id === pair.sourceConnectionId || c.environment === pair.sourceEnv)
    const target = appStore.connections.find(c => c.id === pair.targetConnectionId || c.environment === pair.targetEnv)
    
    if (source && target) {
      const result = await Andb.generate(source, target, {
        type: item.type,
        name: item.name,
        sourceEnv: pair.sourceEnv,
        targetEnv: pair.targetEnv,
        dryRun: true
      })
      migrationSql.value = result.sql || `-- Result: ${result.message}`
    }
  } catch (e) {
    console.error('Failed to generate migration SQL:', e)
    migrationSql.value = '-- Error generating SQL preview'
  } finally {
    fetchingMigrationSql.value = false
  }
}

const closeMigrationView = () => {
    if (previewObject.value?.prevType) {
        previewObject.value.type = previewObject.value.prevType
    } else {
        closePreview()
    }
}

const confirmMigration = async () => {
    if (!migratingItem.value) return
    isMigrating.value = true
    try {
        const item = migratingItem.value
        const pair = item.pair
        const source = appStore.connections.find(c => c.id === pair.sourceConnectionId || c.environment === pair.sourceEnv)
        const target = appStore.connections.find(c => c.id === pair.targetConnectionId || c.environment === pair.targetEnv)

        if (source && target) {
            await Andb.migrate(source, target, {
                type: item.type,
                name: item.name,
                sourceEnv: pair.sourceEnv,
                targetEnv: pair.targetEnv
            })
            closeMigrationView()
        }
    } catch (e) {
        console.error('Migration failed:', e)
    } finally {
        isMigrating.value = false
    }
}

const closePreview = () => {
    previewObject.value = null
    previewCode.value = ''
}

const refreshObject = () => {
    previewLoading.value = true
    const node = previewObject.value
    if (node) {
        handleAbstractSelect(node, node.level || 0)
    } else {
        setTimeout(() => { previewLoading.value = false }, 800)
    }
}

// REFRESH LOGIC
const refreshConnection = async (node: any) => {
    const conn = node.rawData?.parentConn || node.rawData
    if (!conn) return
    
    refreshingNodeId.value = node.id
    try {
        // Hit core - export everything
        const types = ['tables', 'views', 'procedures', 'functions', 'triggers']
        await Promise.all(types.map(type => 
           Andb.export(conn, null as any, { 
              type: type as any, 
              environment: conn.environment 
           })
        ))
        
        // Reload Miller state
        await handleAbstractSelect(node, node.level || 0)
    } catch (e) {
        console.error('Core refresh failed:', e)
    } finally {
        refreshingNodeId.value = null
    }
}

const addNewProject = async () => {
    console.log('Adding new project...')
    const newP = projectsStore.addProject({
        name: 'New Base ' + (projectsStore.projects.length),
        description: 'Created via Miller View',
        connectionIds: [],
        pairIds: [],
        enabledEnvironmentIds: ['DEV']
    })
    // Ensure reactivity settled
    await nextTick()
    projectsStore.selectProject(newP.id)
    await navStore.loadRoot(newP.id)
}

const deleteProject = async (node: MillerNode) => {
    console.log('Deleting project:', node.id)
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
        projectsStore.removeProject(node.id)
        await navStore.loadRoot()
    }
}

const cloneProject = async (node: MillerNode) => {
    console.log('Cloning project:', node.id)
    const original = projectsStore.projects.find(p => p.id === node.id)
    if (original) {
        const cloned = projectsStore.addProject({
            ...original,
            name: `${original.name} (Copy)`
        })
        await navStore.loadRoot(cloned.id)
    }
}

const isDemoSettingUp = ref(false)
const handleSetupDemo = async () => {
    if (isDemoSettingUp.value) return
    isDemoSettingUp.value = true
    try {
        await projectsStore.setupDemo()
        await navStore.loadRoot(projectsStore.selectedProjectId!)
    } catch (error) {
        console.error('Failed to setup demo:', error)
    } finally {
        isDemoSettingUp.value = false
    }
}

// Data fetcher for the abstract component
const millerFetcher = navStore.millerFetcher

onMounted(async () => {
    // 1. Ensure projects are loaded
    if (projectsStore.projects.length === 0) {
        await projectsStore.reloadData()
    }

    // 2. Initialize Miller Root with real data
    await navStore.loadRoot(projectsStore.selectedProjectId || undefined)
})
</script>
