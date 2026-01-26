<template>
  <div class="h-screen flex flex-col pt-0 bg-white dark:bg-gray-900" :style="{ fontSize: appStore.fontSizes.main + 'px', fontFamily: appStore.fontFamilies.general }">
    <!-- Global Header -->
    <Header />

    <div class="flex-1 flex overflow-hidden">
      <!-- Global Sidebar -->
      <div 
        :style="{ width: displaySidebarWidth + 'px', borderRightWidth: displaySidebarWidth === 0 ? '0' : '1px' }" 
        class="shrink-0 relative transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
      >
        <Sidebar ref="sidebarRef" style="width: 100%" />
        <!-- Sidebar Resizer -->
        <div 
          @mousedown="startSidebarResize"
          class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-20"
        ></div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-gray-950 relative">
        <!-- Toolbar Row (Operational context) -->
        <div v-if="$slots.toolbar || isGlobalLayer" class="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-gray-950/50 backdrop-blur-md z-10">
          <div class="flex-1 flex items-center min-w-0">
            <slot name="toolbar"></slot>
          </div>
          <!-- Console Toggle (Operational Views Only) -->
          <div v-if="isMainOperationTab" class="flex items-center ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
            <button 
              @click="consoleStore.toggleVisibility()" 
              class="p-1.5 rounded-lg transition-colors border border-transparent"
              :class="consoleStore.isVisible ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'"
              :title="$t('console.toggle')"
            >
              <PanelBottom class="w-4 h-4" />
            </button>
          </div>

          <!-- Close Global Layer (Settings/Project Manager) -->
          <div v-else-if="isGlobalLayer" class="flex items-center ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
            <button 
              @click="closeGlobalLayer" 
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent"
              :title="$t('navigation.closeGlobal')"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Content & Console Split -->
        <div class="flex-1 flex flex-col overflow-hidden relative">
          
          <!-- Page Content -->
          <main 
            class="flex-1 flex overflow-hidden relative"
            :style="{ height: consoleStore.isVisible ? `calc(100% - ${consoleStore.height}px)` : '100%' }"
          >
            <slot></slot>
          </main>

          <!-- Console Resizer -->
          <div 
            v-if="consoleStore.isVisible"
            @mousedown="startConsoleResize"
            class="h-1 cursor-row-resize bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 transition-colors z-30 w-full shrink-0"
          ></div>

          <!-- Console Panel -->
          <div 
            v-if="consoleStore.isVisible" 
            class="shrink-0 bg-gray-900 border-t border-gray-700" 
            :style="{ height: consoleStore.height + 'px' }"
          >
            <ConsoleOutput :logs="consoleStore.logs" @clear="consoleStore.clearLogs()" @close="consoleStore.setVisibility(false)" />
          </div>

        </div>
      </div>
    </div>
    
    <Notification ref="notificationRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Header from '@/components/general/Header.vue'
import Sidebar from '@/components/general/Sidebar.vue'
import ConsoleOutput from '@/components/general/ConsoleOutput.vue'
import Notification from '@/components/general/Notification.vue'
import { PanelBottom, X } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useConsoleStore } from '@/stores/console'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const consoleStore = useConsoleStore()
const { t: $t } = useI18n()

const isGlobalLayer = computed(() => {
  const globalRoutes = ['Settings', 'Projects']
  return globalRoutes.includes(String(route.name))
})

const isMainOperationTab = computed(() => {
  const mainRoutes = ['Dashboard', 'Schema', 'Compare', 'History']
  return mainRoutes.includes(String(route.name))
})

const closeGlobalLayer = () => {
  router.push('/')
}

// Sidebar Resizing
const isCollapsed = computed(() => appStore.sidebarCollapsed)
const sidebarWidth = ref(280)
const displaySidebarWidth = computed(() => {
  return isCollapsed.value ? 64 : sidebarWidth.value
})
const isResizingSidebar = ref(false)

const startSidebarResize = () => {
  if (isCollapsed.value) return
  isResizingSidebar.value = true
  document.addEventListener('mousemove', handleSidebarResize)
  document.addEventListener('mouseup', stopSidebarResize)
  document.body.style.cursor = 'col-resize'
}

const handleSidebarResize = (e: MouseEvent) => {
  if (isResizingSidebar.value) {
    sidebarWidth.value = Math.max(160, Math.min(480, e.clientX))
  }
}

const stopSidebarResize = () => {
  isResizingSidebar.value = false
  document.removeEventListener('mousemove', handleSidebarResize)
  document.removeEventListener('mouseup', stopSidebarResize)
  document.body.style.cursor = ''
}

// Console Resizing
const isResizingConsole = ref(false)

const startConsoleResize = () => {
  isResizingConsole.value = true
  document.addEventListener('mousemove', handleConsoleResize)
  document.addEventListener('mouseup', stopConsoleResize)
  document.body.style.cursor = 'row-resize'
}

const handleConsoleResize = (e: MouseEvent) => {
  if (isResizingConsole.value) {
    const containerHeight = window.innerHeight
    const newHeight = Math.max(100, Math.min(containerHeight * 0.8, containerHeight - e.clientY))
    consoleStore.setHeight(newHeight)
  }
}

const stopConsoleResize = () => {
  isResizingConsole.value = false
  document.removeEventListener('mousemove', handleConsoleResize)
  document.removeEventListener('mouseup', stopConsoleResize)
  document.body.style.cursor = ''
}
</script>
