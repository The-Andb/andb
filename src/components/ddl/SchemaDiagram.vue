<template>
  <div class="h-full w-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative select-none" 
       ref="container"
       @mousedown="onBackgroundMouseDown"
       @mousemove="onMouseMove"
       @mouseup="onMouseUp"
       @wheel="onWheel">
    
    <!-- Workspace -->
    <div 
      class="absolute transition-transform duration-75 cursor-grab active:cursor-grabbing"
      :style="{ 
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        transformOrigin: '0 0'
      }"
    >
      <!-- Background Grid -->
      <div v-if="settings.showGrid" class="absolute inset-0 opacity-[0.2] dark:opacity-[0.15]" :style="gridStyle"></div>

      <!-- Relationships (Edges) -->
      <svg v-if="settings.showRelationships" class="absolute inset-0 pointer-events-none" :width="workspaceSize.width" :height="workspaceSize.height">
        <g v-for="(edge, index) in edges" :key="index">
          <path 
            :d="calculatePath(edge)" 
            class="stroke-primary-500/30 dark:stroke-primary-500/20"
            fill="none" 
            stroke-width="2"
            stroke-dasharray="4"
          />
        </g>
      </svg>

      <!-- Tables (Nodes) -->
      <div 
        v-for="table in tablesWithPos" 
        :key="table.name"
        class="absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        :class="{ '!transition-none': draggingTable?.name === table.name }"
        :style="{ 
          left: table.x + 'px', 
          top: table.y + 'px',
          zIndex: draggingTable?.name === table.name ? 100 : 1
        }"
        @mousedown.stop="onTableMouseDown($event, table)"
      >
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-64 ring-1 ring-black/5 transition-all duration-300"
             :class="{ 
                 'shadow-2xl ring-primary-500/50 scale-105': draggingTable?.name === table.name,
                 'opacity-30 grayscale-[0.8] blur-[1px]': searchQuery && !table.name.toLowerCase().includes(searchQuery.toLowerCase()),
                 'ring-2 ring-primary-500 shadow-primary-500/20': searchQuery && table.name.toLowerCase().includes(searchQuery.toLowerCase())
             }">
          <!-- Table Header -->
          <div class="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Table class="w-4 h-4 text-primary-500" />
            <span class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white truncate">{{ table.name }}</span>
          </div>

          <!-- Table Content -->
          <div v-if="settings.detailLevel !== 'names'" class="p-3 space-y-1.5 min-h-[40px] transition-all">
            <div 
              v-for="col in (table.columns || [{name: 'id', type: 'integer', pk: true}])" 
              :key="col.name"
            >
              <div 
                 v-if="settings.detailLevel === 'all' || (settings.detailLevel === 'keys' && col.pk)"
                 class="flex items-center justify-between gap-4 group"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <Key v-if="col.pk" class="w-3 h-3 text-yellow-500 shrink-0" />
                  <Circle v-else class="w-1.5 h-1.5 text-gray-300 dark:text-gray-600 shrink-0" />
                  <span class="text-[11px] font-mono text-gray-600 dark:text-gray-300 truncate" :class="{ 'font-bold': col.pk }">{{ col.name }}</span>
                </div>
                <span v-if="settings.detailLevel === 'all'" class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">{{ col.type }}</span>
              </div>
            </div>

            <!-- If no columns parsed, show a hint -->
            <div v-if="!table.columns && settings.detailLevel === 'all'" class="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center py-2 opacity-50 italic">
               Click to see DDL
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Toolbar -->
    <div v-if="!isExporting" class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl ring-1 ring-black/5 transition-all">
        <!-- Zoom Group -->
        <div class="flex items-center px-2 py-1 border-r border-gray-100 dark:border-gray-800">
            <button @click="zoomOut" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-all active:scale-90" title="Zoom Out"><Minus class="w-4 h-4" /></button>
            <span class="text-[10px] font-black w-10 text-center text-gray-600 dark:text-gray-300 tabular-nums">{{ Math.round(zoom * 100) }}%</span>
            <button @click="zoomIn" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-all active:scale-90" title="Zoom In"><Plus class="w-4 h-4" /></button>
        </div>

        <!-- Visibility Toggles -->
        <div class="flex items-center gap-1 px-2 border-r border-gray-100 dark:border-gray-800">
            <button 
                @click="autoLayout" 
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-all active:scale-90" 
                title="Auto Arrange Layout (Organize tables in grid)"
            >
                <LayoutTemplate class="w-4 h-4" />
            </button>
            <button 
                @click="settings.showRelationships = !settings.showRelationships" 
                class="p-2 rounded-xl transition-all active:scale-90" 
                :class="settings.showRelationships ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'"
                title="Toggle Relationships (Show/Hide connection lines)"
            >
                <GitBranch class="w-4 h-4" />
            </button>
            <button 
                @click="settings.showGrid = !settings.showGrid" 
                class="p-2 rounded-xl transition-all active:scale-90" 
                :class="settings.showGrid ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'"
                title="Toggle Background Grid"
            >
                <Grid3X3 class="w-4 h-4" />
            </button>
        </div>

        <!-- View Controls -->
        <div class="flex items-center gap-2 px-2">
            <!-- Search -->
            <div class="relative group">
                <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                    v-model="searchQuery"
                    type="text" 
                    placeholder="Search tables..." 
                    title="Search tables by name"
                    class="pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[11px] font-bold w-32 focus:w-48 transition-all focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white"
                />
            </div>

            <!-- Detail Levels Dropdown -->
            <div class="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-2 py-1 gap-1">
                <span class="text-[9px] font-black uppercase tracking-tighter text-gray-400 mr-1">Show:</span>
                <button 
                    v-for="lv in (['names', 'keys', 'all'] as const)" 
                    :key="lv"
                    @click="settings.detailLevel = lv"
                    class="px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all"
                    :class="settings.detailLevel === lv ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
                    :title="`Show ${lv === 'names' ? 'Table Names only' : lv === 'keys' ? 'Primary Keys only' : 'All Fields'}`"
                >
                    {{ lv }}
                </button>
            </div>

             <button @click="resetView" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-all active:scale-90" title="Center View & Reset Zoom">
                <Maximize2 class="w-4 h-4" />
            </button>

            <div class="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-1"></div>

            <button 
                @click="exportAsPng" 
                :disabled="isExporting"
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-primary-500 transition-all active:scale-90 disabled:opacity-50" 
                title="Export as PNG (with watermark)"
            >
                <Download v-if="!isExporting" class="w-4 h-4" />
                <RefreshCw v-else class="w-4 h-4 animate-spin" />
            </button>
        </div>
    </div>

    <!-- Tip -->
    <div v-if="!isExporting" class="absolute top-6 right-6 px-4 py-2 bg-gray-900/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
        <MousePointer2 class="w-3.5 h-3.5" />
        Drag to pan • Scroll to zoom
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { Table, Key, Circle, Minus, Plus, Maximize2, LayoutTemplate, MousePointer2, GitBranch, Grid3X3, Search, Download, RefreshCw } from 'lucide-vue-next'
import { toPng } from 'html-to-image'

