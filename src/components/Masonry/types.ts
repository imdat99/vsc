// types.ts
export interface PinItem {
  id: number;
  url: string;
  title: string;
  author: string;
  aspectRatio: number;
  isExpanded: boolean;
  isAd: boolean;
  adDesc?: string;
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