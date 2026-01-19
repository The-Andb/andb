<template>
  <header 
     class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 transition-all duration-300 ease-in-out shrink-0"
     :class="appStore.projectManagerMode ? 'py-1 h-10' : 'py-2 h-14'"
  >
    <div class="flex items-center justify-between gap-4 h-full">
      <!-- Left side: Toggle button and title/breadcrumbs -->
      <div class="flex items-center space-x-4 min-w-0 h-full">


        <!-- Logo & Brand -->
        <div class="flex items-center space-x-2 mr-4 cursor-pointer shrink-0 transition-opacity duration-300" 
             @click="handleLogoClick"
        >
          <img 
            src="/icon.png" 
            alt="The Andb" 
            class="rounded shadow-sm transition-all duration-300"
            :class="appStore.projectManagerMode ? 'w-5 h-5' : 'w-6 h-6'"
          />
          <span 
             class="font-black text-gray-900 dark:text-white hidden md:block tracking-tight transition-all duration-300"
             :class="appStore.projectManagerMode ? 'text-sm' : 'text-base'"
          >The Andb</span>
        </div>
        
        <div class="flex flex-col min-w-0 justify-center">
          <h1 
             class="font-black text-gray-900 dark:text-white leading-none truncate transition-all duration-300 uppercase tracking-wider"
             :class="[
               appStore.projectManagerMode ? 'text-xs cursor-pointer hover:text-primary-500' : 'text-sm',
               { 'cursor-pointer hover:text-primary-500': appStore.projectManagerMode }
             ]"
             @click="handleTitleClick"
          >
            {{ headerTitle }}
          </h1>
          <div 
             class="overflow-hidden transition-all duration-300 origin-top"
             :class="appStore.projectManagerMode ? 'h-0 opacity-0' : 'h-auto opacity-100'"
          >
             <Breadcrumbs />
          </div>
        </div>
      </div>

      <!-- Central Toolbar (Contextual Pair or Single Selector) -->
      <div 
         v-if="['/compare', '/schema', '/history'].includes(route.path)" 
         class="hidden lg:flex items-center bg-gray-50 dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300"
         :class="{'opacity-0 pointer-events-none scale-95': appStore.projectManagerMode}"
      >
        <!-- Dropdown Portion -->
        <div class="flex items-center pl-2 space-x-2 border-r border-gray-200 dark:border-gray-700 pr-2">
          <!-- PAIR SELECTOR (Available in Compare, Schema, History) -->
          <div class="flex items-center space-x-2" :class="{ 'pr-2 border-r border-gray-200 dark:border-gray-700 mr-2': route.path !== '/compare' }">
             <GitCompare class="w-4 h-4 text-indigo-500" />
             <div class="relative">
                 <select
                  v-model="selectedPairId"
                  @change="onPairChange"
                  class="w-32 py-1.5 pl-2 pr-6 border-none bg-transparent text-gray-900 dark:text-white text-sm font-bold focus:ring-0 cursor-pointer appearance-none truncate"
                  :class="{'text-gray-400 font-normal': !selectedPairId}"
                  :title="$t('header.pairContext')"
                >
                  <option value="" disabled class="text-gray-400 bg-white dark:bg-gray-800">{{ $t('header.selectPair') }}</option>
                  <option v-for="pair in availablePairs" :key="pair.id" :value="pair.id" class="bg-white dark:bg-gray-800 font-bold text-gray-900 dark:text-white">
                    {{ pair.name }}
                  </option>
                </select>
                <!-- Custom Arrow for better styling -->
                <div class="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                     <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
             </div>
          </div>
          
          <!-- SINGLE DB SELECTOR (Available in Schema, History) -->
          <div v-if="route.path !== '/compare'" class="flex items-center space-x-2">
             <Database class="w-4 h-4 text-primary-500" />
             <select
              v-model="appStore.selectedConnectionId"
              class="pr-8 py-1.5 border-none bg-transparent text-gray-900 dark:text-white text-sm font-bold focus:ring-0 cursor-pointer"
            >
              <option value="" disabled>{{ $t('header.selectDatabase') }}</option>
              <option v-for="conn in appStore.filteredConnections" :key="conn.id" :value="conn.id" class="bg-white dark:bg-gray-800">
                {{ conn.environment }}: {{ conn.database }}
              </option>
            </select>
          </div>
        </div>

        <!-- Unified Action Group -->
        <div class="flex items-center space-x-1 px-1">
          <!-- Verify Action (Contextual) -->
          <button
            @click="handleContextualTest"
            class="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center group relative"
            :class="{ 'opacity-50 cursor-not-allowed': isContextTesting }"
            :disabled="isContextTesting"
            :title="route.path === '/compare' ? $t('header.verifyPair') : $t('header.verifyConnection')"
          >
            <Loader2 v-if="isContextTesting" class="w-4 h-4 animate-spin text-primary-500" />
            <Check v-else-if="contextTestResult === 'success'" class="w-4 h-4 text-green-500" />
            <AlertCircle v-else-if="contextTestResult === 'failed'" class="w-4 h-4 text-red-500" />
            <ShieldCheck v-else class="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
          </button>

          <!-- Reload Action -->
          <button
            @click="refresh"
            class="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all group"
            :disabled="isRefreshing"
            :title="$t('header.reload')"
          >
            <RefreshCw class="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:rotate-180 transition-transform duration-500" :class="{ 'animate-spin': isRefreshing }" />
          </button>

          <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <!-- Settings Shortcut (Project Context) -->
          <button
            @click="router.push(route.path === '/compare' ? '/project-settings?cat=pairs' : '/project-settings?cat=connections')"
            class="p-2 text-gray-400 hover:text-primary-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all group"
            :title="route.path === '/compare' ? $t('header.managePairs') : $t('header.manageConnections')"
          >
            <Layers class="w-4 h-4 transition-transform duration-500" />
          </button>
        </div>
      </div>

      <!-- Right side: System Actions -->
      <div class="flex items-center space-x-1 shrink-0">
        <div class="flex items-center space-x-1">
          <!-- Project Selector -->
          <div 
            v-if="!appStore.projectManagerMode && route.path !== '/settings'" 
            class="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-lg px-2 mr-2 border border-gray-200 dark:border-gray-600 transition-all duration-300"
            :class="{'opacity-0 pointer-events-none w-0 overflow-hidden pr-0 mr-0 border-0': appStore.projectManagerMode}"
          >
            <Folder class="w-4 h-4 text-gray-500 mr-2" />
            <select 
              v-model="selectedProjectModel"
              class="bg-transparent border-none text-xs font-bold py-1.5 focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-200 min-w-[100px]"
            >
              <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id" class="bg-white dark:bg-gray-800">
                {{ p.name }}
              </option>
              <hr />
              <option value="__NEW__" class="bg-gray-50 dark:bg-gray-900 font-bold text-primary-500">
                + {{ $t('projects.newProject') || 'New Base' }}
              </option>
            </select>
          </div>

          <!-- Project Manager Shortcut (OOP improvement: next to selector) -->
          <button 
            v-if="!appStore.projectManagerMode"
            @click="router.push('/projects')"
            class="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all mr-2"
            :title="$t('projects.title')"
          >
            <LayoutGridIcon class="w-4.5 h-4.5" />
          </button>

          <ThemeToggle />
          <LanguageToggle />
        </div>

        
        <div class="w-px h-6 bg-gray-200 dark:border-gray-700 mx-2"></div>

        <!-- App Settings -->
        <button
          @click="router.push('/settings')"
          class="p-2 rounded-lg transition-colors"
          :class="route.path === '/settings' 
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' 
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'"
          :title="$t('common.settings')"
        >
          <Settings class="w-5 h-5" />
        </button>

        <!-- Update Indicator -->
        <button
          v-if="updaterStore.status === 'downloaded' || updaterStore.status === 'available'"
          @click="handleUpdateClick"
          class="p-2 rounded-lg transition-all animate-pulse relative group"
          :class="updaterStore.status === 'downloaded' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'"
          :title="updaterStore.status === 'downloaded' ? 'Update Ready - Click to Restart' : 'New Update Available'"
        >
           <Download class="w-5 h-5" />
           <span class="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>
        </button>

        <button
          @click="showAbout = true"
          class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          :title="$t('header.about')"
        >
          <Info class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- About Modal -->
    <AboutModal :isOpen="showAbout" @close="showAbout = false" />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useProjectsStore } from '@/stores/projects'
