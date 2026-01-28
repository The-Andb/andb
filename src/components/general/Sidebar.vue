<template>
  <aside 
    :class="[
      'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out select-none text-sm relative group',
      isCollapsed ? 'w-12' : 'w-72',
      shouldBlur ? 'blur-[2px] opacity-40 grayscale-[0.8] cursor-pointer' : ''
    ]"
    @click="shouldBlur && router.push('/')"
  >
    <!-- Click to Close Overlay (Visual Hint) -->
    <div v-if="shouldBlur" class="absolute inset-0 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
       <div class="p-3 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform">
         <X class="w-4 h-4 text-red-500" />
         <span class="text-[10px] font-black uppercase tracking-widest">{{ $t('common.close') }}</span>
       </div>
    </div>

    <!-- Content Wrapper -->
    <div :class="['flex-1 flex flex-col min-h-0', shouldBlur ? 'pointer-events-none' : '']">
      <!-- Navigation Menu (Side Activity Bar style if collapsed, or just top menu) -->
      <!-- Navigation Menu (Dynamic Style) -->
      <nav v-show="!isCollapsed" class="flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700 p-2 overflow-hidden">
        <div 
          :class="[
            appStore.navStyle === 'horizontal-tabs' 
              ? 'flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 -mb-1.5 px-0.5' 
              : 'space-y-1'
          ]"
        >
          <router-link
            v-for="item in navItems" :key="item.path"
            :to="item.path"
            class="flex items-center rounded-lg transition-all duration-200 group relative"
            :class="[
              appStore.navStyle === 'horizontal-tabs' ? 'py-2 px-3 flex-shrink-0' : 'px-3 py-2',
              $route.path === item.path 
                ? (appStore.navStyle === 'horizontal-tabs' ? 'text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-gray-800 text-primary-600 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700')
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
            :style="{ fontSize: appStore.fontSizes.menu + 'px' }"
            :title="item.name"
          >
            <div 
              class="rounded-md transition-all duration-300" 
              :class="[
                 appStore.navStyle === 'horizontal-tabs' ? 'p-0.5' : 'p-1.5',
                 $route.path === item.path && appStore.navStyle !== 'horizontal-tabs' ? 'bg-primary-50 dark:bg-primary-900/30' : ''
              ]"
            >
              <component :is="item.icon" :class="appStore.navStyle === 'horizontal-tabs' ? 'w-5 h-5' : 'w-4 h-4'" />
            </div>
            <span v-if="appStore.navStyle !== 'horizontal-tabs'" class="ml-3 font-bold tracking-tight">{{ item.name }}</span>
            <ChevronRight v-if="$route.path === item.path && appStore.navStyle !== 'horizontal-tabs'" class="ml-auto w-3.5 h-3.5 opacity-50" />
            
            <!-- Active Indicator for horizontal mode -->
            <div v-if="appStore.navStyle === 'horizontal-tabs' && $route.path === item.path" class="absolute -bottom-2 left-2 right-2 h-0.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
          </router-link>
        </div>
      </nav>

      <!-- Explorer Header -->
      <div v-show="!isCollapsed" class="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0" :style="{ fontSize: (appStore.fontSizes.schema - 2) + 'px', fontWeight: 'bold' }">
        <span>{{ route.path === '/compare' ? $t('navigation.explorer.source') : (route.path === '/history' ? $t('navigation.explorer.history') : $t('navigation.explorer.schema')) }}</span>
        <div class="flex items-center space-x-1">
          <button @click="sidebarStore.requestRefresh()" class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" :title="$t('navigation.actions.refresh')">
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          </button>
          <button @click="expandAll" class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" :title="$t('navigation.actions.expandAll')">
            <PlusSquare class="w-3.5 h-3.5" />
          </button>
          <button @click="collapseAll" class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" :title="$t('navigation.actions.collapseAll')">
            <MinusSquare class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <!-- Search Box -->
      <div v-show="!isCollapsed" class="px-3 pb-2 pt-1 border-b border-gray-100 dark:border-gray-800/50">
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search class="h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full pl-8 pr-20 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            :placeholder="$t('common.search')"
          />
          
          <!-- Search Flags -->
          <div class="absolute inset-y-0 right-0 flex items-center pr-1.5 space-x-0.5">
            <button 
              @click="searchFlags.caseSensitive = !searchFlags.caseSensitive"
              class="p-1 rounded transition-colors"
              :class="searchFlags.caseSensitive ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
              :title="$t('common.matchCase')"
            >
              <CaseSensitive class="w-3.5 h-3.5" />
            </button>
            <button 
              @click="searchFlags.wholeWord = !searchFlags.wholeWord"
              class="p-1 rounded transition-colors"
              :class="searchFlags.wholeWord ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
              :title="$t('common.wholeWord')"
            >
              <WholeWord class="w-3.5 h-3.5" />
            </button>
            <button 
              @click="searchFlags.regex = !searchFlags.regex"
              class="p-1 rounded transition-colors"
              :class="searchFlags.regex ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
              :title="$t('common.useRegex')"
            >
              <Regex class="w-3.5 h-3.5" />
            </button>
            
            <!-- Clear Button -->
            <button 
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Tree Content -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-gray-900">
        <!-- Loading State (Only if no data or requested refresh) -->
        <div v-if="sidebarStore.loading && sidebarStore.environments.length === 0" class="p-4 space-y-2 opacity-50">
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
        </div>

        <!-- Tree Content (Always show if has data, even while loading in background) -->
        <div v-else class="pb-4">
          <div v-for="env in displayEnvironments" :key="env.name">

            <!-- Environment Node -->
            <div 
              class="group/env flex items-center h-7 px-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent transition-colors"
              :class="{ 
                'text-gray-900 dark:text-white': expandedEnvironments.has(env.name),
                'border-blue-500 bg-blue-50 dark:bg-gray-800': isSourceEnvironment(env.name)
              }"
              @click="toggleEnvironment(env.name)"
              :style="{ fontSize: appStore.fontSizes.schema + 'px' }"
            >
              <span class="w-4 flex items-center justify-center mr-1">
                <ChevronRight 
                  class="w-3.5 h-3.5 transition-transform duration-200"
                  :class="{ 'rotate-90': expandedEnvironments.has(env.name) }" 
                />
              </span>
              <component :is="getEnvIcon(env.name)" class="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
              <span class="font-semibold truncate flex-1">{{ env.name }}</span>
              <span v-if="isSourceEnvironment(env.name)" :style="{ fontSize: (appStore.fontSizes.schema - 3) + 'px' }" class="ml-auto text-blue-600 dark:text-blue-400 font-mono bg-blue-100 dark:bg-blue-400/10 px-1 rounded uppercase font-bold">SRC</span>
            </div>

            <!-- Databases -->
            <div v-if="expandedEnvironments.has(env.name)">
              <div v-for="db in env.databases" :key="db.name" class="relative">
                <!-- Indentation Guide -->
                <div class="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800 group-hover:bg-gray-300 dark:group-hover:bg-gray-700"></div>
                
                <div 
                  class="group/db flex items-center h-7 px-2 pl-[22px] cursor-pointer transition-colors border-l-2"
                  :class="[
                    isActiveDatabase(db) 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-500 font-bold' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent',
                    expandedDatabases.has(`${env.name}-${db.name}`) && !isActiveDatabase(db) ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800' : ''
                  ]"
                  @click="selectDatabase(env.name, db.name)"
                  :style="{ fontSize: (appStore.fontSizes.schema - 1) + 'px' }"
                >
                  <span 
                    class="w-4 flex items-center justify-center mr-1 hover:text-gray-700 dark:hover:text-white"
                    @click.stop="toggleDatabase(env.name, db.name)"
                  >
                    <ChevronRight 
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      :class="{ 'rotate-90': expandedDatabases.has(`${env.name}-${db.name}`) }" 
                    />
                  </span>
                  <Database class="w-3.5 h-3.5 mr-2 text-amber-600 dark:text-amber-500" />
                  <span class="truncate flex-1">{{ getDatabaseDisplayName(db) }}</span>

                  <!-- Fast Refresh Action -->
                  <button 
                    @click.stop="refreshDatabase(env.name, db.name)"
                    class="p-1 opacity-0 group-hover/db:opacity-100 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm hover:scale-110 transition-all text-primary-500 shrink-0 mx-1"
                    :title="$t('common.tooltips.refreshSchema')"
                  >
                    <RefreshCw class="w-3 h-3" />
                  </button>
                </div>

                <!-- Object Categories -->
                <div v-if="expandedDatabases.has(`${env.name}-${db.name}`)" class="relative">
                   <!-- Indentation Guide Level 2 -->
                   <div class="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
                   <div class="absolute left-[41px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>

                  <div v-for="type in ddlTypes" :key="type.key">
                    <!-- Only show if has items -->
                    <div v-if="db[type.key]?.length > 0">
                      <div 
                        class="group/cat flex items-center h-7 px-2 pl-[44px] cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent transition-colors"
                        :class="{ 'text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50': expandedTypes.has(`${env.name}-${db.name}-${type.key}`) }"
                        @click="selectCategory(env.name, db.name, type.key)"
                        :style="{ fontSize: (appStore.fontSizes.schema - 1) + 'px' }"
                      >
                        <span 
                          class="w-4 flex items-center justify-center mr-1 hover:text-gray-700 dark:hover:text-white"
                          @click.stop="toggleType(env.name, db.name, type.key)"
                        >
                          <ChevronRight 
                            class="w-3.5 h-3.5 transition-transform duration-200"
                            :class="{ 'rotate-90': expandedTypes.has(`${env.name}-${db.name}-${type.key}`) }" 
                          />
                        </span>
                        <component 
                          :is="expandedTypes.has(`${env.name}-${db.name}-${type.key}`) ? FolderOpen : Folder" 
                          class="w-3.5 h-3.5 mr-2"
                          :class="type.colorClass || 'text-indigo-400'"
                        />
                         <span class="truncate flex-1">{{ type.label }}</span>
                         <span class="ml-2 text-[10px] opacity-40 font-mono">{{ db[type.key].length }}</span>

                         <!-- Fast Refresh Category -->
                         <button 
                           @click.stop="refreshCategory(env.name, db.name, type.key)"
                           class="p-0.5 opacity-0 group-hover/cat:opacity-100 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm hover:scale-110 transition-all text-primary-500 shrink-0 ml-1.5"
                           :title="$t('common.tooltips.refreshCategory')"
                         >
                           <RefreshCw class="w-3 h-3" />
                         </button>
                         
                         <!-- Changes Badge (Compare Mode Only) -->
                         <span v-if="isCompareView && getCategoryChangeCount(db, type.key) > 0" class="ml-1.5 mr-1 h-3.5 min-w-[14px] px-1 flex items-center justify-center rounded-sm bg-amber-100 dark:bg-amber-500 text-[10px] text-amber-700 dark:text-gray-900 font-bold leading-none">
                           {{ getCategoryChangeCount(db, type.key) }}
                         </span>
                      </div>

                      <!-- Leaves (Objects) -->
                      <div v-if="expandedTypes.has(`${env.name}-${db.name}-${type.key}`)" class="relative">
                         <!-- Indentation Guide Level 3 -->
                         <div class="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
                         <div class="absolute left-[41px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
                         <div class="absolute left-[63px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
                        
                        <div 
                          v-for="item in db[type.key]" 
                          :key="item.name"
                          @click="selectObject(env.name, db.name, type.key, item)"
                          class="group/obj flex items-center h-6 px-2 pl-[66px] cursor-pointer text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent"
                          :class="{ 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border-blue-500': selectedObjectId === item.name }"
                        >
                          <component :is="type.icon" class="w-3.5 h-3.5 mr-2 opacity-70 shrink-0" />
                          <span 
                            class="truncate font-mono leading-tight flex-1"
                            :style="{ fontSize: appStore.fontSizes.ddlName + 'px' }"
                            :class="{ 
                              'text-amber-600 dark:text-amber-400': isCompareView && isModified(type.key, item.name), 
                              'text-green-600 dark:text-green-400': isCompareView && isNew(type.key, item.name) 
                            }"
                          >
                            {{ item.name }}
                          </span>

                          <!-- Fast Refresh Object -->
                          <button 
                            @click.stop="refreshObject(env.name, db.name, type.key, item.name)"
                            class="p-0.5 opacity-0 group-hover/obj:opacity-100 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm hover:scale-110 transition-all text-primary-500 shrink-0 ml-2"
                            :title="$t('common.tooltips.refreshObject')"
                          >
                            <RefreshCw class="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Collapsed Mode Icon Bar -->
      <div v-if="isCollapsed" class="flex flex-col items-center py-4 space-y-4">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded" :title="item.name">
          <component :is="item.icon" class="w-5 h-5" />
        </router-link>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'

