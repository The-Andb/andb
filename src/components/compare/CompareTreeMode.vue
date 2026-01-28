<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden select-none" @mouseup="stopResize" @mouseleave="stopResize">
    <!-- Header -->
    <div class="flex items-center h-10 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      <div :style="{ width: leftColWidth + '%' }" class="px-4 flex items-center border-r border-gray-200 dark:border-gray-700 overflow-hidden relative" :class="{ 'pr-8': isResizing }">
        <Server class="w-3.5 h-3.5 mr-2 shrink-0" />
        <span class="truncate">{{ sourceName }}</span>
        <div class="absolute right-2 text-[10px] text-gray-400 font-normal">{{ $t('common.source') }}</div>
      </div>

      <!-- Resizer Handle Header Zone -->
      <div 
        class="w-1.5 h-full cursor-col-resize hover:bg-blue-400 transition-colors shrink-0 z-20 relative group"
        @mousedown="startResize"
      >
        <div class="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400/20"></div>
      </div>
      
      <div class="flex-1 px-4 flex items-center relative overflow-hidden">
        <Server class="w-3.5 h-3.5 mr-2 text-green-600 dark:text-green-400 opacity-75 shrink-0" />
        <span class="truncate">{{ targetName }}</span>
        <div class="absolute right-4 text-[10px] text-gray-400 font-normal">{{ $t('common.target') }}</div>
      </div>
    </div>
    <!-- Filter Bar -->
    <div class="flex items-center gap-1 px-4 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 overflow-x-auto no-scrollbar">
      <!-- Type Filters -->
      <div class="flex items-center gap-1 pr-2 mr-2 border-r border-gray-200 dark:border-gray-700">
        <button 
          v-for="tOpt in typeOptions" 
          :key="tOpt.id"
          @click="updateType(tOpt.id)"
          class="p-1.5 rounded-lg transition-all flex items-center justify-center border border-transparent"
          :class="activeType === tOpt.id
            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'"
          :title="tOpt.label"
        >
          <component :is="tOpt.icon" class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Status Filters -->
      <button 
        v-for="f in filterOptions" 
        :key="f.id"
        @click="currentFilter = f.id"
        class="px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center shrink-0 border border-transparent"
        :class="currentFilter === f.id 
          ? [f.activeClass, 'shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10'] 
          : 'bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
      >
        <component :is="f.icon" class="w-3 h-3 mr-1.5 opacity-70" :class="currentFilter === f.id ? '' : 'grayscale opacity-40'" />
        {{ f.label }}
        <span class="ml-1.5 opacity-40 font-mono">{{ getFilterCount(f.id) }}</span>
      </button>
    </div>

    <!-- Tree Content -->
    <div class="flex-1 overflow-auto custom-scrollbar p-4 relative" @mousemove="handleResize">
      <div v-if="!hasData" class="text-center text-gray-400 py-10 italic">
        {{ $t('compare.treeViewData.noData') }}
      </div>

      <div v-else class="space-y-6">
        <div v-for="category in categories" :key="category.type" class="space-y-1">
          <!-- Category Header -->
          <div 
            @click="toggleCategory(category.type)"
            v-show="category.items.length > 0"
            class="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-transparent hover:border-gray-100 dark:hover:border-gray-700"
          >
            <ChevronRight 
              class="w-4 h-4 mr-1 transition-transform text-gray-400"
              :class="{ 'rotate-90': !collapsedCategories.has(category.type) }"
            />
            <component :is="getCategoryIcon(category.type)" class="w-4 h-4 mr-2" :class="getCategoryColor(category.type)" />
            <span class="font-bold text-sm text-gray-700 dark:text-gray-200 capitalize">{{ category.type }}</span>
            <span class="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded-full font-mono">{{ category.items.length }}</span>
            
            <!-- Diff Count Badge -->
            <div v-if="category.diffCount > 0" class="ml-auto flex items-center space-x-2">
               <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                 {{ $t('compare.treeViewData.differences', { count: category.diffCount }) }}
               </span>
            </div>
          </div>

          <!-- Items -->
          <div v-show="!collapsedCategories.has(category.type)" class="relative">
                       <div v-for="item in category.items" :key="item.name" 
                         @click="emit('select', item)"
                         class="group relative flex items-center py-1 cursor-pointer"
                       >
               <!-- Row Hover Effect -->
               <div class="absolute inset-0 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 pointer-events-none rounded transition-colors"></div>

               <!-- LEFT SIDE (Source) -->
               <div :style="{ width: leftColWidth + '%' }" class="shrink-0 flex items-center pr-8 relative transition-[width] duration-0 ease-linear">
                  <!-- Tree Lines (Source) -->
                  <div v-if="hasInSource(item)" class="absolute top-0 bottom-0 left-[12px] pointer-events-none z-0 opacity-50">
                      <div class="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      <div class="absolute left-0 top-1/2 w-3.5 h-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>

                  <div class="flex-1 min-w-0 pr-2 pl-8 flex items-center justify-start text-left">
                     <template v-if="hasInSource(item)">
                        <component :is="getCategoryIcon(category.type)" class="w-3.5 h-3.5 mr-2 opacity-50 shrink-0" />
                        <span class="truncate font-mono" :class="getSourceClass(item)" :style="{ fontSize: appStore.fontSizes.ddlName + 'px' }">{{ item.name }}</span>
                     </template>
                     <template v-else>
                        <span class="text-gray-300 dark:text-gray-600 italic text-[10px] pl-6">{{ $t('compare.treeViewData.missingSource') }}</span>
                     </template>
                  </div>
               </div>

               <!-- CENTER CONNECTOR / STATUS -->
               <div class="shrink-0 w-12 flex justify-center z-10 relative">
                 <div 
                   class="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 group/icon transition-all duration-200"
                   :class="canMigrate(item) ? 'cursor-pointer hover:scale-110 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700' : ''"
                   @click="handleMigrateClick(item)"
                 >
                    <component 
                      v-if="canMigrate(item)"
                      :is="Zap"
                      class="w-3.5 h-3.5 text-primary-500 hidden group-hover/icon:block animate-in zoom-in spin-in-12 duration-300" 
                    />
                    <component 
                      :is="getStatusIcon(item.status)" 
                      class="w-3.5 h-3.5 transition-transform" 
                      :class="[getStatusClass(item.status), canMigrate(item) ? 'group-hover/icon:hidden' : '']" 
                    />
                 </div>
                 
                 <!-- Connector Lines -->
                 <div v-if="hasInSource(item)" class="absolute right-full top-1/2 w-4 h-px bg-gray-200 dark:bg-gray-700/50 -mr-1"></div>
                 <div v-if="hasInTarget(item)" class="absolute left-full top-1/2 w-4 h-px bg-gray-200 dark:bg-gray-700/50 -ml-1"></div>
               </div>

               <!-- RIGHT SIDE (Target) -->
               <div class="flex-1 min-w-0 flex items-center pl-4 relative">
                  <!-- Tree Lines (Target) -->
                  <div v-if="hasInTarget(item)" class="absolute top-0 bottom-0 left-[18px] pointer-events-none z-0 opacity-50">
                      <div class="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      <div class="absolute left-0 top-1/2 w-3.5 h-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>

                  <div class="flex-1 min-w-0 pl-7 flex items-center">
                     <template v-if="hasInTarget(item)">
                        <component :is="getCategoryIcon(category.type)" class="w-3.5 h-3.5 mr-2 opacity-50 shrink-0" />
                        <span class="truncate font-mono" :class="getTargetClass(item)" :style="{ fontSize: appStore.fontSizes.ddlName + 'px' }">{{ item.name }}</span>
                     </template>
                     <template v-else>
                        <span class="text-gray-300 dark:text-gray-600 italic text-[10px] pl-4">{{ $t('compare.treeViewData.missingTarget') }}</span>
                     </template>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  ChevronRight, 
  Table, 
  Layers, 
  Hammer, 
  Zap, 
  Database,
  Server,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const { t } = useI18n()

