<!-- App.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import MasonryGallery from './components/MasonryGallery.vue'
import FullscreenView from './components/FullscreenView.vue'

const statusText = ref('Click vào ảnh để mở rộng tại chỗ')
const fullscreenUrl = ref('')
const showFullscreen = ref(false)

const handleOpenFullscreen = (url: string) => {
  fullscreenUrl.value = url
  showFullscreen.value = true
}

const handleCloseFullscreen = () => {
  showFullscreen.value = false
  setTimeout(() => {
    fullscreenUrl.value = ''
  }, 400)
}

const handleReset = () => {
  window.location.reload()
}

const updateStatus = (text: string) => {
  statusText.value = text
}
</script>

<template>
  <div class="bg-white text-[#111111] antialiased min-h-screen">
    <AppHeader 
      :status-text="statusText"
      @reset="handleReset"
    />

    <main class="w-full px-2 pb-20">
      <MasonryGallery 
        @open-fullscreen="handleOpenFullscreen"
        @update-status="updateStatus"
      />
    </main>

    <FullscreenView
      v-if="fullscreenUrl"
      :image-url="fullscreenUrl"
      :is-open="showFullscreen"
      @close="handleCloseFullscreen"
    />
  </div>
</template>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-y: scroll;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}
</style>