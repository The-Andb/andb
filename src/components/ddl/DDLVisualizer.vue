<template>
  <div class="h-full w-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      <!-- Visual Header -->
      <div class="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
              <div class="p-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <Table class="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                  <h3 class="font-bold text-sm text-gray-900 dark:text-white tracking-tight">{{ tableName }}</h3>
              </div>
          </div>
          <p class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{{ columns.length }} Columns</p>
      </div>

      <!-- Table Content -->
      <div v-if="columns.length > 0" class="flex-1 overflow-auto">
          <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 font-bold text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                  <tr>
                      <th class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 w-8">#</th>
                      <th class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 min-w-[150px]">Column</th>
                      <th class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 min-w-[120px]">Datatype</th>
                      <th class="px-2 py-2 border-b border-gray-200 dark:border-gray-700 text-center w-8" title="Primary Key">PK</th>
                      <th class="px-2 py-2 border-b border-gray-200 dark:border-gray-700 text-center w-8" title="Not Null">NN</th>
                      <th class="px-2 py-2 border-b border-gray-200 dark:border-gray-700 text-center w-8" title="Unique">UQ</th>
                      <th class="px-2 py-2 border-b border-gray-200 dark:border-gray-700 text-center w-8" title="Unsigned">UN</th>
                      <th class="px-2 py-2 border-b border-gray-200 dark:border-gray-700 text-center w-8" title="Auto Increment">AI</th>
                      <th class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 min-w-[150px]">Default / Expression</th>
                      <th class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 w-full">Comment</th>
                  </tr>
              </thead>
              <tbody class="text-xs font-mono divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-for="(col, index) in columns" :key="col.name" class="hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-colors">
                      <td class="px-4 py-2 text-gray-400 text-center">{{ index + 1 }}</td>
                      <td class="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 group-hover:text-primary-600">
                          <div class="flex items-center gap-2">
                              <Key v-if="col.pk" class="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <Circle v-else class="w-2 h-2 text-blue-300 dark:text-blue-600" />
                              {{ col.name }}
                          </div>
                      </td>
                      <td class="px-4 py-2 text-blue-600 dark:text-blue-400 font-bold uppercase">{{ col.type }}</td>
                      
                      <!-- Flags Checkboxes (Read-only visualization) -->
                      <td class="px-2 py-2 text-center">
                          <div class="w-3 h-3 border border-gray-300 dark:border-gray-600 rounded mx-auto" :class="{'bg-yellow-500 border-yellow-500': col.pk}"></div>
                      </td>
                      <td class="px-2 py-2 text-center">
                          <div class="w-3 h-3 border border-gray-300 dark:border-gray-600 rounded mx-auto" :class="{'bg-blue-500 border-blue-500': col.notNull}"></div>
                      </td>
                      <td class="px-2 py-2 text-center">
                          <div class="w-3 h-3 border border-gray-300 dark:border-gray-600 rounded mx-auto" :class="{'bg-blue-500 border-blue-500': col.unique}"></div>
                      </td>
                      <td class="px-2 py-2 text-center">
                          <div class="w-3 h-3 border border-gray-300 dark:border-gray-600 rounded mx-auto" :class="{'bg-blue-500 border-blue-500': col.unsigned}"></div>
                      </td>
                      <td class="px-2 py-2 text-center">
                          <div class="w-3 h-3 border border-gray-300 dark:border-gray-600 rounded mx-auto" :class="{'bg-blue-500 border-blue-500': col.autoIncrement}"></div>
                      </td>

                      <td class="px-4 py-2 text-gray-500 dark:text-gray-400">{{ col.default }}</td>
                      <td class="px-4 py-2 text-gray-400 italic truncate max-w-xs">{{ col.comment }}</td>
                  </tr>
              </tbody>
          </table>
      </div>
      <div v-else class="text-center text-gray-400 p-8 flex flex-col items-center justify-center h-full">
        <LayoutTemplate class="w-12 h-12 mb-2 opacity-20" />
        <p class="text-auto uppercase tracking-widest font-bold">Visual Preview Unavailable</p>
      </div>
  </div>
</template>

<script setup lang="ts">
import { Table, Key, Circle, LayoutTemplate } from 'lucide-vue-next'

export interface Column {
  name: string
  type: string
  pk?: boolean
  notNull?: boolean
  unique?: boolean
  unsigned?: boolean
  autoIncrement?: boolean
  default?: string | null
  comment?: string
}

defineProps<{
  tableName: string
  columns: Column[]
}>()
</script>
