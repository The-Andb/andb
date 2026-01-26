import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '../utils/storage-ipc'

export interface ConnectionTemplate {
  id: string
  name: string
  host: string
  port: number
  database?: string
  username: string
  password?: string
  type: 'mysql' | 'postgres' | 'sqlite' | 'dump'
  createdAt: string
  updatedAt: string
}

export const useConnectionTemplatesStore = defineStore('connectionTemplates', () => {
  const templates = ref<ConnectionTemplate[]>([])

  const init = async () => {
    const saved = await storage.get('connectionTemplates')
    if (saved) {
      templates.value = saved
    }
  }

  init()

  watch(templates, (newVal) => {
    storage.set('connectionTemplates', JSON.parse(JSON.stringify(newVal)))
  }, { deep: true })

  function checkDuplicate(template: Partial<ConnectionTemplate>, excludeId?: string) {
    return templates.value.some(t => {
      if (excludeId && t.id === excludeId) return false
      return t.host === template.host &&
        t.port === template.port &&
        t.database === template.database &&
        t.username === template.username
    })
  }

  function addTemplate(template: Omit<ConnectionTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    if (checkDuplicate(template)) {
      throw new Error('DUPLICATE_CONNECTION')
    }

    const newTemplate: ConnectionTemplate = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...template
    }
    templates.value.push(newTemplate)
    return newTemplate
  }

  function updateTemplate(id: string, updates: Partial<ConnectionTemplate>) {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const merged = { ...templates.value[index], ...updates }
      if (checkDuplicate(merged, id)) {
        throw new Error('DUPLICATE_CONNECTION')
      }

      templates.value[index] = {
        ...templates.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  function removeTemplate(id: string) {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return {
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    reloadData: init
  }
})
