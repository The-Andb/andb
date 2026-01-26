<template>
  <div class="h-screen flex flex-col pt-0 bg-gray-50 dark:bg-gray-900" :style="{ fontFamily: appStore.fontFamilies.general, fontSize: appStore.fontSizes.main + 'px' }">
    <Header />
    <div class="flex-1 flex overflow-hidden">
      <Sidebar />
      <main class="flex-1 flex overflow-hidden bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        <!-- Settings Category Sidebar -->
        <div class="w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 backdrop-blur-md flex flex-col shrink-0">
          <div class="p-8 pb-4">
            <h1 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2 mb-1">
              <Layers class="w-5 h-5 text-indigo-500" />
              {{ $t('settings.project_settings') }}
            </h1>
            <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-60">{{ projectsStore.currentProject?.name }}</p>
          </div>
          
          <div class="flex-1 overflow-y-auto px-4 py-2 space-y-6">
            <!-- Project Settings -->
            <div class="space-y-1">
               <h3 class="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-50">{{ $t('settings.sections.project') }}</h3>
              <button 
                v-for="cat in projectSettings" :key="cat.id"
                @click="activeCategory = cat.id"
                class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden"
                :class="activeCategory === cat.id 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'"
              >
                <component :is="cat.icon" class="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span class="text-[11px] font-bold uppercase tracking-widest">{{ cat.label }}</span>
                <div v-if="activeCategory === cat.id" class="absolute inset-0 bg-white/10 translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>
              </button>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <button @click="resetToDefaults" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-transparent hover:border-red-200/50 dark:hover:border-red-900/50">
              <RotateCcw class="w-3.5 h-3.5" />
              {{ $t('settings.reset') }}
            </button>
          </div>
        </div>
        
        <!-- Category Detail Pane -->
        <div class="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div class="max-w-4xl mx-auto">
            
            <!-- ENVIRONMENTS SECTION -->
            <div v-if="activeCategory === 'environment'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shadow-inner">
                  <Globe2 class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.environment.title') }}</h2>
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">{{ $t('settings.environment.subtitle') }}</p>
                </div>
              </div>
              <EnvironmentManager @show-connection-manager="activeCategory = 'connections'" />
            </div>

            <!-- CONNECTIONS SECTION -->
            <div v-if="activeCategory === 'connections'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shadow-inner">
                  <Link2 class="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.connections.title') }}</h2>
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">{{ $t('settings.connections.subtitle') }}</p>
                </div>
              </div>
              <ConnectionManager />
            </div>

            <!-- PAIRS SECTION -->
            <div v-if="activeCategory === 'pairs' " class="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-inner">
                  <GitCompare class="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.pairs.title') }}</h2>
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">{{ $t('settings.pairs.subtitle') }}</p>
                </div>
              </div>
              <ConnectionPairManager />
            </div>

            <!-- ENGINE SECTION (PROJECT LEVEL) -->
            <div v-if="activeCategory === 'engine'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-inner">
                  <Cpu class="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Engine Configuration</h2>
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">Core behavior settings for this project</p>
                </div>
              </div>

               <div class="space-y-8">
                  <!-- Domain Normalization -->
                  <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <GitCompare class="w-32 h-32" />
                     </div>
                     <div class="relative z-10">
                        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Domain Normalization</h3>
                        <p class="text-xs text-gray-500 mb-6 max-w-lg leading-relaxed">
                           Use this to ignore differences that vary by environment (like hardcoded email domains). This ensures the comparison tool focuses on <strong>structure</strong> changes.
                        </p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div class="space-y-2">
                              <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest">Regex Pattern</label>
                              <input 
                                 :value="projectsStore.currentProject?.settings?.domainNormalization?.pattern"
                                 @input="updateProjectSetting('domainNormalization', 'pattern', ($event.target as HTMLInputElement).value)"
                                 type="text"
                                 class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                 placeholder="e.g. @[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                              />
                           </div>
                           <div class="space-y-2">
                              <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest">Replacement</label>
                              <input 
                                 :value="projectsStore.currentProject?.settings?.domainNormalization?.replacement"
                                 @input="updateProjectSetting('domainNormalization', 'replacement', ($event.target as HTMLInputElement).value)"
                                 type="text"
                                 class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                 placeholder="e.g. @<EMAIL_DOMAIN>"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Migration Exclusions -->
                  <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                      <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Shield class="w-32 h-32" />
                     </div>
                     <div class="relative z-10">
                        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Migration Exclusions</h3>
                        <p class="text-xs text-gray-500 mb-6 max-w-lg leading-relaxed">
                           Prevent accidental deployment of temporary or test objects. Any table, procedure, or view matching this pattern will be <strong>strictly skipped</strong>.
                        </p>

                        <div class="space-y-2">
                              <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest">Exclusion Pattern (Regex)</label>
                              <input 
                                 :value="projectsStore.currentProject?.settings?.isNotMigrateCondition"
                                 @input="updateProjectSetting('isNotMigrateCondition', null, ($event.target as HTMLInputElement).value)"
                                 type="text"
                                 class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                 placeholder="e.g. test|OTE_"
                              />
                              <p class="text-[10px] text-gray-400 font-medium pt-1">Objects matching this regex will be ignored during migration.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </div>


    <!-- Reset Data Confirmation Modal (Pro Style) -->
    <div v-if="showResetModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        class="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
        @click="showResetModal = false"
      ></div>
      
      <div class="relative bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <!-- Modal Header -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shadow-inner">
              <Trash2 class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.resetModal.title') }}</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">{{ $t('settings.resetModal.subtitle') }}</p>
            </div>
          </div>
          <button @click="showResetModal = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="px-8 py-6">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {{ $t('settings.resetModal.warning').split('{irreversible}')[0] }}<span class="font-black text-red-500 underline decoration-2 underline-offset-2">{{ $t('settings.resetModal.irreversible') }}</span>.
          </p>
          
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-6">
            <h4 class="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-[0.2em] mb-4">{{ $t('settings.resetModal.purgedListTitle') }}</h4>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <Database class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.cachedSchemas') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <GitCompare class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.comparisonResults') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <FileCode class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.generatedAlters') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <Activity class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.migrationHistory') }}</span>
              </div>
            </div>
          </div>
          
           <div class="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-100/50 dark:border-primary-900/50">
             <div class="p-1 bg-white dark:bg-gray-800 rounded-md text-primary-500 shadow-sm">
               <RotateCcw class="w-3 h-3" />
             </div>
             <p class="text-[10px] text-primary-700 dark:text-primary-300 font-bold uppercase leading-relaxed tracking-tight">
               {{ $t('settings.resetModal.preservationNote') }}
             </p>
           </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <button 
            @click="showResetModal = false" 
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ $t('settings.resetModal.cancel') }}
          </button>
          <button 
            @click="confirmResetData" 
            class="flex-[1.5] py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            :disabled="isResetting"
          >
            <RotateCcw v-if="isResetting" class="w-3.5 h-3.5 animate-spin" />
            <span v-if="isResetting">{{ $t('settings.resetModal.purging') }}</span>
            <span v-else>{{ $t('settings.resetModal.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>
    </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Layers,
  Globe2, 
  Link2, 
  GitCompare, 
  Database,
  Trash2,
  X,
  FileCode,
  Activity,
  RotateCcw,
  Cpu,
  Shield
} from 'lucide-vue-next'
import Header from '@/components/general/Header.vue'
import Sidebar from '@/components/general/Sidebar.vue'
import EnvironmentManager from '@/components/connection/EnvironmentManager.vue'
import ConnectionPairManager from '@/components/connection/ConnectionPairManager.vue'
import ConnectionManager from '@/components/connection/ConnectionManager.vue'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects' 
import { useOperationsStore } from '@/stores/operations'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const appStore = useAppStore()

const connectionPairsStore = useConnectionPairsStore()
const projectsStore = useProjectsStore()
const operationsStore = useOperationsStore()
const route = useRoute()

const categories = computed(() => {
  const projectCats = [
    { id: 'environment', label: t('settings.categories.environment'), icon: Globe2 },
    { id: 'connections', label: t('settings.categories.connections'), icon: Link2 },
    { id: 'pairs', label: t('settings.categories.pairs'), icon: GitCompare },
    { id: 'engine', label: t('settings.categories.engine'), icon: Cpu }
  ]
  
  return projectCats.map(c => ({ ...c, type: 'project' }))
})

const projectSettings = computed(() => categories.value)
const activeCategory = ref('connections') // Default to connections

// Handle deep linking from query params
const handleDeepLink = (query: any) => {
  if (query.cat && categories.value.find(c => c.id === query.cat)) {
    activeCategory.value = query.cat as string
  }
  // Support 'tab' alias as used in dashboard (e.g. settings?tab=connections)
  if (query.tab && categories.value.find(c => c.id === query.tab)) {
    activeCategory.value = query.tab as string
  }
}

// Watch for project changes to reset state
watch(() => projectsStore.selectedProjectId, () => {
  activeCategory.value = 'connections'
})

onMounted(() => {
  handleDeepLink(route.query)
})

watch(() => route.query, (newQuery) => {
  handleDeepLink(newQuery)
})

const showResetModal = ref(false)
const isResetting = ref(false)

const resetToDefaults = () => {
  showResetModal.value = true
}

const confirmResetData = async () => {
  isResetting.value = true
  try {
     if ((window as any).electronAPI && (window as any).electronAPI.andbClearStorage) {
         await (window as any).electronAPI.andbClearStorage()
     } else {
         await new Promise(resolve => setTimeout(resolve, 800))
     }
     
     // Reload app data
     await Promise.all([
       appStore.reloadData(),
       connectionPairsStore.reloadData(),
       operationsStore.clearOperations(),
       operationsStore.loadOperations()
     ])
     
     showResetModal.value = false
  } catch (error: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('error', 'Failed to reset data in settings', error.message)
    }
    alert('Failed to reset data.')
  } finally {
    isResetting.value = false
  }
}

const updateProjectSetting = (category: string, key: string | null, value: string) => {
  if (!projectsStore.currentProject) return

  const settings = { ...(projectsStore.currentProject.settings || {}) }
  
  if (category === 'domainNormalization') {
     const currentNorm = settings.domainNormalization || { pattern: '', replacement: '' }
     settings.domainNormalization = {
        pattern: currentNorm.pattern,
        replacement: currentNorm.replacement,
        [key!]: value
     }
  } else if (category === 'isNotMigrateCondition') {
     settings.isNotMigrateCondition = value
  }

  projectsStore.updateProject(projectsStore.currentProject.id, { settings })
}
</script>


<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb; /* gray-200 */
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937; /* gray-800 */
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db; /* gray-300 */
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151; /* gray-700 */
}
</style>
