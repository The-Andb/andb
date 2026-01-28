<template>
  <div class="space-y-8">
    <!-- Basic Info -->
    <div class="space-y-6">
        <div class="pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t('connections.basicInfo') }}</h3>
        </div>
        
        <div class="grid grid-cols-1 gap-6" :class="{ 'md:grid-cols-2': showEnvironment }">
            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.templateName') }} *</label>
                <input
                    :value="modelValue.name"
                    @input="updateField('name', ($event.target as HTMLInputElement).value)"
                    type="text"
                    class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                />
            </div>
            
            <div v-if="showEnvironment" class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.environment') }} *</label>
                 <div class="relative group">
                    <select 
                        :value="modelValue.environment"
                        @change="updateField('environment', ($event.target as HTMLSelectElement).value)"
                        class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none outline-none"
                    >
                        <!-- Environment options should be passed or slot? For now, we assume simple text or provide slots -->
                        <option value="">Select Environment</option>
                        <option v-for="env in environments" :key="env" :value="env">{{ env }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                 </div>
            </div>
        </div>
    </div>

    <!-- Database Connection -->
    <div class="space-y-6">
        <div class="pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t('connections.databaseConnection') }}</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.databaseType') }} *</label>
                 <div class="relative group">
                    <select 
                        :value="modelValue.type"
                        @change="updateField('type', ($event.target as HTMLSelectElement).value)"
                        class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none outline-none"
                    >
                        <option value="mysql">{{ $t('connections.types.mysql') }}</option>
                        <option value="postgres">{{ $t('connections.types.postgres') }}</option>
                        <option value="sqlite">{{ $t('connections.types.sqlite') }}</option>
                        <option value="dump">{{ $t('connections.types.dump') }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                 </div>
            </div>

            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    {{ modelValue.type === 'dump' ? $t('connections.dumpPath') : $t('connections.host') }} *
                </label>
                <div class="relative">
                    <input 
                        :value="modelValue.host" 
                        @input="updateField('host', ($event.target as HTMLInputElement).value)"
                        type="text" 
                        :placeholder="modelValue.type === 'dump' ? $t('connections.dumpPathPlaceholder') : $t('connections.hostPlaceholder')"
                        class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none" 
                    />
                    <button 
                        v-if="modelValue.type === 'dump'" 
                        @click="pickDumpFile"
                        type="button"
                        class="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                    >
                        <FolderOpen class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.port') }} *</label>
                <input 
                    :value="modelValue.port"
                    @input="updateField('port', Number(($event.target as HTMLInputElement).value))"
                    type="number" 
                    class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none" 
                />
            </div>

            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.database') }}</label>
                <input 
                    :value="modelValue.database"
                    @input="updateField('database', ($event.target as HTMLInputElement).value)"
                    type="text" 
                    :placeholder="$t('connections.databasePlaceholder')" 
                    class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none" 
                />
            </div>

             <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.username') }} *</label>
                <input 
                    :value="modelValue.username"
                    @input="updateField('username', ($event.target as HTMLInputElement).value)"
                    type="text" 
                    class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none" 
                />
            </div>

            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.password') }}</label>
                <div class="relative">
                    <input 
                        :value="modelValue.password"
                        @input="updateField('password', ($event.target as HTMLInputElement).value)"
                        :type="showPassword ? 'text' : 'password'" 
                        placeholder="••••••" 
                        class="w-full px-4 py-3 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none" 
                    />
                     <button @click="showPassword = !showPassword" type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors">
                        <Eye v-if="!showPassword" class="w-4 h-4" />
                        <EyeOff v-else class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Product Configuration -->
    <div class="space-y-6">
        <div class="pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Product Configuration (Pre-env)</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Project Domain</label>
                <input 
                    :value="modelValue.productSettings?.domain"
                    @input="updateField('productSettings', { ...(modelValue.productSettings || {}), domain: ($event.target as HTMLInputElement).value })"
                    type="text"
                    placeholder="e.g. abc.com"
                    class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                />
            </div>
            <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Server Domain</label>
                <input 
                    :value="modelValue.productSettings?.emailServer"
                    @input="updateField('productSettings', { ...(modelValue.productSettings || {}), emailServer: ($event.target as HTMLInputElement).value })"
                    type="text"
                    placeholder="e.g. @abc.net"
                    class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                />
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Eye, EyeOff, FolderOpen } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    modelValue: any
    showEnvironment?: boolean
    environments?: string[]
}>()

const emit = defineEmits(['update:modelValue'])
const { t: $t } = useI18n()

const showPassword = ref(false)

const updateField = (key: string, value: any) => {
    emit('update:modelValue', {
        ...props.modelValue,
        [key]: value
    })
}

const pickDumpFile = async () => {
    try {
        // 1. Try Electron API first
        if ((window as any).electronAPI && (window as any).electronAPI.pickFile) {
            const path = await (window as any).electronAPI.pickFile({
                title: 'Select MySQL Dump File',
                filters: [{ name: 'SQL Files', extensions: ['sql'] }]
            })
            if (path) updateField('host', path)
            return
        }

        // 2. Fallback for Web/Browser mode
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.sql'
        input.onchange = async (e: any) => {
            const file = e.target.files[0]
            if (file) {
                // In browser mode, we use the file name as the path marker
                updateField('host', file.name)
                
                // If this is a new template, we might also auto-fill name if empty
                if (!props.modelValue.name) {
                    updateField('name', file.name.replace('.sql', ''))
                }
            }
        }
        input.click()
    } catch (error) {
        console.error('Failed to pick file:', error)
    }
}
</script>
