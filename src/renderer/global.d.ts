/// <reference types="vite/client" />
import type { CariAPI } from '../main/preload';

declare global {
  interface Window {
    cari: CariAPI;
  }
}
export {};