import { 
  Home, 
  Database,
  GitCompare, 
  History,
  RefreshCw, 
  ChevronRight,
  Table,
  Zap,
  Hammer,
  Layers,
  ShieldCheck,
  Server,
  Folder,
  FolderOpen,

  MinusSquare,
  PlusSquare,
  Search,
  CaseSensitive,
  WholeWord,
  Regex,
  X
} from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const connectionPairsStore = useConnectionPairsStore()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()


const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activePair = computed(() => connectionPairsStore.activePair)

const isGlobalLayer = computed(() => {
  const globalRoutes = ['Settings', 'Projects']
  return globalRoutes.includes(String(route.name))
})

const shouldBlur = computed(() => {
  return !appStore.projectManagerMode && isGlobalLayer.value
})

// Navigation Items
// Navigation Items
const navItems = computed(() => {
  return [
    { name: t('common.dashboard'), path: '/', icon: Home },
    { name: t('common.schema'), path: '/schema', icon: Database },
    { name: t('common.compare'), path: '/compare', icon: GitCompare },
    { name: t('common.history'), path: '/history', icon: History },
    { name: t('settings.project_settings'), path: '/project-settings', icon: Layers }, 
  ]
})

// Schema Tree State
const environments = computed(() => sidebarStore.environments)
const loading = computed(() => sidebarStore.loading)