import ThemeToggle from './ThemeToggle.vue'

import LanguageToggle from './LanguageToggle.vue'
import AboutModal from './AboutModal.vue'
import Breadcrumbs from './Breadcrumbs.vue'
import { 
  ShieldCheck, 
  RefreshCw, 
  Settings,
  Info,
  Loader2,
  Check,
  AlertCircle,
  GitCompare,
  Database,
  Download,
  Folder,
  Layers,
  LayoutGrid as LayoutGridIcon
} from 'lucide-vue-next'

import { useUpdaterStore } from '@/stores/updater'

const route = useRoute()
const router = useRouter()
const { t: $t } = useI18n()
const appStore = useAppStore()
const connectionPairsStore = useConnectionPairsStore()
const projectsStore = useProjectsStore()
const updaterStore = useUpdaterStore()


// About modal state
// About modal state
const showAbout = ref(false)
const isRefreshing = ref(false)

const handleUpdateClick = () => {
   updaterStore.showModal = true
}

const isContextTesting = computed(() => {
  if (route.path === '/compare') {
    return connectionPairsStore.selectedPair?.status === 'testing'
  } else {
    const conn = appStore.connections.find(c => c.id === appStore.selectedConnectionId)
    return (conn?.status as string) === 'testing'
  }
})

const contextTestResult = computed(() => {
  if (route.path === '/compare') {
    return connectionPairsStore.selectedPair?.status
  } else {
    const conn = appStore.connections.find(c => c.id === appStore.selectedConnectionId)
    // Map internal status to UI status
    if (conn?.status === 'connected') return 'success'
    if (conn?.status === 'failed') return 'failed'
    return 'idle'
  }
})

