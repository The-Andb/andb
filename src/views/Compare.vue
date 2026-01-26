<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full gap-4">
        <!-- Title & Page Status -->
        <div class="flex items-center gap-4">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
              <GitMerge class="w-5 h-5 mr-2 text-primary-500" />
              {{ $t('common.compare') }}
            </h1>
            <div v-if="activePair && activePair.source && activePair.target" class="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
               <span class="text-blue-500">{{ activePair.source.name }}</span>
               <ArrowRightLeft class="w-3 h-3 mx-2 opacity-50 text-gray-400" />
               <span class="text-green-500">{{ activePair.target.name }}</span>
               <span v-if="hasResults" class="ml-3 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800/30">
                 {{ countSummary }}
               </span>
            </div>
            <p v-else class="text-[10px] text-gray-400 uppercase tracking-widest font-bold italic">{{ $t('compare.noPair') }}</p>
          </div>
        </div>

     <!-- Right Actions & Controls -->
     <div class="flex items-center gap-4">
        <!-- View Mode Switch -->
        <div 
          v-if="!showMigrateModal"
          class="flex items-center gap-3"
        >
          <!-- Segmented Control for View Mode -->
          <div 
            class="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl"
            :class="appStore.buttonStyle === 'minimal' ? 'scale-90' : ''"
          >
              <button 
                @click="viewMode = 'list'" 
                class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200"
                :class="[
                  viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                  appStore.buttonStyle === 'full' ? 'px-3 py-1.5 text-[10px]' : 'px-2 py-1 text-[10px]'
                ]"
                :title="$t('compare.listViewTooltip')"
              >
                <List class="w-3.5 h-3.5" />
                <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{ $t('compare.listView') }}</span>
              </button>
              <button 
                @click="viewMode = 'tree'" 
                class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200"
                :class="[
                  viewMode === 'tree' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                  appStore.buttonStyle === 'full' ? 'px-3 py-1.5 text-[10px]' : 'px-2 py-1 text-[10px]'
                ]"
                :title="$t('compare.treeViewTooltip')"
              >
                <GitMerge class="w-3.5 h-3.5 rotate-90" />
                <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{ $t('compare.treeViewLabel') }}</span>
              </button>
          </div>

          <div v-if="appStore.buttonStyle === 'full'" class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <div v-if="error" class="text-red-500 text-[10px] font-bold uppercase tracking-wider max-w-[150px] truncate" :title="error">{{ error }}</div>

          <button 
            @click="runComparison(true)" 
            :disabled="loading || !activePair"
             class="hidden md:flex items-center justify-center p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all disabled:opacity-50"
            :title="fetchButtonText"
          >
            <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': loading }" />
          </button>

          <button 
            @click="runComparison(false)" 
            :disabled="loading || !activePair"
            class="flex items-center justify-center font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:grayscale"
            :class="[
              appStore.buttonStyle === 'full' ? 'px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs tracking-wide shadow-md active:scale-95 gap-2' : '',
              appStore.buttonStyle === 'minimal' ? 'px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[10px] tracking-wider active:scale-95 shadow-sm gap-2' : '',
              appStore.buttonStyle === 'icons' ? 'w-10 h-10 bg-primary-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95' : ''
            ]"
            :title="$t('compare.runCompareTooltip')"
          >
            <GitCompare v-if="!loading" class="w-4 h-4" />
            <RefreshCw v-else class="w-4 h-4 animate-spin" />
            <span v-if="appStore.buttonStyle !== 'icons'">{{ loading ? $t('compare.comparing') : (appStore.buttonStyle === 'full' ? $t('compare.compare') : $t('compare.compare')) }}</span>
          </button>
       </div>
       
       <!-- Console Toggle -->
       <button 
          @click="consoleStore.toggleVisibility()" 
          class="p-2 rounded-xl text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-transparent"
          :title="$t('console.toggle')"
        >
          <PanelBottom class="w-4 h-4" />
        </button>
     </div>
   </div>
    </template>
        
        <!-- Comparison & Console Split -->
        <div class="flex-1 flex flex-col overflow-hidden relative min-w-0 bg-white dark:bg-gray-950">
          <!-- Comparison Area (Top) -->
          <div class="flex-1 flex overflow-hidden relative min-w-0">
            <main class="flex-1 flex overflow-hidden relative min-w-0">
              <!-- Loading Overlay (Spinner Only) -->
              <!-- Loading Overlay (Spinner Only) -->
              <!-- <div v-if="loading && !hasResults" class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-20 flex items-center justify-center backdrop-blur-sm">
                <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                  <div class="relative w-20 h-20 mx-auto mb-6">
                    <div class="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
                    <div class="absolute inset-0 border-4 border-t-primary-500 rounded-full animate-spin"></div>
                    <div class="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
                  </div>
                  <p class="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">{{ statusMessage || $t('schema.loading') }}</p>
                  <div class="mt-2 text-xs text-gray-500 uppercase tracking-tighter animate-pulse">{{ $t('schema.runningCommands') }}</div>
                </div>
              </div> -->

          <!-- Vertical Split: Object List vs DDL View -->
          <div v-if="viewMode === 'list'" class="flex-1 flex overflow-hidden relative min-w-0">
            <!-- Left: Comparison Results List (Sub-sidebar style) -->
            <div :style="{ width: showMigrateModal ? '60px' : resultsWidth + 'px' }" class="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 flex flex-col shrink-0 relative transition-all duration-300">
              <!-- Results Header with Breadcrumb-like stack navigation -->
              <div class="p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-10 flex items-center shrink-0 justify-center">
                <button 
                  v-if="selectedFilterType !== 'all'"
                  @click="selectedFilterType = 'all'"
                  class="p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                  :class="showMigrateModal ? '' : 'mr-2'"
                  title="Back to Database Overview"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <div class="flex items-center min-w-0" :class="showMigrateModal ? 'justify-center' : 'flex-1'">
                  <span class="text-primary-600 dark:text-primary-400 shrink-0" :class="showMigrateModal ? '' : 'mr-1.5'">
                    <Database v-if="selectedFilterType === 'all'" class="w-3.5 h-3.5" />
                    <component v-else :is="getIconForType(selectedFilterType)" class="w-3.5 h-3.5" />
                  </span>
                  <div v-if="!showMigrateModal" class="flex flex-col min-w-0">
                    <span class="truncate text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">
                      <span v-if="selectedFilterType === 'all'">{{ selectedPath.db || $t('common.database') }} {{ $t('common.overview') }}</span>
                      <span v-else>{{ selectedFilterType }}</span>
                    </span>
                    <span v-if="hasResults" class="text-[8px] text-gray-400 uppercase tracking-tighter">
                      {{ filteredResults.length }} {{ $t('schema.items') }} • {{ filteredTotalChanges }} {{ $t('compare.totalChanges') }}
                    </span>
                  </div>
                </div>
                <!-- Batch Migrate for single type or entire schema -->
                <button 
                  v-if="hasChanges(selectedFilterType) && !showMigrateModal"
                  @click="openBatchMigrateModal(selectedFilterType === 'all' ? 'Schema' : selectedFilterType)"
                  class="ml-auto p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                  :title="selectedFilterType === 'all' ? 'Migrate Entire Schema' : 'Migrate All in this category'"
                >
                  <Zap class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Filter & Search Bar -->
              <div v-if="hasResults && !showMigrateModal" class="p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search class="w-3.5 h-3.5 text-gray-400" />
                  </span>
                  <input 
                    v-model="searchQuery"
                    type="text" 
                    :placeholder="$t('history.searchPlaceholder')"
                    class="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div class="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                  <button 
                    v-for="filter in statusFilters" :key="filter.value"
                    @click="selectedStatusFilter = filter.value"
                    class="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter transition-all whitespace-nowrap"
                    :class="selectedStatusFilter === filter.value 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </div>
              
              <div class="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden p-2">
                <div v-if="!hasResults" class="p-8 text-center text-gray-400 h-full flex flex-col justify-center">
                  <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p v-if="!showMigrateModal" class="text-xs uppercase tracking-widest font-bold">{{ $t('history.noHistory') }}</p>
                </div>

                <!-- OVERVIEW MODE: Stack view of categories or when modal is open -->
                <div v-else-if="selectedFilterType === 'all' || showMigrateModal" class="space-y-2">
                  <div 
                    v-for="cat in resultsByCategory" :key="cat.type"
                    @click="selectedFilterType = cat.type; showMigrateModal = false"
                    class="rounded-xl transition-all cursor-pointer group flex flex-col relative"
                    :class="showMigrateModal 
                      ? 'p-2 justify-center hover:bg-gray-100 dark:hover:bg-gray-800' 
                      : 'p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-500/30'"
                    :title="showMigrateModal ? `${cat.type} (${cat.items.length})` : ''"
                  >
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center min-w-0" :class="showMigrateModal ? 'justify-center w-full' : ''">
                        <div class="rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-transform group-hover:scale-110 relative" :class="showMigrateModal ? 'p-2' : 'p-2 mr-3'">
                          <component :is="getIconForType(cat.type)" />
                          <!-- Collapsed Badge -->
                          <div v-if="showMigrateModal && cat.changes > 0" class="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-bold shadow-sm ring-2 ring-white dark:ring-gray-900 z-10">
                            {{ cat.changes }}
                          </div>
                        </div>
                        <div v-if="!showMigrateModal" class="min-w-0">
                          <div class="font-bold text-gray-900 dark:text-white uppercase text-[10px] tracking-widest">{{ cat.type }}</div>
                          <div class="text-[10px] text-gray-400">{{ cat.items.length }} items</div>
                        </div>
                      </div>
                      <div v-if="!showMigrateModal" class="flex items-center gap-3">
                        <button 
                          v-if="cat.changes > 0"
                          @click.stop.prevent="openBatchMigrateModal(cat.type)"
                          class="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-600 hover:shadow-md dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50 dark:hover:bg-orange-600 dark:hover:text-white transition-all group/badge shadow-sm"
                          title="Click to Migrate All Changes"
                        >
                          <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-900/50 rounded w-4 h-4 group-hover/badge:bg-white/20 group-hover/badge:text-white transition-colors">
                            <Zap class="w-2.5 h-2.5 fill-current" />
                          </div>
                          <span class="font-bold text-[10px] tracking-wider">{{ cat.changes }}</span>
                        </button>
                        <ChevronRight class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-all group-hover:translate-x-0.5" />
                      </div>
                    </div>
                    <!-- Micro progress bar -->
                    <div v-if="!showMigrateModal" class="mt-3 h-1.5 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden flex ring-1 ring-inset ring-black/5">
                      <div 
                        class="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                        :style="{ width: (cat.changes / cat.items.length * 100) + '%' }"
                      ></div>
                      <div 
                        class="h-full bg-gray-200 dark:bg-gray-600" 
                        :style="{ width: ((cat.items.length - cat.changes) / cat.items.length * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- LIST MODE: Flat list of objects in category -->
                <div v-else class="space-y-1">
                  <div v-for="item in filteredResults" :key="item.name" 
                    @click="selectItem(item)"
                    class="cursor-pointer rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center group"
                    :class="[
                      showMigrateModal ? 'p-2 justify-center' : 'p-2.5 justify-between',
                      { 'bg-white dark:bg-gray-800 shadow-sm border border-primary-500/20 ring-1 ring-primary-500/10': selectedItem?.name === item.name }
                    ]"
                  >
                    <div class="min-w-0" :class="showMigrateModal ? '' : 'pr-2'">
                      <div v-if="!showMigrateModal" class="text-[12px] font-mono truncate text-gray-900 dark:text-gray-100" :class="{ 'font-bold': selectedItem?.name === item.name }" :title="item.name">
                        {{ item.name }}
                      </div>
                      <div class="text-[9px] text-gray-400 uppercase tracking-tighter flex items-center">
                        <component :is="getIconForType(item.type)" class="mr-1" :class="showMigrateModal ? 'w-4 h-4' : 'w-2.5 h-2.5'" :title="showMigrateModal ? item.name : ''" />
                        <span v-if="!showMigrateModal">{{ item.type }}</span>
                      </div>
                    </div>
                    <div v-if="!showMigrateModal" class="flex items-center justify-center w-6 h-6 shrink-0 group/status">
                      <!-- Always show status icon if identical -->
                      <component 
                        v-if="item.status === 'equal' || item.status === 'same'"
                        :is="getStatusIcon(item.status)" 
                        class="w-4 h-4 transition-all"
                        :class="getStatusClass(item.status)"
                        :title="getStatusText(item.status)"
                      />
                      <!-- Show status icon by default, swap to Zap on hover if can migrate -->
                      <template v-else>
                        <component 
                          :is="getStatusIcon(item.status)" 
                          class="w-4 h-4 transition-all group-hover/status:hidden"
                          :class="getStatusClass(item.status)"
                        />
                        <Zap 
                          @click.stop="openMigrateModal(item)"
                          class="w-4 h-4 text-primary-500 hidden group-hover/status:block cursor-pointer hover:scale-125 hover:drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] active:scale-95 animate-in fade-in zoom-in-75 duration-200"
                          title="Click to Migrate"
                        />
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resize Handle -->
              <div 
                @mousedown="startResultsResize"
                class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-20"
              ></div>
            </div>

            <!-- Right: Split DDL Detail -->
            <div class="flex-1 flex flex-col bg-white dark:bg-gray-950 relative min-w-0">
               <!-- Migration Overlay -->
               <MigrationConfirm
                  v-if="showMigrateModal"
                  :is-open="showMigrateModal"
                  :loading="isMigrating"
                  :item="migratingItem"
                  :source-name="sourceName"
                  :target-name="targetName"
                  :sql-script="migrationSql"
                  :sql-map="migrationSqlMap"
                  :fetching-sql="fetchingMigrationSql"
                  @close="showMigrateModal = false"
                  @confirm="confirmMigration"
                />

              <div v-if="selectedItem" class="h-full flex flex-col">
                <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                  <div class="flex items-center text-xs space-x-2 overflow-hidden">
                    <div class="flex items-center text-gray-500 dark:text-gray-400">
                      <Server class="w-3.5 h-3.5 mr-1" />
                      <span class="truncate">{{ selectedPath.env }}</span>
                    </div>
                    <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div class="flex items-center text-gray-500 dark:text-gray-400">
                      <Database class="w-3.5 h-3.5 mr-1" />
                      <span class="truncate">{{ selectedPath.db }}</span>
                    </div>
                    <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div class="flex items-center text-gray-600 dark:text-gray-300 font-bold">
                      <component :is="getIconForType(selectedItem.type)" class="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span class="uppercase">{{ selectedItem.type }}</span>
                    </div>
                    <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div class="flex items-center">
                      <span class="font-bold text-gray-900 dark:text-white truncate text-sm">{{ selectedItem.name }}</span>
                    </div>
                    <span :class="getStatusClass(selectedItem.status)" class="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-opacity-10 font-black border uppercase tracking-tighter" :style="{ borderColor: 'currentColor' }">
                      {{ getStatusText(selectedItem.status) }}
                    </span>
                  </div>
                  <div class="flex space-x-2 items-center">
                    <button 
                      v-if="selectedItem.status !== 'equal' && selectedItem.status !== 'same'"
                      @click="openMigrateModal(selectedItem)" 
                      class="btn btn-primary py-1.5 px-4 text-[11px] h-9 flex items-center gap-2 group overflow-hidden relative shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                      :disabled="isMigrating"
                    >
                      <Zap class="w-4 h-4 group-hover:animate-pulse" />
                      <span class="font-bold">{{ $t('compare.migrateTo', { name: targetName }) }}</span>
                      <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 linear skew-x-[-20deg]"></div>
                    </button>
                    <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button @click="openDetailModal(selectedItem)" class="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm" :title="$t('compare.viewFullDefinition')">
                      <ScanSearch class="w-4.5 h-4.5 font-bold" />
                    </button>
                  </div>
                </div>
                <div class="flex-1 flex flex-col min-h-0 min-w-0">
                  <MirrorDiffView 
                    :source-ddl="selectedItem.diff?.source"
                    :target-ddl="selectedItem.diff?.target"
                    :source-label="sourceName"
                    :target-label="targetName"
                    :status="selectedItem.status"
                  />
                </div>
              </div>
              <div v-else class="flex-1 flex items-center justify-center text-gray-400 italic">
                <div class="text-center">
                  <MousePointer2 class="w-12 h-12 mx-auto mb-2 opacity-10" />
                  <p>{{ $t('schema.selectObject') }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tree Mode View -->
          <div v-else class="flex-1 relative">
             <CompareTreeMode 
               :results="allResults"
               :source-name="sourceName"
               :target-name="targetName"
               v-model:active-type="selectedFilterType"
               @migrate="openMigrateModal"
             />
          </div>

        </main>
      </div>
    </div>
  </MainLayout>

    <!-- Modals & Notifications -->
    <DDLDetailModal
      :is-open="showDetailModal"
      :item="selectedItem"
      @close="closeDetailModal"
      @apply="handleApplyFromDetail"
    />

</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import DDLDetailModal from '@/components/ddl/DDLDetailModal.vue'
import MirrorDiffView from '@/components/compare/MirrorDiffView.vue'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useConsoleStore } from '@/stores/console'
import Andb from '@/utils/andb'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  RefreshCw, 
  ScanSearch, 
  MousePointer2,
  ChevronRight,
  Database,
  Server,
  Table,
  Layers,
  Hammer,
  Zap,
  ChevronLeft,
  CheckCircle2,
  PlusCircle,
  XCircle,
  AlertCircle,
  Search,
  List,
  GitMerge,
  ArrowRightLeft,
  GitCompare
} from 'lucide-vue-next'
import MigrationConfirm from '@/components/compare/MigrationConfirm.vue'
import { useOperationsStore } from '@/stores/operations'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import CompareTreeMode from '@/components/compare/CompareTreeMode.vue'

