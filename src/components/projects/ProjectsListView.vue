<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { 
  Folder, 
  Plus, 
  Search, 
  MoreVertical, 
  Database, 
  GitCompare, 
  Clock, 
  Trash2, 
  Edit3,
  ChevronRight,
  LayoutGrid,
  List as LayoutList,
  Copy,
  Play,
  Loader,
  Check,
  X
} from 'lucide-vue-next'
import QuickDumpPairModal from './QuickDumpPairModal.vue'
import BulkDeleteConfirmModal from './BulkDeleteConfirmModal.vue'

const projectsStore = useProjectsStore()

const viewMode = ref<'grid' | 'list'>('list')
const searchQuery = ref('')
const filteredProjects = computed(() => {
  if (!searchQuery.value) return projectsStore.projects
  const query = searchQuery.value.toLowerCase()
  return projectsStore.projects.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.description.toLowerCase().includes(query)
  )
})

const emit = defineEmits<{
  (e: 'open', id: string): void
  (e: 'create'): void
  (e: 'delete', id: string): void
  (e: 'rename', id: string, newName: string): void
  (e: 'duplicate', id: string): void
}>()

const renamingId = ref<string | null>(null)
const renamingName = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

const startRename = (project: any) => {
  renamingId.value = project.id
  renamingName.value = project.name
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

const confirmRename = () => {
  if (renamingId.value && renamingName.value.trim()) {
    emit('rename', renamingId.value, renamingName.value.trim())
    renamingId.value = null
  }
}

const cancelRename = () => {
  renamingId.value = null
  renamingName.value = ''
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  } catch (e) {
    return 'long ago'
  }
}

const activeMenuId = ref<string | null>(null)
const toggleMenu = (id: string) => {
  activeMenuId.value = activeMenuId.value === id ? null : id
}

const isDemoSettingUp = ref(false)
const handleSetupDemo = async () => {
  if (isDemoSettingUp.value) return
  isDemoSettingUp.value = true
  try {
    await projectsStore.setupDemo()
    emit('open', projectsStore.selectedProjectId!)
  } catch (error) {
    console.error('Failed to setup demo:', error)
  } finally {
    isDemoSettingUp.value = false
  }
}

// Selection Logic
const selectedIds = ref<string[]>([])
const isSelectionMode = computed(() => selectedIds.value.length > 0)

const toggleSelection = (id: string) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.length === filteredProjects.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredProjects.value.map(p => p.id)
  }
}

const isBulkDeleteModalOpen = ref(false)
const projectsToDelete = computed(() => {
  return projectsStore.projects.filter(p => selectedIds.value.includes(p.id))
})

const handleBulkDelete = () => {
  if (selectedIds.value.length === 0) return
  
  // Exclude default project from bulk delete logic within confirm
  const targets = selectedIds.value.filter(id => id !== 'default')
  if (targets.length === 0) {
    alert("System projects cannot be deleted.")
    selectedIds.value = []
    return
  }

  isBulkDeleteModalOpen.value = true
}

const confirmBulkDelete = () => {
  const targets = selectedIds.value.filter(id => id !== 'default')
  targets.forEach(id => projectsStore.removeProject(id))
  selectedIds.value = []
  isBulkDeleteModalOpen.value = false
}

const clearSelection = () => {
  selectedIds.value = []
}

// Close menu when clicking outside (simple version)
const closeMenu = () => {
  activeMenuId.value = null
}

