<template>
  <div class="space-y-6">
    <!-- View: Connection List -->
    <div v-if="!showAddForm && !editingConnection" class="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      <!-- View Mode Selector & Tabs -->
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <nav class="flex -mb-px space-x-8">
           <button
            @click="viewMode = 'all'"
            class="py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all"
            :class="viewMode === 'all' 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
          >
            <List class="w-4 h-4" />
            ALL CONNECTIONS
          </button>
          <button
            @click="viewMode = 'tabs'"
            class="py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all"
            :class="viewMode === 'tabs' 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
          >
            <LayoutGrid class="w-4 h-4" />
            BY ENVIRONMENT
          </button>
        </nav>

        <!-- Environment Selection (Only in Tab mode) -->
        <div v-if="viewMode === 'tabs'" class="flex items-center gap-2 pb-2">
            <button
                v-for="env in enabledEnvironments"
                :key="env.name"
                @click="selectedEnvironment = env.name"
                class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                :class="selectedEnvironment === env.name 
                ? getEnvironmentBadgeClass(env.name) + ' ring-2 ring-primary-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
            >
                {{ env.name }}
                <span class="ml-1 opacity-50">{{ getConnectionCount(env.name) }}</span>
            </button>
        </div>
      </div>

      <!-- Connection List for Selected Environment -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {{ viewMode === 'all' ? 'All Connections' : $t('connections.connectionsFor', { environment: selectedEnvironment }) }}
          </h3>
          <div class="flex items-center gap-2">
            <!-- Bulk Actions -->
            <div v-if="selectedConnections.length > 0" class="flex items-center gap-2 mr-2">
              <span class="text-xs text-gray-500 font-bold">{{ selectedConnections.length }} selected</span>
              <button @click="bulkTestConnections"
                      class="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <ShieldQuestion class="w-3.5 h-3.5" />
                Test All
              </button>
              <button @click="bulkDeleteConnections"
                      class="btn btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                <Trash2 class="w-3.5 h-3.5" />
                Delete
              </button>
              <button @click="clearSelection"
                      class="text-xs text-gray-400 hover:text-gray-600 px-2">
                Clear
              </button>
            </div>
            
            <!-- Global Maintenance -->
            <button 
              @click="handleCleanup"
              class="btn btn-secondary flex items-center gap-2 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-900/20"
              title="Clean redundant / duplicate connections and pairs"
            >
              <Sparkles class="w-4 h-4" />
              <span class="hidden md:inline text-xs uppercase font-black tracking-widest">Clean Redundant Data</span>
            </button>

            <button @click="showAddForm = true"
                    class="btn btn-primary flex items-center">
              <Plus class="w-4 h-4 mr-2" />
              {{ $t('connections.addConnection') }}
            </button>
          </div>
        </div>

        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-4 py-2 text-left w-10">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {{ $t('connections.connectionName') }}
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {{ $t('connections.host') }}
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {{ $t('connections.database') }}
                  </th>
                  <th class="px-4 py-2 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {{ $t('common.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="connection in displayedConnections"
                    :key="connection.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-800"
                    :class="{ 'bg-primary-50 dark:bg-primary-900/10': selectedConnections.includes(connection.id) }">
                  <td class="px-4 py-2 whitespace-nowrap w-10">
                    <input
                      type="checkbox"
                      :value="connection.id"
                      v-model="selectedConnections"
                      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8">
                        <div class="h-8 w-8 rounded-full flex items-center justify-center transition-colors"
                          :class="{
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': !connection.type || connection.type === 'mysql',
                            'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400': connection.type === 'postgres',
                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400': connection.type === 'sqlite',
                            'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400': connection.type === 'dump'
                          }"
                        >
                           <!-- Simple Text Badge for Type -->
                          <span v-if="connection.type === 'postgres'" class="text-[10px] font-black">PG</span>
                          <span v-else-if="connection.type === 'sqlite'" class="text-[10px] font-black">SL</span>
                          <span v-else-if="connection.type === 'dump'" class="text-[10px] font-black">DU</span>
                          <span v-else class="text-[10px] font-black">MY</span>
                        </div>
                      </div>
                      <div class="ml-3">
                        <div class="flex items-center gap-2">
                            <div class="text-sm font-bold text-gray-900 dark:text-white">
                                {{ connection.name }}
                            </div>
                            <span v-if="viewMode === 'all'" class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter" :class="getEnvironmentBadgeClass(connection.environment)">
                                {{ connection.environment }}
                            </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white truncate max-w-[150px]" :title="`${connection.host}:${connection.port}`">
                      {{ connection.host }}:{{ connection.port }}
                    </div>
                    <div class="text-[11px] text-gray-500 dark:text-gray-400">
                      {{ connection.username }}
                    </div>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div v-if="connection.database" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit font-bold">
                        <Database class="w-3.5 h-3.5 text-gray-400" />
                        {{ connection.database }}
                    </div>
                    <div v-else class="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md w-fit italic">
                        <Database class="w-3.5 h-3.5 opacity-50" />
                        {{ connection.name }}
                    </div>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end gap-2">
                       <!-- Test Button: Hidden for DUMP types -->
                      <div class="relative group" v-if="connection.type !== 'dump'">
                         <button @click="testConnection(connection.id)"
                                class="relative p-1 rounded-lg transition-all"
                                :class="{
                                    'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20': connection.status === 'idle',
                                    'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20': connection.status === 'connected',
                                    'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20': connection.status === 'failed',
                                    'animate-pulse': connection.status === 'testing'
                                }"
                          >
                          <RefreshCw v-if="connection.status === 'testing'" class="w-4 h-4 animate-spin" />
                          <CheckCircle2 v-else-if="connection.status === 'connected'" class="w-4 h-4" />
                          <AlertCircle v-else-if="connection.status === 'failed'" class="w-4 h-4" />
                          <ShieldQuestion v-else class="w-4 h-4" />
                        </button>
                         <!-- Tooltip -->
                         <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                             {{ $t('connections.testConnection') }}
                             <span v-if="connection.lastTested" class="opacity-70">({{ formatLastTested(connection.lastTested) }})</span>
                         </div>
                      </div>

                       <!-- Tooltip for Dump types explaining why test is disabled -->
                       <div v-else class="relative group cursor-help p-1 text-gray-300 dark:text-gray-600">
                          <Database class="w-4 h-4" />
                          <div class="absolute bottom-full mb-2 right-0 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 max-w-xs">
                             Static Dump File (No active connection to test)
                          </div>
                      </div>

                      <button @click="editConnection(connection)"
                              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                              :title="$t('common.edit')">
                        <Edit class="w-4 h-4" />
                      </button>
                      <button @click="duplicateConnection(connection)"
                              class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              :title="$t('common.duplicate')">
                        <Copy class="w-4 h-4" />
                      </button>
                      <button @click="deleteConnection(connection.id)"
                              class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              :title="$t('common.delete')">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-if="displayedConnections.length === 0" class="text-center py-12">
            <Database class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ viewMode === 'all' ? 'No connections found' : $t('connections.noConnectionsForEnvironment', { environment: selectedEnvironment }) }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ $t('connections.addFirstConnection') }}
            </p>

          </div>
        </div>
      </div>
    </div>

    <!-- View: Connection Form (Inline) -->
    <div v-else class="animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <!-- Form Header -->
      <div class="px-8 pt-8 pb-4 flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-inner">
            <Database class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {{ editingConnection ? 'Edit Connection' : 'Add New Connection' }}
            </h3>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Database Endpoint Configuration</p>
          </div>
        </div>
        <button @click="closeForm" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors flex items-center gap-2">
            <span class="text-xs font-bold uppercase">{{ $t('common.cancel') }}</span>
            <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Form Body -->
      <div class="px-8 py-6">
        <ConnectionForm
          :connection="editingConnection || ({ environment: selectedEnvironment } as any)"
          @save="handleSaveConnection"
          @cancel="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Database, ShieldQuestion, Edit, Trash2, X, Copy, LayoutGrid, List, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import ConnectionForm from './ConnectionForm.vue'
