<!-- components/PinItem.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PinItem } from "../types"

interface Props {
  item: PinItem & { x?: number; y?: number; width?: number; height?: number }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggleExpand: [id: number]
  openFullscreen: [url: string]
}>()

const isImageLoaded = ref(false)

const itemStyle = computed(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: `${props.item.width || 236}px`,
  height: `${props.item.height || 300}px`,
  transform: `translate3d(${props.item.x || 0}px, ${props.item.y || 0}px, 0)`,
  transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease',
  willChange: 'transform, width, height, opacity',
  transformOrigin: 'center top',
  opacity: isImageLoaded.value ? 1 : 0.3
}))

const handleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('button')) {
    if (props.item.isAd) {
      alert('Chuyển hướng đến trang đích quảng cáo!')
      e.stopPropagation()
    }
    return
  }
  if (!props.item.isAd) {
    emit('toggleExpand', props.item.id)
  }
}

const handleImageLoad = () => {
  isImageLoaded.value = true
}

const handleOpenFullscreen = () => {
  emit('openFullscreen', props.item.url)
}
</script>

<template>
  <div
    :data-id="item.id"
    :style="itemStyle"
    class="masonry-item group"
    :class="{ 
      'is-ad': item.isAd, 
      'expanded': item.isExpanded,
      'z-30': item.isExpanded,
      'z-5': item.isAd
    }"
    @click="handleClick"
  >
    <!-- Ad Layout -->
    <div v-if="item.isAd" class="pin-card relative bg-gray-50 border-2 border-transparent hover:border-gray-200 w-full h-full overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow">
      <div class="ad-badge absolute top-2.5 left-2.5 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-gray-600 z-10 backdrop-blur">
        Được tài trợ
      </div>
      
      <div class="relative w-full bg-gray-200 overflow-hidden flex-shrink-0">
        <div :style="{ paddingBottom: `${item.aspectRatio * 100}%` }"></div>
        <img 
          :src="item.url" 
          class="absolute top-0 left-0 w-full h-full object-cover"
          @load="handleImageLoad"
        >
        <div class="absolute bottom-4 right-4 z-20">
          <button class="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-700 shadow-lg transition transform hover:scale-105">
            Mua ngay ↗
          </button>
        </div>
      </div>

      <div class="p-4 bg-white flex flex-col flex-1 justify-center">
        <h3 class="font-bold text-lg truncate mb-1 text-gray-900">{{ item.title }}</h3>
        <p class="text-sm text-gray-500 line-clamp-2">{{ item.adDesc }}</p>
        <div class="mt-2 text-xs font-bold text-gray-400 uppercase tracking-wide">{{ item.author }}</div>
      </div>
    </div>

    <!-- Normal Item Layout -->
    <div v-else class="pin-card relative w-full h-full overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col" :class="{ 'shadow-xl border border-black/5': item.isExpanded }">
      <div class="relative w-full bg-gray-200 overflow-hidden flex-shrink-0">
        <div :style="{ paddingBottom: `${item.aspectRatio * 100}%` }"></div>
        <img 
          :src="item.url" 
          class="absolute top-0 left-0 w-full h-full object-cover"
          @load="handleImageLoad"
        >
        <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between">
          <div class="flex justify-end">
            <button class="bg-[#E60023] text-white px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-md">
              Lưu
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white flex flex-col flex-1">
        <div 
          class="pin-details overflow-hidden transition-all duration-400"
          :class="{
            'opacity-0 max-h-0': !item.isExpanded,
            'opacity-100 max-h-[1000px]': item.isExpanded
          }"
        >
          <div class="p-4">
            <h3 class="font-bold text-xl mb-2">{{ item.title }}</h3>
            <div class="flex items-center gap-2 mb-3 mt-1">
              <div class="w-8 h-8 rounded-full bg-gray-200"></div>
              <div class="text-xs">
                <p class="font-bold">{{ item.author }}</p>
                <p class="text-gray-500">Người sáng tạo</p>
              </div>
              <button class="ml-auto bg-gray-100 px-3 py-1.5 rounded-full font-bold text-xs hover:bg-gray-200">
                Follow
              </button>
            </div>
            <p class="text-sm text-gray-700 leading-relaxed mb-4">
              Nội dung đã được mở rộng. Các ảnh khác sẽ tự động sắp xếp lại để nhường chỗ mà không bị che khuất.
            </p>
            <div class="mt-auto pt-2 border-t border-gray-100 flex gap-2">
              <button 
                @click.stop="handleOpenFullscreen"
                class="flex-1 bg-gray-100 text-gray-800 py-2 rounded-full font-bold text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                </svg>
                Xem lớn hơn
              </button>
              <button class="flex-1 bg-gray-100 py-2 rounded-full font-bold text-sm hover:bg-gray-200">
                Ghé thăm
              </button>
              <button class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.masonry-item {
  cursor: pointer;
}

.is-ad {
  cursor: default;
}

.pin-card {
  /* transition: box-shadow 0.2s ease, background-color 0.3s; */
}
</style>