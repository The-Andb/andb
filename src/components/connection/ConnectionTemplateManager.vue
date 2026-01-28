<template>
  <div class="space-y-6">
    <!-- View: Template List -->
    <div v-if="!showAddForm" class="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      <!-- View Mode Selector & Tabs -->
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <nav class="flex -mb-px space-x-8">
              <button
              class="py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all border-primary-500 text-primary-600 dark:text-primary-400"
              >
              <List class="w-4 h-4" />
              ALL TEMPLATES
              </button>
              <button
              class="py-4 px-1 border-b-2 border-transparent font-black text-xs uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-not-allowed opacity-50"
              title="Coming soon"
              >
              <LayoutGrid class="w-4 h-4" />
              BY TYPE
              </button>
          </nav>
      </div>

      <!-- Template List (Table View) -->
      <div class="space-y-4 pt-4">
          <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
              ALL TEMPLATES
              </h3>
              <div class="flex items-center gap-2">
                  <!-- Bulk Actions -->
                  <div v-if="selectedTemplates.length > 0" class="flex items-center gap-2 mr-2 animate-in fade-in zoom-in duration-200">
                      <span class="text-xs text-gray-500 font-bold">{{ selectedTemplates.length }} selected</span>
                      <button @click="bulkTestTemplates"
                              class="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                          <ShieldQuestion class="w-3.5 h-3.5" />
                          Test All
                      </button>
                      <button @click="bulkDeleteTemplates"
                              class="btn btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                          <Trash2 class="w-3.5 h-3.5" />
                          Delete
                      </button>
                      <button @click="clearSelection"
                              class="text-xs text-gray-400 hover:text-gray-600 px-2 transition-colors">
                          Clear
                      </button>
                  </div>
                  <button @click="openForm()" class="btn btn-primary flex items-center">
                    <Plus class="w-4 h-4 mr-2" />
                    {{ $t('settings.templates.add') }}
                  </button>
              </div>
          </div>

          <div class="card overflow-hidden border border-gray-200 dark:border-gray-800 rounded-2xl">
              <div class="overflow-x-auto">
              <table class="w-full">
                  <thead class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                      <th class="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          :checked="isAllSelected"
                          @change="toggleSelectAll"
                          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                        />
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('connections.templateName') }}
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('connections.host') }}
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('connections.database') }}
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('common.actions') }}
                      </th>
                  </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-for="template in templates" 
                      :key="template.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      :class="{ 'bg-primary-50 dark:bg-primary-900/10': selectedTemplates.includes(template.id) }"
                  >
                      <td class="px-4 py-4 whitespace-nowrap w-10">
                        <input
                          type="checkbox"
                          :value="template.id"
                          v-model="selectedTemplates"
                          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer hover:scale-105"
                              :class="{
                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': template.type === 'mysql',
                              'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400': template.type === 'postgres',
                              'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400': template.type === 'sqlite'
                              }"
                              @click="openForm(template)"
                          >
                              <span v-if="template.type === 'postgres'" class="text-[10px] font-black">PG</span>
                              <span v-else-if="template.type === 'sqlite'" class="text-[10px] font-black">SL</span>
                              <span v-else class="text-[10px] font-black">MY</span>
                          </div>
                          </div>
                          <div class="ml-4 cursor-pointer" @click="openForm(template)">
                          <div class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {{ template.name }}
                          </div>
                          <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              {{ template.type }}
                          </div>
                          </div>
                      </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col">
                          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <Server class="w-3.5 h-3.5 text-gray-400" />
                              {{ template.host }}:{{ template.port }}
                          </div>
                          <div class="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <User class="w-3 h-3 opacity-70" />
                              {{ template.username }}
                          </div>
                      </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div v-if="template.database" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit">
                          <Database class="w-3.5 h-3.5 text-gray-400" />
                          {{ template.database }}
                      </div>
                      <span v-else class="text-xs text-gray-400 italic">No default DB</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end gap-2 px-2 py-1 rounded-lg">
                          <button @click="testTemplate(template)" 
                                  class="relative p-1 rounded-lg transition-all"
                                  :class="{
                                      'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20': !testingTemplates.has(template.id) && !testResults[template.id],
                                      'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20': testResults[template.id]?.success,
                                      'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20': testResults[template.id] && !testResults[template.id].success,
                                      'animate-pulse': testingTemplates.has(template.id)
                                  }"
                                  :title="$t('connections.testConnection')">
                            <RefreshCw v-if="testingTemplates.has(template.id)" class="w-4 h-4 animate-spin" />
                            <CheckCircle2 v-else-if="testResults[template.id]?.success" class="w-4 h-4" />
                            <AlertCircle v-else-if="testResults[template.id] && !testResults[template.id].success" class="w-4 h-4" />
                            <ShieldQuestion v-else class="w-4 h-4" />
                          </button>
                          <button @click="openForm(template)" 
                                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                                  :title="$t('common.edit')">
                          <Edit2 class="w-4 h-4" />
                          </button>
                          <button @click="duplicateTemplate(template)"
                                  class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                  :title="$t('common.duplicate')">
                          <Copy class="w-4 h-4" />
                          </button>
                          <button @click="deleteTemplate(template.id)" 
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

              <!-- Empty State in Table -->
              <div v-if="templates.length === 0" class="flex flex-col items-center justify-center text-center py-16 bg-gray-50/50 dark:bg-gray-900/50">
                  <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600 shadow-inner">
                      <LayoutTemplate class="w-8 h-8" />
                  </div>
                  <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">{{ $t('settings.templates.emptyTitle') }}</h3>
                  <p class="text-xs text-gray-500 max-w-xs mb-6">{{ $t('settings.templates.emptyDesc') }}</p>
                  <button @click="openForm()" class="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all">
                      {{ $t('settings.templates.createFirst') }}
                  </button>
              </div>
          </div>
      </div>
    </div>

    <!-- View: Template Form (Inline) -->
    <div v-else class="animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <!-- Form Header -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-inner">
                <LayoutTemplate class="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
                <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {{ editingTemplate ? $t('settings.templates.edit') : $t('settings.templates.create') }}
                </h3>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Global Connection Configuration</p>
            </div>
            </div>
            <button @click="closeForm" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors flex items-center gap-2">
                <span class="text-xs font-bold uppercase">{{ $t('common.cancel') }}</span>
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Form Body -->
        <!-- Form Body -->
        <div class="px-8 py-6 space-y-8">
            <ConnectionConfigForm v-model="form" />

            <!-- Actions -->
            <div class="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                @click="closeForm"
                class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                {{ $t('common.cancel') }}
                </button>
                <button
                @click="saveTemplate"
                class="flex items-center justify-center px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                >
                {{ $t('common.save') }}
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
    Plus, LayoutTemplate, Edit2, Trash2, Server, User, LayoutGrid, List, Database, X, Copy, 
    ShieldQuestion, RefreshCw, CheckCircle2, AlertCircle 
} from 'lucide-vue-next'
import { useConnectionTemplatesStore, type ConnectionTemplate } from '@/stores/connectionTemplates'
import ConnectionConfigForm from '@/components/connection/ConnectionConfigForm.vue'
import { useI18n } from 'vue-i18n'
import Andb from '@/utils/andb'
import type { DatabaseConnection } from '@/stores/app'

