export interface AppConfig {
  appName: string;
  appIcon: string;
  description: string;
  imageScale: number; // 1.0 = normal, 1.5 = 150% size (implies fewer columns)
  videoScale: number;
}

export interface MediaGroup {
  category: string;
  type: 'image' | 'video';
  baseUrl: string;
  zids: string[];
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  category: string;
}

export type ToastType = 'success' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}