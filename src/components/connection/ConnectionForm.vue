<template>
  <div class="space-y-6">
    <!-- Template Selection -->
    <div class="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30">
        <label class="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <LayoutTemplate class="w-4 h-4" />
            {{ $t('connections.template.source') }}
        </label>
        <div class="flex items-center gap-4">
            <div class="relative flex-1">
                <select
                v-model="form.templateId"
                class="w-full h-12 px-4 pl-10 text-sm border border-indigo-200 dark:border-indigo-800 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none outline-none font-bold leading-tight"
                >
                <option value="">{{ $t('connections.template.custom') }}</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.name }} ({{ t.host }})
                </option>
                </select>
                <div v-if="form.templateId" class="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                    <Lock class="w-4 h-4" />
                </div>
                 <div v-else class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Unlink class="w-4 h-4" />
                </div>
                <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
             <button 
                v-if="form.templateId"
                @click="detachTemplate"
                class="px-4 py-3 bg-white dark:bg-gray-800 text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-700 hover:border-red-200 rounded-xl transition-all shadow-sm"
                :title="$t('connections.template.detach')"
             >
                <Unlink class="w-4 h-4" />
             </button>

             <div v-else class="flex items-center gap-2">
                 <div v-if="showTemplateCreate" class="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                    <input 
                        v-model="newTemplateName"
                        type="text" 
                        :placeholder="$t('connections.template.namePrompt')"
                        class="px-3 py-3 w-40 text-sm border border-indigo-200 dark:border-indigo-800 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        @keyup.enter="confirmcreateTemplate"
                        @keyup.esc="cancelTemplateCreation"
                        autoFocus
                    />
                    <button @click="confirmcreateTemplate" class="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
                        <Check class="w-4 h-4" />
                    </button>
                     <button @click="cancelTemplateCreation" class="p-3 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl transition-all">
                        <X class="w-4 h-4" />
                    </button>
                 </div>
                 
                 <button 
                    v-else
                    @click="startTemplateCreation"
                    class="px-4 py-3 bg-white dark:bg-gray-800 text-indigo-500 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 rounded-xl transition-all shadow-sm flex items-center gap-2"
                    :title="$t('connections.template.createFromDesc')"
                 >
                    <LayoutTemplate class="w-4 h-4" />
                    <span class="text-xs font-bold whitespace-nowrap">{{ $t('connections.template.createFrom') }}</span>
                 </button>
             </div>
        </div>
        <p class="text-[10px] text-indigo-400 dark:text-indigo-500 mt-2 font-medium" v-if="form.templateId">
            {{ $t('connections.template.inheritedDesc') }}
        </p>
    </div>

    <!-- Basic Connection Info -->
    <div class="space-y-6">
      <div class="pb-2 border-b border-gray-100 dark:border-gray-800">
        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t('connections.basicInfo') }}</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.connectionName') }} *</label>
          <input
            v-model="form.name"
            type="text"
            :placeholder="$t('connections.connectionNamePlaceholder')"
            class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
            :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.name }"
          />
          <p v-if="errors.name" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.name }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.environment') }} *</label>
          <div class="relative group">
            <select
              v-model="form.environment"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none outline-none font-bold leading-tight"
              :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.environment }"
            >
              <option value="">{{ $t('common.select') }}</option>
              <option 
                v-for="env in enabledEnvironments" 
                :key="env.name" 
                :value="env.name"
              >
                {{ $t(`environments.${env.name.toLowerCase()}`) }}
              </option>
            </select>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
          </div>
          <p v-if="errors.environment" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.environment }}</p>
        </div>
      </div>
    </div>

    <!-- Database Connection -->
    <div class="space-y-6 pt-4">
      <div class="pb-2 border-b border-gray-100 dark:border-gray-800">
        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t('connections.databaseConnection') }}</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.databaseType') }} *</label>
          <div class="relative group">
             <select
              v-model="form.type"
              :disabled="isInherited"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
            >
              <option value="mysql">{{ $t('connections.types.mysql') }}</option>
              <option value="dump">{{ $t('connections.types.dump') }}</option>
              <option value="postgres" disabled>{{ $t('connections.types.postgres') }}</option>
              <option value="sqlite" disabled>{{ $t('connections.types.sqlite') }}</option>
            </select>
             <ChevronDown v-if="!isInherited" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
             <Lock v-else class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {{ form.type === 'dump' ? $t('connections.dumpPath') : $t('connections.host') }} *
          </label>
          <div class="relative">
            <input
                v-model="form.host"
                type="text"
                :disabled="isInherited"
                :placeholder="form.type === 'dump' ? $t('connections.dumpPathPlaceholder') : $t('connections.hostPlaceholder')"
                class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 font-bold leading-tight"
                :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.host }"
            />
            <button 
              v-if="form.type === 'dump' && !isInherited" 
              @click="pickDumpFile"
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
            >
              <FolderOpen class="w-4 h-4" />
            </button>
            <Lock v-if="isInherited" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <p v-if="errors.host" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.host }}</p>
        </div>

        <div v-if="form.type !== 'dump'" class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.port') }} *</label>
          <div class="relative">
            <input
                v-model.number="form.port"
                type="number"
                :disabled="isInherited"
                :placeholder="$t('connections.portPlaceholder')"
                class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 font-bold leading-tight"
                :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.port }"
            />
             <Lock v-if="isInherited" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
           </div>
          <p v-if="errors.port" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.port }}</p>
        </div>

        <div v-if="form.type !== 'dump'" class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.database') }} *</label>
          <input
            v-model="form.database"
            type="text"
            :placeholder="$t('connections.databasePlaceholder')"
            class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-bold leading-tight"
            :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.database }"
          />
          <p v-if="errors.database" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.database }}</p>
        </div>

        <div v-if="form.type !== 'dump'" class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.username') }} *</label>
          <div class="relative">
            <input
                v-model="form.username"
                type="text"
                :disabled="isInherited"
                :placeholder="$t('connections.usernamePlaceholder')"
                class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 font-bold leading-tight"
                :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.username }"
            />
            <Lock v-if="isInherited" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <p v-if="errors.username" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.username }}</p>
        </div>

        <div v-if="form.type !== 'dump'" class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.password') }}</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :disabled="isInherited"
              :placeholder="isInherited ? '••••••••' : $t('connections.passwordPlaceholder')"
              class="w-full h-12 px-4 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800 font-bold leading-tight"
            />
             <Lock v-if="isInherited" class="absolute right-12 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <button
              v-if="!isInherited"
              @click="showPassword = !showPassword"
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors"
            >
              <Eye v-if="!showPassword" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.connectionTimeout') }}</label>
          <div class="flex flex-col gap-1">
            <input
              v-model.number="form.timeout"
              type="number"
              placeholder="30"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-bold leading-tight"
            />
            <p class="text-[9px] text-gray-500 font-bold uppercase tracking-tight ml-1 opacity-60">{{ $t('connections.timeoutInSeconds') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Settings (Collapsible) -->
    <div class="bg-gray-50/30 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        @click="showAdvanced = !showAdvanced"
        class="flex items-center justify-between w-full px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <span class="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">{{ $t('connections.advancedSettings') }}</span>
        <ChevronDown :class="{ 'rotate-180': showAdvanced }" class="w-4 h-4 text-gray-400 transition-transform" />
      </button>

      <div v-if="showAdvanced" class="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <label class="flex items-center gap-3 cursor-pointer group">
              <div class="relative">
                <input
                  v-model="form.useSSL"
                  type="checkbox"
                  class="peer sr-only"
                />
                <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-primary-500 transition-colors"></div>
                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span class="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest group-hover:text-primary-500 transition-colors">{{ $t('connections.useSSL') }}</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer group" :class="{ 'opacity-50 pointer-events-none': !form.useSSL }">
              <div class="relative">
                <input
                  v-model="form.allowSelfSigned"
                  type="checkbox"
                  class="peer sr-only"
                  :disabled="!form.useSSL"
                />
                <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-primary-500 transition-colors"></div>
                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span class="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest group-hover:text-primary-500 transition-colors">{{ $t('connections.allowSelfSigned') }}</span>
            </label>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.charset') }}</label>
              <div class="relative group">
                <select
                  v-model="form.charset"
                  class="w-full px-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 appearance-none outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                >
                  <option value="utf8mb4">{{ $t('connections.utf8mb4Recommended') }}</option>
                  <option value="utf8">utf8</option>
                  <option value="latin1">latin1</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.timezone') }}</label>
              <div class="relative group">
                <select
                  v-model="form.timezone"
                  class="w-full px-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 appearance-none outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                >
                  <option value="+00:00">{{ $t('connections.utc') }}</option>
                  <option value="+07:00">{{ $t('connections.ho_chi_minh') }}</option>
                  <option value="+08:00">{{ $t('connections.singapore') }}</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Result -->
    <div v-if="testResult" class="p-4 rounded-lg" :class="testResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
      <div class="flex items-center">
        <ShieldCheck v-if="testResult.success" class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
        <XCircle v-else class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
        <span :class="testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
          {{ testResult.message }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-gray-800 shrink-0">
      <button
        v-if="form.type !== 'dump'"
        @click="testConnection"
        :disabled="isTesting || !isFormValid"
        class="flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary-500 hover:text-primary-500 transition-all active:scale-95 disabled:opacity-50"
      >
        <ShieldQuestion v-if="!isTesting" class="w-4 h-4 mr-2" />
        <Loader v-else class="w-4 h-4 mr-2 animate-spin" />
        {{ isTesting ? $t('connections.testing') : $t('connections.test') }}
      </button>
      <div v-else></div>

      <div class="flex items-center gap-4">
        <button
          @click="$emit('cancel')"
          class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          @click="saveConnection"
          :disabled="isSaving"
          class="flex items-center justify-center px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Loader v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
          {{ isSaving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ShieldQuestion, 
  Loader, 
  ShieldCheck, 
  XCircle,
  LayoutTemplate,
  Unlink,
  Lock,
  Check,
  X,
  FolderOpen
} from 'lucide-vue-next'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useConnectionTemplatesStore } from '@/stores/connectionTemplates'
import type { DatabaseConnection } from '@/stores/app'

const { t: $t } = useI18n()
const connectionPairsStore = useConnectionPairsStore()
const templatesStore = useConnectionTemplatesStore()

const enabledEnvironments = computed(() => connectionPairsStore.enabledEnvironments)
const templates = computed(() => templatesStore.templates)

interface Props {
  connection?: Partial<DatabaseConnection>
}

const props = withDefaults(defineProps<Props>(), {
  connection: undefined
})

const emit = defineEmits<{
  save: [connection: Omit<DatabaseConnection, 'id'>]
  cancel: []
}>()

// Form state
const form = ref({
  name: '',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: '',
  environment: '',
  timeout: 30,
  useSSL: false,
  allowSelfSigned: false,
  charset: 'utf8mb4',
  timezone: '+00:00',
  type: 'mysql',
  templateId: ''
})

// UI state
const showPassword = ref(false)
const showAdvanced = ref(false)
const isTesting = ref(false)
const isSaving = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const showTemplateCreate = ref(false)
const newTemplateName = ref('')

// Validation errors
const errors = ref<Record<string, string>>({})

// Initialize form with existing connection
if (props.connection) {
  form.value = {
    name: props.connection.name || '',
    host: props.connection.host || '',
    port: props.connection.port || 3306,
    database: props.connection.database || '',
    username: props.connection.username || '',
    password: props.connection.password || '',
    environment: props.connection.environment || '',
    timeout: 30, // Default
    useSSL: false,
    allowSelfSigned: false,
    charset: 'utf8mb4',
    timezone: '+00:00',
    type: props.connection.type || 'mysql',
    templateId: props.connection.templateId || ''
  }
}

// Template Handling
const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === form.value.templateId)
})

