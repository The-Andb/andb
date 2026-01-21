<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg" :class="getIconBgClass(item?.status)">
            <FileCode class="w-5 h-5" :class="getIconColorClass(item?.status)" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ item?.name }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('ddlDetail.details', { type: item?.type ? $t(`navigation.ddl.${item.type.toLowerCase()}`) : $t('navigation.ddl.tables') }) }}</p>
          </div>
        </div>
        
        <!-- Tab Switcher -->
        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
            <button 
                @click="activeTab = 'code'"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2"
                :class="activeTab === 'code' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            >
                <Code2 class="w-4 h-4" />
                Code
            </button>
            <button 
                @click="activeTab = 'visual'"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2"
                :class="activeTab === 'visual' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            >
                <LayoutTemplate class="w-4 h-4" />
                Visual
            </button>
        </div>

        <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto flex-1 min-h-0">
        <!-- Status Info Bar -->
        <div class="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <div class="flex items-center gap-6">
             <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Status</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="getStatusBadgeClass(item?.status)">
                    {{ getStatusText(item?.status) }}
                </span>
             </div>
             <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Action</span>
                <span class="text-xs font-medium text-gray-900 dark:text-white">{{ getActionText(item?.status) }}</span>
             </div>
          </div>
        </div>

        <!-- CODE VIEW -->
        <div v-if="activeTab === 'code'" class="p-6 space-y-6">
             <div v-if="ddlStatements.length > 0">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">DDL Statements</h3>
                    <div class="flex gap-2">
                        <button @click="copyAllDDL" class="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700">
                            <Copy class="w-3 h-3" /> Copy All
                        </button>
                    </div>
                </div>
                <div class="space-y-4">
                    <div v-for="(stmt, index) in ddlStatements" :key="index" class="relative group">
                        <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button @click="copyDDL(stmt)" class="p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700" title="Copy">
                                <Copy class="w-3 h-3" />
                             </button>
                        </div>
                        <pre class="p-4 bg-gray-900 text-green-400 font-mono text-xs md:text-sm rounded-xl overflow-x-auto shadow-inner leading-relaxed">{{ stmt }}</pre>
                    </div>
                </div>
             </div>
             
             <!-- Schema Diff -->
            <div v-if="item?.status === 'different' && schemaDiff" class="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ $t('ddlDetail.schemaDiff') }}</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h4 class="text-xs font-bold uppercase text-gray-500">{{ $t('common.source') }}</h4>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                            <pre class="text-xs font-mono text-gray-600 dark:text-gray-300">{{ formatSchema(schemaDiff.source) }}</pre>
                        </div>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-2 h-2 rounded-full bg-green-500"></div>
                            <h4 class="text-xs font-bold uppercase text-gray-500">{{ $t('common.target') }}</h4>
                        </div>
                         <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                            <pre class="text-xs font-mono text-gray-600 dark:text-gray-300">{{ formatSchema(schemaDiff.target) }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- VISUAL VIEW -->
        <div v-if="activeTab === 'visual'" class="h-full flex flex-col min-h-0 bg-gray-50/50 dark:bg-gray-900/50">
             <DDLVisualizer 
                :table-name="item?.name || ''"
                :columns="parsedColumns"
             />
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <button @click="close" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">{{ $t('about.close') }}</button>
        <button v-if="ddlStatements.length > 0" @click="applyChanges" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
          <CheckCircle class="w-4 h-4" />
          {{ $t('ddlDetail.applyChanges') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, FileCode, Copy, CheckCircle, Code2, LayoutTemplate } from 'lucide-vue-next'
import DDLVisualizer from '@/components/ddl/DDLVisualizer.vue'

const { t } = useI18n()

interface DDLItem {
  name: string
  type?: string
  status: string
  ddl?: string[]
  metadata?: any
  diff?: {
    source: any
    target: any
  }
}

interface Column {
  name: string
  type: string
  pk?: boolean
  notNull?: boolean
  unique?: boolean
  unsigned?: boolean
  autoIncrement?: boolean
  default?: string | null
  comment?: string
}

const props = defineProps<{
  isOpen: boolean
  item: DDLItem | null
}>()

const emit = defineEmits(['close', 'apply'])

const activeTab = ref<'code' | 'visual'>('code')

// Watch open state to reset tab
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        // Default to visual if it's a table creation/modification
        if (props.item?.type === 'table' || !props.item?.type || props.item?.type === 'tables') {
             activeTab.value = 'visual' 
        } else {
             activeTab.value = 'code'
        }
    }
})

