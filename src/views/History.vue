<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full gap-4">
        <!-- Title & Page Status -->
        <div class="flex items-center gap-4">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
              <History class="w-5 h-5 mr-2 text-primary-500" />
              {{ $t('history.title') }}
            </h1>
            <div class="flex items-center gap-2">
               <!-- Pill Type Selectors -->
               <div class="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                  <button 
                    v-for="type in historyTypes" 
                    :key="type"
                    @click="filters.type = type"
                    class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all"
                    :class="filters.type === type 
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  >
                    {{ type ? $t(`navigation.ddl.${type.toLowerCase()}`) : $t('common.all') }}
                  </button>
               </div>
            </div>
          </div>
        </div>

        <!-- Action Group -->
        <div 
          class="flex items-center gap-3 p-1.5 rounded-2xl transition-all duration-300 shadow-sm"
          :class="appStore.buttonStyle === 'full' 
            ? 'bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm ring-1 ring-black/5' 
            : 'bg-transparent border-transparent px-0'"
        >
          <button 
            @click="loadSnapshots" 
            class="flex items-center gap-2 font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:grayscale"
            :class="appStore.buttonStyle === 'full'
              ? 'px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl text-[11px] tracking-widest shadow-lg shadow-primary-500/20 active:scale-95'
              : 'px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[10px] tracking-wider active:scale-95 shadow-sm'"
            :disabled="loading"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            <span>{{ appStore.buttonStyle === 'full' ? $t('history.refreshHistory') : $t('common.refresh') }}</span>
          </button>
        </div>
      </div>
    </template>

    <div class="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      <!-- Snapshots List -->
      <div class="w-1/3 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex flex-col shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white">{{ $t('history.snapshotsList') }}</h2>
            <span class="text-[10px] text-gray-400 uppercase tracking-tighter">{{ filteredSnapshots.length }} {{ $t('history.records') }}</span>
          </div>
          <div class="relative">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              v-model="filters.query"
              type="text"
              :placeholder="$t('history.searchPlaceholder')"
              class="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div v-if="loading" class="p-8 text-center text-gray-400">
            <RefreshCw class="w-8 h-8 mx-auto mb-2 animate-spin opacity-20" />
            <p class="text-xs uppercase tracking-widest">{{ $t('history.loading') }}</p>
          </div>
          
          <div v-else-if="filteredSnapshots.length === 0" class="p-8 text-center text-gray-400">
            <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-10" />
            <p class="text-xs uppercase tracking-widest">{{ $t('history.noHistory') }}</p>
          </div>

          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <div 
              v-for="snapshot in filteredSnapshots" 
              :key="snapshot.id"
              @click="selectedSnapshot = snapshot"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors relative group border-l-4 border-transparent"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20 border-primary-500': selectedSnapshot?.id === snapshot.id }"
            >
              <div class="flex items-start justify-between mb-1">
                <div class="flex items-center min-w-0">
                  <span class="p-1.5 rounded bg-gray-100 dark:bg-gray-800 mr-3 text-gray-500 dark:text-gray-400">
                    <component :is="getIconForType(snapshot.ddl_type)" class="w-3.5 h-3.5" />
                  </span>
                  <div class="flex flex-col min-w-0">
                    <span class="font-bold text-gray-900 dark:text-white truncate" :style="{ fontSize: appStore.fontSizes.ddlName + 'px' }">{{ snapshot.ddl_name }}</span>
                    <div class="flex items-center space-x-2 text-[10px] uppercase tracking-tighter text-gray-400 font-bold mt-0.5">
                      <span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{{ snapshot.environment }}</span>
                      <span class="truncate">{{ snapshot.database_name }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center text-[10px] text-gray-400">
                  <Clock class="w-3 h-3 mr-1" />
                  {{ formatDate(snapshot.created_at) }}
                </div>
                <div v-if="snapshot.version_tag" class="text-[9px] px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full font-bold uppercase tracking-widest scale-90 origin-right">
                  {{ snapshot.version_tag.replace('pre-migration-', '') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail View -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden">
        <div v-if="!selectedSnapshot" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8">
           <div class="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8 opacity-50">
             <History class="w-24 h-24" />
           </div>
           <h3 class="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-2">{{ $t('history.selectVersion') }}</h3>
           <p class="text-[10px] text-center max-w-xs uppercase tracking-tighter leading-relaxed">
             {{ $t('history.selectVersionDesc') }}
           </p>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
            <div class="flex items-center min-w-0">
              <span class="p-2 rounded-lg bg-primary-500/10 text-primary-500 mr-4">
                <component :is="getIconForType(selectedSnapshot.ddl_type)" class="w-5 h-5" />
              </span>
              <div class="flex flex-col min-w-0">
                    <div class="flex items-center space-x-2 mb-1.5 min-w-0">
                      <h2 class="font-bold text-gray-900 dark:text-gray-100 truncate" :style="{ fontSize: appStore.fontSizes.ddlHeader + 'px' }">{{ selectedSnapshot.ddl_name }}</h2>
                      <span class="text-[9px] font-extrabold uppercase bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 whitespace-nowrap">{{ selectedSnapshot.ddl_type }}</span>
                    </div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center">
                   <Server class="w-3 h-3 mr-1" /> {{ selectedSnapshot.environment }} 
                   <span class="mx-2 opacity-30">|</span> 
                   <Database class="w-3 h-3 mr-1" /> {{ selectedSnapshot.database_name }}
                   <span class="mx-2 opacity-30">|</span> 
                   <Clock class="w-3 h-3 mr-1" /> {{ formatDate(selectedSnapshot.created_at) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click="copyDDL"
                class="inline-flex items-center gap-2 font-bold uppercase transition-all active:scale-95 disabled:opacity-50"
                :class="appStore.buttonStyle === 'full'
                  ? 'px-5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 text-gray-700 dark:text-gray-300 rounded-xl text-[11px] tracking-widest shadow-sm'
                  : 'px-3 py-1.5 text-primary-500 bg-primary-50 dark:bg-primary-900/10 rounded-lg text-[10px] tracking-wider'"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>{{ $t('history.copyScript') }}</span>
              </button>
              
              <button
                @click="restoreVersion"
                :disabled="loading || selectedSnapshot.ddl_type.toUpperCase() === 'TABLES'"
                class="inline-flex items-center gap-2 font-bold uppercase transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                :class="appStore.buttonStyle === 'full'
                  ? 'px-5 py-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-xl text-[11px] tracking-widest shadow-lg shadow-red-500/20'
                  : 'px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] tracking-wider shadow-sm shadow-red-500/10'"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>{{ $t('history.restoreVersion') }}</span>
              </button>
              
              <div v-if="selectedSnapshot.ddl_type.toUpperCase() === 'TABLES'" class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                <AlertTriangle class="w-3 h-3 text-amber-500" />
                <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">{{ $t('history.manualUpdateWarning') }}</span>
              </div>
            </div>
          </div>

          <!-- Code Viewer -->
          <DDLViewer 
            :content="selectedSnapshot.ddl_content" 
            :font-size="appStore.fontSizes.code" 
            :font-family="appStore.fontFamilies.code"
          />
        </template>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import DDLViewer from '@/components/ddl/DDLViewer.vue'
import Andb from '@/utils/andb'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useNotificationStore } from '@/stores/notification'
import { 
  History, 
  RefreshCw, 
  Search, 
  ScanSearch, 
  Table, 
  Zap, 
  Hammer, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Server,
  Database,
  Copy,
  RotateCcw,
  AlertTriangle
} from 'lucide-vue-next'

const loading = ref(false)
const snapshots = ref<any[]>([])
const selectedSnapshot = ref<any>(null)
const copySuccess = ref(false)
const appStore = useAppStore()
const projectsStore = useProjectsStore()
const notificationStore = useNotificationStore()
const route = useRoute()
const { t } = useI18n()

// Watch for project changes to reset state
watch(() => projectsStore.selectedProjectId, () => {
  selectedSnapshot.value = null
  filters.value.query = ''
  filters.value.type = ''
  filters.value.environment = ''
})

const filters = ref({
  environment: '',
  type: '',
  query: ''
})

const historyTypes = ['', 'TABLES', 'VIEWS', 'PROCEDURES', 'FUNCTIONS', 'TRIGGERS']

const currentConnection = computed(() => {
  return appStore.connections.find(c => c.id === appStore.selectedConnectionId)
})

const projectConnections = computed(() => {
  if (!projectsStore.currentProject) return []
  const ids = projectsStore.currentProject.connectionIds || []
  return appStore.connections.filter(c => ids.includes(c.id))
})

const filteredSnapshots = computed(() => {
  return snapshots.value.filter(s => {
    // 1. Primary Filter: Must belong to current project
    const belongsToProject = projectConnections.value.some(c => 
      c.environment === s.environment && c.database === s.database_name
    )
    if (!belongsToProject) return false

    // 2. Secondary Filter: If a specific connection is globally selected
    if (currentConnection.value) {
       if (s.environment !== currentConnection.value.environment) return false
       if (s.database_name !== currentConnection.value.database) return false
    }

    // 3. Local UI Filters (Type & Query)
    const matchesType = !filters.value.type || s.ddl_type === filters.value.type
    const matchesQuery = !filters.value.query || 
                         s.ddl_name.toLowerCase().includes(filters.value.query.toLowerCase())
    return matchesType && matchesQuery
  })
})

const getIconForType = (type: string) => {
  switch (type.toUpperCase()) {
    case 'TABLES': return Table
    case 'PROCEDURES': return Hammer
    case 'FUNCTIONS': return Zap
    case 'TRIGGERS': return ShieldCheck
    case 'VIEWS': return Layers
    default: return Database
  }
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch (e) {
    return dateStr
  }
}

const loadSnapshots = async () => {
  loading.value = true
  try {
    const result = await Andb.getAllSnapshots(500)
    snapshots.value = result
  } catch (err: any) {
    notificationStore.add({
      type: 'error',
      title: t('history.notifications.loadError'),
      message: err.message
    })
  } finally {
    loading.value = false
  }
}

const copyDDL = async () => {
  if (!selectedSnapshot.value) return
  try {
    await navigator.clipboard.writeText(selectedSnapshot.value.ddl_content)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch (e) {
    // Fail silently or notify
  }
}

const restoreVersion = async () => {
  if (!selectedSnapshot.value) return
  
  const snapshot = selectedSnapshot.value
  const conn = appStore.connections.find(c => 
    c.environment === snapshot.environment && 
    c.database === snapshot.database_name
  )

  if (!conn) {
    notificationStore.add({
      type: 'error',
      title: t('history.notifications.connNotFound'),
      message: t('history.notifications.connNotFoundDesc', { target: `${snapshot.environment}:${snapshot.database_name}` })
    })
    return
  }

  const confirmed = confirm(t('history.notifications.confirmRestore', { 
    name: snapshot.ddl_name, 
    date: formatDate(snapshot.created_at), 
    env: snapshot.environment 
  }))
  if (!confirmed) return

  loading.value = true
  try {
    await Andb.restoreSnapshot(conn, snapshot)
    notificationStore.add({
      type: 'success',
      title: t('history.notifications.restoreSuccess'),
      message: t('history.notifications.restoreDesc', { name: snapshot.ddl_name })
    })
  } catch (err: any) {
    notificationStore.add({
      type: 'error',
      title: t('history.notifications.restoreFailed'),
      message: err.message
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadSnapshots()

  // Apply filters from query params if present
  if (route.query.env) {
    filters.value.environment = route.query.env as string
  }
  if (route.query.name) {
    filters.value.query = route.query.name as string
    
    // Auto-select if there is exactly one match or first one matches name
    // (Wait for reactivity or computed update?)
    // Actually filteredSnapshots is computed from snapshots.value.
    // So subsequent render/tick will have it.
  }

  // Listen for sidebar selection events to filter history AND update Global Connection
  window.addEventListener('category-selected', (e: any) => {
    const { env, type, db } = e.detail
    
    // Update global store if needed
    const conn = appStore.connections.find(c => c.environment === env && c.database === db)
    if (conn) {
      appStore.selectedConnectionId = conn.id
    }

    if (type && type !== 'all') {
      filters.value.type = type.toUpperCase()
    } else {
      filters.value.type = ''
    }
  })

  window.addEventListener('object-selected', (e: any) => {
    const { env, name, type, db } = e.detail
    
    // Update global store if needed
    const conn = appStore.connections.find(c => c.environment === env && c.database === db)
    if (conn) {
      appStore.selectedConnectionId = conn.id
    }

    filters.value.query = name
    if (type) {
      filters.value.type = type.toUpperCase()
    }
  })
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.4);
}

</style>
