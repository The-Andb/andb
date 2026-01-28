<template>
  <div 
    class="flex flex-col overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300"
    :class="[
      inline ? 'flex-1 h-full' : 'absolute inset-0 z-50'
    ]"
  >
    <!-- Header -->
    <div 
      class="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 flex items-center justify-between shadow-sm z-10 box-border transition-colors duration-200"
      :class="inline ? 'py-2' : 'h-10'"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <!-- Title & Breadcrumbs -->
        <div class="flex items-center gap-2 min-w-0">
           <h2 class="text-[10px] sm:text-xs font-black leading-6 text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wider whitespace-nowrap opacity-80">
            {{ isBatchMode ? $t('migration.titleBatch') : $t('migration.titleSingle') }}
          </h2>
          <div class="h-3 w-px bg-gray-300 dark:bg-gray-600 shrink-0 mx-1 sm:mx-0"></div>
          <div class="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-mono truncate">
            <span class="font-bold text-blue-600 dark:text-blue-400 truncate max-w-[80px] sm:max-w-[120px]">{{ sourceName }}</span>
            <ArrowRight class="w-3 h-3 opacity-40 shrink-0" />
            <span class="font-bold text-green-600 dark:text-green-400 truncate max-w-[80px] sm:max-w-[120px]">{{ targetName }}</span>
          </div>
        </div>
      </div>

       <!-- Actions -->
      <div class="flex items-center gap-2 shrink-0 z-30">
        <button
          type="button"
          class="flex items-center justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 shadow-sm"
          :disabled="loading"
          @click="$emit('close')"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="flex items-center justify-center rounded-md bg-primary-600 hover:bg-primary-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all border border-primary-600 shadow-md hover:shadow-lg active:scale-95 items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading || targetIsStatic"
          @click="$emit('confirm')"
          :title="targetIsStatic ? 'Cannot migrate to a static file' : ''"
        >
          <Zap class="w-3 h-3" :class="{ 'animate-spin': loading }" />
          {{ loading ? $t('common.processing') : (isBatchMode ? $t('migration.actionBatch') : $t('migration.actionSingle')) }}
        </button>
      </div>
    </div>

    <!-- Main Content (Split View) -->
    <div class="flex-1 flex overflow-hidden lg:flex-row flex-col">
       
       <!-- LEFT PANEL: Overview & List -->
       <div class="w-full lg:w-1/3 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
          
          <!-- Summary Cards -->
          <div class="p-4 pb-0 shrink-0">
             <!-- Combined Stats (Shows for both Single and Batch now) -->
            <div class="grid grid-cols-2 gap-2 mb-2">
                 <div class="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                   <div class="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{{ itemsToProcess.length }}</div>
                   <div class="text-[9px] uppercase text-gray-500 font-bold tracking-wider">{{ $t('migration.totalItems') }}</div>
                 </div>
                 <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center border border-amber-100 dark:border-amber-800/30">
                   <div class="text-xl font-black text-amber-600 dark:text-amber-400 leading-none mb-1">{{ Object.keys(groupedItems).length }}</div>
                   <div class="text-[9px] uppercase text-amber-600 dark:text-amber-400 font-bold tracking-wider">{{ $t('migration.typesChanged') }}</div>
                 </div>
            </div>
          </div>

          <!-- Items List (Scrollable) -->
          <div class="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2">
               <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 flex items-center">
                  <List class="w-3 h-3 mr-1.5" />
                  {{ $t('migration.itemsToMigrate') }}
               </h3>
               
               <div class="space-y-3 pb-4">
                  <div v-for="(group, type) in groupedItems" :key="type" class="border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                    <div class="bg-gray-50 dark:bg-gray-700/30 px-3 py-1.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50">
                       <div class="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                         <component :is="getIconForType(type as any)" class="w-3 h-3 mr-1.5 shrink-0 opacity-70" />
                         {{ type }}
                         <span class="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 rounded-full text-[9px] min-w-[16px] text-center mb-0.5">{{ group.length }}</span>
                       </div>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-700/50">
                      <div 
                        v-for="obj in group" 
                        :key="obj.name" 
                        @click="selectItem(obj)"
                        class="px-3 py-2 flex items-center justify-between cursor-pointer transition-all border-l-2"
                        :class="selectedItemKey === getItemKey(obj) ? 'bg-primary-50 dark:bg-gray-700 border-primary-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-transparent'"
                      >
                        <span class="text-[11px] font-mono text-gray-600 dark:text-gray-300 truncate pr-2 flex items-center min-w-0">
                            <span class="truncate" :class="{ 'font-bold text-gray-900 dark:text-white': selectedItemKey === getItemKey(obj) }">{{ obj.name }}</span>
                        </span>
                        <span :class="getStatusClass(obj.status)" class="shrink-0 text-[9px] uppercase font-bold tracking-tighter flex items-center">
                          <component :is="getStatusIcon(obj.status)" class="w-3 h-3 mr-1" />
                          {{ getStatusText(obj.status) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
          </div>
       </div>

       <!-- RIGHT PANEL: SQL Preview -->
       <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
            <div class="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 shrink-0">
               <span class="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                 <Terminal class="w-4 h-4 text-gray-400" />
                 {{ $t('migration.sqlPreview') }}
                 <span v-if="selectedItemName" class="ml-2 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] normal-case tracking-normal">
                    {{ selectedItemName }}
                 </span>
                 <div v-if="showWarning" class="ml-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-[10px] font-bold text-amber-600 dark:text-amber-400 normal-case tracking-normal">
                    <AlertTriangle class="w-3 h-3 shrink-0" />
                    <span class="truncate max-w-[300px]">{{ $t('migration.warning') }}</span>
                 </div>
                 <div v-if="targetIsStatic" class="ml-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-[10px] font-bold text-red-600 dark:text-red-400 normal-case tracking-normal">
                    <AlertTriangle class="w-3 h-3 shrink-0" />
                    <span class="truncate max-w-[300px]">Migration to Static Dump is not supported. Use SQL Preview to copy script manually.</span>
                 </div>
               </span>
               <button 
                  v-if="sqlScript && !fetchingSql"
                  @click="copySql"
                  class="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:text-white hover:bg-primary-600 flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 shadow-sm active:scale-95"
                >
                  <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
                  {{ copied ? $t('common.copied') : $t('common.copy') }}
                </button>
            </div>
            
            <div class="flex-1 relative bg-gray-50 dark:bg-gray-950 overflow-hidden flex flex-col">
                <div v-if="fetchingSql" class="flex-1 flex flex-col items-center justify-center p-12 text-gray-500">
                  <div class="relative w-16 h-16 mb-4">
                     <div class="absolute inset-0 border-4 border-gray-200 dark:border-gray-800 rounded-full"></div>
                     <div class="absolute inset-0 border-4 border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                  <span class="text-xs uppercase tracking-widest font-bold animate-pulse">{{ $t('common.loading') }}</span>
                </div>
                
                <div v-else-if="previewSql" class="flex-1 flex flex-col min-h-0 relative">
                  <DDLViewer 
                    :content="previewSql" 
                    :font-size="appStore.fontSizes.code + 1" 
                    :font-family="appStore.fontFamilies.code"
                    :show-line-numbers="true"
                    :is-dark="appStore.isDark"
                    class="flex-1"
                  />
                </div>
                
                <div v-else class="flex-1 flex flex-col items-center justify-center p-10 text-gray-400 italic text-[11px] bg-gray-100/30 dark:bg-gray-900">
                  <div class="mb-4 opacity-10 p-6 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <Terminal class="w-12 h-12" />
                  </div>
                  <span class="max-w-[200px] text-center">{{ $t('migration.noPreview') }}</span>
                </div>
            </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue' // Added watch
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import DDLViewer from '@/components/ddl/DDLViewer.vue'
import { 
  Zap, 
  ArrowRight, 
  AlertTriangle,
  Table,
  Layers,
  Hammer,
  Database,
  Trash2,
  PlusCircle,
  FileEdit,
  Terminal,
  Copy,
  Check,
  List
} from 'lucide-vue-next'

const { t } = useI18n()
const appStore = useAppStore()

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  item: any
  sourceName: string
  targetName: string
  sqlScript?: string
  fetchingSql?: boolean
  sqlMap?: Record<string, string>
  inline?: boolean
  targetIsStatic?: boolean
}>()

const copied = ref(false)
const selectedItemKey = ref<string | null>(null) // State for selected item

const copySql = () => {
    let content = previewSql.value
    if (!content) return
    navigator.clipboard.writeText(content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
}

// Reset selection when modal closes
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    selectedItemKey.value = null
  }
})

