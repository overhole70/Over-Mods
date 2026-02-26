import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import PageRenderer from './components/PageRenderer';
import { db, auth } from './db';
import { AppMetadata } from './types/sdui';
import { User, Mod, MinecraftServer, NewsItem } from './types';
import { Loader2, Download } from 'lucide-react';
import { AdService } from './core/AdService';
import { onAuthStateChanged } from 'firebase/auth';

const CURRENT_VERSION = "1.0.0"; 

// Wrapper to inject useParams into PageRenderer
const PageWrapper = (props: any) => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  
  return (
    <PageRenderer 
      {...props} 
      activePage={pageId || 'home'} 
      onNavigate={(path: string) => navigate(`/${path}`)} 
    />
  );
};

export default function App() {
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [servers, setServers] = useState<MinecraftServer[]>([]);
  const [newsSnippet, setNewsSnippet] = useState<NewsItem | null>(null);
  const [userDownloads, setUserDownloads] = useState<Mod[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Mod | MinecraftServer | null>(null);
  
  const [hasMoreMods, setHasMoreMods] = useState(false);
  const [isLoadingMoreMods, setIsLoadingMoreMods] = useState(false);

  const initializeData = async () => {
    setIsRefreshing(true);
    try {
      const [fetchedMods, fetchedServers, fetchedNews] = await Promise.all([
        db.getAll('mods', 50),
        db.getAll('servers', 20),
        db.getAll('news', 1)
      ]);
      
      setMods(fetchedMods as Mod[]);
      setServers(fetchedServers as MinecraftServer[]);
      setNewsSnippet(fetchedNews[0] as NewsItem || null);
      
      if (currentUser) {
        const downloads = await db.getUserMods(currentUser.id);
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
        
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userData = await db.get('users', user.uid);
            if (userData) setCurrentUser(userData as User);
          } else {
            setCurrentUser(null);
          }
        });

        await initializeData();
      } catch (e) {
        console.error("Critical: App init failed.", e);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-lime-500" />
      </div>
    );
  }

  if (metadata && metadata.force_update && metadata.min_version > CURRENT_VERSION) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="w-20 h-20 bg-lime-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Download className="text-black" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-4">Update Required</h1>
          <p className="text-zinc-500 mb-8 font-medium">
            To continue using the app, please download the latest version from the store.
          </p>
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
    isRTL: true,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    setShowAdminModal,
    setCurrentUser,
    editingItem,
    setEditingItem,
    db,
    onLoadMoreMods: () => {},
    hasMoreMods,
    isLoadingMoreMods
  };

  return (
    <Router>
      <Routes>
        <Route path="/:pageId" element={<PageWrapper {...commonProps} />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}