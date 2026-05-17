import React, { useState, useEffect } from "react";
import { Download, Search, Loader2, Image as ImageIcon, X, Menu, Home, Compass, User, Compass as CompassIcon, Layers, ChevronLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImageData {
  url: string;
  title: string;
  source: string;
  thumbnail: string;
}

const CATEGORIES = ["Nature", "Amoled", "Abstract", "Cars", "Space", "City", "Animals", "Gaming"];

export default function App() {
  const [query, setQuery] = useState("");
  const [currentSearch, setCurrentSearch] = useState("latest best mobile wallpapers 4k");
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [isSearching, setIsSearching] = useState(false);
  const [previousTab, setPreviousTab] = useState("home");
  const [page, setPage] = useState(1);
  const [downloads, setDownloads] = useState<ImageData[]>(() => {
    try {
      const saved = localStorage.getItem('mobiwall_downloads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState("");

  const handleDownloadComplete = (img: ImageData) => {
    setDownloads(prev => {
      const newDownloads = [img, ...prev.filter(d => d.url !== img.url)];
      localStorage.setItem('mobiwall_downloads', JSON.stringify(newDownloads));
      return newDownloads;
    });
    setToast("Wallpaper downloaded successfully!");
    setTimeout(() => setToast(""), 3000);
  };

  const fetchImages = async (searchQuery: string, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setImages([]);
    }
    setError("");
    try {
      let finalQuery = searchQuery;
      if (["home", "trending"].includes(activeTab) && !finalQuery.includes("202")) {
        finalQuery = `${searchQuery} ${new Date().getFullYear()} ${new Date().toLocaleString('en-US', { month: 'long' })}`;
      }
      const response = await fetch(`/api/search-images?q=${encodeURIComponent(finalQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Google Images");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (append) {
        // filter out duplicates
        setImages(prev => {
           const existingUrls = new Set(prev.map(p => p.url));
           const newImgs = data.results.filter((img: ImageData) => !existingUrls.has(img.url));
           return [...prev, ...newImgs];
        });
      } else {
        setImages(data.results || []);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const RANDOM_QUERIES = [
    "latest best mobile wallpapers 4k",
    "trending popular photos 2024",
    "epic nature landscape 4k mobile",
    "cyberpunk neon city 4k",
    "abstract colorful aesthetic wallpaper",
    "beautiful world street photography",
    "dark amoled minimal backgrounds",
    "cute animals wild photography"
  ];

  useEffect(() => {
    if (activeTab !== "categories" && activeTab !== "profile") {
       fetchImages(currentSearch);
       setPage(1);
    }
  }, [currentSearch, activeTab]);

  const loadMore = () => {
    if (loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    let nextQuery = currentSearch + ` page ${nextPage}`;
    if (activeTab === "home") {
        nextQuery = RANDOM_QUERIES[nextPage % RANDOM_QUERIES.length];
    } else if (activeTab === "trending") {
        const trendingQs = ["viral trending wallpaper", "most popular images 4k", "top loved backgrounds"];
        nextQuery = trendingQs[nextPage % trendingQs.length] || currentSearch + ` cool ${nextPage}`;
    }
    fetchImages(nextQuery, true);
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMore();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setCurrentSearch(query);
    setPreviousTab(activeTab);
    setActiveTab("search");
    // Removed setIsSearching(false) to keep search bar state
  };

  const handleCategoryClick = (cat: string) => {
    setQuery(cat + " wallpaper 4k");
    setCurrentSearch(cat + " wallpaper 4k");
    setPreviousTab(activeTab);
    setActiveTab("search");
    setIsSearching(true);
  };

  const handleBack = () => {
    setIsSearching(false);
    setQuery("");
    if (activeTab === "search") {
      setActiveTab(previousTab);
      if (previousTab === "home") setCurrentSearch("amoled 4k mobile wallpaper");
      else if (previousTab === "trending") setCurrentSearch("trending popular wallpapers");
    }
  };

  const setTabAndLoad = (tab: string, queryStr: string) => {
    setActiveTab(tab);
    if (queryStr) {
      setCurrentSearch(queryStr);
    }
    setIsSearching(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f3f3f3] text-gray-900 font-sans sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-300 sm:shadow-2xl relative overflow-hidden">
      {/* Header */}
      {!isSearching ? (
        <header className="px-4 py-4 bg-[#f3f3f3] flex items-center justify-between z-10 shrink-0">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">MobiWall</h1>
            <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">Premium Wallpapers</span>
          </div>
          <button 
            className="p-3 bg-white rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsSearching(true)}
          >
            <Search size={22} className="text-gray-600" />
          </button>
        </header>
      ) : (
        <header className="px-4 py-4 bg-[#f3f3f3] flex items-center gap-3 z-10 shrink-0">
          <button 
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors shrink-0"
            onClick={handleBack}
          >
            <ChevronLeft size={24} />
          </button>
          <form onSubmit={handleSearch} className="flex-1">
             <input 
                type="text"
                autoFocus
                placeholder="Search wallpapers..."
                className="w-full bg-white rounded-full py-2.5 px-4 outline-none border border-transparent focus:border-[#c4e0f9] shadow-sm text-base text-gray-700"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
             />
          </form>
        </header>
      )}

      {/* Tabs - Only show when not explicitly searching or in profile */}
      {(activeTab !== "search" && activeTab !== "profile") && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button 
            onClick={() => setTabAndLoad('home', "amoled 4k mobile wallpaper")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'home' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            For You
          </button>
          <button 
            onClick={() => setTabAndLoad('trending', "trending popular wallpapers")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'trending' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Trending
          </button>
          <button 
            onClick={() => setTabAndLoad('categories', "")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'categories' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Categories
          </button>
        </div>
      )}

      <main 
        className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar relative"
        onScroll={handleScroll}
      >
        {activeTab === 'categories' ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
             {CATEGORIES.map((cat, i) => (
               <div 
                 key={cat}
                 onClick={() => handleCategoryClick(cat)}
                 className="relative h-32 rounded-2xl overflow-hidden cursor-pointer shadow-sm"
               >
                 <img src={`https://source.unsplash.com/random/400x400/?${cat}`} alt={cat} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold tracking-wide">{cat}</span>
                 </div>
               </div>
             ))}
          </div>
        ) : activeTab === 'profile' ? (
           <div className="flex flex-col h-full mt-4">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
                  <p className="text-xs text-gray-500">{downloads.length} Wallpapers saved</p>
                </div>
             </div>
             
             <h3 className="font-bold text-lg mb-4">Download History</h3>
             {downloads.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400 mt-10">
                  <Download size={48} className="mb-3 opacity-30" />
                  <p>No downloads yet</p>
                </div>
             ) : (
                <div className="columns-2 gap-4 space-y-4 pb-12">
                  {downloads.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden shadow-sm inline-block w-full cursor-pointer bg-white" onClick={() => setSelectedImage(img)}>
                       <img src={img.thumbnail} alt={img.title} className="w-full object-cover" />
                       <div className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded-full">
                          <CheckCircle size={14} className="text-green-400" />
                       </div>
                    </div>
                  ))}
                </div>
             )}
           </div>
        ) : (
          <>
            {activeTab === 'search' && !isSearching && (
              <div className="flex items-center gap-2 mt-2 mb-4">
                <button onClick={handleBack} className="p-1 text-gray-600 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button>
                <h2 className="text-lg font-bold text-gray-800">Results for "{currentSearch}"</h2>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm text-center">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center -top-20 z-0">
                <Loader2 size={32} className="animate-spin text-gray-400 mb-2" />
                <p className="text-gray-400 text-sm font-medium">{activeTab === 'search' ? "Searching Google Images..." : "Curating wallpapers..."}</p>
              </div>
            ) : (
              <div className="columns-2 gap-4 space-y-4 mt-2">
                {images.map((img, idx) => {
                   const heights = ["h-48", "h-56", "h-64", "h-72"];
                   const randomHeight = heights[idx % heights.length];
                   return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer bg-white shadow-sm inline-block w-full ${randomHeight}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img 
                        src={img.thumbnail} 
                        alt={img.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x600?text=Unavailable";
                        }}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                    </motion.div>
                  )
                })}
              </div>
            )}
            
            {!loading && images.length === 0 && (
               <div className="text-center mt-20 text-gray-400">
                  <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No wallpapers found</p>
               </div>
            )}

            {loadingMore && (
              <div className="flex justify-center items-center py-6">
                 <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 flex items-center justify-around px-2 z-20">
         <button 
           onClick={() => setTabAndLoad('home', "amoled 4k mobile wallpaper")}
           className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'home' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
         >
            <Home size={22} className={activeTab === 'home' ? "fill-black" : ""} />
            <span className="text-[10px] font-medium">Home</span>
         </button>
         <button 
           onClick={() => setTabAndLoad('trending', "trending popular wallpapers")}
           className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'trending' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
         >
            <CompassIcon size={22} className={activeTab === 'trending' ? "fill-black" : ""} />
            <span className="text-[10px] font-medium">Discover</span>
         </button>
         <button 
           onClick={() => setTabAndLoad('categories', "")}
           className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'categories' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
         >
            <Layers size={22} className={activeTab === 'categories' ? "fill-black" : ""} />
            <span className="text-[10px] font-medium">Collections</span>
         </button>
         <button 
           onClick={() => setTabAndLoad('profile', "")}
           className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'profile' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
         >
            <User size={22} className={activeTab === 'profile' ? "fill-black" : ""} />
            <span className="text-[10px] font-medium">Profile</span>
         </button>
      </nav>

      <AnimatePresence>
        {selectedImage && (
          <ImageModal 
            img={selectedImage} 
            onClose={() => setSelectedImage(null)} 
            onDownloadComplete={handleDownloadComplete}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {toast && (
          <motion.div
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 50 }}
             className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <CheckCircle size={18} className="text-green-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImageModal({ img, onClose, onDownloadComplete }: { img: ImageData, onClose: () => void, onDownloadComplete: (img: ImageData) => void }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(img.url)}`);
      let downloadedOk = false;
      if (!response.ok) {
          window.open(img.url, '_blank');
          downloadedOk = true;
      } else {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = blobUrl;
          const extMatch = img.url.match(/\.(jpeg|jpg|png|webp)(\?|$)/i);
          const ext = extMatch ? extMatch[1] : 'jpg';
          let cleanTitle = img.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          if (!cleanTitle) cleanTitle = 'mobiwall_wallpaper';
          
          link.download = `${cleanTitle}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          downloadedOk = true;
      }
      if (downloadedOk) {
         onDownloadComplete(img);
         onClose();
      }
    } catch (e) {
      console.error(e);
      window.open(img.url, '_blank');
      onDownloadComplete(img);
      onClose();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-md sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-700"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 p-2 bg-black/40 text-white rounded-full backdrop-blur-md"
      >
        <X size={24} />
      </button>

      <motion.div 
         initial={{ y: 50, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         exit={{ y: 50, opacity: 0 }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         className="flex-1 flex items-center justify-center p-4 pointer-events-none"
      >
        <img 
          src={img.url} 
          alt={img.title}
          className="max-w-full max-h-[70vh] rounded-3xl object-contain shadow-2xl pointer-events-auto"
          onError={(e) => {
              (e.target as HTMLImageElement).src = img.thumbnail; 
          }}
          referrerPolicy="no-referrer"
        />
      </motion.div>

      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-8 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        <h3 className="font-bold text-xl text-gray-800 line-clamp-2 leading-tight mb-2">{img.title}</h3>
        {img.source && (
           <p className="text-sm text-gray-500 truncate mb-6">
              Source: 
              <a href={img.source} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline ml-1">
                 {(() => {
                   try { return new URL(img.source).hostname; }
                   catch { return "Link"; }
                 })()}
              </a>
           </p>
        )}
        
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-full font-bold transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-black/20"
        >
          {downloading ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              <span>Parsing High Quality...</span>
            </>
          ) : (
            <>
              <Download size={22} />
              <span>Set as Wallpaper / Download</span>
               <span className="ml-1 text-xs px-2 py-0.5 bg-white/20 rounded-full text-white/90">HD</span>
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