const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()
const operationsStore = useOperationsStore()
const consoleStore = useConsoleStore()
const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()
const { t } = useI18n()

const activePair = computed(() => connectionPairsStore.activePair)
const sourceName = computed(() => activePair.value?.source?.name || 'Source')
const targetName = computed(() => activePair.value?.target?.name || 'Target')

const route = useRoute()
const router = useRouter() // Ensure router is available

const projectsStore = useProjectsStore()

// Watch for project changes to reset state
watch(() => projectsStore.selectedProjectId, () => {
  tableResults.value = []
  procedureResults.value = []
  functionResults.value = []
  viewResults.value = []
  triggerResults.value = []
  selectedItem.value = null
  selectedFilterType.value = 'all'
  error.value = null
})

// Deep Link Handling
onMounted(async () => {
    // Check for pairId in query
    if (route.query.pairId) {
        // Wait for store to load
        if (connectionPairsStore.connectionPairs.length === 0) {
            await connectionPairsStore.reloadData()
        }
        connectionPairsStore.selectPair(route.query.pairId as string)
    }

    // Check for action=new (Auto Run)
    if (route.query.action === 'new') {
        // Wait a bit for stores to sync activePair from the selectPair call above
        await nextTick()
        
        // If we have an active pair, run valid comparison immediately
        if (activePair.value) {
           runComparison(true)
        } else {
            // Retry once after another tick if store was slow
            await nextTick()
            if (activePair.value) runComparison(true)
            else {
                notificationStore.add({
                    type: 'info',
                    title: 'New Comparison',
                    message: 'Please select a Connection Pair to start comparison.'
                })
            }
        }
        
        // Clean URL
        router.replace({ query: { ...route.query, action: undefined } })
    }
})