const isInherited = computed(() => !!selectedTemplate.value)

// Watch template selection
watch(() => form.value.templateId, (newId) => {
  const template = templates.value.find(t => t.id === newId)
  if (template) {
    // Apply template values
    form.value.host = template.host
    form.value.port = template.port
    form.value.username = template.username
    form.value.password = template.password || ''
    form.value.type = template.type
    // Apply database if template has it
    if (template.database) {
      form.value.database = template.database
    }
    // Clear errors for these fields as they are now valid/managed
    delete errors.value.host
    delete errors.value.port
    delete errors.value.username
    delete errors.value.database
  }
})

// Detach from template
const detachTemplate = () => {
  form.value.templateId = ''
  // Values remain as they were, but now editable
}

// Start template creation flow
const startTemplateCreation = () => {
    newTemplateName.value = form.value.name + ' Template'
    showTemplateCreate.value = true
}

// Cancel template creation
const cancelTemplateCreation = () => {
    showTemplateCreate.value = false
    newTemplateName.value = ''
}

// Confirm creation
const confirmcreateTemplate = () => {
  if (!newTemplateName.value.trim()) return

  const newTemplateData = {
    name: newTemplateName.value,
    host: form.value.host,
    port: form.value.port,
    database: form.value.database,
    username: form.value.username,
    password: form.value.password,
    type: form.value.type as 'mysql' | 'postgres' | 'sqlite' | 'dump'
  }

  try {
    const newTemplate = templatesStore.addTemplate(newTemplateData)
    form.value.templateId = newTemplate.id
    cancelTemplateCreation()
  } catch (e: any) {
    if (e.message === 'DUPLICATE_CONNECTION') {
        alert($t('connections.template.duplicateError'))
    } else {
        console.error(e)
        alert($t('common.error'))
    }
  }
}