const expandedEnvironments = computed(() => sidebarStore.expandedEnvironments)
const expandedDatabases = computed(() => sidebarStore.expandedDatabases)
const expandedTypes = computed(() => sidebarStore.expandedTypes)
const selectedObjectId = ref<string | null>(null)

// Search State
const searchQuery = ref('')
const searchFlags = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false
})
const isSearchActive = computed(() => searchQuery.value.length > 0)


const isCompareView = computed(() => route.path === '/compare')

// Comparison Mapping from Store
const comparisonMap = computed(() => {
  const map: Record<string, any> = {}
  if (sidebarStore.comparisonResults) {
    sidebarStore.comparisonResults.forEach(res => {
      map[`${res.type}-${res.name}`] = res
    })
  }
  return map
})

const getCategoryChangeCount = (db: any, typeKey: string) => {
  if (!sidebarStore.comparisonResults) return 0
  return db[typeKey].filter((item: any) => {
    const res = comparisonMap.value[`${typeKey}-${item.name}`]
    return res && res.status !== 'equal' && res.status !== 'same'
  }).length
}

const getItemStatus = (type: string, name: string) => {
  return comparisonMap.value[`${type}-${name}`]?.status
}

const isModified = (type: string, name: string) => {
  const s = getItemStatus(type, name)?.toLowerCase()
  return s === 'modified' || s === 'different' || s === 'updated'
}