const viewMode = ref<'list' | 'tree'>('list')

const fetchButtonText = computed(() => {
    if (loading.value) return t('schema.fetching')
    
    if (selectedItem.value) {
        const type = selectedItem.value.type.toLowerCase()
        let singularType = type.endsWith('s') ? type.slice(0, -1) : type
        if (type === 'procedures') singularType = 'procedure'
        return `FETCH THIS ${singularType.toUpperCase()}`
    }
    
    // If category filtered
    if (selectedFilterType.value && selectedFilterType.value !== 'all') {
        return `FETCH ALL ${selectedFilterType.value.toUpperCase()}`
    }

    if (appStore.buttonStyle === 'full') return t('compare.fetchFromDB')
    return t('compare.fetch')
})



const typeIcons = {
  tables: Table,
  views: Layers,
  procedures: Hammer,
  functions: Hammer,
  triggers: Zap
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase() as keyof typeof typeIcons
  return typeIcons[key] || Database
}

// State
const loading = ref(false)
const statusMessage = ref('')
const resultsWidth = ref(300)
const error = ref<string | null>(null)
const tableResults = ref<any[]>([])
const procedureResults = ref<any[]>([])
const functionResults = ref<any[]>([])
const viewResults = ref<any[]>([])
const triggerResults = ref<any[]>([])
const selectedItem = ref<any>(null)
const showDetailModal = ref(false)
const selectedFilterType = ref<string>('all')
const searchQuery = ref('')
const selectedStatusFilter = ref('all')

