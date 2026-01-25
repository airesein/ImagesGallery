import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, AppConfig } from '../types';
import { Card } from './HeroUI';

interface MasonryGridProps {
  items: MediaItem[];
  favorites: Set<string>;
  config: AppConfig;
  onItemClick: (item: MediaItem) => void;
  onCopy: (text: string) => void;
  onOpenNew: (url: string) => void;
  onToggleFavorite: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
}

// --- Video State Manager Hook ---
const useVideoManager = () => {
  const [activeIds, setActiveIds] = useState<string[]>([]); // Max 4 playing
  const [cachedIds, setCachedIds] = useState<string[]>([]); // Max 20 in DOM

  const requestPlay = useCallback((id: string) => {
    setActiveIds(prev => {
      // If already playing, move to end (mark as most recently used)
      if (prev.includes(id)) {
        return [...prev.filter(pid => pid !== id), id];
      }
      // Add new, limit to 4
      const newList = [...prev, id];
      return newList.slice(-4); 
    });

    setCachedIds(prev => {
      // Add to cache, limit to 20
      // We filter out the id first to move it to the end (LRU policy)
      const withoutId = prev.filter(cid => cid !== id);
      const newList = [...withoutId, id];
      return newList.slice(-20);
    });
  }, []);

  const notifyOutOfView = useCallback((id: string) => {
    setActiveIds(prev => prev.filter(pid => pid !== id));
    // Note: We do NOT remove from cachedIds here. 
    // It stays in DOM (paused) until pushed out by new videos.
  }, []);

  return { activeIds, cachedIds, requestPlay, notifyOutOfView };
};

// --- Helper ---
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
  const { activeIds, cachedIds, requestPlay, notifyOutOfView } = useVideoManager();
  
  // Calculate columns
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
               shouldPlay={activeIds.includes(item.id)}
               shouldCache={cachedIds.includes(item.id)}
               onRequestPlay={() => requestPlay(item.id)}
               onOutOfView={() => notifyOutOfView(item.id)}
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
  shouldPlay: boolean;
  shouldCache: boolean;
  onRequestPlay: () => void;
  onOutOfView: () => void;
  onItemClick: (item: MediaItem) => void;
  onCopy: (text: string) => void;
  onOpenNew: (url: string) => void;
  onToggleFavorite: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
}> = ({ 
  item, 
  isFavorite, 
  shouldPlay, 
  shouldCache, 
  onRequestPlay, 
  onOutOfView, 
  onItemClick, 
  onCopy, 
  onOpenNew, 
  onToggleFavorite, 
  onDownload 
}) => {
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const thumbnailUrl = item.type === 'video' 
    ? `https://previewengine.zoho.com.cn/thumbnail/WD/${getZidFromUrl(item.url)}`
    : item.url;

  // Intersection Observer for Auto-Pause
  useEffect(() => {
    if (item.type !== 'video' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && shouldPlay) {
          onOutOfView();
        }
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [item.type, shouldPlay, onOutOfView]);

  // Handle Play/Pause side effects based on props
  useEffect(() => {
    if (item.type !== 'video' || !videoRef.current) return;

    if (shouldPlay) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented
          console.debug("Autoplay prevented", error);
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [shouldPlay, item.type]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle click
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
        if (item.type === 'video') {
            if (!shouldPlay) {
                // If clicked and not playing, request play
                setIsLoadingVideo(true);
                onRequestPlay();
            } else {
                // If already playing, open detail view
                onItemClick(item);
            }
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

  // Video Event Handlers
  const handleVideoLoadedData = () => {
    setIsVideoReady(true);
    // If we have enough data to render a frame, we might still be buffering for smooth playback,
    // but we can show the video element now.
  };

  const handleVideoWaiting = () => {
    if (shouldPlay) setIsLoadingVideo(true);
  };

  const handleVideoPlaying = () => {
    setIsLoadingVideo(false);
    setIsVideoReady(true);
  };

  return (
    <Card 
      isPressable={false} 
      className="w-full h-auto bg-content2 group relative min-h-[100px] cursor-pointer"
      onClick={handleClick}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
      >
        {isFavorite && (
          <div className="absolute top-2 left-2 z-20 text-yellow-400 drop-shadow-md">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
          </div>
        )}

        {/* Thumbnail Layer */}
        <img 
            src={thumbnailUrl} 
            alt={item.id} 
            loading="lazy"
            decoding="async" 
            onLoad={() => setIsImgLoaded(true)}
            className={`
              w-full h-auto object-cover block transition-opacity duration-300
              ${isImgLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ willChange: 'opacity' }}
          />

        {/* Video Layer */}
        {item.type === 'video' && shouldCache && (
            <div className="absolute inset-0 z-10 bg-transparent">
                 <video 
                   ref={videoRef}
                   src={item.url} 
                   className={`
                     w-full h-full object-cover block transition-opacity duration-500 ease-in-out
                     ${isVideoReady ? 'opacity-100' : 'opacity-0'}
                   `}
                   loop
                   muted // Required for reliable autoplay
                   playsInline // Critical for iOS
                   webkit-playsinline="true"
                   controls={false}
                   onLoadedData={handleVideoLoadedData}
                   onWaiting={handleVideoWaiting}
                   onPlaying={handleVideoPlaying}
                 />
            </div>
        )}

        {/* Loading / Buffering Progress Bar */}
        {item.type === 'video' && shouldPlay && isLoadingVideo && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-content3 z-30 overflow-hidden">
                <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite] w-full origin-left" />
            </div>
        )}

        {/* Video Type Indicator (Show if video not cached OR cached but not ready) */}
        {item.type === 'video' && (!shouldCache || (shouldCache && !isVideoReady)) && (
             <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white z-10 pointer-events-none transition-opacity duration-300">
                视频
             </div>
        )}
        
        {!isImgLoaded && <div className="absolute inset-0 bg-content2 z-[-1]" />}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none z-20" />
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: scaleX(0); opacity: 0.5; }
          50% { transform: scaleX(0.5); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; margin-left: 100%; }
        }
      `}</style>
    </Card>
  );
};