const store = useConnectionTemplatesStore()
const templates = computed(() => store.templates)
const { t } = useI18n()

const testingTemplates = ref(new Set<string>())
const testResults = ref<Record<string, { success: boolean, message?: string }>>({})

// Selection state for bulk operations
const selectedTemplates = ref<string[]>([])

const isAllSelected = computed(() => {
    return templates.value.length > 0 && 
           templates.value.every(t => selectedTemplates.value.includes(t.id))
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedTemplates.value = []
    } else {
        selectedTemplates.value = templates.value.map(t => t.id)
    }
}

const clearSelection = () => {
    selectedTemplates.value = []
}

const bulkTestTemplates = async () => {
    for (const id of selectedTemplates.value) {
        const template = templates.value.find(t => t.id === id)
        if (template) {
            await testTemplate(template)
        }
    }
}

const bulkDeleteTemplates = () => {
    const count = selectedTemplates.value.length
    if (confirm(t('connections.confirmBulkDelete', { count }))) {
        selectedTemplates.value.forEach(id => store.removeTemplate(id))
        clearSelection()
    }
}

// State
const showAddForm = ref(false)
const showPassword = ref(false)
const editingTemplate = ref<ConnectionTemplate | null>(null)

const form = ref({
    name: '',
    host: 'localhost',
    port: 3306,
    database: '',
    username: 'root',
    password: '',
    type: 'mysql' as 'mysql' | 'postgres' | 'sqlite' | 'dump'
})