const statusFilters = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('compare.filters.modified'), value: 'modified' },
  { label: t('compare.filters.new'), value: 'new' },
  { label: t('compare.filters.deprecated'), value: 'deprecated' },
  { label: t('compare.filters.identical'), value: 'equal' }
])

// Migration State
const isMigrating = ref(false)
const showMigrateModal = ref(false)
const migratingItem = ref<any>(null)
const migrationSql = ref('')
const migrationSqlMap = ref<Record<string, string>>({})
const fetchingMigrationSql = ref(false)
const batchType = ref<string | null>(null)

const hasChanges = (type: string) => {
  return allResults.value.some(i => (type === 'all' || i.type.toLowerCase() === type.toLowerCase()) && i.status !== 'equal' && i.status !== 'same')
}

const selectedPath = ref({
  env: '',
  db: '',
  type: ''
})

// View State
const isResizingResults = ref(false)

const startResultsResize = () => {
  isResizingResults.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}

const handleResize = (e: MouseEvent) => {
  if (isResizingResults.value) {
    resultsWidth.value = Math.max(200, Math.min(800, resultsWidth.value + e.movementX))
  }
}

const stopResize = () => {
  isResizingResults.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}

const allResults = computed(() => {
  const all = [
    ...tableResults.value.map(i => ({ ...i, type: 'tables' })),
    ...procedureResults.value.map(i => ({ ...i, type: 'procedures' })),
    ...functionResults.value.map(i => ({ ...i, type: 'functions' })),
    ...viewResults.value.map(i => ({ ...i, type: 'views' })),
    ...triggerResults.value.map(i => ({ ...i, type: 'triggers' }))
  ]
  
  return all.sort((a, b) => {
    // Sort by status priority: different/updated > missing/new > equal/same
    const getPriority = (s: string) => {
      s = s?.toLowerCase()
      if (s === 'different' || s === 'updated' || s === 'modified') return 0
      if (s === 'missing_in_target' || s === 'new' || s === 'missing') return 1
      if (s === 'missing_in_source' || s === 'deprecated') return 2
      if (s === 'equal' || s === 'same') return 3
      return 4
    }
    
    const priA = getPriority(a.status)
    const priB = getPriority(b.status)
    
    if (priA !== priB) return priA - priB
    return a.name.localeCompare(b.name)
  })
})

const filteredResults = computed(() => {
  let filtered = allResults.value

  // Filter by category
  if (selectedFilterType.value !== 'all') {
    filtered = filtered.filter(i => i.type === selectedFilterType.value)
  }

  // Filter by status
  if (selectedStatusFilter.value !== 'all') {
    const filter = selectedStatusFilter.value
    filtered = filtered.filter(i => {
      const status = i.status.toLowerCase()
      if (filter === 'modified') return status === 'modified' || status === 'different' || status === 'updated'
      if (filter === 'new') return status === 'new' || status === 'missing_in_target'
      if (filter === 'deprecated') return status === 'deprecated' || status === 'missing_in_source'
      if (filter === 'equal') return status === 'equal' || status === 'same'
      return true
    })
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(i => i.name.toLowerCase().includes(query))
  }

  return filtered
})

