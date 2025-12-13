<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import PinItem from './PinItem.vue'
import type { PinItem as PinItemType } from '../types'
import { debounce } from '@hiogawa/utils';
import { getImageAspectRatio } from '@/lib/utils';

const emit = defineEmits<{
  openFullscreen: [url: string]
  updateStatus: [text: string]
}>()

// --- Config ---
const MAX_ITEMS = 134 // Tăng giới hạn lên để thấy rõ hiệu quả của Virtual Scroll
const BUFFER_PX = 800 // Khoảng đệm render trước/sau viewport (pixel)

const container = ref<HTMLElement>()
const items = ref<PinItemType[]>([])
const isLoading = ref(false)
const isFinished = ref(false)
const showEndMessage = ref(false)

// State cho Virtual Scroll
const scrollY = ref(0)
const windowHeight = ref(1000) // Giá trị mặc định ban đầu

const state = ref({
  columnCount: 4,
  gap: 16,
  colWidth: 236,
  containerHeight: 0
})

let globalId = 0
let resizeTimer: number
let scrollRAF: number | null = null

// --- Data Generation ---
const generateItems = (count: number): Promise<PinItemType[]> => {
  const newItems: PinItemType[] = []
  const aspectRatios = [0.7, 1.0, 1.2, 1.5, 0.8]

  for (let i = 0; i < count; i++) {
    globalId++
    const isAd = globalId % 10 === 0 // Giảm tần suất ad một chút

    if (isAd) {
      newItems.push({
        id: globalId,
        url: `https://picsum.photos/800/600?random=${globalId}`,
        title: `Quảng cáo Tài trợ #${globalId}`,
        author: 'Brand Name',
        aspectRatio: 0.75,
        isExpanded: false,
        isAd: true,
        adDesc: 'Sản phẩm tốt nhất cho ngôi nhà của bạn. Mua ngay hôm nay để nhận ưu đãi.'
      })
    } else {
      const ratio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)]
      const reqW = 400
      const reqH = Math.round(reqW * ratio)
      newItems.push({
        id: globalId,
        url: `https://picsum.photos/${reqW}/${reqH}?random=${globalId}`,
        title: `Pin ${globalId}`,
        author: `Creator ${globalId}`,
        aspectRatio: ratio,
        isExpanded: false,
        isAd: false
      })
    }
  }
  return Promise.resolve(newItems)
  // return fetch("https://inv.pipic.fun/image-list").then(r => r.json()).then((data) => {
  //   return Promise.all(data.map(async (item: any) => {
  //     const aspectRatio = await getImageAspectRatio(item.url)
  //     return {
  //     id: item.id,
  //     url: item.url,
  //     width: 400,
  //     title: item.title,
  //     author: item.user.name,
  //     isExpanded: false,
  //     isAd: false,
  //     // width: 400,
  //     // height: aspectRatio.float * 400,
  //     aspectRatio: 1/aspectRatio.float
  //   }}))
  // })
}

const getItemDisplayHeight = (item: PinItemType, width: number): number => {
  if (item.isAd) {
    return width * item.aspectRatio + 100
  } else {
    if (item.isExpanded) {
      return width * item.aspectRatio + 250
    } else {
      return width * item.aspectRatio
    }
  }
}