const props = defineProps<{
  tables: any[]
}>()

interface Column {
  name: string
  type: string
  pk?: boolean
}

interface TableData {
  name: string
  x: number
  y: number
  columns: Column[] | null
}

interface Edge {
  from: TableData
  to: TableData
}

const container = ref<HTMLElement | null>(null)
const zoom = ref(0.8)
const offset = ref({ x: 50, y: 50 })
const isDraggingBackground = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const workspaceSize = ref({ width: 5000, height: 5000 })
const searchQuery = ref('')
const isExporting = ref(false)

const settings = reactive({
    showGrid: true,
    showRelationships: true,
    detailLevel: 'all' as 'names' | 'keys' | 'all'
})

// Enhanced Tables with Positions and basic column parsing
const tablesWithPos = ref<any[]>([])
const edges = ref<any[]>([])

const gridStyle = computed(() => ({
  backgroundImage: `radial-gradient(circle, #9ca3af 1px, transparent 1px)`,
  backgroundSize: `${20 * zoom.value}px ${20 * zoom.value}px`,
  width: '10000px',
  height: '10000px',
  transform: 'translate(-2500px, -2500px)' // Center the huge grid
}))

// Auto-layout logic (Balanced Grid)
const autoLayout = () => {
  const horizontalSpacing = 320
  let verticalSpacing = 320 
  
  // Dynamic spacing based on detail level
  if (settings.detailLevel === 'names') verticalSpacing = 80
  else if (settings.detailLevel === 'keys') verticalSpacing = 160
  
  const cols = Math.ceil(Math.sqrt(props.tables.length))
  
  tablesWithPos.value = props.tables.map((table, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    
    // Parse columns from DDL if available
    let columns: Column[] | null = null
    const ddl = table.ddl || table.content || ''
    if (ddl) {
        columns = parseColumnsFromDDL(ddl)
    }

    // Adjust vertical spacing based on column count
    const dynamicY = row * verticalSpacing + 100
    
    return {
      ...table,
      columns,
      x: col * horizontalSpacing + 100,
      y: dynamicY
    }
  })
  
  // Try to find relations based on naming conventions (id -> table_id)
  calculateEdges()
}