const hasResults = computed(() => allResults.value.length > 0)
const totalChanges = computed(() => allResults.value.filter(i => i.status !== 'equal' && i.status !== 'same').length)
const filteredTotalChanges = computed(() => filteredResults.value.filter(i => i.status !== 'equal' && i.status !== 'same').length)

const resultsByCategory = computed(() => {
  const categories = ['tables', 'views', 'procedures', 'functions', 'triggers']
  return categories.map(cat => {
    const items = allResults.value.filter(i => i.type === cat)
    return {
      type: cat,
      items,
      changes: items.filter(i => i.status !== 'equal' && i.status !== 'same').length
    }
  }).filter(c => c.items.length > 0)
})

const countSummary = computed(() => {
  const total = allResults.value.length
  const changes = totalChanges.value
  return `${changes} changes, ${total - changes} identical`
})

// Actions
const runComparison = async (refresh: boolean = false) => {
  if (!activePair.value) return
  
  loading.value = true
  // consoleStore.setVisibility(true) // Only open console on manual run/error, not initial load
  statusMessage.value = t('compare.initializing')
  consoleStore.clearLogs()
  error.value = null

  try {
    const { source, target } = activePair.value
    
    let objTypes: ('tables' | 'procedures' | 'functions' | 'triggers' | 'views')[] = ['tables', 'procedures', 'functions', 'triggers', 'views']
    let compareName: string | undefined = undefined

    // Atomic Compare Logic
    if (selectedItem.value) {
      // 1. Compare specific object
      objTypes = [selectedItem.value.type.toLowerCase()] // e.g., 'tables'
      compareName = selectedItem.value.name
      consoleStore.addLog(`Comparing single object: ${selectedItem.value.name} (${selectedItem.value.type})`, 'info')
      statusMessage.value = t('compare.analyzingItem', { name: selectedItem.value.name })
    } else if (selectedFilterType.value && selectedFilterType.value !== 'all') {
      // 2. Compare specific category
      objTypes = [selectedFilterType.value.toLowerCase() as any]
      consoleStore.addLog(`Comparing category: ${selectedFilterType.value}`, 'info')
      statusMessage.value = t('compare.analyzingItem', { name: selectedFilterType.value })
    } else {
      consoleStore.addLog(`Starting comparison between ${source.name} (${source.host}) and ${target.name} (${target.host})`, 'info')
      statusMessage.value = t('compare.analyzing')
    }
    
    // 1. Export Source and Target DDLs (Only if refreshing)
    // 1. Export Source and Target DDLs (Only if refreshing)
    if (refresh) {
      consoleStore.setVisibility(true)
      
      // POWERFUL FETCH: Clear cache if doing a full fetch to ensure fresh data
      if (!selectedItem.value && (!selectedFilterType.value || selectedFilterType.value === 'all')) {
         statusMessage.value = t('compare.cleaning')
         consoleStore.addLog('Cleaning up local cache for fresh fetch...', 'warn')
         await Promise.all([
           Andb.clearConnectionData(source),
           Andb.clearConnectionData(target)
         ])
      }

      statusMessage.value = t('compare.exporting')
      
      for (const type of objTypes) {
        const cmdS = `andb export --source ${source.environment} --type ${type}` + (compareName ? ` --name ${compareName}` : '')
        consoleStore.addLog(cmdS, 'cmd')
        const cmdT = `andb export --source ${target.environment} --type ${type}` + (compareName ? ` --name ${compareName}` : '')
        consoleStore.addLog(cmdT, 'cmd')
      }
      
      // Parallelize exports
      await Promise.all([
        ...objTypes.map(type => Andb.export(source, target, { 
          type, 
          environment: source.environment,
          name: compareName
        })),
        ...objTypes.map(type => Andb.export(source, target, { 
          type, 
          environment: target.environment,
          name: compareName
        }))
      ])
    }
    
    // 2. Compare (Always run to update comparison results from local cache)
    statusMessage.value = t('compare.comparingObjects')
    
    // Start recording operation
    const opId = operationsStore.addOperation({
      type: 'compare',
      sourceEnv: source.environment,
      targetEnv: target.environment,
      status: 'pending',
      startTime: new Date()
    })

    const results = await Promise.all(objTypes.map(type => 
      Andb.compare(source, target, { 
        type, 
        sourceEnv: source.environment, 
        targetEnv: target.environment,
        name: compareName
      })
    ))

    // Map results based on what we fetched
    objTypes.forEach((type, index) => {
      const res = Array.isArray(results[index]) ? results[index] : []
      if (type === 'tables') tableResults.value = res
      if (type === 'procedures') procedureResults.value = res
      if (type === 'functions') functionResults.value = res
      if (type === 'views') viewResults.value = res
      if (type === 'triggers') triggerResults.value = res
    })
    
    const totalCount = tableResults.value.length + procedureResults.value.length + functionResults.value.length + viewResults.value.length + triggerResults.value.length
    
    // Complete operation record
    operationsStore.completeOperation(opId, true, { ddlCount: totalCount })

    // Sync to Sidebar Store
    sidebarStore.setComparisonResults(allResults.value)
    sidebarStore.triggerRefresh()

    consoleStore.addLog('Comparison completed successfully', 'success')
  } catch (e: any) {
    error.value = e.message || 'Comparison failed'
    consoleStore.addLog(`Comparison failed: ${e.message}`, 'error')
    notificationStore.add({
      type: 'error',
      title: 'Comparison Failed',
      message: e.message
    })
  } finally {
    // 5. Update Sidebar to show new objects
    await sidebarStore.loadSchemas(true)
    
    loading.value = false
  }
}

const selectItem = (item: any) => {
  selectedItem.value = item
  showMigrateModal.value = false
}