defineEmits(['close', 'confirm'])

const typeIcons: any = {
  tables: Table,
  views: Layers,
  procedures: Hammer,
  functions: Hammer,
  triggers: Zap
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase() 
  return typeIcons[key] || Database
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'missing_in_source':
    case 'deprecated': 
      return Trash2
    case 'missing_in_target':
    case 'new': 
      return PlusCircle
    default: 
      return FileEdit
  }
}

const isBatchMode = computed(() => !!props.item?.isBatch)

const itemsToProcess = computed(() => {
  if (isBatchMode.value) return props.item?.items || []
  return props.item ? [props.item] : []
})

const groupedItems = computed(() => {
  const items = itemsToProcess.value
  if (!items.length) return {}
  const groups: any = {}
  
  items.forEach((item: any) => {
    const type = item.type || 'Unknown'
    if (!groups[type]) groups[type] = []
    groups[type].push(item)
  })
  
  return groups
})

const showWarning = computed(() => {
  const items = itemsToProcess.value
  // Show warning if ANY item is NOT a pure creation (i.e. is an update or delete)
  return items.some((item: any) => {
    const s = item.status?.toLowerCase()
    return s !== 'new' && s !== 'missing_in_target'
  })
})

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'new':
    case 'missing_in_target':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'deprecated':
    case 'missing_in_source':
      return 'text-rose-600 dark:text-rose-400'
    default:
      return 'text-amber-600 dark:text-amber-400'
  }
}

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'different':
    case 'updated':
    case 'modified': return t('common.status.modified').toUpperCase()
    case 'missing_in_target':
    case 'new': return t('common.status.newSource').toUpperCase()
    case 'missing_in_source':
    case 'deprecated': return t('common.status.deprecatedTarget').toUpperCase()
    default: return status ? status.toUpperCase() : 'UNKNOWN'
  }
}