// Validation
const validateForm = () => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = $t('validation.required', { field: $t('connections.connectionName') })
  }
  
  if (form.value.type === 'dump') {
    if (!form.value.host.trim()) {
      errors.value.host = $t('validation.required', { field: $t('connections.dumpPath') })
    }
  } else {
    if (!form.value.host.trim()) {
      errors.value.host = $t('validation.required', { field: $t('connections.host') })
    }
    
    if (!form.value.port || form.value.port < 1 || form.value.port > 65535) {
      errors.value.port = $t('validation.invalidPort')
    }
    
    if (!form.value.database.trim()) {
      errors.value.database = $t('validation.required', { field: $t('connections.database') })
    }
    
    if (!form.value.username.trim()) {
      errors.value.username = $t('validation.required', { field: $t('connections.username') })
    }
  }
  
  if (!form.value.environment) {
    errors.value.environment = $t('validation.required', { field: $t('connections.environment') })
  }
  
  return Object.keys(errors.value).length === 0
}

  const isFormValid = computed(() => {
    // Debug log to see what's missing
    // console.log('Form validation:', {
    //   name: !!form.value.name.trim(),
    //   host: !!form.value.host.trim(),
    //   port: form.value.port > 0,
    //   database: !!form.value.database.trim(),
    //   username: !!form.value.username.trim(),
    //   environment: !!form.value.environment
    // })
    
    if (form.value.type === 'dump') {
      return form.value.name.trim() !== '' && 
             form.value.host.trim() !== '' && 
             !!form.value.environment
    }

    return form.value.name.trim() !== '' && 
           form.value.host.trim() !== '' && 
           form.value.port > 0 && 
           form.value.database.trim() !== '' && 
           form.value.username.trim() !== '' && 
           !!form.value.environment
  })