const isNew = (type: string, name: string) => {
  const s = getItemStatus(type, name)?.toLowerCase()
  return s === 'new' || s === 'missing_in_target'
}

const filteredEnvironments = computed(() => {
  let envs = environments.value
  
  if (route.path === '/compare' && activePair.value?.sourceEnv) {
    envs = environments.value.filter(env => env.name.toUpperCase() === activePair.value?.sourceEnv?.toUpperCase())
  }

  // Use the order from connectionPairsStore.environments
  return [...envs].sort((a, b) => {
    const envA = connectionPairsStore.environments.find(e => e.name.toUpperCase() === a.name.toUpperCase())
    const envB = connectionPairsStore.environments.find(e => e.name.toUpperCase() === b.name.toUpperCase())
    
    const orderA = envA ? envA.order : 999
    const orderB = envB ? envB.order : 999
    
    if (orderA !== orderB) return orderA - orderB
    return a.name.localeCompare(b.name)
  })
})

const displayEnvironments = computed(() => {
  const envs = filteredEnvironments.value
  if (!isSearchActive.value) return envs

  const q = searchQuery.value
  const { caseSensitive, wholeWord, regex } = searchFlags.value

  let filterFn: (name: string) => boolean

  if (regex) {
    try {
      const re = new RegExp(q, caseSensitive ? '' : 'i')
      filterFn = (name: string) => re.test(name)
    } catch (e) {
      filterFn = () => false
    }
  } else {
    const searchVal = caseSensitive ? q : q.toLowerCase()
    filterFn = (name: string) => {
      const itemVal = caseSensitive ? name : name.toLowerCase()
      if (wholeWord) {
        return itemVal === searchVal
      }
      return itemVal.includes(searchVal)
    }
  }

  // Deep filter
  const result: any[] = []
  
  envs.forEach(env => {
    const filteredDatabases: any[] = []
    
    env.databases.forEach((db: any) => {
      const filteredDb = { ...db }
      let dbHasMatch = false
      
      // Also check if DB name itself matches (optional, but good for UX)
      // if (filterFn(db.name)) dbHasMatch = true
      
      ddlTypes.value.forEach(type => {
        const items = db[type.key] || []
        const filteredItems = items.filter((item: any) => filterFn(item.name))
        filteredDb[type.key] = filteredItems
        if (filteredItems.length > 0) {
          dbHasMatch = true
          // Auto-expand if search matches
          expandedEnvironments.value.add(env.name)
          expandedDatabases.value.add(`${env.name}-${db.name}`)
          expandedTypes.value.add(`${env.name}-${db.name}-${type.key}`)
        }
      })
      
      if (dbHasMatch) {
        filteredDatabases.push(filteredDb)
      }
    })
    
    if (filteredDatabases.length > 0) {
      result.push({ ...env, databases: filteredDatabases })
    }
  })
  
  return result
})

