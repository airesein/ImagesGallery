import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, AppConfig } from '../types';
import { Card } from './HeroUI';

interface MasonryGridProps {
  items: MediaItem[];
  favorites: Set<string>; // Set of URLs
  config: AppConfig;
  onItemClick: (item: MediaItem) => void;
  onCopy: (text: string) => void;
  onOpenNew: (url: string) => void;
  onToggleFavorite: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
}

// Helper: Extract ZID from URL
const getZidFromUrl = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 1] || '';
};

export const MasonryGrid: React.FC<MasonryGridProps> = ({ 
  items, 
  favorites,
  config, 
  onItemClick,
  onCopy,
  onOpenNew,
  onToggleFavorite,
  onDownload
}) => {
  const [columns, setColumns] = useState<MediaItem[][]>([]);
  
  // Calculate columns based on width and scale
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      const scale = config.imageScale || 1.0;
      let numCols = 4;

      if (width < 640) numCols = 1;
      else if (width < 1024) numCols = 2;
      else if (width < 1280) numCols = 3;
      else numCols = 4;

      if (scale >= 2.0) numCols = Math.max(1, numCols - 2);
      else if (scale >= 1.2) numCols = Math.max(1, numCols - 1);

      const newCols: MediaItem[][] = Array.from({ length: numCols }, () => []);
      items.forEach((item, index) => {
        newCols[index % numCols].push(item);
      });
      setColumns(newCols);
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [items, config.imageScale]);

  return (
    <div className="flex gap-3 sm:gap-4 w-full items-start">
      {columns.map((colItems, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
          {colItems.map((item) => (
             <MasonryItem 
               key={item.id} 
               item={item} 
               isFavorite={favorites.has(item.url)}
               config={config}
               onItemClick={onItemClick}
               onCopy={onCopy}
               onOpenNew={onOpenNew}
               onToggleFavorite={onToggleFavorite}
               onDownload={onDownload}
             />
          ))}
        </div>
      ))}
    </div>
  );
};

const MasonryItem: React.FC<{
  item: MediaItem;
  isFavorite: boolean;
  config: AppConfig;
  onItemClick: (item: MediaItem) => void;
  onCopy: (text: string) => void;
  onOpenNew: (url: string) => void;
  onToggleFavorite: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
}> = ({ item, isFavorite, onItemClick, onCopy, onOpenNew, onToggleFavorite, onDownload }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Construct thumbnail URL for videos
  const thumbnailUrl = item.type === 'video' 
    ? `https://previewengine.zoho.com.cn/thumbnail/WD/${getZidFromUrl(item.url)}`
    : item.url;

  const handleMouseEnter = () => {
    if (item.type === 'video') {
      // Small delay before playing to prevent flashing on quick scroll
      hoverTimeoutRef.current = window.setTimeout(() => {
        setIsPlaying(true);
      }, 200); 
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsPlaying(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click
    if (e.button === 1) {
      e.preventDefault();
      onDownload(item);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left Click
      if (e.ctrlKey) {
        e.preventDefault();
        onOpenNew(item.url);
      } else {
        // If it's a video and not playing yet (mobile tap), play it first
        if (item.type === 'video' && !isPlaying && window.innerWidth < 768) {
             setIsPlaying(true);
        } else {
             onItemClick(item);
        }
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      onToggleFavorite(item);
    } else {
      onCopy(item.url);
    }
  };

  return (
    <Card 
      isPressable={false} 
      className="w-full h-auto bg-content2 group relative min-h-[100px] cursor-pointer"
      onClick={handleClick}
    >
      <div 
        className="relative w-full h-full"
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isFavorite && (
          <div className="absolute top-2 left-2 z-20 text-yellow-400 drop-shadow-md">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
          </div>
        )}

        {/* 
            Resource Optimization Strategy:
            1. Always show the Image (Thumbnail for video).
            2. Only inject <video> tag when isPlaying is true (hover/click).
            3. The Image sits behind the video to prevent layout shift.
        */}

        {/* Thumbnail / Image Layer */}
        <img 
            src={thumbnailUrl} 
            alt={item.id} 
            loading="lazy"
            decoding="async" 
            onLoad={() => setIsLoaded(true)}
            className={`
              w-full h-auto object-cover block transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ 
                willChange: 'opacity',
                // Keep image visible behind video to prevent flashing
            }}
          />

        {/* Video Layer - Only renders when active */}
        {item.type === 'video' && isPlaying && (
            <div className="absolute inset-0 z-10 bg-black">
                 <video 
                   src={item.url} 
                   className="w-full h-full object-cover block animate-fade-in"
                   autoPlay
                   muted
                   loop
                   playsInline
                   // No preload since we only render on interaction
                 />
            </div>
        )}

        {/* Video Indicator */}
        {item.type === 'video' && (
             <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white z-10 pointer-events-none">
                视频
             </div>
        )}
        
        {!isLoaded && <div className="absolute inset-0 bg-content2 z-[-1]" />}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none z-10" />
      </div>
    </Card>
  );
};