const isQuickDumpModalOpen = ref(false)
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30 p-8 overflow-y-auto custom-scrollbar" @click="closeMenu">
    <!-- Quick Dump Modal -->
    <QuickDumpPairModal :is-open="isQuickDumpModalOpen" @close="isQuickDumpModalOpen = false" />
    <!-- Bulk Delete Modal -->
    <BulkDeleteConfirmModal 
      :is-open="isBulkDeleteModalOpen" 
      :projects="projectsToDelete"
      @close="isBulkDeleteModalOpen = false"
      @confirm="confirmBulkDelete"
    />
    <!-- Header Area -->
    <div class="max-w-7xl mx-auto w-full mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-2">
        <h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
          Your Bases
        </h1>
        <p class="text-gray-500 dark:text-gray-400 font-medium tracking-wide flex items-center gap-2">
          Organize and switch between your database environments
          <span class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-black rounded-full uppercase">
            {{ projectsStore.projects.length }} Total
          </span>
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- View Toggle -->
        <div class="flex items-center bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mr-2">
         
          <button 
            @click="viewMode = 'list'"
            class="p-2 rounded-xl transition-all"
            :class="viewMode === 'list' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
            title="List View"
          >
            <LayoutList class="w-4 h-4" />
          </button>

           <button 
            @click="viewMode = 'grid'"
            class="p-2 rounded-xl transition-all"
            :class="viewMode === 'grid' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
            title="Grid View"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative group">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search bases..."
            class="pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all w-64 md:w-80 shadow-sm"
          />
        </div>

        <button 
          @click="isQuickDumpModalOpen = true"
          class="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Zap class="w-4 h-4 fill-white/20" />
          QUICK COMPARE
        </button>

        <button 
          @click="emit('create')"
          class="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Plus class="w-5 h-5 stroke-[3px]" />
          NEW BASE
        </button>
      </div>
    </div>

    <!-- Bulk Action Toolbar -->
    <div 
      v-if="isSelectionMode"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500"
    >
      <div class="flex items-center gap-3 border-r border-white/10 pr-6">
        <button 
          @click="toggleSelectAll"
          class="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-primary-400"
          :title="selectedIds.length === filteredProjects.length ? 'Deselect All' : 'Select All'"
        >
          <div class="w-5 h-5 rounded border-2 border-primary-500 flex items-center justify-center bg-transparent">
            <Check v-if="selectedIds.length === filteredProjects.length" class="w-3 h-3 text-primary-500 stroke-[4px]" />
          </div>
          {{ selectedIds.length === filteredProjects.length ? 'None' : 'All' }}
        </button>
        <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-black text-sm">
          {{ selectedIds.length }}
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-black uppercase tracking-widest text-primary-400">Selected</span>
          <span class="text-xs font-bold">{{ selectedIds.length }} Project{{ selectedIds.length > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="handleBulkDelete"
          class="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
        >
          <Trash2 class="w-4 h-4" />
          Delete Selected
        </button>
      </div>

      <button 
        @click="clearSelection"
        class="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Content Area (Conditional View) -->
    <div class="max-w-7xl mx-auto w-full pb-20">
      
      <!-- GRID VIEW -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <div 
          v-for="project in filteredProjects" 
          :key="project.id"
          class="group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-6 transition-all duration-500 cursor-pointer"
          :class="[
            selectedIds.includes(project.id) 
              ? 'ring-2 ring-primary-500 bg-primary-50/10 border-primary-500/30 shadow-2xl shadow-primary-500/10' 
              : 'hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-500/50'
          ]"
          @click="isSelectionMode ? toggleSelection(project.id) : emit('open', project.id)"
        >
          <!-- Selection Checkbox (Grid) -->
          <div 
            class="absolute top-4 left-4 z-40 transition-all duration-300"
            :class="[isSelectionMode ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100']"
          >
            <button 
              @click.stop="toggleSelection(project.id)"
              class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all bg-white dark:bg-gray-800"
              :class="[
                selectedIds.includes(project.id) 
                  ? '!bg-primary-500 !border-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-primary-500 shadow-sm'
              ]"
            >
              <Check 
                v-if="selectedIds.includes(project.id)" 
                class="w-4 h-4 text-white stroke-[3.5px] animate-in zoom-in-50 duration-200" 
              />
            </button>
          </div>
          <!-- Card Background Pattern (Clipped to card) -->
          <div class="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div class="absolute -right-4 -top-4 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
          </div>

          <!-- Header -->
          <div class="flex items-start justify-between mb-6 relative z-30">
            <div class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-primary-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <Folder v-if="project.id === 'default'" class="w-6 h-6 fill-primary-500/20" />
              <Database v-else class="w-6 h-6" />
            </div>

            <div class="relative">
              <button 
                @click.stop="toggleMenu(project.id)"
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
              >
                <MoreVertical class="w-5 h-5" />
              </button>
              
              <!-- Menu Backdrop/Portal (Self-contained) -->
              <div 
                v-if="activeMenuId === project.id"
                class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <button @click.stop="startRename(project)" class="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Edit3 class="w-4 h-4" /> Rename Base
                </button>
                <button @click.stop="emit('duplicate', project.id)" class="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Copy class="w-4 h-4" /> Duplicate Base
                </button>
                <button v-if="project.id !== 'default'" @click.stop="emit('delete', project.id)" class="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 class="w-4 h-4" /> Delete Base
                </button>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="space-y-1 mb-8 relative z-10">
            <h3 v-if="renamingId !== project.id" class="text-xl font-black text-gray-900 dark:text-white leading-tight flex items-center gap-2">
              {{ project.name }}
              <span v-if="projectsStore.selectedProjectId === project.id" class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h3>
            <div v-else class="relative z-50">
              <input 
                ref="renameInput"
                v-model="renamingName"
                @click.stop
                @keyup.enter="confirmRename"
                @keyup.esc="cancelRename"
                @blur="confirmRename"
                class="w-full px-3 py-1 bg-white dark:bg-gray-800 border-2 border-primary-500 rounded-lg text-lg font-black text-gray-900 dark:text-white outline-none shadow-xl"
              />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2 min-h-[2.5rem]">
              {{ project.description || 'No description provided for this base.' }}
            </p>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 relative z-10">
            <div class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
              <Database class="w-3.5 h-3.5" />
              {{ project.connectionIds.length }} Conns
            </div>
            <div class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
              <GitCompare class="w-3.5 h-3.5" />
              {{ project.pairIds.length }} Pairs
            </div>
          </div>

          <!-- Footer -->
          <div class="pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest relative z-10">
            <div class="flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5" />
              Updated {{ formatDate(project.updatedAt) }}
            </div>
            
            <div class="flex items-center gap-1 text-primary-500 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
              OPEN BASE
              <ChevronRight class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Add New Base Card (Alternative) -->
        <div 
          @click="emit('create')"
          class="group bg-gray-100/30 dark:bg-gray-800/20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white dark:hover:bg-gray-800/50 hover:border-primary-500/50 transition-all duration-300 cursor-pointer min-h-[260px]"
        >
          <div class="w-16 h-16 rounded-3xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-300">
            <Plus class="w-8 h-8 stroke-[3px]" />
          </div>
          <div class="text-center group-hover:translate-y-1 transition-transform">
            <div class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Add New Base</div>
            <div class="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide uppercase">Start a fresh project cluster</div>
          </div>
        </div>

        <!-- Try Live Demo Card -->
        <div 
          @click="handleSetupDemo"
          class="group bg-orange-500/5 dark:bg-orange-500/10 border-2 border-dashed border-orange-200 dark:border-orange-900/30 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 cursor-pointer min-h-[260px]"
        >
          <div class="w-16 h-16 rounded-3xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-all duration-300">
            <Play v-if="!isDemoSettingUp" class="w-8 h-8 fill-orange-500/20" />
            <Loader v-else class="w-8 h-8 animate-spin" />
          </div>
          <div class="text-center group-hover:translate-y-1 transition-transform">
            <div class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">{{ $t('common.liveDemo') }}</div>
            <div class="text-xs font-bold text-orange-500/70 tracking-wide uppercase">Try Andb with sample SQL dumps</div>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-else class="flex flex-col gap-3 animate-in fade-in duration-500">
        <div 
          v-for="project in filteredProjects" 
          :key="project.id"
          class="group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-6 transition-all duration-300 cursor-pointer overflow-hidden"
          :class="[
            selectedIds.includes(project.id) 
              ? 'ring-2 ring-primary-500 bg-primary-50/10 border-primary-500/30 shadow-lg' 
              : 'hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/50'
          ]"
          @click="isSelectionMode ? toggleSelection(project.id) : emit('open', project.id)"
        >
          <!-- Selection Checkbox (List) -->
          <div 
            class="shrink-0 z-40 transition-all duration-300"
            :class="[isSelectionMode ? 'opacity-100 w-6' : 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-6']"
          >
            <button 
              @click.stop="toggleSelection(project.id)"
              class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all bg-white dark:bg-gray-800"
              :class="[
                selectedIds.includes(project.id) 
                  ? '!bg-primary-500 !border-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-primary-500 shadow-sm'
              ]"
            >
              <Check 
                v-if="selectedIds.includes(project.id)" 
                class="w-4 h-4 text-white stroke-[3.5px] animate-in zoom-in-50 duration-200" 
              />
            </button>
          </div>
           <!-- Card Background Pattern (Clipped to card) -->
          <div class="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div class="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 bg-primary-500/[0.03] rounded-full blur-3xl group-hover:bg-primary-500/[0.06] transition-colors duration-500"></div>
          </div>

          <div class="w-12 h-12 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-primary-500 shadow-inner group-hover:scale-110 transition-transform duration-300 relative z-10">
            <Folder v-if="project.id === 'default'" class="w-6 h-6 fill-primary-500/20" />
            <Database v-else class="w-6 h-6" />
          </div>

          <div class="flex-1 min-w-0 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <!-- Name & Desc -->
            <div class="md:col-span-5 space-y-0.5">
              <h3 v-if="renamingId !== project.id" class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 truncate">
                {{ project.name }}
                <span v-if="projectsStore.selectedProjectId === project.id" class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              </h3>
              <div v-else class="relative z-50">
                <input 
                  ref="renameInput"
                  v-model="renamingName"
                  @click.stop
                  @keyup.enter="confirmRename"
                  @keyup.esc="cancelRename"
                  @blur="confirmRename"
                  class="w-full px-3 py-1 bg-white dark:bg-gray-800 border-2 border-primary-500 rounded-lg text-base font-black text-gray-900 dark:text-white outline-none shadow-xl"
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                {{ project.description || 'No description provided.' }}
              </p>
            </div>

            <!-- Stats -->
            <div class="md:col-span-4 flex items-center gap-3">
               <div class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase text-gray-400 tracking-widest group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                <Database class="w-3 h-3" />
                {{ project.connectionIds.length }} Conns
              </div>
              <div class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase text-gray-400 tracking-widest group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                <GitCompare class="w-3 h-3" />
                {{ project.pairIds.length }} Pairs
              </div>
            </div>

            <!-- Update Info -->
            <div class="md:col-span-3 flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Update</span>
                <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                   <Clock class="w-3 h-3" />
                   {{ formatDate(project.updatedAt) }}
                </span>
              </div>

               <div class="flex items-center gap-1 text-primary-500 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                OPEN
                <ChevronRight class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Inline Actions Area (No longer using Menu) -->
          <div class="relative z-30 ml-4 shrink-0 flex items-center gap-1 opacity-10 sm:opacity-40 group-hover:opacity-100 transition-opacity">
            <button 
              @click.stop="startRename(project)" 
              class="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-500 rounded-xl transition-all"
              title="Rename Base"
            >
              <Edit3 class="w-4 h-4" />
            </button>
            <button 
              @click.stop="emit('duplicate', project.id)" 
              class="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-500 rounded-xl transition-all"
              title="Duplicate Base"
            >
              <Copy class="w-4 h-4" />
            </button>
            
            <!-- Delete Button (Muted if default) -->
            <button 
              @click.stop="project.id !== 'default' && emit('delete', project.id)" 
              class="p-2 rounded-xl transition-all"
              :class="[
                project.id === 'default' 
                  ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed' 
                  : 'text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
              ]"
              :title="project.id === 'default' ? 'System Base (Protected)' : 'Delete Base'"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Inline Add Button -->
        <button 
          @click="emit('create')"
          class="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-primary-500 hover:border-primary-500 hover:bg-white dark:hover:bg-gray-800/20 transition-all duration-300 font-black text-xs uppercase tracking-[0.2em]"
        >
          <Plus class="w-4 h-4 stroke-[3px]" />
          Add New Base
        </button>

        <!-- Inline Live Demo Button -->
        <button 
          @click="handleSetupDemo"
          class="w-full py-4 bg-orange-500/5 dark:bg-orange-500/10 border-2 border-dashed border-orange-200 dark:border-orange-900/30 rounded-2xl flex items-center justify-center gap-3 text-orange-500 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 font-black text-xs uppercase tracking-[0.2em]"
        >
          <Play v-if="!isDemoSettingUp" class="w-4 h-4 fill-orange-500/20" />
          <Loader v-else class="w-4 h-4 animate-spin" />
          {{ $t('common.liveDemo') }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
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
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

.ease-spring {
  transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