// --- Layout Calculation (Core Logic - Dense Packing) ---
const calculateLayout = () => {
  if (!container.value) return

  const containerWidth = container.value.clientWidth

  // Calculate columns - Updated Logic
  if (containerWidth < 640) state.value.columnCount = 2
  else if (containerWidth < 768) state.value.columnCount = 3
  else if (containerWidth < 1024) state.value.columnCount = 4
  else if (containerWidth < 1280) state.value.columnCount = 5
  else if (containerWidth < 1536) state.value.columnCount = 6
  else if (containerWidth < 1920) state.value.columnCount = 7
  else if (containerWidth < 2560) state.value.columnCount = 8
  else if (containerWidth < 3840) state.value.columnCount = 9
  else state.value.columnCount = 10 

  const totalGapWidth = (state.value.columnCount - 1) * state.value.gap
  state.value.colWidth = (containerWidth - totalGapWidth) / state.value.columnCount

  const colHeights = new Array(state.value.columnCount).fill(0)
  
  // Sử dụng Set để theo dõi các item đã được sắp xếp (vì ta có thể lấy item ở phía sau lên trước)
  const placedIndices = new Set<number>()

  // Process items
  for (let i = 0; i < items.value.length; i++) {
    if (placedIndices.has(i)) continue

    const item = items.value[i]
    let span = 1
    
    // Updated Span Logic
    if ((item.isExpanded || item.isAd) && state.value.columnCount >= 2) {
      if (item.isAd) {
        // span = Math.min(2, state.value.columnCount)
        span = 1;
      } else {
        // Expanded items now try to span 3 columns
        span = Math.min(3, state.value.columnCount)
      }
    }
    
    let width = span * state.value.colWidth + (span - 1) * state.value.gap

    if (span >= 2) {
      let bestColIndex = 0
      let minY = Infinity

      // Tìm vị trí tốt nhất (cụm cột có chiều cao max thấp nhất)
      // Loop qua các vị trí bắt đầu có thể (từ 0 đến tổng số cột - số cột span)
      for (let c = 0; c <= state.value.columnCount - span; c++) {
        // Tìm chiều cao lớn nhất trong cụm span tại vị trí c
        let currentSpanMaxY = 0
        for(let k = 0; k < span; k++) {
            currentSpanMaxY = Math.max(currentSpanMaxY, colHeights[c+k])
        }
        
        if (currentSpanMaxY < minY) {
          minY = currentSpanMaxY
          bestColIndex = c
        }
      }

      // --- GENERALIZED GAP FILLING STRATEGY (Tối ưu khoảng trống) ---
      // Chiến lược: Trong phạm vi span (bestColIndex -> bestColIndex + span),
      // nếu có cột nào thấp hơn mức "sàn" (minY) một khoảng đáng kể, hãy lấp nó bằng item nhỏ.
      
      const spanCeiling = minY // Đây là mức Y mà item to sẽ đặt lên (hoặc cao hơn nếu lấp đầy làm tăng chiều cao)

      for (let k = 0; k < span; k++) {
        const colIdx = bestColIndex + k
        
        while (true) {
            const currentH = colHeights[colIdx]
            const diff = spanCeiling - currentH // Khoảng trống so với mức sàn chung của span
            
            // Ngưỡng chênh lệch chấp nhận được (30px), nếu nhỏ hơn thì coi như bằng nhau
            if (diff < 30) break

            // Tìm item 1 cột chưa được place ở phía sau danh sách
            let foundIdx = -1
            for (let j = i + 1; j < items.value.length; j++) {
                if (!placedIndices.has(j)) {
                    const nextItem = items.value[j]
                    // Chỉ dùng item nhỏ (không expand/ad) để lấp
                    const nextIsWide = (nextItem.isExpanded || nextItem.isAd)
                    if (!nextIsWide) {
                        foundIdx = j
                        break
                    }
                }
            }

            if (foundIdx === -1) break // Không còn item nào để lấp

            // Lấy item đó lấp vào cột này
            const fillItem = items.value[foundIdx]
            const fillW = state.value.colWidth
            const fillH = getItemDisplayHeight(fillItem, fillW)
            
            fillItem.x = colIdx * (state.value.colWidth + state.value.gap)
            fillItem.y = currentH
            fillItem.width = fillW
            fillItem.height = fillH
            
            colHeights[colIdx] += fillH + state.value.gap
            placedIndices.add(foundIdx)
        }
      }
      // --- END GAP FILLING ---

      // Sau khi lấp (nếu có), tính lại max Y của cụm cột này để đặt item to
      let finalY = 0
      for(let k = 0; k < span; k++) {
         finalY = Math.max(finalY, colHeights[bestColIndex + k])
      }

      const height = getItemDisplayHeight(item, width)
      
      item.x = bestColIndex * (state.value.colWidth + state.value.gap)
      item.y = finalY
      item.width = width
      item.height = height

      // Cập nhật chiều cao cho tất cả các cột bị span đè lên
      for (let k = 0; k < span; k++) {
         colHeights[bestColIndex + k] = finalY + height + state.value.gap
      }
      placedIndices.add(i)

    } else {
      // Logic cũ cho item 1 cột: đặt vào cột ngắn nhất
      const bestColIndex = colHeights.indexOf(Math.min(...colHeights))
      const height = getItemDisplayHeight(item, width)
      
      item.x = bestColIndex * (state.value.colWidth + state.value.gap)
      item.y = colHeights[bestColIndex]
      item.width = width
      item.height = height

      colHeights[bestColIndex] += height + state.value.gap
      placedIndices.add(i)
    }
  }

  state.value.containerHeight = Math.max(...colHeights)
}

