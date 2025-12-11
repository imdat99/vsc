<!-- components/AppHeader.vue -->
<script setup lang="ts">
interface Props {
  statusText: string
}

defineProps<Props>()
const emit = defineEmits<{
  reset: []
}>()

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <header class="bg-white sticky top-0 z-40 px-4 py-3 flex justify-between items-center w-full shadow-sm border-b border-gray-100 mb-6">
    <div class="flex items-center gap-2 flex-shrink-0">
      <div 
        @click="handleReset"
        class="w-10 h-10 bg-[#E60023] rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-[#AD081B] transition"
      >
        P
      </div>
      <span class="font-bold text-lg hidden sm:block">Pinterest In-Place</span>
    </div>

    <div class="flex-1 px-4 max-w-2xl text-center text-sm text-gray-500">
      <span>{{ statusText }}</span>
    </div>

    <div class="flex items-center gap-2">
      <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 cursor-pointer transition">
        <svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    </div>
  </header>
</template>