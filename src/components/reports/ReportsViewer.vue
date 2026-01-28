<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
    
    <!-- Header -->
    <div class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between bg-white dark:bg-[#0F172A]">
      <div class="flex items-center gap-3">
        <button 
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5 text-gray-500" />
        </button>
        <div class="flex flex-col">
          <h2 class="text-sm font-bold uppercase tracking-wider">Reports Viewer</h2>
          <span class="text-[10px] text-gray-500 font-mono">
            {{ selectedReport ? selectedReport.name : 'Select a report' }}
          </span>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          @click="refreshList"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Refresh list"
        >
          <RefreshCw class="w-4 h-4 text-gray-500" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar: Report List -->
      <div class="w-1/4 min-w-[280px] max-w-[350px] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
        <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
          <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">Available Reports</h3>
          <button 
            v-if="reports.length > 0"
            @click="clearAllReports"
            class="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded font-bold uppercase transition-colors"
            title="Delete all reports"
          >
            Clear All
          </button>
        </div>

        <div v-if="reports.length === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-60">
          <FileText class="w-12 h-12 mb-3 text-gray-300" />
          <p class="text-sm">No reports found</p>
          <p class="text-xs text-gray-400 mt-1">Generate a report to see it here</p>
        </div>

        <div v-else class="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            v-for="report in reports"
            :key="report.name"
            @click="selectReport(report)"
            class="w-full text-left p-3 rounded-lg text-sm transition-all duration-200 group border"
            :class="[
              selectedReport?.name === report.name 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            ]"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                :class="selectedReport?.name === report.name ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm'"
              >
                JSON
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate text-gray-900 dark:text-gray-100">
                  {{ report.name.replace('.json', '') }}
                </div>
                <div class="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>{{ formatDate(report.mtime) }}</span>
                  <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span>{{ formatSize(report.size) }}</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Main Content: Report Viewer -->
      <div v-if="isLoadingContent" class="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0B1121]">
        <div class="flex flex-col items-center gap-3">
          <RefreshCw class="w-8 h-8 text-blue-500 animate-spin" />
          <p class="text-sm font-medium text-gray-500">Loading report data...</p>
        </div>
      </div>

      <div v-else-if="reportData" class="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0B1121] p-8">
        <!-- Render Report Content Here -->
        <div class="max-w-7xl mx-auto space-y-8">
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Status -->
                <div class="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sync Status</h4>
                    <div class="text-3xl font-black tracking-tight" :class="isSync ? 'text-emerald-500' : 'text-amber-500'">
                        {{ isSync ? 'In Sync' : 'Divergent' }}
                    </div>
                </div>

                 <!-- New -->
                 <div class="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm group hover:border-emerald-500/50 transition-colors">
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Created Objects</h4>
                    <div class="text-3xl font-black tracking-tight text-emerald-500">{{ stats.new }}</div>
                </div>

                <!-- Updated -->
                <div class="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm group hover:border-blue-500/50 transition-colors">
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Modified Units</h4>
                    <div class="text-3xl font-black tracking-tight text-blue-500">{{ stats.updated }}</div>
                </div>

                <!-- Deprecated -->
                <div class="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm group hover:border-red-500/50 transition-colors">
                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Terminated</h4>
                    <div class="text-3xl font-black tracking-tight text-red-500">{{ stats.deprecated }}</div>
                </div>
            </div>

            <!-- Chart -->
            <div class="bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                 <div id="chart-container" class="w-full h-[400px]"></div>
            </div>

            <!-- Sections -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div v-for="(section, key) in sections" :key="key" class="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    <div class="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 class="text-lg font-bold flex items-center gap-2 uppercase">{{ key }}</h3>
                        <span class="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {{ getSectionLabel(String(key)) }}
                        </span>
                    </div>
                    
                    <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                        <!-- New -->
                        <div class="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                            <h4 class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-4 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> New
                            </h4>
                            <ul v-if="section.NEW && section.NEW.length" class="space-y-1">
                                <li v-for="item in section.NEW" :key="item" class="text-xs font-mono py-1.5 px-2 bg-white/50 dark:bg-black/20 rounded border border-emerald-500/10 dark:border-emerald-500/20 truncate">
                                    {{ item }}
                                </li>
                            </ul>
                            <div v-else class="text-[10px] italic text-slate-400 p-2">No changes detected</div>
                        </div>

                        <!-- Updated -->
                        <div class="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
                            <h4 class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-4 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-blue-500"></span> Updated
                            </h4>
                             <ul v-if="section.UPDATED && section.UPDATED.length" class="space-y-1">
                                <li v-for="item in section.UPDATED" :key="item" class="text-xs font-mono py-1.5 px-2 bg-white/50 dark:bg-black/20 rounded border border-blue-500/10 dark:border-blue-500/20 truncate">
                                    {{ item }}
                                </li>
                            </ul>
                            <div v-else class="text-[10px] italic text-slate-400 p-2">No changes detected</div>
                        </div>

                         <!-- Deprecated -->
                         <div class="bg-red-500/5 rounded-xl p-4 border border-red-500/10">
                            <h4 class="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-4 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-red-500"></span> Deprecated
                            </h4>
                             <ul v-if="section.DEPRECATED && section.DEPRECATED.length" class="space-y-1">
                                <li v-for="item in section.DEPRECATED" :key="item" class="text-xs font-mono py-1.5 px-2 bg-white/50 dark:bg-black/20 rounded border border-red-500/10 dark:border-red-500/20 truncate">
                                    {{ item }}
                                </li>
                            </ul>
                            <div v-else class="text-[10px] italic text-slate-400 p-2">No changes detected</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
      
      <div v-else-if="!isLoadingContent" class="flex-1 flex flex-col items-center justify-center text-gray-400">
         <FileX class="w-12 h-12 mb-3 opacity-50" />
         <p class="text-sm font-medium">Unable to load report content</p>
         <p class="text-xs opacity-70 mt-1">The file may be empty or missing.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { ArrowLeft, RefreshCw, FileText, FileX } from 'lucide-vue-next'