// Test connection
const testConnection = async () => {
  if (!validateForm()) return
  
  isTesting.value = true
  testResult.value = null
  
  try {
    // Determine which credentials to use for testing
    // If inherit, use template (though form should already have them)
    // Actually, form handles the values directly, so we just use form vals.
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const success = Math.random() > 0.3 // Random for demo
    testResult.value = {
      success,
      message: success 
        ? $t('connections.testSuccess') 
        : $t('connections.testFailed')
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: $t('connections.testError')
    }
  } finally {
    isTesting.value = false
  }
}

const pickDumpFile = async () => {
    try {
        // 1. Try Electron API first
        if ((window as any).electronAPI && (window as any).electronAPI.pickFile) {
            const path = await (window as any).electronAPI.pickFile({
                title: 'Select MySQL Dump File',
                filters: [{ name: 'SQL Files', extensions: ['sql'] }]
            })
            if (path) form.value.host = path
            return
        }

        // 2. Fallback for Web/Browser mode
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.sql'
        input.onchange = async (e: any) => {
            const file = e.target.files[0]
            if (file) {
                // In browser mode, we use the file name as the path marker
                form.value.host = file.name
                
                // If this is a new connection, we might also auto-fill name if empty
                if (!form.value.name) {
                    form.value.name = file.name.replace('.sql', '')
                }
            }
        }
        input.click()
    } catch (error) {
        console.error('Failed to pick file:', error)
    }
}

// Save connection
const saveConnection = async () => {
  if (!validateForm()) return
  
  isSaving.value = true
  
  try {
    const connectionData: Omit<DatabaseConnection, 'id'> = {
      name: form.value.name,
      host: form.value.host,
      port: form.value.port,
      database: form.value.database,
      username: form.value.username,
      password: form.value.password || undefined,
      environment: form.value.environment as 'DEV' | 'STAGE' | 'UAT' | 'PROD',
      status: 'testing',
      type: form.value.type as 'mysql' | 'postgres' | 'sqlite' | 'dump',
      templateId: form.value.templateId || undefined
    }
    
    emit('save', connectionData)
  } finally {
    isSaving.value = false
  }
}

// Clear test result when form changes
watch(form, () => {
  testResult.value = null
}, { deep: true })
</script>