// --- Virtual Scroll Logic ---
// Chỉ render các item nằm trong vùng nhìn thấy + buffer
const visibleItems = computed(() => {
  if (items.value.length === 0) return []

  const startY = scrollY.value - BUFFER_PX
  const endY = scrollY.value + windowHeight.value + BUFFER_PX

  return items.value.filter(item => {
    // Item hợp lệ nếu phần dưới của nó > giới hạn trên màn hình
    // VÀ phần trên của nó < giới hạn dưới màn hình
    const itemBottom = (item.y || 0) + (item.height || 0)
    const itemTop = item.y || 0
    
    return itemBottom > startY && itemTop < endY
  })
})

const toggleExpand = (itemId: string) => {
  const item = items.value.find(i => i.id === itemId)
  if (!item || item.isAd) return

  const isExpanding = !item.isExpanded

  // Reset all
  items.value.forEach(i => i.isExpanded = false)

  if (isExpanding) {
    item.isExpanded = true
  }

  nextTick(() => {
    calculateLayout()
    
    if (isExpanding) {
      setTimeout(() => {
        const element = container.value?.querySelector(`[data-id="${itemId}"]`)
        // Vì item có thể bị unmount do virtual scroll nếu scroll đi xa,
        // nhưng khi expand nó thường nằm trong viewport nên vẫn an toàn.
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  })
}

const loadMore = () => {
  if (isLoading.value || isFinished.value) return

  if (items.value.length >= MAX_ITEMS) {
    isFinished.value = true
    showEndMessage.value = true
    emit('updateStatus', 'Đã tải hết ảnh.')
    return
  }

  isLoading.value = true
  emit('updateStatus', `Đang tải ${items.value.length} / ${MAX_ITEMS}...`)
  generateItems(20).then(newItems => {
    console.log("Loaded items:", newItems)
    items.value.push(...newItems)

    nextTick(() => {
      calculateLayout()
      isLoading.value = false
      emit('updateStatus', `Đã tải ${items.value.length} / ${MAX_ITEMS}.`)
    })
  })
  // Giả lập network delay
  // setTimeout(() => {
  //   const newItems = generateItems(20)
  //   items.value.push(...newItems)

  //   nextTick(() => {
  //     calculateLayout()
  //     isLoading.value = false

  //     // Nếu màn hình quá lớn mà chưa có scrollbar, load tiếp
  //     if (state.value.containerHeight < window.innerHeight && items.value.length < MAX_ITEMS) {
  //       loadMore()
  //     }
  //   })
  // }, 300)
}

const updateScrollState = () => {
  scrollY.value = window.scrollY
  windowHeight.value = window.innerHeight

  // Check load more trigger
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
    loadMore()
  }
}

const handleScroll = () => {
  // Sử dụng requestAnimationFrame để tối ưu performance cho sự kiện scroll
  if (scrollRAF) cancelAnimationFrame(scrollRAF)
  scrollRAF = requestAnimationFrame(updateScrollState)
}

const handleResize = debounce(() => {
  windowHeight.value = window.innerHeight
  calculateLayout()
}, 200)

onMounted(() => {
  updateScrollState()
  loadMore()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
})

onUnmounted(() => {
  if (scrollRAF) cancelAnimationFrame(scrollRAF)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})

const handleOpenFullscreen = (url: string) => {
  emit('openFullscreen', url)
}
</script>

<template>
  <!-- 
    Quan trọng: Container phải giữ nguyên chiều cao thật (state.containerHeight)
    để thanh cuộn của trình duyệt hoạt động đúng, dù các item bên trong bị ẩn đi.
  -->
  <div
    ref="container"
    class="relative w-full mx-auto transition-all duration-500"
    :style="{ height: `${state.containerHeight}px` }"
  >
    <!-- Render visibleItems thay vì toàn bộ items -->
    <PinItem
      v-for="item in visibleItems"
      :key="item.id"
      :item="item"
      @toggle-expand="toggleExpand"
      @open-fullscreen="handleOpenFullscreen"
    />
  </div>

  <div 
    class="h-20 w-full flex justify-center items-center mt-8 transition-opacity"
    :class="{ 'opacity-0': !isLoading, 'opacity-100': isLoading }"
  >
    <svg class="animate-spin h-8 w-8 text-[#E60023]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>

  <div v-if="showEndMessage" class="h-20 w-full flex justify-center items-center text-gray-500 font-medium">
    Đã hiển thị hết ảnh ({{ items.length }} items).
  </div>
</template>