// DDL Types Mapping
const ddlTypes = computed(() => [
  { key: 'tables', label: t('navigation.ddl.tables'), icon: Table, colorClass: 'text-blue-600 dark:text-blue-400' },
  { key: 'views', label: t('navigation.ddl.views'), icon: Layers, colorClass: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'procedures', label: t('navigation.ddl.procedures'), icon: Hammer, colorClass: 'text-purple-600 dark:text-purple-400' },
  { key: 'functions', label: t('navigation.ddl.functions'), icon: Hammer, colorClass: 'text-purple-600 dark:text-purple-400' },
  { key: 'triggers', label: t('navigation.ddl.triggers'), icon: Zap, colorClass: 'text-amber-600 dark:text-amber-400' }
])

// Actions
const isSourceEnvironment = (envName: string) => {
  return activePair.value?.sourceEnv === envName
}

const getEnvIcon = (envName: string) => {
  const name = envName.toUpperCase()
  if (name.includes('PROD')) return ShieldCheck
  if (name.includes('UAT')) return Layers
  if (name.includes('STAGE')) return Server
  return Database
}

const collapseAll = () => {
  expandedEnvironments.value.clear()
  expandedDatabases.value.clear()
  expandedTypes.value.clear()
}

const expandAll = () => {
  filteredEnvironments.value.forEach(env => {
    expandedEnvironments.value.add(env.name)
    env.databases.forEach((db: any) => {
      expandedDatabases.value.add(`${env.name}-${db.name}`)
      ddlTypes.value.forEach(type => {
        if (db[type.key]?.length > 0) {
          expandedTypes.value.add(`${env.name}-${db.name}-${type.key}`)
        }
      })
    })
  })
}

