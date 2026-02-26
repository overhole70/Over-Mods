import React, { useState, useEffect } from 'react';
import PageRenderer from './components/PageRenderer';
import { db, auth } from './db';
import { AppMetadata } from './types/sdui';
import { User, Mod, MinecraftServer, NewsItem } from './types';
import { Loader2, Download } from 'lucide-react';
import { AdService } from './core/AdService';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firestore } from './db';

const CURRENT_VERSION = "1.0.0"; 

export default function App() {
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Routing State
  const [currentView, setCurrentView] = useState('home');
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);

  // Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [servers, setServers] = useState<MinecraftServer[]>([]);
  const [newsSnippet, setNewsSnippet] = useState<NewsItem | null>(null);
  const [userDownloads, setUserDownloads] = useState<Mod[]>([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Mod | MinecraftServer | null>(null);
  
  // Pagination State (simplified for now)
  const [hasMoreMods, setHasMoreMods] = useState(false);
  const [isLoadingMoreMods, setIsLoadingMoreMods] = useState(false);

  const initializeData = async () => {
    setIsRefreshing(true);
    try {
      const [fetchedMods, fetchedServers, fetchedNews] = await Promise.all([
        db.getAll('mods', 50), // Fetch more initially to ensure local lookup works better
        db.getAll('servers', 20),
        db.getAll('news', 1)
      ]);
      
      setMods(fetchedMods as Mod[]);
      setServers(fetchedServers as MinecraftServer[]);
      setNewsSnippet(fetchedNews[0] as NewsItem || null);
      
      if (currentUser) {
        const downloads = await db.getUserMods(currentUser.id); // Placeholder, actual logic might differ
        setUserDownloads(downloads);
      }
    } catch (e) {
      console.error("Data initialization failed", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await AdService.initialize();
        const meta = await db.get('app_metadata', 'config') as AppMetadata;
        setMetadata(meta);
        
        // Auth Listener
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userData = await db.get('users', user.uid);
            if (userData) setCurrentUser(userData as User);
          } else {
            setCurrentUser(null);
          }
        });

        await initializeData();

        // URL Parsing Logic
        const path = window.location.pathname;
        if (path !== '/' && path !== '/home') {
           // Check for mod routes
           const modMatch = path.match(/^\/(mod|rp|map|modpack)\/([^\/]+)$/);
           if (modMatch) {
              const code = modMatch[2];
              try {
                const q = query(collection(firestore, 'mods'), where('shareCode', '==', code), limit(1));
                const snap = await getDocs(q);
                if (!snap.empty) {
                   const foundMod = { id: snap.docs[0].id, ...snap.docs[0].data() } as Mod;
                   setSelectedMod(foundMod);
                   // We use 'details' as a pseudo-view, but PageRenderer expects a pageId.
                   // If we pass externalMod, PageRenderer will use it regardless of activePage (mostly).
                   // But we should probably set activePage to something meaningful or just use the code.
                   setCurrentView(code); 
                } else {
                   // Not found -> Home
                   window.history.replaceState({}, '', '/home');
                   setCurrentView('home');
                }
              } catch (e) {
                console.error("URL parsing fetch failed", e);
                window.history.replaceState({}, '', '/home');
                setCurrentView('home');
              }
           } else {
              // Handle other static routes manually if needed, or just pass the path segment
              const segment = path.substring(1);
              setCurrentView(segment);
           }
        } else {
           setCurrentView('home');
        }

      } catch (e) {
        console.error("Critical: App init failed.", e);
      } finally {
        setIsReady(true);
      }
    };
    init();

    // Handle back/forward navigation
    const handlePopState = () => {
       const path = window.location.pathname;
       const segment = path === '/' ? 'home' : path.substring(1);
       // Simple handling: just update view. Complex mod handling on popstate might require re-fetching if not cached.
       // For now, assume simple navigation.
       setCurrentView(segment.split('/')[0] === 'home' ? 'home' : segment);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    if (path === currentView) return;
    
    // If path is a mod code or typed route, handle it
    // But PageRenderer usually calls this with "mod/CODE" or "home"
    
    // Update URL
    const url = path === 'home' ? '/home' : `/${path}`;
    window.history.pushState({}, '', url);
    
    // If navigating to home, clear selected mod
    if (path === 'home') {
       setSelectedMod(null);
    }
    
    setCurrentView(path);
  };

  const trackUserInterest = (category: string) => {
    // Placeholder for interest tracking
    console.log("Tracking interest:", category);
  };

  if (!isReady) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-lime-500" /></div>;

  if (metadata && metadata.force_update && metadata.min_version > CURRENT_VERSION) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="w-20 h-20 bg-lime-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Download className="text-black" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-4">Update Required</h1>
          <p className="text-zinc-500 mb-8 font-medium">To continue using the app, please download the latest version from the store.</p>
          <button 
            onClick={() => window.open(metadata.update_url, '_blank')}
            className="w-full py-5 bg-lime-500 text-black rounded-2xl font-black text-lg active:scale-95 transition-all"
          >
            Update Now
          </button>
        </div>
      </div>
    );
  }

  const commonProps = {
    currentUser,
    mods,
    servers,
    newsSnippet,
    userDownloads,
    searchTerm,
    setSearchTerm,
    isRefreshing,
    initializeData,
    trackUserInterest,
    isRTL: true, // Default to RTL for Arabic
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    setShowAdminModal,
    setCurrentUser,
    editingItem,
    setEditingItem,
    db,
    onLoadMoreMods: () => {}, // Implement pagination if needed
    hasMoreMods,
    isLoadingMoreMods,
    externalMod: selectedMod
  };

  return (
    <PageRenderer 
      {...commonProps} 
      activePage={currentView} 
      onNavigate={handleNavigate} 
    />
  );
}