const parseColumnsFromDDL = (ddl: string): Column[] | null => {
    try {
        const columns: Column[] = []
        const lines = ddl.split('\n')
        lines.forEach(line => {
             const trimmed = line.trim()
             // Skip CREATE TABLE start, constraints, indices, etc
             if (trimmed.toUpperCase().startsWith('CREATE') || 
                 trimmed.toUpperCase().startsWith('PRIMARY') || 
                 trimmed.toUpperCase().startsWith('KEY') || 
                 trimmed.toUpperCase().startsWith('CONSTRAINT') || 
                 trimmed.toUpperCase().startsWith('UNIQUE') || 
                 trimmed.toUpperCase().startsWith('INDEX') || 
                 trimmed.toUpperCase().startsWith('FOREIGN') || 
                 trimmed.startsWith(')') || trimmed.startsWith('(') || !trimmed) {
                 return
             }
             
             // Match format: "column_name" data_type(...) ...
             const match = trimmed.match(/^[`"]?([a-zA-Z0-9_]+)[`"]?\s+([a-zA-Z0-9_()]+)/i)
             if (match) {
                 columns.push({
                     name: match[1],
                     type: match[2].toLowerCase(),
                     pk: trimmed.toUpperCase().includes('PRIMARY KEY')
                 })
             }
        })
        return columns.length > 0 ? columns.slice(0, 15) : null // Increase to 15 columns
    } catch (e) {
        return null
    }
}

const calculateEdges = () => {
    // Look for potential FKs based on column names like 'user_id'
    const newEdges: Edge[] = []
    tablesWithPos.value.forEach((t1: TableData) => {
        if (!t1.columns) return
        t1.columns.forEach((col: Column) => {
            if (col.name.endsWith('_id')) {
                const targetTableName = col.name.replace('_id', '') + 's' // Simple pluralization check
                const target = tablesWithPos.value.find(t => t.name.toLowerCase() === targetTableName.toLowerCase() || t.name.toLowerCase() === col.name.replace('_id', '').toLowerCase())
                if (target && target !== t1) {
                    newEdges.push({ from: t1, to: target })
                }
            }
        })
    })
    edges.value = newEdges
}

const calculatePath = (edge: Edge): string => {
    const fromX = (edge.from.x || 0) + 256
    const fromY = (edge.from.y || 0) + 50
    const toX = (edge.to.x || 0)
    const toY = (edge.to.y || 0) + 50
    
    const cp1x = fromX + (toX - fromX) / 2
    const cp2x = fromX + (toX - fromX) / 2
    
    return `M ${fromX} ${fromY} C ${cp1x} ${fromY}, ${cp2x} ${toY}, ${toX} ${toY}`
}

// Interactivity
const draggingTable = ref<TableData | null>(null)
const tableDragOffset = ref({ x: 0, y: 0 })

const onBackgroundMouseDown = (e: MouseEvent) => {
  if (draggingTable.value) return
  isDraggingBackground.value = true
  dragStart.value = { x: e.clientX - offset.value.x, y: e.clientY - offset.value.y }
}

const onTableMouseDown = (e: MouseEvent, table: TableData) => {
  draggingTable.value = table
  tableDragOffset.value = { 
    x: (e.clientX / zoom.value) - table.x, 
    y: (e.clientY / zoom.value) - table.y 
  }
}

const onMouseMove = (e: MouseEvent) => {
  if (isDraggingBackground.value) {
    offset.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y
    }
  } else if (draggingTable.value) {
    const table = tablesWithPos.value.find(t => t.name === draggingTable.value?.name)
    if (table) {
      table.x = (e.clientX / zoom.value) - tableDragOffset.value.x
      table.y = (e.clientY / zoom.value) - tableDragOffset.value.y
    }
  }
}

const onMouseUp = () => {
  isDraggingBackground.value = false
  draggingTable.value = null
}

const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.05 : 0.05
  const nextZoom = Math.max(0.2, Math.min(2, zoom.value + delta))
  
  // Zoom towards mouse
  if (container.value) {
    const rect = container.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const worldX = (mouseX - offset.value.x) / zoom.value
    const worldY = (mouseY - offset.value.y) / zoom.value
    
    zoom.value = nextZoom
    
    offset.value.x = mouseX - worldX * zoom.value
    offset.value.y = mouseY - worldY * zoom.value
  }
}