const props = defineProps<{
  results: any[]
  sourceName: string
  targetName: string
  activeType: string
  targetIsStatic?: boolean
}>()

const emit = defineEmits<{
  (e: 'migrate', item: any): void
  (e: 'select', item: any): void
  (e: 'update:activeType', type: string): void
}>()

const updateType = (type: string) => {
  emit('update:activeType', type)
}

const typeOptions = [
  { id: 'all', label: 'All Types', icon: Database },
  { id: 'tables', label: 'Tables', icon: Table },
  { id: 'views', label: 'Views', icon: Layers },
  { id: 'procedures', label: 'Procedures', icon: Hammer },
  { id: 'functions', label: 'Functions', icon: Hammer },
  { id: 'triggers', label: 'Triggers', icon: Zap }
]

const collapsedCategories = ref(new Set<string>())
const leftColWidth = ref(45) // Percentage
const isResizing = ref(false)

const currentFilter = ref('all')
const filterOptions = computed(() => [
  { id: 'all', label: t('compare.treeViewData.filter.all'), activeClass: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200', icon: Database },
  { id: 'new', label: t('compare.treeViewData.filter.new'), activeClass: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', icon: ArrowRight },
  { id: 'modified', label: t('compare.treeViewData.filter.modified'), activeClass: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: AlertCircle },
  { id: 'identical', label: t('compare.treeViewData.filter.identical'), activeClass: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', icon: CheckCircle2 },
  { id: 'deprecated', label: t('compare.treeViewData.filter.deprecated'), activeClass: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400', icon: XCircle }
])

const startResize = () => {
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  // Calculate percentage based on mouse X position relative to container width
  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percent = (x / rect.width) * 100
  
  // Clamp between 20% and 80%
  leftColWidth.value = Math.max(20, Math.min(80, percent))
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.cursor = ''
}

const hasData = computed(() => props.results && props.results.length > 0)

const getFilterCount = (filterId: string) => {
  if (!props.results) return 0
  if (filterId === 'all') return props.results.length
  
  return props.results.filter(item => {
    const s = item.status?.toLowerCase()
    if (filterId === 'new') return s === 'new' || s === 'missing_in_target'
    if (filterId === 'modified') return s === 'modified' || s === 'different' || s === 'updated'
    if (filterId === 'identical') return s === 'equal' || s === 'same' || s === 'identical'
    if (filterId === 'deprecated') return s === 'deprecated' || s === 'missing_in_source'
    return false
  }).length
}

const categories = computed(() => {
  const cats = ['tables', 'views', 'procedures', 'functions', 'triggers']
  return cats.map(type => {
    // 0. Filter by type (if activeType is not all)
    if (props.activeType !== 'all' && type !== props.activeType) {
      return { type, items: [], diffCount: 0 }
    }

    // 1. Get items for this category
    let items = props.results.filter(r => r.type === type)
    
    // 2. Filter items based on current filter
    if (currentFilter.value !== 'all') {
      items = items.filter(item => {
        const s = item.status?.toLowerCase()
        if (currentFilter.value === 'new') return s === 'new' || s === 'missing_in_target'
        if (currentFilter.value === 'modified') return s === 'modified' || s === 'different' || s === 'updated'
        if (currentFilter.value === 'identical') return s === 'equal' || s === 'same' || s === 'identical'
        if (currentFilter.value === 'deprecated') return s === 'deprecated' || s === 'missing_in_source'
        return false
      })
    }

    const diffCount = items.filter(r => {
      const s = r.status?.toLowerCase()
      return s !== 'equal' && s !== 'same' && s !== 'identical'
    }).length

    return {
      type,
      items,
      diffCount
    }
  }).filter(c => c.items.length > 0)
})

const toggleCategory = (type: string) => {
  if (collapsedCategories.value.has(type)) {
    collapsedCategories.value.delete(type)
  } else {
    collapsedCategories.value.add(type)
  }
}

const handleMigrateClick = (item: any) => {
  if (canMigrate(item)) {
    emit('migrate', item)
  }
}

const canMigrate = (item: any) => {
  if (props.targetIsStatic) return false
  const s = item.status?.toLowerCase()
  return s !== 'equal' && s !== 'same'
}

// Helpers
const getCategoryIcon = (type: string) => {
  switch(type) {
    case 'tables': return Table
    case 'views': return Layers
    case 'procedures': case 'functions': return Hammer
    case 'triggers': return Zap
    default: return Database
  }
}

const getCategoryColor = (type: string) => {
   switch(type) {
    case 'tables': return 'text-blue-500'
    case 'views': return 'text-indigo-500'
    case 'procedures': case 'functions': return 'text-purple-500'
    case 'triggers': return 'text-amber-500'
    default: return 'text-gray-500'
  }
}

const hasInSource = (item: any) => {
  return item.status !== 'missing_in_source' && item.status !== 'deprecated'
}

const hasInTarget = (item: any) => {
  return item.status !== 'missing_in_target' && item.status !== 'new'
}

const getSourceClass = (item: any) => {
   if (item.status === 'modified' || item.status === 'different') return 'text-amber-600 dark:text-amber-400 font-bold'
   if (item.status === 'new' || item.status === 'missing_in_target') return 'text-emerald-600 dark:text-emerald-400 font-bold'
   return 'text-gray-700 dark:text-gray-300'
}

const getTargetClass = (item: any) => {
   if (item.status === 'modified' || item.status === 'different') return 'text-amber-600 dark:text-amber-400 font-bold'
   if (item.status === 'deprecated' || item.status === 'missing_in_source') return 'text-rose-600 dark:text-rose-400 font-bold'
   return 'text-gray-700 dark:text-gray-300'
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal': case 'same': return CheckCircle2
    case 'new': case 'missing_in_target': return ArrowRight
    case 'deprecated': case 'missing_in_source': return XCircle 
    case 'modified': case 'different': case 'updated': return AlertCircle
    default: return AlertCircle
  }
}

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal': case 'same': return 'text-teal-500 dark:text-teal-400'
    case 'new': case 'missing_in_target': return 'text-emerald-500 dark:text-emerald-400'
    case 'deprecated': case 'missing_in_source': return 'text-rose-500 dark:text-rose-400'
    case 'modified': case 'different': case 'updated': return 'text-amber-500 dark:text-amber-400'
    default: return 'text-gray-400'
  }
}

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 3px; }
</style>