const handleObjectSelected = (event: any) => {
  const { env, db, name, type } = event.detail
  
  selectedPath.value = { env, db, type }
  
  // Normalize type (ensure plural)
  const normalizedType = type.endsWith('s') ? type : type + 's'
  
  const found = allResults.value.find(i => 
    i.name === name && 
    (i.type === normalizedType || i.type === type)
  )
  
  if (found) {
    selectedItem.value = found
    // Ensure selected type matches the item type
    selectedFilterType.value = 'all' 
  } else {
    // If NOT found, it might be because comparison hasn't run or item is new/missing
    // Let's trigger a LOCAL comparison first to check cache
    consoleStore.addLog(`Object ${name} not in current results. Triggering local comparison...`, 'info')
    runComparison(false).then(() => {
       const retryFound = allResults.value.find(i => i.name === name)
       if (retryFound) selectedItem.value = retryFound
    })
  }
}

const handleCategorySelected = (event: any) => {
  const { env, db, type } = event.detail
  selectedFilterType.value = type
  selectedPath.value = { env, db, type }
  
  // Clear diff view when category is selected
  selectedItem.value = null
  
  // If we have literally 0 results for this category after selection, 
  // maybe we should auto-trigger a comparison?
  const hasTypeResults = allResults.value.some(i => i.type.toLowerCase() === type.toLowerCase())
  if (type !== 'all' && !hasTypeResults) {
    consoleStore.addLog(`No results for ${type}. Auto-triggering comparison...`, 'info')
    runComparison(false)
  }
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return CheckCircle2
    case 'new':
    case 'missing_in_target':
      return PlusCircle
    case 'deprecated':
    case 'missing_in_source':
      return XCircle
    case 'modified':
    case 'different':
    case 'updated':
      return AlertCircle
    default:
      return AlertCircle
  }
}

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return 'text-teal-600 dark:text-teal-400 font-bold' 
    case 'new':
    case 'missing_in_target':
      return 'text-emerald-500 dark:text-emerald-400 drop-shadow-sm font-bold'
    case 'deprecated':
    case 'missing_in_source':
      return 'text-rose-500 dark:text-rose-400 drop-shadow-sm font-bold'
    case 'modified':
    case 'different':
    case 'updated':
      return 'text-amber-500 dark:text-amber-400 drop-shadow-sm font-bold'
    default:
      return 'text-gray-400'
  }
}

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same': return t('common.status.identical')
    case 'different':
    case 'updated':
    case 'modified': return t('common.status.modified')
    case 'missing_in_target':
    case 'new': return t('common.status.newSource')
    case 'missing_in_source':
    case 'deprecated': return t('common.status.deprecatedTarget')
    default: return status
  }
}

const openDetailModal = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
}

