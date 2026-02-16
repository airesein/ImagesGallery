import React, { useState } from 'react';
import { MediaItem } from '../types';

interface DrawerProps {
  isOpen: boolean;
  media: MediaItem | null;
  isFavorite: boolean;
  onClose: () => void;
  onCopy: (url: string) => void;
  onOpenNew: (url: string) => void;
  onToggleFavorite: (item: MediaItem) => void;
}

const getDownloadUrl = (url: string): string => {
    const parts = url.split('/');
    const zid = parts[parts.length - 1] || '';
    return `https://files.zohopublic.com.cn/public/workdrive-public/download/${zid}?x-cli-msg=%7B%22isFileOwner%22%3Afalse%2C%22version%22%3A%221.0%22%2C%22isWDSupport%22%3Afalse%7D`;
};

export const Drawer: React.FC<DrawerProps> = ({ isOpen, media, isFavorite, onClose, onCopy, onOpenNew, onToggleFavorite }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen || !media) return null;

  const handleContainerClick = () => {
    onClose();
  };

  const handleControlClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleDownload = () => {
    const downloadUrl = getDownloadUrl(media.url);
    window.open(downloadUrl, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center animate-fade-in transition-all duration-300 select-none"
      onClick={handleContainerClick}
    >
      {/* Main Display Area */}
      <div className="relative w-full h-full flex items-center justify-center p-0 md:p-4">
        {/* 
            DOM Reuse Concept: 
            We use the EXACT same URL as the grid item. 
            The browser will serve this from memory cache instantly.
            'loading=eager' ensures highest priority.
        */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {media.type === 'image' ? (
            <img 
              src={media.url} 
              alt="Full view" 
              loading="eager"
              decoding="sync"
              className="max-w-full max-h-[100dvh] object-contain shadow-2xl pointer-events-auto"
              style={{ cursor: 'default' }}
            />
          ) : (
            <video 
              src={media.url} 
              autoPlay
              muted={false} // Unmute in full view
              loop
              playsInline
              controls
              className="max-w-full max-h-[100dvh] shadow-2xl pointer-events-auto bg-black"
              style={{ cursor: 'default' }}
            />
          )}
        </div>

        {/* Expandable Action Button Group */}
        <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-3"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        >
            {/* The 4 Expanded Buttons with Text */}
            <div className={`
                flex flex-row md:flex-row items-end gap-3 mb-4 transition-all duration-300 ease-out origin-bottom
                ${isExpanded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-75 pointer-events-none'}
            `}>
                <ActionBtn 
                    onClick={(e) => handleControlClick(e, () => onToggleFavorite(media))}
                    icon={isFavorite ? (
                        <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    )}
                    label={isFavorite ? "已收藏" : "收藏"}
                />
                
                <ActionBtn 
                    onClick={(e) => handleControlClick(e, handleDownload)}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                    label="下载"
                />

                <ActionBtn 
                    onClick={(e) => handleControlClick(e, () => onCopy(media.url))}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                    label="复制"
                />

                <ActionBtn 
                    onClick={(e) => handleControlClick(e, () => onOpenNew(media.url))}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>}
                    label="新窗口"
                />
            </div>

            {/* Main Trigger Button */}
            <div className={`
                w-12 h-12 rounded-full bg-content1/80 backdrop-blur-md text-foreground flex items-center justify-center shadow-lg border border-divider transition-transform duration-300 hover:bg-primary hover:text-white cursor-pointer
                ${isExpanded ? 'rotate-90 bg-primary text-white' : ''}
            `}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
        </div>
      </div>
    </div>
  );
};

// Updated ActionBtn to include label text
const ActionBtn: React.FC<{ onClick: (e: React.MouseEvent) => void; icon: React.ReactNode; label: string }> = ({ onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className="
          flex items-center gap-2 px-4 py-2 rounded-full 
          bg-content1/90 hover:bg-primary hover:text-white backdrop-blur-md 
          shadow-lg border border-divider transition-all duration-200
          text-sm font-medium whitespace-nowrap
          text-[#0080FF]
        "
    >
        {icon}
        <span>{label}</span>
    </button>
);