const schemaDiff = computed(() => props.item?.diff || null)

const ddlStatements = computed(() => {
  if (!props.item) return []
  
  if (props.item.ddl && Array.isArray(props.item.ddl)) {
    if (props.item.ddl.length > 0) return props.item.ddl
  }
  
  const statements: string[] = []
  const { name, type = 'table', status, diff } = props.item
  
  // Logic to generate missing DDL (same as before)
  if (status === 'missing_in_target' || status === 'missing') {
    if (diff?.source) {
      statements.push(diff.source)
    } else {
        // ... (fallback logic same as existing)
        if (type === 'table' || type === 'tables') statements.push(`-- Source DDL not available\nCREATE TABLE \`${name}\` (\n  -- Schema definition needed\n);`)
    }
  } else if (status === 'different' || status === 'modified') {
    if (diff?.source) statements.push(diff.source) // For visual parsing, we prefer source
  } else if (status === 'missing_in_source') {
    if (diff?.target) statements.push(diff.target)
  }
  
  return statements
})

// Visual Parsing Logic
const parsedColumns = computed(() => {
    const ddl = ddlStatements.value.find(s => s.toUpperCase().includes('CREATE TABLE')) || ddlStatements.value[0] || ''
    if (!ddl) return []
    return parseColumnsFromDDL(ddl) || []
})