// Migration Actions
const openMigrateModal = async (item: any) => {
  console.log('[Compare] openMigrateModal for item:', item.name, item.status)
  consoleStore.addLog(`Preparing migration for ${item.name} (${item.type})...`, 'info')
  
  migratingItem.value = item
  batchType.value = null
  migrationSql.value = ''
  showMigrateModal.value = true
  
  // 1. If item already has generated DDL (from comparison), use it immediately!
  const hasExistingDdl = item.ddl && (Array.isArray(item.ddl) ? item.ddl.length > 0 : !!item.ddl)
  if (hasExistingDdl) {
    console.log('[Compare] Using existing DDL from item:', item.ddl)
    migrationSql.value = Array.isArray(item.ddl) ? item.ddl.join('\n') : item.ddl
    consoleStore.addLog(`Using pre-generated SQL for ${item.name}`, 'success')
    return
  }

  // 2. Otherwise, if it's an individual item, try to fetch/generate SQL
  if (!item.isBatch && activePair.value) {
    fetchingMigrationSql.value = true
    try {
      const { source, target } = activePair.value
      let status: 'NEW' | 'UPDATED' | 'DEPRECATED' = 'NEW'
      if (item.status === 'modified' || item.status === 'different' || item.status === 'updated') status = 'UPDATED'
      if (item.status === 'deprecated' || item.status === 'missing_in_source') status = 'DEPRECATED'
      
      console.log('[Compare] Fetching dry-run SQL for:', item.name, 'with status:', status)
      
      const result = await Andb.migrate(source, target, {
        type: item.type as any,
        sourceEnv: source.environment,
        targetEnv: target.environment,
        name: item.name,
        status: status,
        dryRun: true // DRY RUN to get SQL
      })
      
      console.log('[Compare] Dry run raw result:', result)
      
      let sql = ''
      if (result !== null && result !== undefined && result !== '') {
        // Robust parsing of dry-run result
        if (typeof result === 'string') {
          sql = result
        } else if (typeof result === 'number') {
          // If it's a number (like 0), it's probably NOT the SQL unless the SQL is just '0'
          sql = '' 
        } else if (Array.isArray(result)) {
          sql = result.join('\n')
        } else {
          // Object results
          const rawData = result.data || result
          if (typeof rawData === 'string') {
            sql = rawData
          } else if (rawData.sql) {
            sql = rawData.sql
          } else if (rawData.script) {
            sql = rawData.script
          } else if (Array.isArray(rawData)) {
            sql = rawData.join('\n')
          } else if (rawData.ddl) {
            sql = Array.isArray(rawData.ddl) ? rawData.ddl.join('\n') : rawData.ddl
          }
        }
      }
      
      migrationSql.value = sql
      
      if (migrationSql.value) {
        consoleStore.addLog(`Successfully fetched SQL preview for ${item.name}`, 'success')
      } else {
        console.log('[Compare] Dry run returned no content. Trying fallbacks...')
        consoleStore.addLog(`No direct SQL from dry-run for ${item.name}, checking fallbacks...`, 'info')
      }
      
      // Extended Fallbacks
      if (!migrationSql.value) {
        // PRIORITY 1: Use pre-generated ALTER ddl from item (from comparison result)
        const cachedAlter = item.ddl && (Array.isArray(item.ddl) ? item.ddl.join('\n') : item.ddl)
        if (status === 'UPDATED' && cachedAlter) {
          console.log('[Compare] Fallback: Using cached ALTER statement from comparison')
          migrationSql.value = cachedAlter
        } 
        // PRIORITY 2: New items get Source DDL
        else if (status === 'NEW' && item.diff?.source) {
          console.log('[Compare] Fallback: Using Source DDL for NEW item')
          migrationSql.value = Array.isArray(item.diff.source) ? item.diff.source.join('\n') : item.diff.source
        } 
        // PRIORITY 3: Deprecated items get DROP
        else if (status === 'DEPRECATED') {
          console.log('[Compare] Fallback: Generating DROP for DEPRECATED item')
          const objectType = item.type.toLowerCase().replace(/s$/, '').toUpperCase()
          migrationSql.value = `DROP ${objectType} IF EXISTS \`${item.name}\`;`
        } 
        // PRIORITY 4: Worst case fallback for UPDATED (Show warning and Source DDL)
        else if (status === 'UPDATED' && item.diff?.source) {
          console.log('[Compare] Fallback: No ALTER found, showing Source DDL as warning')
          const sourceCode = Array.isArray(item.diff.source) ? item.diff.source.join('\n') : item.diff.source
          migrationSql.value = `-- Warning: No ALTER script generated. Displaying new full DDL:\n\n${sourceCode}`
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch migration SQL preview:', e)
      consoleStore.addLog(`Error fetching preview: ${e.message}`, 'error')
    } finally {
      fetchingMigrationSql.value = false
    }
  }
}

const openBatchMigrateModal = (type: string) => {
  console.log('[Compare] openBatchMigrateModal called with type:', type)
  consoleStore.addLog(`Opening batch migration for ${type}`, 'info')
  
  batchType.value = type
  
  // Collect all items that will be migrated
  let itemsToMigrate = []
  if (type === 'Schema') {
    itemsToMigrate = allResults.value.filter(i => i.status !== 'equal' && i.status !== 'same')
  } else {
    itemsToMigrate = allResults.value.filter(i => 
      i.type.toLowerCase() === type.toLowerCase() && 
      i.status !== 'equal' && 
      i.status !== 'same'
    )
  }

  console.log('[Compare] Items to migrate:', itemsToMigrate.length)
  consoleStore.addLog(`Found ${itemsToMigrate.length} items to migrate`, 'info')

  migratingItem.value = {
    name: `All ${type}`,
    type: type,
    isBatch: true,
    items: itemsToMigrate
  }
  
  // Populate migration SQL for batch preview (Combined)
  migrationSql.value = itemsToMigrate.map(i => {
    let sql = Array.isArray(i.ddl) ? i.ddl.join('\n') : i.ddl
    
    // Fallback for New items
    const isNew = i.status === 'new' || i.status === 'missing_in_target'
    if (!sql && isNew && i.diff?.source) {
       sql = Array.isArray(i.diff.source) ? i.diff.source.join('\n') : i.diff.source
    }
    
    // Fallback for Deprecated items
    const isDeprecated = i.status === 'deprecated' || i.status === 'missing_in_source'
    if (!sql && isDeprecated) {
       const objectType = i.type.toLowerCase().replace(/s$/, '').toUpperCase()
       sql = `DROP ${objectType} IF EXISTS \`${i.name}\`;`
    }
    
    const finalSql = `-- OBJECT: ${i.name} (${i.type})\n${sql || '-- No SQL script available'}`
    
    // Populate Map for individual selection
    migrationSqlMap.value[`${i.type}-${i.name}`] = finalSql
    
    return finalSql
  }).join('\n\n')

  showMigrateModal.value = true
}

const confirmMigration = async () => {
  if (!activePair.value || !migratingItem.value) return
  
  const item = migratingItem.value
  isMigrating.value = true
  
  try {
    const { source, target } = activePair.value
    
    // Start recording operation
    const opId = operationsStore.addOperation({
      type: 'migrate',
      sourceEnv: source.environment,
      targetEnv: target.environment,
      status: 'pending',
      startTime: new Date()
    })

    try {
      if (batchType.value) {
        // Batch Migration
        const type = batchType.value.toLowerCase()
        
        const ddlTypes = type === 'schema' 
          ? ['tables', 'views', 'procedures', 'functions', 'triggers']
          : [type]
        
        // For batch migration, we sync everything: New, Updated, and Deprecated
        const statuses: ('NEW' | 'UPDATED' | 'DEPRECATED')[] = ['NEW', 'UPDATED', 'DEPRECATED']
        
        const resultsMap: Record<string, any> = {
          tables: tableResults,
          procedures: procedureResults,
          functions: functionResults,
          views: viewResults,
          triggers: triggerResults
        }

        for (const ddlType of ddlTypes) {
          // 1. Migrate all changes for this type
          for (const status of statuses) {
            await Andb.migrate(source, target, {
              type: ddlType as any,
              sourceEnv: source.environment,
              targetEnv: target.environment,
              status: status
            })
          }
          
          // 2. Export Target (Atomic for Category)
          await Andb.export(source, target, {
            type: ddlType as any,
            environment: target.environment
          })
          
          // 3. Compare (Atomic for Category)
          const results = await Andb.compare(source, target, {
            type: ddlType as any,
            sourceEnv: source.environment,
            targetEnv: target.environment
          })
          
          // 4. Update UI State immediately
          if (Array.isArray(results) && resultsMap[ddlType]) {
             resultsMap[ddlType].value = results.map(r => ({ ...r, type: ddlType.endsWith('s') ? ddlType : ddlType + 's' }))
             
             // If selected item is in this category, try to refresh it or deselect if gone
             if (selectedItem.value && selectedItem.value.type === ddlType) {
               const found = results.find((r: any) => r.name === selectedItem.value.name)
               if (found) {
                 selectedItem.value = { ...found, type: ddlType }
               } else {
                 // Item might have been deleted/renamed (though rare in migrate), or status changed to equal and filter hides it
                 // We keep it selected but update content
               }
             }
          }
        }

        notificationStore.add({
          type: 'success',
          title: 'Batch Migration Successful',
          message: `${type === 'schema' ? 'Entire schema' : 'All ' + batchType.value} has been migrated and verified.`
        })
      } else {
        // Individual Migration
        let status: 'NEW' | 'UPDATED' | 'DEPRECATED' = 'NEW'
        if (item.status === 'modified' || item.status === 'different' || item.status === 'updated') status = 'UPDATED'
        if (item.status === 'deprecated' || item.status === 'missing_in_source') status = 'DEPRECATED'
        
        await Andb.migrate(source, target, {
          type: item.type as any,
          sourceEnv: source.environment,
          targetEnv: target.environment,
          name: item.name,
          status: status
        })
        
        // Atomic Verification
        await applyAtomicVerify(item)
        
        notificationStore.add({
          type: 'success',
          title: 'Migration Successful',
          message: `${item.name} (${item.type}) has been migrated and verified.`
        })
      }
      
      showMigrateModal.value = false
      
      // Update Sidebar with new results
      sidebarStore.setComparisonResults(allResults.value)
      sidebarStore.triggerRefresh()

      // Complete operation record
      operationsStore.completeOperation(opId, true)
    } catch (e: any) {
      operationsStore.completeOperation(opId, false, { error: e.message })
      throw e
    }
  } catch (e: any) {
    notificationStore.add({
      type: 'error',
      title: 'Migration Failed',
      message: e.message || 'An unknown error occurred during migration.'
    })
    if (window.electronAPI) {
      window.electronAPI.log.send('error', `Migration failed for ${item.name}`, e.message)
    }
  } finally {
    isMigrating.value = false
  }
}

/**
 * Perform atomic export and comparison for a single item
 * and update the local state without re-running full comparison
 */
const applyAtomicVerify = async (item: any) => {
  if (!activePair.value) return
  
  try {
    const { source, target } = activePair.value
    
    // 1. Export atomic (Target only, since source hasn't changed)
    await Andb.export(source, target, {
      type: item.type as any,
      environment: target.environment,
      name: item.name
    })
    
    // 2. Compare atomic
    const results = await Andb.compare(source, target, {
      type: item.type as any,
      sourceEnv: source.environment,
      targetEnv: target.environment,
      name: item.name
    })
    
    if (Array.isArray(results)) {
      const updatedItem = results.find((r: any) => r.name === item.name)
      
      if (!updatedItem) {
        return
      }
      
      // 3. Patch the specific result list
      const resultsMap: Record<string, any> = {
        tables: tableResults,
        procedures: procedureResults,
        functions: functionResults,
        views: viewResults,
        triggers: triggerResults
      }
      
      const listRef = resultsMap[item.type.toLowerCase()]
      if (listRef) {
        const index = listRef.value.findIndex((i: any) => i.name === item.name)
        if (index !== -1) {
          // Update the item in the list using splice for guaranteed reactivity
          const updatedObject = { ...listRef.value[index], ...updatedItem, type: item.type }
          listRef.value.splice(index, 1, updatedObject)
          
          // Update selected item if focused to refresh diff view
          if (selectedItem.value?.name === item.name) {
            selectedItem.value = { ...updatedObject }
          }
        }
      }
    }
  } catch (e: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('warn', `Atomic verify failed for ${item.name}, falling back to full comparison`, e.message)
    }
    // Fallback to full comparison if atomic fails
    await runComparison()
  }
}

const handleApplyFromDetail = (item: any) => {
  showDetailModal.value = false
  openMigrateModal(item)
}

const handleDatabaseRefreshRequested = (e: any) => {
  const { env } = e.detail
  if (activePair.value && (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)) {
    runComparison(true)
  }
}

const handleCategoryRefreshRequested = (e: any) => {
  const { type, env } = e.detail
  if (activePair.value && (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)) {
    selectedFilterType.value = type
    runComparison(true)
  }
}

const handleObjectRefreshRequested = (e: any) => {
  const { name, type, env } = e.detail
  if (activePair.value && (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)) {
    // Select it first so runComparison(true) knows what to refresh atomically
    const normalizedType = type.endsWith('s') ? type : type + 's'
    const item = allResults.value.find(i => i.name === name && i.type === normalizedType)
    if (item) {
      selectedItem.value = item
    } else {
      // If not in local results, at least set the search/filter so it might appear
      selectedFilterType.value = normalizedType
    }
    runComparison(true)
  }
}

// Lifecycle
onMounted(async () => {
  window.addEventListener('category-selected', handleCategorySelected as any)
  window.addEventListener('object-selected', handleObjectSelected as any)
  window.addEventListener('database-refresh-requested', handleDatabaseRefreshRequested as any)
  window.addEventListener('category-refresh-requested', handleCategoryRefreshRequested as any)
  window.addEventListener('object-refresh-requested', handleObjectRefreshRequested as any)
  
  // Trigger local comparison on init (fetch from DB is manual)
  if (activePair.value) {
    runComparison(false)
  }
})

onUnmounted(() => {
  window.removeEventListener('category-selected', handleCategorySelected as any)
  window.removeEventListener('object-selected', handleObjectSelected as any)
  window.removeEventListener('database-refresh-requested', handleDatabaseRefreshRequested as any)
  window.removeEventListener('category-refresh-requested', handleCategoryRefreshRequested as any)
  window.removeEventListener('object-refresh-requested', handleObjectRefreshRequested as any)
})

// Auto-run comparison when sidebar refresh is clicked (Top refresh button)
watch(() => sidebarStore.refreshRequestKey, () => {
  if (route.path === '/compare' && activePair.value) {
    consoleStore.addLog('Sidebar refresh requested: Fetching from DB...', 'info')
    runComparison(true)
  }
})

// Auto-load or Auto-compare on pair change
watch(() => connectionPairsStore.selectedPairId, (newId) => {
  if (newId) {
    // Reset state first
    tableResults.value = []
    procedureResults.value = []
    functionResults.value = []
    viewResults.value = []
    triggerResults.value = []
    selectedItem.value = null // Resets detail view
    
    // Trigger local comparison on pair change
    runComparison(false)
  }
})

</script>