const openForm = (template?: ConnectionTemplate) => {
    if (template) {
        editingTemplate.value = template
        form.value = {
            name: template.name,
            host: template.host,
            port: template.port,
            database: template.database || '',
            username: template.username,
            password: template.password || '',
            type: template.type
        }
    } else {
        editingTemplate.value = null
        form.value = {
            name: '',
            host: 'localhost',
            port: 3306,
            database: '',
            username: 'root',
            password: '',
            type: 'mysql'
        }
    }
    showAddForm.value = true
}

const closeForm = () => {
    showAddForm.value = false
    editingTemplate.value = null
    showPassword.value = false
}

const saveTemplate = () => {
    if (!form.value.name) return // Simple validation

    try {
        if (editingTemplate.value) {
            store.updateTemplate(editingTemplate.value.id, form.value)
        } else {
            store.addTemplate(form.value)
        }
        closeForm()
    } catch (e: any) {
        if (e.message === 'DUPLICATE_CONNECTION') {
            alert(t('connections.template.duplicateError'))
        } else {
            console.error(e)
            alert(t('common.error'))
        }
    }
}

const duplicateTemplate = (template: ConnectionTemplate) => {
    const { id, createdAt, updatedAt, ...rest } = template
    const newName = `${rest.name} (Copy)`
    try {
        store.addTemplate({
            ...rest,
            name: newName
        })
    } catch (e: any) {
        alert(t('common.error'))
    }
}

const testTemplate = async (template: ConnectionTemplate) => {
    if (testingTemplates.value.has(template.id)) return
    
    testingTemplates.value.add(template.id)
    delete testResults.value[template.id]

    try {
        // Construct temporary connection for testing
        const tempConn: DatabaseConnection = {
            id: template.id,
            name: template.name,
            host: template.host,
            port: template.port,
            database: template.database || '',
            username: template.username,
            password: template.password,
            type: template.type,
            status: 'testing',
            environment: 'DEV' // Doesn't matter for test
        }

        const result = await Andb.testConnection(tempConn)
        testResults.value[template.id] = result
        
        if (!result.success) {
            console.warn(`Connection test failed for ${template.name}:`, result.message)
        }
    } catch (e: any) {
        testResults.value[template.id] = { success: false, message: e.message }
    } finally {
        testingTemplates.value.delete(template.id)
    }
}

const deleteTemplate = (id: string) => {
    if (confirm(t('connections.confirmDeleteTemplate'))) {
        store.removeTemplate(id)
    }
}

// Auto-test all templates when they are loaded
watch(templates, (newTemplates) => {
    if (newTemplates.length > 0 && Object.keys(testResults.value).length === 0 && testingTemplates.value.size === 0) {
        newTemplates.forEach(template => {
            testTemplate(template)
        })
    }
}, { immediate: true })
</script>