// Logic for preview
const previewSql = computed(() => {
    // If we have a specific selection
    if (selectedItemKey.value) {
        // If batch, try map
        if (isBatchMode.value && props.sqlMap) {
             return props.sqlMap[selectedItemKey.value] || '-- No SQL available for this item'
        }
        // If single, and selected key matches (it should), return script
         if (!isBatchMode.value) {
            return props.sqlScript
        }
    }
    
    // Default fallback
    return props.sqlScript || '-- Select an item to view specific SQL'
})

const selectedItemName = computed(() => {
    if (selectedItemKey.value) {
        // Parse key "type-name"
        return selectedItemKey.value.split('-').slice(1).join('-')
    }
    return props.item?.name
})

const selectItem = (item : any) => {
    selectedItemKey.value = getItemKey(item)
}

const getItemKey = (item: any) => `${item.type}-${item.name}`

// Auto select first item logic
watch(() => props.item, (newItem) => {
  if (newItem) {
      if (newItem.isBatch && newItem.items?.length > 0) {
          selectedItemKey.value = getItemKey(newItem.items[0])
      } else if (!newItem.isBatch) {
          selectedItemKey.value = getItemKey(newItem)
      }
  } else {
     selectedItemKey.value = null
  }
}, { immediate: true })

</script>