const isActiveDatabase = (db: any) => {
  return db.connectionId === appStore.selectedConnectionId
}

const toggleEnvironment = (envName: string) => {
  if (expandedEnvironments.value.has(envName)) {
    expandedEnvironments.value.delete(envName)
  } else {
    expandedEnvironments.value.add(envName)
  }
}

const toggleDatabase = (envName: string, dbName: string) => {
  const key = `${envName}-${dbName}`
  if (expandedDatabases.value.has(key)) {
    expandedDatabases.value.delete(key)
  } else {
    expandedDatabases.value.add(key)
  }
}

const toggleType = (envName: string, dbName: string, type: string) => {
  const key = `${envName}-${dbName}-${type}`
  if (expandedTypes.value.has(key)) {
    expandedTypes.value.delete(key)
  } else {
    expandedTypes.value.add(key)
  }
}

const selectDatabase = async (env: string, db: string) => {
  toggleDatabase(env, db)
  if (route.path === '/compare') {
    window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type: 'all' } }))
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    // Small delay to ensure component is mounted and listener attached if we navigated
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type: 'all' } }))
    }, isNavigationNeeded ? 200 : 0)
  }
}

const selectCategory = async (env: string, db: string, type: string) => {
  toggleType(env, db, type)
  if (route.path === '/compare') {
    window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type } }))
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type } }))
    }, isNavigationNeeded ? 200 : 0)
  }
}

const selectObject = async (env: string, db: string, type: string, item: any) => {
  selectedObjectId.value = item.name
  if (route.path === '/compare') {
    window.dispatchEvent(new CustomEvent('object-selected', { detail: { env, db, name: item.name, type } }))
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('object-selected', { detail: { env, db, name: item.name, type } }))
    }, isNavigationNeeded ? 200 : 0)
  }
}

const refreshDatabase = (env: string, db: string) => {
  window.dispatchEvent(new CustomEvent('database-refresh-requested', { detail: { env, db } }))
}

const refreshCategory = (env: string, db: string, type: string) => {
  window.dispatchEvent(new CustomEvent('category-refresh-requested', { detail: { env, db, type } }))
}

const refreshObject = (env: string, db: string, type: string, name: string) => {
  window.dispatchEvent(new CustomEvent('object-refresh-requested', { detail: { env, db, type, name } }))
}

const getDatabaseDisplayName = (db: any) => {
  const conn = appStore.getConnectionById(db.connectionId)
  if (!conn) return db.name
  if (conn.type === 'dump') return conn.name
  return db.name || conn.name
}

