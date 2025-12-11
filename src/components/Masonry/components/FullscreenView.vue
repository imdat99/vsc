<!-- components/FullscreenView.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  imageUrl: string
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const showExpandIcon = ref(true)

const zoomLevel = computed(() => `${Math.round(scale.value * 100)}%`)

const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) translate(${translateX.value / scale.value}px, ${translateY.value / scale.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s ease-out'
}))

const containerCursor = computed(() => {
  if (scale.value > 1.01) {
    return isDragging.value ? 'grabbing' : 'grab'
  }
  return 'default'
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    resetZoom()
  } else {
    document.body.style.overflow = ''
  }
})

const resetZoom = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  showExpandIcon.value = true
}

const handleSmartZoom = () => {
  if (scale.value > 1.05) {
    // Reset to fit
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    showExpandIcon.value = true
  } else {
    // Fill screen
    const img = document.getElementById('fullscreen-img') as HTMLImageElement
    if (!img) return

    const rect = img.getBoundingClientRect()
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    const scaleW = viewportW / rect.width
    const scaleH = viewportH / rect.height
    
    scale.value = Math.max(scaleW, scaleH)
    translateX.value = 0
    translateY.value = 0
    showExpandIcon.value = false
  }
}

const handleZoom = (type: 'in' | 'out') => {
  if (type === 'in') {
    scale.value += 0.25
    showExpandIcon.value = false
  } else {
    if (scale.value > 0.5) {
      scale.value -= 0.25
    }
    if (scale.value <= 1.01) {
      showExpandIcon.value = true
      translateX.value = 0
      translateY.value = 0
    }
  }
}

const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Ảnh tuyệt đẹp từ Pinterest',
        text: 'Hãy xem bức ảnh này!',
        url: props.imageUrl
      })
    } catch (err) {
      console.error(err)
    }
  } else {
    try {
      await navigator.clipboard.writeText(props.imageUrl)
      alert('Đã sao chép liên kết ảnh vào clipboard!')
    } catch (err) {
      console.error(err)
    }
  }
}

const startDrag = (e: MouseEvent) => {
  if (scale.value <= 1.01) return
  e.preventDefault()
  isDragging.value = true
  startX.value = e.clientX - translateX.value
  startY.value = e.clientY - translateY.value
}

const drag = (e: MouseEvent) => {
  if (!isDragging.value) return
  e.preventDefault()
  translateX.value = e.clientX - startX.value
  translateY.value = e.clientY - startY.value
}

const endDrag = () => {
  isDragging.value = false
}

const handleClose = () => {
  emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center transition-all duration-400"
    :class="{
      'opacity-0 scale-95 pointer-events-none': !isOpen,
      'opacity-100 scale-100 pointer-events-auto': isOpen
    }"
  >
    <!-- Toolbar -->
    <div class="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
      <div class="text-white font-bold text-lg hidden sm:block">Chế độ xem lớn</div>
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Smart Zoom Button -->
        <button
          @click="handleSmartZoom"
          class="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition border border-white/10"
          title="Smart Fill Screen"
        >
          <svg v-if="showExpandIcon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4l5 5m0 0l-5 5m5-5h12m-5 5l5-5m0 0l-5-5"></path>
          </svg>
        </button>

        <div class="w-px h-8 bg-white/20 mx-1 sm:mx-2"></div>

        <button
          @click="handleZoom('out')"
          class="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition"
          title="Thu nhỏ"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
          </svg>
        </button>
        
        <span class="text-white font-mono text-sm w-12 text-center select-none">{{ zoomLevel }}</span>
        
        <button
          @click="handleZoom('in')"
          class="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition"
          title="Phóng to"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>

        <div class="w-px h-8 bg-white/20 mx-1 sm:mx-2"></div>

        <button
          @click="handleShare"
          class="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition"
          title="Chia sẻ"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
        </button>
        
        <button
          @click="handleClose"
          class="bg-white/20 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur-sm transition ml-2"
          title="Đóng"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Image Area -->
    <div
      class="w-full h-full flex items-center justify-center overflow-hidden"
      :style="{ cursor: containerCursor }"
      @mousedown="startDrag"
      @mousemove="drag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
    >
      <img
        id="fullscreen-img"
        :src="imageUrl"
        class="max-w-full max-h-full object-contain shadow-2xl origin-center"
        :style="imageStyle"
      >
    </div>
  </div>
</template>