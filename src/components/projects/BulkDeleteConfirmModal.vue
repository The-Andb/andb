<script setup lang="ts">
import { X, Trash2, AlertTriangle, Check } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  projects: { id: string, name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[150] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-gray-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
      @click="emit('close')"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
      <!-- Header -->
      <div class="px-8 pt-8 pb-4 flex flex-col items-center text-center">
        <div class="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <Trash2 class="w-8 h-8" />
        </div>
        <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('projects.bulkDeleteTitle', 'Delete Projects') }}</h2>
        <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 px-4">
          {{ $t('projects.bulkDeleteWarning', 'You are about to permanently remove the following bases and all their configurations.') }}
        </p>
      </div>

      <!-- Projects List -->
      <div class="px-8 py-4 max-h-[300px] overflow-y-auto custom-scrollbar">
        <div class="space-y-2">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 group hover:border-red-500/30 transition-all"
          >
            <div class="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-red-500 transition-colors">
              <Check class="w-4 h-4" />
            </div>
            <span class="text-sm font-black text-gray-700 dark:text-gray-200 truncate">{{ project.name }}</span>
            <span v-if="project.id === 'default'" class="ml-auto text-[8px] font-black uppercase bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">System</span>
          </div>
        </div>
      </div>

      <!-- Danger Notice -->
      <div class="mx-8 mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
           <p class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-normal">
            {{ $t('common.warning', 'Warning') }}
           </p>
           <p class="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-tight">
             {{ $t('projects.irreversibleAction', 'This action is irreversible. All connections and pairs within these projects will be lost.') }}
           </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-8 flex items-center gap-4">
        <button 
          @click="emit('close')"
          class="flex-1 px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          {{ $t('common.cancel') }}
        </button>
        <button 
          @click="emit('confirm')"
          :disabled="loading"
          class="flex-1 px-6 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          <Loader v-if="loading" class="w-4 h-4 animate-spin" />
          {{ $t('common.deleteConfirm', 'Confirm Delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.05);
  border-radius: 99px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.05);
}
</style>