const zoomIn = () => { zoom.value = Math.min(2, zoom.value + 0.1) }
const zoomOut = () => { zoom.value = Math.max(0.2, zoom.value - 0.1) }
const resetView = () => {
    zoom.value = 0.8
    offset.value = { x: 50, y: 50 }
}

const exportAsPng = async () => {
    if (!container.value) return
    isExporting.value = true
    
    // Create watermark element
    const watermark = document.createElement('div')
    watermark.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: flex-end; font-family: sans-serif; opacity: 0.8;">
            <div style="font-size: 16px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px;">The Andb</div>
            <div style="font-size: 9px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px;">Schema Explorer</div>
        </div>
    `
    watermark.style.position = 'absolute'
    watermark.style.bottom = '40px'
    watermark.style.right = '40px'
    watermark.style.pointerEvents = 'none'
    watermark.style.zIndex = '9999'
    watermark.style.opacity = '0.6'
    
    container.value.appendChild(watermark)
    
    try {
        // Wait a tiny bit for the watermark to mount
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const dataUrl = await toPng(container.value, {
            cacheBust: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#020617' : '#f9fafb',
            style: {
                // Ensure the transform is preserved for the capture
            }
        })
        
        const link = document.createElement('a')
        link.download = `andb-schema-export-${new Date().getTime()}.png`
        link.href = dataUrl
        link.click()
    } catch (err) {
        console.error('Failed to export diagram:', err)
    } finally {
        if (container.value.contains(watermark)) {
            container.value.removeChild(watermark)
        }
        isExporting.value = false
    }
}

watch(() => props.tables, () => {
  autoLayout()
}, { immediate: true })

watch(() => settings.detailLevel, () => {
  autoLayout()
})

onMounted(() => {
  autoLayout()
})
</script>

<style scoped>
.cursor-grab { cursor: grab; }
.cursor-grabbing { cursor: grabbing; }

/* Custom Scrollbar for Workspace */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.4);
}
</style>
