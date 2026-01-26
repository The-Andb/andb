<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  X, 
  FileCode, 
  ArrowRight, 
  Database, 
  Upload,
  Loader,
  PlayCircle,
  AlertCircle
} from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects'
import { useRouter } from 'vue-router'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const projectsStore = useProjectsStore()
const router = useRouter()

const sourcePath = ref('')
const targetPath = ref('')
const projectName = ref('')
const isProcessing = ref(false)
const error = ref('')

const isFormValid = computed(() => {
  return sourcePath.value && targetPath.value
})

const sourceFile = ref<File | null>(null)
const targetFile = ref<File | null>(null)

const pickFile = async (type: 'source' | 'target') => {
  try {
    // 1. Try Electron API first
    if ((window as any).electronAPI && (window as any).electronAPI.pickFile) {
      const path = await (window as any).electronAPI.pickFile({
        title: `Select ${type === 'source' ? 'Source' : 'Target'} SQL Dump`,
        filters: [{ name: 'SQL Files', extensions: ['sql'] }]
      })
      
      if (path) {
        isProcessing.value = true
        const savedPath = await (window as any).electronAPI.saveDumpFile(path)
        if (type === 'source') sourcePath.value = savedPath
        else targetPath.value = savedPath
        isProcessing.value = false
      }
      return
    }

    // 2. Fallback for Web/Browser mode
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.sql'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        // In browser mode, we use the file name as a marker
        // The actual content processing will happen via FileReader if needed,
        // but for now we set the path to the name to show in UI
        if (type === 'source') {
          sourceFile.value = file
          sourcePath.value = file.name
        } else {
          targetFile.value = file
          targetPath.value = file.name
        }
      }
    }
    input.click()
  } catch (err) {
    console.error('Failed to pick file:', err)
    error.value = 'Failed to upload file. Please try again.'
    isProcessing.value = false
  }
}

const handleQuickCompare = async () => {
  if (!isFormValid.value || isProcessing.value) return
  
  isProcessing.value = true
  error.value = ''
  
  try {
    const pair = await projectsStore.createQuickDumpPair(
      sourcePath.value, 
      targetPath.value, 
      projectName.value || undefined
    )
    
    emit('close')
    router.push({ path: '/compare', query: { pairId: pair.id, action: 'new' } })
  } catch (err: any) {
    error.value = err.message || 'Failed to initialize quick comparison'
  } finally {
    isProcessing.value = false
  }
}

const getFileName = (path: string) => path.split(/[/\\]/).pop() || ''
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <div>
          <h2 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('common.quickDump.title') }}</h2>
          <p class="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">{{ $t('common.quickDump.subtitle') }}</p>
        </div>
        <button @click="emit('close')" class="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-8 space-y-8">
        <!-- Project Name -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('common.quickDump.projectNameLabel') }}</label>
          <input 
            v-model="projectName"
            type="text"
            :placeholder="$t('common.quickDump.projectNamePlaceholder')"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
          />
        </div>

        <!-- Files Selection Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <!-- Connector Icon -->
          <div class="absolute left-1/2 top-12 -translate-x-1/2 hidden md:flex w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 items-center justify-center z-10 shadow-sm">
            <ArrowRight class="w-5 h-5 text-primary-500" />
          </div>

          <!-- Source File -->
          <div class="space-y-3">
            <label class="block text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Database class="w-3.5 h-3.5" /> {{ $t('common.quickDump.sourceLabel') }}
            </label>
            <div 
              @click="pickFile('source')"
              class="group relative h-32 bg-indigo-50/30 dark:bg-indigo-900/10 border-2 border-dashed border-indigo-200 dark:border-indigo-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-500/50 transition-all"
            >
              <div v-if="!sourcePath" class="text-center">
                <Upload class="w-8 h-8 text-indigo-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{{ $t('common.quickDump.selectFile') }}</span>
              </div>
              <div v-else class="text-center px-4">
                <FileCode class="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300 truncate block w-full">{{ getFileName(sourcePath) }}</span>
              </div>
            </div>
          </div>

          <!-- Target File -->
          <div class="space-y-3">
            <label class="block text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Database class="w-3.5 h-3.5" /> {{ $t('common.quickDump.targetLabel') }}
            </label>
            <div 
              @click="pickFile('target')"
              class="group relative h-32 bg-emerald-50/30 dark:bg-emerald-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all"
            >
              <div v-if="!targetPath" class="text-center">
                <Upload class="w-8 h-8 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{{ $t('common.quickDump.selectFile') }}</span>
              </div>
              <div v-else class="text-center px-4">
                <FileCode class="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300 truncate block w-full">{{ getFileName(targetPath) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">{{ error }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-50 dark:border-gray-800 flex items-center justify-end gap-4">
        <button 
          @click="emit('close')"
          class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          {{ $t('common.cancel') }}
        </button>
        <button 
          @click="handleQuickCompare"
          :disabled="!isFormValid || isProcessing"
          class="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Loader v-if="isProcessing" class="w-4 h-4 animate-spin" />
          <PlayCircle v-else class="w-4 h-4" />
          {{ $t('common.quickDump.start') }}
        </button>
      </div>
    </div>
  </div>
</template>
