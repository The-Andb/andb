<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ $t('connectionPairs.title') }}
      </h3>
      <button
        @click="addConnectionPair"
        class="btn btn-primary flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        {{ $t('connectionPairs.addPair') }}
      </button>
    </div>

    <!-- Connection Pairs List -->
    <div class="space-y-3">
      <div
        v-for="pair in connectionPairs"
        :key="pair.id"
        class="card p-3 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center space-x-4">
          <!-- Pair Name -->
          <div class="flex-1">
            <input
              v-model="pair.name"
              type="text"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none"
              :placeholder="$t('connectionPairs.pairNamePlaceholder')"
              @blur="updatePair(pair)"
            />
          </div>

          <!-- Source Environment -->
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('connectionPairs.source') }}</span>
            <select
              :value="pair.sourceConnectionId"
              class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent max-w-[180px] outline-none"
              @change="updateSource(pair, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ $t('connectionPairs.selectConnection') }}</option>
              <optgroup v-for="env in enabledEnvironments" :key="env.id" :label="env.name">
                <option v-for="conn in getConnectionsByEnv(env.name)" :key="conn.id" :value="conn.id">
                  {{ conn.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Arrow -->
          <ArrowRight class="w-4 h-4 text-gray-400" />

          <!-- Target Environment -->
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('connectionPairs.target') }}</span>
            <select
              :value="pair.targetConnectionId"
              class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent max-w-[180px] outline-none"
              @change="updateTarget(pair, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ $t('connectionPairs.selectTarget') }}</option>
              <optgroup v-for="env in enabledEnvironments" :key="env.id" :label="env.name">
                <option v-for="conn in getConnectionsByEnv(env.name)" :key="conn.id" :value="conn.id">
                  {{ conn.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Status Indicator -->
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                getPairStatusClass(pair)
              ]"
            ></div>
            <span class="text-xs text-gray-500">{{ getPairStatusText(pair) }}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2">
            <button
              v-if="!isDumpPair(pair)"
              @click="testPair(pair)"
              class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              :title="$t('connectionPairs.testConnection')"
              :disabled="!pair.sourceEnv || !pair.targetEnv"
            >
              <ShieldQuestion class="w-4 h-4" />
            </button>
            <div v-else class="w-6"></div>
            <button
              @click="setAsDefault(pair)"
              class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
              :title="$t('connectionPairs.setAsDefault')"
              :class="{ 'text-green-600 dark:text-green-400': pair.isDefault }"
            >
              <Star class="w-4 h-4" />
            </button>
            <button
              @click="duplicatePair(pair)"
              class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              :title="$t('connectionPairs.duplicate')"
            >
              <Copy class="w-4 h-4" />
            </button>
            <button
              @click="removePair(pair)"
              class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              :title="$t('connectionPairs.remove')"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-3">
          <input
            v-model="pair.description"
            type="text"
            class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            :placeholder="$t('connectionPairs.descPlaceholder')"
            @blur="updatePair(pair)"
          />
        </div>
      </div>
    </div>

    <!-- Help Text -->
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <p>• {{ $t('connectionPairs.help.direction') }}</p>
      <p>• {{ $t('connectionPairs.help.default') }}</p>
      <p>• {{ $t('connectionPairs.help.test') }}</p>
      <p>• {{ $t('connectionPairs.help.enabledOnly') }}</p>
    </div>

    <!-- Default Pair Display -->
    <div v-if="defaultPair" class="card p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
      <div class="flex items-center space-x-2">
        <Star class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
          {{ $t('connectionPairs.defaultPairLabel') }} {{ defaultPair.name }}
        </span>
        <span class="text-sm text-primary-600 dark:text-primary-400">
          ({{ defaultPair.sourceEnv }} → {{ defaultPair.targetEnv }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, ArrowRight, ShieldQuestion, Star, Copy, Trash2 } from 'lucide-vue-next'
import { useConnectionPairsStore, type ConnectionPair } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'

const { t } = useI18n()
const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

// Handle deep linking for actions
onMounted(() => {
  if (route.query.action === 'new') {
    addConnectionPair()
    // Optional: Clear query param
    router.replace({ query: { ...route.query, action: undefined } })
  }
})

const connectionPairs = computed(() => connectionPairsStore.availablePairs)
const enabledEnvironments = computed(() => connectionPairsStore.enabledEnvironments)
const connections = computed(() => appStore.connections)

const defaultPair = computed(() => connectionPairsStore.defaultPair)

const getConnectionsByEnv = (envName: string) => {
  const projectsStore = useProjectsStore()
  const project = projectsStore.currentProject
  if (!project) return []

  return connections.value.filter(c => 
    c.environment === envName && 
    project.connectionIds.includes(c.id)
  )
}

const addConnectionPair = () => {
  connectionPairsStore.addConnectionPair({
    name: 'New Pair',
    sourceEnv: '',
    targetEnv: '',
    sourceConnectionId: '',
    targetConnectionId: '',
    description: '',
    isDefault: false,
    status: 'idle'
  })
}

const duplicatePair = (pair: ConnectionPair) => {
  connectionPairsStore.addConnectionPair({
    name: `${pair.name}_COPY`,
    sourceEnv: pair.sourceEnv,
    targetEnv: pair.targetEnv,
    sourceConnectionId: pair.sourceConnectionId,
    targetConnectionId: pair.targetConnectionId,
    description: pair.description,
    isDefault: false,
    status: 'idle'
  })
}

const removePair = (pair: ConnectionPair) => {
  connectionPairsStore.removeConnectionPair(pair.id)
}

const setAsDefault = (pair: ConnectionPair) => {
  connectionPairsStore.setDefaultPair(pair.id)
}

const testPair = async (pair: ConnectionPair) => {
  if (!pair.sourceEnv || !pair.targetEnv) return
  await connectionPairsStore.testConnectionPair(pair.id)
}

const updatePair = (pair: ConnectionPair) => {
  // Validate pair
  if (!pair.name.trim()) {
    pair.name = 'New Pair'
  }
  
  // Ensure unique names
  const duplicates = connectionPairs.value.filter(p => 
    p.name === pair.name && p.id !== pair.id
  )
  if (duplicates.length > 0) {
    pair.name = `${pair.name}_${Date.now()}`
  }
  
  // Update in store
  connectionPairsStore.updateConnectionPair(pair.id, {
    name: pair.name,
    sourceEnv: pair.sourceEnv,
    targetEnv: pair.targetEnv,
    sourceConnectionId: pair.sourceConnectionId,
    targetConnectionId: pair.targetConnectionId,
    description: pair.description
  })
}

const updateSource = (pair: ConnectionPair, connectionId: string) => {
  const connection = connections.value.find(c => c.id === connectionId)
  if (connection) {
    pair.sourceConnectionId = connectionId
    pair.sourceEnv = connection.environment
    updatePair(pair)
  }
}

const updateTarget = (pair: ConnectionPair, connectionId: string) => {
  const connection = connections.value.find(c => c.id === connectionId)
  if (connection) {
    pair.targetConnectionId = connectionId
    pair.targetEnv = connection.environment
    updatePair(pair)
  }
}

const isDumpPair = (pair: ConnectionPair) => {
  const source = connections.value.find(c => c.id === pair.sourceConnectionId)
  const target = connections.value.find(c => c.id === pair.targetConnectionId)
  return source?.type === 'dump' || target?.type === 'dump'
}

const getPairStatusClass = (pair: ConnectionPair) => {
  switch (pair.status) {
    case 'testing':
      return 'bg-yellow-500'
    case 'success':
      return 'bg-green-500'
    case 'failed':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

const getPairStatusText = (pair: ConnectionPair) => {
  switch (pair.status) {
    case 'testing':
      return t('connectionPairs.status.testing')
    case 'success':
      return t('connectionPairs.status.connected')
    case 'failed':
      return t('connectionPairs.status.failed')
    default:
      return t('connectionPairs.status.notTested')
  }
}

// Expose methods and data for parent component
defineExpose({
  connectionPairs: computed(() => connectionPairs.value),
  defaultPair,
  getDefaultPair: () => connectionPairsStore.defaultPair,
  getPairsBySource: (sourceEnv: string) => connectionPairsStore.getPairsBySource(sourceEnv),
  getPairsByTarget: (targetEnv: string) => connectionPairsStore.getPairsByTarget(targetEnv)
})
</script>
