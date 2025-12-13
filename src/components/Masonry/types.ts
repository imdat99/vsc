// types.ts
export interface PinItem {
  id: string;
  url: string;
  title: string;
  author: string;
  aspectRatio: number;
  isExpanded: boolean;
  isAd: boolean;
  adDesc?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ItemWithElement {
  data: PinItem;
  element: HTMLElement;
}

export interface MasonryState {
  items: ItemWithElement[];
  fillers: ItemWithElement[];
  columnCount: number;
  gap: number;
  colWidth: number;
  isLoading: boolean;
  isFinished: boolean;
}

export interface FullscreenState {
  isOpen: boolean;
  imageUrl: string;
  scale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
}