const refreshSchemas = async (force = false) => {
  try {
    const result = await sidebarStore.loadSchemas(force)
    if (!result) return

    const conns = appStore.filteredConnections || [] // Connections for current project
    
    // Group by environment
    const envMap = new Map<string, any>()
    
    // 1. Initialize with configured connections so they always appear
    conns.forEach(c => {
      if (!envMap.has(c.environment)) {
        envMap.set(c.environment, { name: c.environment, databases: [] })
      }
      const env = envMap.get(c.environment)
      if (!env.databases.find((db: any) => db.name === c.database)) {
        env.databases.push({
          name: c.database,
          connectionId: c.id,
          tables: [],
          views: [],
          procedures: [],
          functions: [],
          triggers: [],
          totalCount: 0,
          lastUpdated: null
        })
      }
    })
    
    // 2. Merge with results from SQLite - ONLY for connections in the current project
    if (result && Array.isArray(result)) {
      console.log('[Sidebar] Processing Schema Result:', { 
         totalEnvs: result.length, 
         connsCount: conns.length,
         conns: conns.map(c => ({ id: c.id, name: c.name, db: c.database, type: c.type, env: c.environment }))
      })

      result.forEach((remoteEnv: any) => {
        remoteEnv.databases.forEach((remoteDb: any) => {
          // Find matching connection in current project scope
          // Improved Logic:
          // 1. Can we match by Connection ID if available in remoteEnv? (Usually remote only has name/db)
          // 2. Normalize and check empty DB names for Dump files
          
          const projectConn = conns.find(c => {
             const envMatch = c.environment.toLowerCase() === remoteEnv.name.toLowerCase()
             
             // 1. Strict ID Match (if remoteDb has connectionId, which it often doesn't from backend, but let's check)
             if (remoteDb.connectionId && c.id === remoteDb.connectionId) return true;

             // 2. Dump File Logic:
             // Dump connections can have empty database names or names like 'demo_source'.
             // We relax the check: if connection is Dump type and environment matches, we assume it's the one (since we project-scope queries usually)
             
             if (c.type === 'dump' && envMatch) {
                // If remoteDb key provided host/path, use it!
                // Inspecting keys during dev to confirm availability
                if ((remoteDb as any).host && c.host) {
                   // Compare normalized paths
                   return (remoteDb as any).host.trim() === c.host.trim()
                }

                // Fallback: If remoteDb.name is empty OR matches cached name OR matches connection name
                const cDbName = (c.database || '').toLowerCase()
                const cName = c.name.toLowerCase()
                const rDbName = (remoteDb.name || '').toLowerCase()
                
                const isMatch = cDbName === rDbName || rDbName === '' || cName === rDbName
                
                if (isMatch) console.log('[Sidebar] Dump Match Found (Weak):', { cName: c.name, rDbName, cHost: c.host })
                return isMatch
             }

             // 3. Standard Logic
             return envMatch && c.database.toLowerCase() === remoteDb.name.toLowerCase()
          })
          
          if (!projectConn) {
             console.warn('[Sidebar] Unmatched Schema:', remoteEnv.name, remoteDb.name)
          }

          if (projectConn) {
            let localEnv = envMap.get(remoteEnv.name)
            if (!localEnv) {
               localEnv = { name: remoteEnv.name, databases: [] }
               envMap.set(remoteEnv.name, localEnv)
            }
            
            let localDb = localEnv.databases.find((db: any) => 
               db.name === remoteDb.name || 
               (db.connectionId === projectConn.id) ||
               (db.name.toLowerCase() === remoteDb.name.toLowerCase())
            )
            
            // Critical Fix: If localDb exists (created from config), merge data.
            // If it doesn't exist (unexpected), create it.
            
            if (localDb) {
              // Found configured connection, merge actual counts/data
              // Use Object.assign to update reactive object in place
              Object.assign(localDb, {
                 tables: remoteDb.tables,
                 views: remoteDb.views,
                 procedures: remoteDb.procedures,
                 functions: remoteDb.functions,
                 triggers: remoteDb.triggers,
                 totalCount: remoteDb.totalCount || 0
                 // Do NOT overwrite name or connectionId as local config is source of truth
              })
            } else {
              // Should have been created in Step 1, but added here for safety
              localEnv.databases.push({ ...remoteDb, connectionId: projectConn.id })
            }
          }
        })
      })
    }
    
    const finalEnvs = Array.from(envMap.values())
    sidebarStore.setEnvironments(finalEnvs)
    
    // Auto-expand all environments by default to show connections
    finalEnvs.forEach(env => expandedEnvironments.value.add(env.name))
  } catch (error: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('error', 'Failed to load schemas in sidebar', error.message)
    }
  }
}


// Watch for active pair changes to auto-expand
watch(activePair, (newPair) => {
  if (newPair?.sourceEnv) {
    expandedEnvironments.value.add(newPair.sourceEnv)
  }
}, { immediate: true })

watch(() => appStore.connections, () => {
  refreshSchemas(false) // Use cache if available, don't force re-parse
}, { deep: true })

watch(() => sidebarStore.refreshKey, () => {
  refreshSchemas(false) // Use cache if available
})

watch(() => sidebarStore.refreshRequestKey, () => {
  refreshSchemas(true) // Force fetch from DB
})

watch(() => projectsStore.selectedProjectId, () => {
  refreshSchemas(false) // Just regroup the connections
})



onMounted(() => {
  refreshSchemas()
})

defineExpose({
  refreshSchemas
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5); /* gray-400 */
  border-radius: 4px;
}
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8); /* gray-500 */
}
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