import type { DatabaseConnection } from '@/stores/app'

import { useConnectionTemplatesStore } from '@/stores/connectionTemplates'

const route = useRoute()
const router = useRouter()
const { t: $t } = useI18n()
const appStore = useAppStore()
const projectsStore = useProjectsStore()
const templatesStore = useConnectionTemplatesStore()
const connectionPairsStore = useConnectionPairsStore()

onMounted(async () => {
  // 1. Fetch latest templates to ensure we have fresh data for sync
  await templatesStore.reloadData()

  // 2. Sync connections that have templateId
  appStore.connections.forEach((conn, index) => {
    if (conn.templateId) {
      const template = templatesStore.templates.find(t => t.id === conn.templateId)
      if (template) {
        // Sync fields from template
        appStore.connections[index] = {
          ...conn,
          name: template.name, // Keep name in sync too? User might prefer local name, but usually template name is the "standard"
          host: template.host,
          port: template.port,
          type: template.type,
          username: template.username,
          password: template.password || conn.password // Fallback to local if template has no pass
        }
      }
    }
  })

  // Deep link handling
  if (route.query.action === 'new') {
    showAddForm.value = true
    router.replace({ query: { ...route.query, action: undefined } })
  }

  // 3. Auto-test all displayed connections on mount (after sync), EXCEPT DUMP types
  displayedConnections.value.forEach(conn => {
    if (conn.type !== 'dump') {
      appStore.testConnection(conn.id)
    }
  })
})