import Highcharts from 'highcharts'

defineEmits(['close'])

const reports = ref<any[]>([])
const isLoading = ref(false)
const isLoadingContent = ref(false)
const selectedReport = ref<any>(null)
const reportData = ref<any>(null)

// Stats
const stats = ref({ new: 0, updated: 0, deprecated: 0 })
const isSync = ref(false)
const sections = ref<any>({})

const formatDate = (date: string) => {
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  const k = 1024
  const sizes = ['KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getSectionLabel = (key: string) => {
    const map: any = {
        'tables': 'Core Storage',
        'views': 'Virtual Schemas',
        'procedures': 'Logic Units',
        'functions': 'Atomic Logic',
        'triggers': 'Event Hooks',
        'events': 'Scheduler'
    }
    return map[key.toLowerCase()] || 'Database Object'
}

const refreshList = async () => {
  isLoading.value = true
  try {
    if ((window as any).electronAPI) {
      const res = await (window as any).electronAPI.getReportList()
      // Response is { success: true, data: [...] }
      if (res.success && Array.isArray(res.data)) {
         reports.value = res.data
      } else {
         reports.value = []
      }
    }
  } catch (e) {
    console.error('Failed to load reports', e)
    reports.value = []
  } finally {
    isLoading.value = false
  }
}

const clearAllReports = async () => {
  if (!confirm('Are you sure you want to delete all generated reports? This cannot be undone.')) return
  
  isLoading.value = true
  try {
    if ((window as any).electronAPI && (window as any).electronAPI.deleteAllReports) {
      await (window as any).electronAPI.deleteAllReports()
      await refreshList()
      selectedReport.value = null
      reportData.value = null
    }
  } catch (e) {
    console.error('Failed to delete reports', e)
  } finally {
    isLoading.value = false
  }
}

const processReportData = (data: any) => {
    // Determine structure. 
    // It likely has keys: tables, views, etc.
    const keys = ['tables', 'views', 'procedures', 'functions', 'triggers', 'events'];
    
    let totalNew = 0;
    let totalUpdated = 0;
    let totalDeprecated = 0;
    
    const processedSections: any = {};
    const chartCategories: string[] = [];
    const chartNew: number[] = [];
    const chartUpdated: number[] = [];
    const chartDeprecated: number[] = [];
    
    // Check if data is wrapped or flat
    // Based on ReportHelper, it seems flat: { tables: {...}, views: {...} }
    
    keys.forEach(key => {
        const item = data[key] || {};
        // Ensure arrays
        const n = Array.isArray(item.NEW) ? item.NEW : [];
        const u = Array.isArray(item.UPDATED) ? item.UPDATED : [];
        const d = Array.isArray(item.DEPRECATED) ? item.DEPRECATED : [];
        
        processedSections[key.toUpperCase()] = {
            NEW: n,
            UPDATED: u,
            DEPRECATED: d
        };
        
        totalNew += n.length;
        totalUpdated += u.length;
        totalDeprecated += d.length;
        
        // Chart data
        chartCategories.push(key.toUpperCase());
        chartNew.push(n.length);
        chartUpdated.push(u.length);
        chartDeprecated.push(d.length);
    });
    
    stats.value = {
        new: totalNew,
        updated: totalUpdated,
        deprecated: totalDeprecated
    };
    
    isSync.value = (totalNew === 0 && totalUpdated === 0 && totalDeprecated === 0);
    sections.value = processedSections;
    
    return {
        categories: chartCategories,
        series: [
            { name: 'New', data: chartNew, color: '#10B981' }, // emerald-500
            { name: 'Updated', data: chartUpdated, color: '#3B82F6' }, // blue-500
            { name: 'Deprecated', data: chartDeprecated, color: '#EF4444' } // red-500
        ]
    };
}

const renderChart = (chartConfig: any) => {
    const el = document.getElementById('chart-container');
    if (!el) return;
    
    Highcharts.chart('chart-container', {
        chart: {
            type: 'bar',
            backgroundColor: 'transparent',
            style: { fontFamily: 'inherit' }
        },
        title: { text: null },
        xAxis: {
            categories: chartConfig.categories,
            title: { text: null },
            gridLineWidth: 1,
            gridLineColor: 'rgba(128,128,128,0.1)',
            lineWidth: 0,
            labels: { style: { color: '#94A3B8', fontSize: '11px', fontWeight: '600' } }
        },
        yAxis: {
            min: 0,
            title: { text: 'OBJECT COUNT', align: 'high', style: { color: '#94A3B8', fontSize: '10px', letterSpacing: '0.1em' } },
            gridLineWidth: 1,
            gridLineColor: 'rgba(128,128,128,0.1)'
        },
        legend: {
             itemStyle: { color: '#94A3B8' },
             itemHoverStyle: { color: '#CBD5E1' }
        },
        credits: { enabled: false },
        plotOptions: {
             bar: {
                 borderRadius: 4,
                 borderWidth: 0,
                 dataLabels: { enabled: true, style: { color: 'contrast', textOutline: 'none' } }
             }
        },
        series: chartConfig.series
    } as any);
}

const selectReport = async (report: any) => {
  if (selectedReport.value?.name === report.name) return
  
  selectedReport.value = report
  isLoadingContent.value = true
  reportData.value = null
  
  try {
    if ((window as any).electronAPI) {
      const res = await (window as any).electronAPI.getReportContent(report.name)
      if (res.success && res.data) {
         reportData.value = res.data;
         
         const chartConfig = processReportData(res.data);
         
         nextTick(() => {
             renderChart(chartConfig);
         });
      } else {
        console.error('Failed to load report data', res.error)
      }
    }
  } catch (e) {
    console.error('Failed to load report content', e)
  } finally {
    isLoadingContent.value = false
  }
}

const props = defineProps({
  isOpen: Boolean
})

// Reload list when opened
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    refreshList()
    selectedReport.value = null
    reportData.value = null
  }
})

onMounted(() => {
  if (props.isOpen) {
    refreshList()
  }
})
</script>