const parseColumnsFromDDL = (ddl: string): Column[] | null => {
    if (!ddl) return null
    if (!ddl.toUpperCase().includes('CREATE TABLE')) return null
    
    // Normalize logic
    const content = ddl
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
    
    // Simple regex for extracting inside parenthesis
    const match = content.match(/CREATE TABLE.*?\((.*)\)(?:\s|$)/i) || content.match(/CREATE TABLE.*?\((.*)\)/i)
    
    if (!match) return null
    
    const body = match[1]
    
    const parts: string[] = []
    let current = ''
    let parenLevel = 0
    let inQuote = false
    let quoteChar = ''
    
    for (let i = 0; i < body.length; i++) {
        const char = body[i]
        
        if (inQuote) {
            current += char
            if (char === quoteChar && body[i-1] !== '\\') {
                inQuote = false
            }
        } else {
            if (char === "'" || char === '"' || char === '`') {
                inQuote = true
                quoteChar = char
                current += char
            } else if (char === '(') {
                parenLevel++
                current += char
            } else if (char === ')') {
                parenLevel--
                current += char
            } else if (char === ',' && parenLevel === 0) {
                parts.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
    }
    if (current.trim()) parts.push(current.trim())
    
    const columns: Column[] = []
    const pkColumns = new Set<string>()
    
    for (const p of parts) {
        if (!p) continue
        
        const up = p.toUpperCase()
        
        // Handle PRIMARY KEY definitions
        if (up.startsWith('PRIMARY KEY') || (up.startsWith('CONSTRAINT') && up.includes('PRIMARY KEY'))) {
             const pkMatch = p.match(/PRIMARY KEY\s*\((.*?)\)/i)
             if (pkMatch) {
                 const cols = pkMatch[1].split(',').map(c => c.trim().replace(/^[`"]|[`"]$/g, ''))
                 cols.forEach(c => pkColumns.add(c))
             }
             continue
        }
        
        // Skip keys definitions
        if (/^(KEY|UNIQUE KEY|CONSTRAINT|FOREIGN KEY|FULLTEXT|SPATIAL|INDEX)/i.test(p)) continue
        
        // Match column name
        const colMatch = p.match(/^`?([a-zA-Z0-9_]+)`?\s+([a-zA-Z0-9_().,'"\s]+?)(?=\s|$)/)
        
        if (colMatch) {
            const name = colMatch[1]
            const fullType = colMatch[2]
            
            // Extract attributes
            let isPk = up.includes('PRIMARY KEY')
            if (isPk) pkColumns.add(name)

            const isNotNull = up.includes('NOT NULL')
            const isUnsigned = up.includes('UNSIGNED')
            const isAutoInc = up.includes('AUTO_INCREMENT')
            const isUnique = up.includes('UNIQUE')
            
            let defVal = null
            const defMatch = p.match(/DEFAULT\s+('([^']*)'|([^,\s]+))/)
            if (defMatch) {
                defVal = defMatch[2] || defMatch[3]
                if (defVal === 'NULL') defVal = 'NULL'
            }
            
            let comment = ''
            const commentMatch = p.match(/COMMENT\s+'([^']*)'/)
            if (commentMatch) {
                comment = commentMatch[1]
            }

            let type = fullType.replace(/UNSIGNED/i, '').replace(/ZEROFILL/i, '').trim()
            
            columns.push({
                name,
                type,
                pk: false, // Updated in return statement (see below)
                notNull: isNotNull,
                unique: isUnique,
                unsigned: isUnsigned,
                autoIncrement: isAutoInc,
                default: defVal,
                comment
            })
        }
    }
    
    return columns.map(col => ({
        ...col,
        pk: pkColumns.has(col.name)
    }))
}

// Helpers
const getStatusBadgeClass = (status?: string) => {
    const base = "ml-2"
    if (!status) return base + " bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
     switch (status.toLowerCase()) {
        case 'equal': return base + " bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        case 'different': return base + " bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        case 'missing':
        case 'missing_in_target': return base + " bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        case 'missing_in_source': return base + " bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
        default: return base + " bg-gray-100 text-gray-800"
     }
}

const getStatusText = (status?: string) => {
  if (!status) return t('ddlDetail.actions.unknown')
  switch (status.toLowerCase()) {
    case 'equal':
    case 'same': return 'Synced'
    case 'different':
    case 'modified': return 'Changed'
    case 'missing_in_target':
    case 'missing': return 'New'
    case 'missing_in_source': return 'Orphaned'
    default: return status
  }
}

// ... (Existing helper functions: getIconBgClass, getIconColorClass, getActionText, formatSchema, copyAllDDL, etc.)
// Re-implementing simplified versions or keeping existing ones if not replaced:
const getIconBgClass = (status?: string) => {
  if (!status) return 'bg-gray-100 dark:bg-gray-700'
  switch (status.toLowerCase()) {
    case 'equal': return 'bg-green-100 dark:bg-green-900/20'
    case 'different': return 'bg-yellow-100 dark:bg-yellow-900/20'
    case 'missing': return 'bg-red-100 dark:bg-red-900/20'
    default: return 'bg-gray-100 dark:bg-gray-700'
  }
}

const getIconColorClass = (status?: string) => {
  if (!status) return 'text-gray-600 dark:text-gray-400'
  switch (status.toLowerCase()) {
    case 'equal': return 'text-green-600 dark:text-green-400'
    case 'different': return 'text-yellow-600 dark:text-yellow-400'
    case 'missing': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getActionText = (status?: string) => {
  if (!status) return t('ddlDetail.actions.unknown')
  switch (status.toLowerCase()) {
    case 'equal': return 'No Action'
    case 'different': return 'Alter Table'
    case 'missing': return 'Create Table'
    default: return 'Review'
  }
}

const formatSchema = (schema: any) => {
  if (!schema) return 'N/A'
  if (typeof schema === 'string') return schema
  return JSON.stringify(schema, null, 2)
}

const copyDDL = async (ddl: string) => {
  try {
    await navigator.clipboard.writeText(ddl)
  } catch (err) {}
}

const copyAllDDL = async () => {
  const allDDL = ddlStatements.value.join('\n\n')
  await copyDDL(allDDL)
}

const close = () => {
  emit('close')
}

const applyChanges = () => {
  if (props.item) emit('apply', props.item)
}
</script>
