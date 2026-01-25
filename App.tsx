import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SHORTCUTS_TEXT } from './constants';
import { MediaItem, ToastMessage, AppConfig, MediaGroup } from './types';
import { Divider, DisplayTextarea, TabItem, Accordion, Button, Dropdown } from './components/HeroUI';
import { MasonryGrid } from './components/MasonryGrid';
import { Drawer } from './components/Drawer';
import { ToastContainer } from './components/Toast';

// Simple interface for stored favorites
interface FavoriteItem {
  url: string;
  type: 'image' | 'video';
}

// Helper to flatten data based on category
const getAllItems = (data: MediaGroup[]): MediaItem[] => {
  const items: MediaItem[] = [];
  data.forEach(group => {
    group.zids.forEach((zid, idx) => {
      // Use baseUrl from group for video, but for image it's just the zid if it's not a full url
      // However, data.json logic seems to imply constructing full URL.
      // Based on previous files, baseUrl is prefix.
      items.push({
        id: `${zid}-${group.category}-${idx}`, 
        category: group.category,
        type: group.type,
        url: `${group.baseUrl}${zid}`
      });
    });
  });
  return items;
};

// Helper to extract ZID from URL or ID
const getZidFromUrl = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 1] || '';
};

const getDownloadUrl = (zid: string): string => {
  return `https://files.zohopublic.com.cn/public/workdrive-public/download/${zid}?x-cli-msg=%7B%22isFileOwner%22%3Afalse%2C%22version%22%3A%221.0%22%2C%22isWDSupport%22%3Afalse%7D`;
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [data, setData] = useState<MediaGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('mediaflow_theme');
      return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    }
    return 'dark';
  });

  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Favorites State
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem('mediaflow_favorites_v2');
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      console.error("Error loading favorites", e);
    }
    return [];
  });

  const favoritesUrlSet = useMemo(() => {
    return new Set(favorites.map(f => f.url));
  }, [favorites]);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, dataRes] = await Promise.all([
          fetch('config.json'),
          fetch('date.json')
        ]);
        
        if (!configRes.ok || !dataRes.ok) throw new Error("Failed to load data");

        const configData: AppConfig = await configRes.json();
        const dataData: MediaGroup[] = await dataRes.json();

        setConfig(configData);
        setData(dataData);
        
        if (dataData.length > 0) {
          setSelectedCategory(dataData[0].category);
        }
      } catch (error) {
        console.error("Failed to load application data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mediaflow_theme', theme);
  }, [theme]);

  // Persist Favorites
  useEffect(() => {
    localStorage.setItem('mediaflow_favorites_v2', JSON.stringify(favorites));
  }, [favorites]);

  // Filter Items
  useEffect(() => {
    if (!config) return;

    if (selectedCategory === '收藏') {
      const favItems: MediaItem[] = favorites.map((f, idx) => ({
        id: `fav-${idx}-${getZidFromUrl(f.url)}`, 
        url: f.url,
        type: f.type,
        category: '收藏'
      }));
      setItems(favItems);
    } else if (data.length > 0) {
      const allItems = getAllItems(data);
      if (selectedCategory === '全部') {
        setItems(allItems);
      } else {
        setItems(allItems.filter(item => item.category === selectedCategory));
      }
    }
  }, [selectedCategory, data, config, favorites]);

  // Scroll Reset
  useEffect(() => {
    if (mainScrollRef.current) {
      // Direct jump, no smooth scrolling to avoid loading intermediate images
      mainScrollRef.current.scrollTop = 0;
    }
  }, [selectedCategory]);

  const categories = useMemo(() => {
    return data.map(d => d.category);
  }, [data]);

  // Actions
  const addToast = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => {
      const newToasts = [...prev, { id, message, type }];
      return newToasts.slice(-2); 
    });
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast('链接已复制！', 'success');
  };

  const handleOpenNewWindow = (url: string) => {
    window.open(url, '_blank');
    addToast('已在新窗口打开', 'info');
  };

  const handleToggleFavorite = (item: MediaItem) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.url === item.url);
      if (exists) {
        addToast('已取消收藏', 'info');
        return prev.filter(f => f.url !== item.url);
      } else {
        addToast('已加入收藏', 'success');
        return [...prev, { url: item.url, type: item.type }];
      }
    });
  };

  const handleItemClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setDrawerOpen(true);
  };

  const handleDownload = (item: MediaItem) => {
    const zid = getZidFromUrl(item.url);
    const downloadUrl = getDownloadUrl(zid);
    window.open(downloadUrl, '_blank');
    addToast('已开始下载', 'success');
  }

  const downloadTxtFile = (content: string, prefix: string) => {
    const blob = new Blob([content.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export handlers
  const handleExportRawLinks = () => {
    if (favorites.length === 0) return;
    const content = favorites.map(f => f.url).join('\n');
    downloadTxtFile(content, "favorites_links");
    addToast('普通链接已导出！', 'success');
  };

  const handleExportDownloadLinks = () => {
    if (favorites.length === 0) return;
    const content = favorites.map(f => getDownloadUrl(getZidFromUrl(f.url))).join('\n');
    downloadTxtFile(content, "favorites_downloads");
    addToast('下载直链已导出！', 'success');
  };

  const handleCopyAllFavorites = () => {
    if (favorites.length === 0) return;
    const urls = favorites.map(item => item.url).join('\n');
    navigator.clipboard.writeText(urls);
    addToast(`已复制 ${favorites.length} 条链接！`, 'success');
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background text-foreground">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground select-none transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full w-60 bg-content1 flex-shrink-0 border-r border-divider flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-medium border border-divider flex-shrink-0">
            <img src={config.appIcon} alt="App Icon" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight line-clamp-1">{config.appName}</h1>
        </div>

        <div className="px-4 pb-2">
           <Button 
             variant="flat" 
             className="w-full justify-start"
             onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
           >
             {theme === 'light' ? <span>切换至暗色</span> : <span>切换至亮色</span>}
           </Button>
        </div>

        <Divider />

        <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide flex flex-col gap-1">
          <TabItem 
            label="收藏" 
            isActive={selectedCategory === '收藏'} 
            onClick={() => { setSelectedCategory('收藏'); setIsSidebarOpen(false); }}
            icon={<svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>}
          />
          <Divider />
          <div className="grid grid-cols-2 gap-1">
            {categories.map(cat => (
              <TabItem 
                key={cat} 
                label={cat} 
                isActive={selectedCategory === cat} 
                onClick={() => { setSelectedCategory(cat); setIsSidebarOpen(false); }} 
              />
            ))}
          </div>
        </div>

        <Divider />

        <div className="p-4">
          <Accordion title="其他">
             <div className="flex flex-col gap-4 pt-2">
               <Button 
                 variant="flat" 
                 className="w-full justify-start mb-2"
                 onClick={() => window.open('/api/readme.html', '_blank')}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 API文档
               </Button>
               <DisplayTextarea label="快捷键" value={SHORTCUTS_TEXT} className="bg-content2 hover:bg-content3 transition-colors" />
               <DisplayTextarea label="关于" value={config.description} className="bg-content2 hover:bg-content3 transition-colors" />
             </div>
          </Accordion>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        ref={mainScrollRef}
        // REMOVED 'scroll-smooth' to ensure instant scrolling to top
        className="flex-1 h-full overflow-y-auto p-4 md:p-8 relative bg-background"
      >
        <div className="md:hidden sticky top-4 mx-4 mb-6 z-30 flex items-center justify-between p-2 pl-3 bg-content1/90 backdrop-blur-lg border border-divider rounded-full shadow-lg">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-content2 rounded-full hover:bg-content3">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             </button>
             <h2 className="text-base font-bold">{selectedCategory}</h2>
           </div>
           <div className="pr-4 text-xs opacity-60 font-medium">{items.length} 项</div>
        </div>

        <header className="hidden md:flex mb-8 justify-between items-end">
           <div>
             <h2 className="text-3xl font-bold mb-2 text-foreground">
               {selectedCategory}
             </h2>
             <p className="text-foreground/60">当前分类共有 {items.length} 个项目</p>
           </div>

           {/* Favorites Actions */}
           {selectedCategory === '收藏' && items.length > 0 && (
             <div className="flex items-center gap-2">
               <Dropdown 
                  trigger={
                    <Button variant="flat">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      导出
                      <svg className="w-3 h-3 ml-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </Button>
                  }
                  items={[
                    { key: 'download', label: '下载链接 (直链)', onClick: handleExportDownloadLinks },
                    { key: 'raw', label: '普通链接', onClick: handleExportRawLinks }
                  ]}
               />
               
               <Button variant="flat" onClick={handleCopyAllFavorites} title="复制所有链接">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                 复制
               </Button>
             </div>
           )}
        </header>

        <MasonryGrid 
          items={items}
          favorites={favoritesUrlSet}
          config={config}
          onItemClick={handleItemClick}
          onCopy={handleCopyLink}
          onOpenNew={handleOpenNewWindow}
          onToggleFavorite={handleToggleFavorite}
          onDownload={handleDownload}
        />
        
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <div className="text-4xl mb-4">📭</div>
             <p>此分类下暂无内容。</p>
          </div>
        )}
      </main>

      <Drawer 
        isOpen={drawerOpen} 
        media={selectedMedia}
        isFavorite={selectedMedia ? favoritesUrlSet.has(selectedMedia.url) : false}
        onClose={() => setDrawerOpen(false)}
        onCopy={handleCopyLink}
        onOpenNew={handleOpenNewWindow}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
};

export default App;