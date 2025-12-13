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

// State
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const showExpandIcon = ref(true)

// Touch specific state
const lastTapTime = ref(0)
const initialPinchDistance = ref(0)
const initialScale = ref(1)

const zoomLevel = computed(() => `${Math.round(scale.value * 100)}%`)

// Style calculation logic
const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) translate(${translateX.value / scale.value}px, ${translateY.value / scale.value}px)`,
  // Tắt transition khi đang drag hoặc pinch để tránh bị lag/giật
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
  isDragging.value = false
}

// --- Helpers ---
const getDistance = (touches: TouchList) => {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  )
}

// --- Actions ---

const handleSmartZoom = () => {
  if (scale.value > 1.05) {
    // Reset to fit
    resetZoom()
  } else {
    // Fill screen
    const img = document.getElementById('fullscreen-img') as HTMLImageElement
    if (!img) return

    const rect = img.getBoundingClientRect()
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    // Tính toán tỷ lệ để lấp đầy màn hình
    const scaleW = viewportW / rect.width
    const scaleH = viewportH / rect.height
    
    // Chọn tỷ lệ lớn hơn để fill hết
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
      resetZoom()
    }
  }
}

const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Ảnh',
        text: 'Hãy xem bức ảnh này!',
        url: props.imageUrl
      })
    } catch (err) {
      // User cancelled share usually
    }
  } else {
    try {
      await navigator.clipboard.writeText(props.imageUrl)
      // Dùng alert hoặc toast message của app bạn
      alert('Đã sao chép liên kết ảnh!')
    } catch (err) {
      console.error(err)
    }
  }
}

// --- Mouse Events (Desktop) ---

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

// --- Touch Events (Mobile) ---

const handleTouchStart = (e: TouchEvent) => {
  // Case 1: 1 Ngón tay (Panning hoặc Double Tap)
  if (e.touches.length === 1) {
    const now = Date.now()
    // Logic Double Tap (trong vòng 300ms)
    if (now - lastTapTime.value < 300) {
      handleSmartZoom()
    }
    lastTapTime.value = now

    // Chỉ bắt đầu drag nếu đang zoom
    if (scale.value > 1.01) {
      isDragging.value = true
      startX.value = e.touches[0].clientX - translateX.value
      startY.value = e.touches[0].clientY - translateY.value
    }
  } 
  // Case 2: 2 Ngón tay (Pinch Zoom)
  else if (e.touches.length === 2) {
    isDragging.value = true // Đánh dấu đang thao tác để tắt transition CSS
    initialPinchDistance.value = getDistance(e.touches)
    initialScale.value = scale.value
  }
}

const handleTouchMove = (e: TouchEvent) => {
  // Case 1: Panning (1 ngón)
  if (e.touches.length === 1 && isDragging.value && scale.value > 1.01) {
    translateX.value = e.touches[0].clientX - startX.value
    translateY.value = e.touches[0].clientY - startY.value
  } 
  // Case 2: Pinching (2 ngón)
  else if (e.touches.length === 2) {
    const currentDistance = getDistance(e.touches)
    if (initialPinchDistance.value > 0) {
      const pinchRatio = currentDistance / initialPinchDistance.value
      // Giới hạn zoom từ 0.5x đến 5x
      const newScale = initialScale.value * pinchRatio
      scale.value = Math.min(Math.max(0.5, newScale), 5)
      
      if (scale.value > 1.1) showExpandIcon.value = false
    }
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  // Nếu nhấc hết ngón tay lên
  if (e.touches.length === 0) {
    isDragging.value = false
    // Snap back nếu zoom nhỏ hơn 1
    if (scale.value < 1) {
      resetZoom()
    }
  }
  // Nếu đang 2 ngón nhấc 1 ngón -> chuyển về state pan
  else if (e.touches.length === 1) {
    // Cập nhật lại vị trí bắt đầu để tránh bị nhảy hình
    startX.value = e.touches[0].clientX - translateX.value
    startY.value = e.touches[0].clientY - translateY.value
  }
}

const handleClose = () => {
  emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') handleClose()
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
    class="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center transition-all duration-300 touch-none"
    :class="{
      'opacity-0 pointer-events-none': !isOpen,
      'opacity-100 pointer-events-auto': isOpen
    }"
  >
    <!-- Toolbar -->
    <!-- Thêm overflow-x-auto để không vỡ layout trên màn hình quá nhỏ -->
    <div class="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
      <div class="text-white font-bold text-lg hidden sm:block truncate pr-4">Chế độ xem lớn</div>
      
      <!-- Controls Container -->
      <div class="flex items-center gap-1 sm:gap-4 ml-auto overflow-x-auto no-scrollbar py-1">
        <!-- Smart Zoom -->
        <button
          @click.stop="handleSmartZoom"
          class="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-md transition border border-white/5"
        >
          <svg v-if="showExpandIcon" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
          </svg>
          <svg v-else class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4l5 5m0 0l-5 5m5-5h12m-5 5l5-5m0 0l-5-5"></path>
          </svg>
        </button>

        <div class="w-px h-6 sm:h-8 bg-white/20 mx-1 sm:mx-2 flex-shrink-0"></div>

        <!-- Zoom Out -->
        <button
          @click.stop="handleZoom('out')"
          class="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-md transition"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
          </svg>
        </button>
        
        <span class="text-white font-mono text-xs sm:text-sm w-10 sm:w-12 text-center select-none tabular-nums">{{ zoomLevel }}</span>
        
        <!-- Zoom In -->
        <button
          @click.stop="handleZoom('in')"
          class="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-md transition"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>

        <div class="w-px h-6 sm:h-8 bg-white/20 mx-1 sm:mx-2 flex-shrink-0"></div>

        <!-- Share -->
        <button
          @click.stop="handleShare"
          class="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-md transition"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
        </button>
        
        <!-- Close -->
        <button
          @click.stop="handleClose"
          class="bg-white/20 hover:bg-red-600 active:bg-red-700 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-md transition ml-1 sm:ml-2"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Image Area -->
    <!-- Thêm sự kiện touch ở đây -->
    <div
      class="w-full h-full flex items-center justify-center overflow-hidden touch-none select-none"
      :style="{ cursor: containerCursor }"
      @mousedown="startDrag"
      @mousemove="drag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @touchstart.passive="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <img
        id="fullscreen-img"
        :src="imageUrl"
        class="max-w-full max-h-full object-contain shadow-2xl origin-center pointer-events-none"
        :style="imageStyle"
        draggable="false"
      >
    </div>
  </div>
</template>

<style scoped>
/* Ẩn scrollbar cho thanh công cụ trên mobile */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>