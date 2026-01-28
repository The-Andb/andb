<template>
  <div id="app" class="h-screen bg-gray-50 dark:bg-gray-900">
    <router-view />
    <UpdateModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUpdaterStore } from '@/stores/updater'
import { useConsoleStore } from '@/stores/console'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import Andb from '@/utils/andb'

import UpdateModal from '@/components/general/UpdateModal.vue'

const appStore = useAppStore()
const updaterStore = useUpdaterStore()
const consoleStore = useConsoleStore()
const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()


// Global Refresh Handlers
const handleDatabaseRefreshRequested = async (e: any) => {
  const { env, db } = e.detail
  const conn = appStore.connections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (!conn) return

  try {
    consoleStore.addLog(`Global Refresh: Full database ${db}`, 'info')
    consoleStore.setVisibility(true)
    
    // Clear data first for full refresh
    await Andb.clearConnectionData(conn)
    
    // Fetch all types
    const objTypes = ['tables', 'procedures', 'functions', 'triggers', 'views']
    await Promise.all(objTypes.map(type => 
       Andb.export(conn, null as any, { type: type as any, environment: conn.environment })
         .then(res => consoleStore.addLog(`Fetched ${res.data?.length || 0} ${type}`, 'success'))
    ))
    
    sidebarStore.triggerRefresh()
    notificationStore.add({ type: 'success', title: 'Refreshed', message: `Database ${db} refreshed successfully` })
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  }
}

const handleCategoryRefreshRequested = async (e: any) => {
  const { type, env, db } = e.detail
  const conn = appStore.connections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (!conn) return

  try {
    consoleStore.addLog(`Global Refresh: Category ${type} in ${db}`, 'info')
    consoleStore.setVisibility(true)
    
    await Andb.export(conn, null as any, { type: type as any, environment: conn.environment })
      .then(res => consoleStore.addLog(`Fetched ${res.data?.length || 0} ${type}`, 'success'))
    
    sidebarStore.triggerRefresh()
    notificationStore.add({ type: 'success', title: 'Refreshed', message: `${type} refreshed successfully` })
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  }
}

const handleObjectRefreshRequested = async (e: any) => {
  const { name, type, env, db } = e.detail
  const conn = appStore.connections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (!conn) return

  try {
    consoleStore.addLog(`Global Refresh: Object ${name} (${type})`, 'info')
    consoleStore.setVisibility(true)
    
    await Andb.export(conn, null as any, { type: type as any, environment: conn.environment, name })
      .then(() => consoleStore.addLog(`Fetched ${name}`, 'success'))
      
    sidebarStore.triggerRefresh()
    notificationStore.add({ type: 'success', title: 'Refreshed', message: `${name} updated` })
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  }
}

// Global keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+B or Cmd+B to toggle sidebar
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault()
    appStore.toggleSidebar()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // global refresh listeners
  window.addEventListener('database-refresh-requested', handleDatabaseRefreshRequested)
  window.addEventListener('category-refresh-requested', handleCategoryRefreshRequested)
  window.addEventListener('object-refresh-requested', handleObjectRefreshRequested)
  
  // Listen for Electron Updater events
  if (window.electronAPI?.updater) {
    window.electronAPI.updater.onUpdateStatus((response: any) => {
      updaterStore.setStatus(response.status, response.info || response.progress || response.error)
    })
    // Initial check (quietly)
    // updaterStore.checkForUpdates() // Optional, main process does it on startup
  }

  // FAILSAFE: Verify Project Selection state after mounting
  setTimeout(() => {
     // Recover Name from storage
     const lastPName = localStorage.getItem('andb_last_pname')
     const lastPId = localStorage.getItem('andb_last_pid')
     console.log('[App] Failsafe Check:', { lastPName, lastPId })
     
     // Note: Store init happens before this, but let's just log verification.
     // Actual recovery logic is better placed in the store itself, which we improved.
  }, 1000)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  window.removeEventListener('database-refresh-requested', handleDatabaseRefreshRequested)
  window.removeEventListener('category-refresh-requested', handleCategoryRefreshRequested)
  window.removeEventListener('object-refresh-requested', handleObjectRefreshRequested)
  if (window.electronAPI?.updater) {
    window.electronAPI.updater.offUpdateStatus()
  }
})
</script>