// State
const viewMode = ref<'tabs' | 'all'>('all')
const selectedEnvironment = ref('DEV')
const showAddForm = ref(false)
const editingConnection = ref<DatabaseConnection | null>(null)

// Selection state for bulk operations
const selectedConnections = ref<string[]>([])

const isAllSelected = computed(() => {
  return displayedConnections.value.length > 0 && 
         displayedConnections.value.every(conn => selectedConnections.value.includes(conn.id))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedConnections.value = []
  } else {
    selectedConnections.value = displayedConnections.value.map(conn => conn.id)
  }
}

const clearSelection = () => {
  selectedConnections.value = []
}

const bulkTestConnections = async () => {
  for (const id of selectedConnections.value) {
    const conn = appStore.connections.find(c => c.id === id)
    if (conn && conn.type !== 'dump') {
      await appStore.testConnection(id)
    }
  }
}

const bulkDeleteConnections = () => {
  const count = selectedConnections.value.length
  if (confirm($t('connections.confirmBulkDelete', { count }))) {
    selectedConnections.value.forEach(id => appStore.removeConnection(id))
    clearSelection()
  }
}

// Computed
const enabledEnvironments = computed(() => connectionPairsStore.enabledEnvironments)

const displayedConnections = computed(() => {
  if (viewMode.value === 'all') {
    return appStore.filteredConnections
  }
  return appStore.filteredConnections.filter(conn => conn.environment === selectedEnvironment.value)
})

// Methods
const getEnvironmentBadgeClass = (environment: string) => {
  const classes = {
    DEV: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    STAGE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    UAT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    PROD: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[environment as keyof typeof classes] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

const getConnectionCount = (environmentName: string) => {
  return appStore.filteredConnections.filter(conn => conn.environment === environmentName).length
}

const formatLastTested = (lastTested?: string | Date) => {
  if (!lastTested) return $t('connections.neverTested')
  return new Date(lastTested).toLocaleString()
}

const testConnection = (id: string) => appStore.testConnection(id)

const editConnection = (connection: DatabaseConnection) => {
  editingConnection.value = connection
  selectedEnvironment.value = connection.environment
}

const duplicateConnection = (connection: DatabaseConnection) => {
  const { id, ...rest } = connection
  appStore.addConnection(rest as Omit<DatabaseConnection, 'id'>)
}

const deleteConnection = (id: string) => {
  if (confirm($t('connections.confirmDelete'))) appStore.removeConnection(id)
}

  const handleSaveConnection = (connectionData: Omit<DatabaseConnection, 'id'>) => {
    if (editingConnection.value) {
      appStore.updateConnection(editingConnection.value.id, connectionData)
    } else {
      // Respect the environment selected in the form
      appStore.addConnection({ 
        ...connectionData
      })
    }
    closeForm()
  }

const handleCleanup = async () => {
  if (confirm("This will merge duplicate connections and pairs across all your projects. This action is safe but will permanently consolidate redundant items. Proceed?")) {
    await projectsStore.cleanGarbageConnections()
    // Refresh to ensure all stores reflect changes
    await Promise.all([
      appStore.reloadData(),
      connectionPairsStore.reloadData(),
      projectsStore.reloadData()
    ])
    alert("Cleanup completed successfully. Redundant items have been merged.")
  }
}

const closeForm = () => {
  showAddForm.value = false
  editingConnection.value = null
}

// Initialize with first enabled environment
if (enabledEnvironments.value.length > 0) {
  selectedEnvironment.value = enabledEnvironments.value[0].name
}
</script>
