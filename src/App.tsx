import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import PageRenderer from './components/PageRenderer';
import ModDetails from './components/ModDetails';
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

// Wrapper for ModDetails to handle navigation and props
const ModDetailsWrapper = (props: any) => {
  const navigate = useNavigate();
  
  const handleModClick = (m: Mod) => {
      let prefix = 'mod';
      if (m.type === 'Resource Pack') prefix = 'rp';
      else if (m.type === 'Map') prefix = 'map';
      else if (m.type === 'Modpack') prefix = 'modpack';
      navigate(`/${prefix}/${m.shareCode || m.id}`);
  };

  return (
    <ModDetails 
      {...props} 
      onBack={() => navigate('/')}
      onModClick={handleModClick}
      onPublisherClick={(pid: string) => navigate(`/profile/${pid}`)}
    />
  );
};

export default function App() {
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  const [isReady, setIsReady] = useState(false);
  
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
  
  // Pagination State
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

  const trackUserInterest = (category: string) => {
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

  // Common props for ModDetails
  const modDetailsDataProps = {
    allMods: mods,
    currentUser,
    onDownload: () => {},
    onEdit: () => {},
    onDelete: () => {},
    isFollowing: false,
    onFollow: () => {},
    isOnline: true,
    isAdmin: isAdminAuthenticated
  };

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
        <Route path="/mod/:code" element={<ModDetailsWrapper {...modDetailsDataProps} expectedType="Mod" />} />
        <Route path="/map/:code" element={<ModDetailsWrapper {...modDetailsDataProps} expectedType="Map" />} />
        <Route path="/rp/:code" element={<ModDetailsWrapper {...modDetailsDataProps} expectedType="Resource Pack" />} />
        <Route path="/modpack/:code" element={<ModDetailsWrapper {...modDetailsDataProps} expectedType="Modpack" />} />
        
        <Route path="/:pageId" element={<PageWrapper {...commonProps} />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}