const handleContextualTest = async () => {
  if (route.path === '/compare') {
    const selectedPair = connectionPairsStore.selectedPair
    if (selectedPair) {
      await connectionPairsStore.testConnectionPair(selectedPair.id)
    }
  } else {
    if (appStore.selectedConnectionId) {
      await appStore.testConnection(appStore.selectedConnectionId)
    }
  }
}

// Initialize store
onMounted(() => {
  // Initialize is now automatic in the store
  // Initial test on mount if we have a pair
  if (connectionPairsStore.selectedPairId) {
    testConnections()
  }

  // Auto-pick source for schema explorer if nothing selected
  if (route.path === '/schema' && !appStore.selectedConnectionId && connectionPairsStore.activePair) {
    appStore.selectedConnectionId = connectionPairsStore.activePair.source?.id || ''
  }
})

// Watch for route changes to apply auto-pick logic
watch(() => route.path, (newPath) => {
  if (['/schema', '/history'].includes(newPath) && !appStore.selectedConnectionId && connectionPairsStore.activePair) {
    appStore.selectedConnectionId = connectionPairsStore.activePair.source?.id || ''
  }
})

// Watch for pair changes to update auto-pick (optional, but requested "auto pick source in default pair")
watch(() => connectionPairsStore.selectedPairId, (newId) => {
  if (newId) {
    // Reset status before testing
    const pair = connectionPairsStore.connectionPairs.find(p => p.id === newId)
    if (pair) {
      pair.status = 'idle'
      // If we are in schema/history view, update the selection to match the new pair's source
      if (['/schema', '/history'].includes(route.path) && connectionPairsStore.activePair) {
        appStore.selectedConnectionId = connectionPairsStore.activePair.source?.id || ''
      }
    }
    
    testConnections()
  }
})

const selectedPairId = computed({
  get: () => connectionPairsStore.selectedPairId,
  set: (value) => connectionPairsStore.setSelectedPair(value)
})

const availablePairs = computed(() => connectionPairsStore.availablePairs)

const selectedProjectModel = computed({
  get: () => projectsStore.selectedProjectId,
  set: (val: string) => {
    if (val === '__NEW__') {
       const newProject = projectsStore.addProject({
          name: 'New Base',
          description: '',
          connectionIds: [],
          pairIds: [],
          enabledEnvironmentIds: ['DEV', 'STAGE', 'UAT', 'PROD']
       })
       projectsStore.selectProject(newProject.id)
    } else {
      projectsStore.selectedProjectId = val
    }
  }
})

const handleLogoClick = () => {
   if (appStore.projectManagerMode) {
      router.push('/projects')
   } else {
      router.push('/')
   }
}

const handleTitleClick = () => {
   if (appStore.projectManagerMode) {
      router.push('/projects')
   }
}

const headerTitle = computed(() => {
   return currentPageTitle.value
})

const currentPageTitle = computed(() => {
  const routeNames: Record<string, string> = {
    '/': $t('common.dashboard'),
    '/schema': $t('common.schema'),
    '/compare': $t('common.compare'),
    '/settings': $t('common.settings'),
    '/projects': $t('projects.title')
  }
  return routeNames[route.path] || $t('common.dashboard')
})



const testConnections = async () => {
  // Test current selected pair
  const selectedPair = connectionPairsStore.selectedPair
  if (selectedPair) {
    await connectionPairsStore.testConnectionPair(selectedPair.id)
  }
}

const onPairChange = () => {
}

const refresh = async () => {
  isRefreshing.value = true
  try {
    // Refresh connection pairs and app connections
    await Promise.all([
      connectionPairsStore.reloadData(),
      appStore.reloadData()
    ])
  } finally {
    // Artificial delay for feel
    setTimeout(() => {
      isRefreshing.value = false
    }, 800)
  }
}

// Keyboard shortcuts moved to App.vue for better global handling
</script>
