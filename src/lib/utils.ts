import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function debounce<Func extends (...args: any[]) => any>(func: Func, wait: number): Func {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function(this: any, ...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  } as Func;
}
type AspectInfo = {
  width: number;
  height: number;
  ratio: string;     // ví dụ: "16:9"
  float: number;     // ví dụ: 1.777...
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function getImageAspectRatio(url: string): Promise<AspectInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const g = gcd(w, h);

      resolve({
        width: w,
        height: h,
        ratio: `${w / g}:${h / g}`,
        float: w / h
      });
    };

    img.onerror = () => reject(new Error("Cannot load image"));

    img.src = url;
  });
}