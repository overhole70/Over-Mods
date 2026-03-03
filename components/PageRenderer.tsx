import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { firestore } from '../db';
import { Mod, User, MinecraftServer, NewsItem } from '../types';
import { Loader2, Ghost } from 'lucide-react';

// Components
import HomeView from './HomeView';
import SettingsView from './SettingsView';
import { ProfileView } from './ProfileView';
import ModDetails from './ModDetails';
import LoginView from './LoginView';
import ServersView from './ServersView';
import NewsView from './NewsView';
import UploadForm from './UploadForm';
import CreatorVerification from './CreatorVerification';
import NotificationsView from './NotificationsView';
import DownloadsView from './DownloadsView';
import FriendsView from './FriendsView';
import MonetizationView from './MonetizationView';
import ContestsView from './ContestsView';
import EditProfileView from './EditProfileView';
import AdminDashboard from './AdminDashboard';
import StatsDashboard from './StatsDashboard';
import QuestionsView from './QuestionsView';
import CompleteProfileView from './CompleteProfileView';
import DownloadPage from './DownloadPage';
import AdStatsView from './AdStatsView';
import VerifyEmailView from './VerifyEmailView'; // ✅ تمت الإضافة

interface PageRendererProps {
  activePage: string;
  onNavigate: (page: string) => void;
  currentUser: User | null;
  mods: Mod[];
  servers: MinecraftServer[];
  newsSnippet: NewsItem | null;
  userDownloads: Mod[];
  searchTerm: string;
  setSearchTerm: (t: string) => void;
  isRefreshing: boolean;
  initializeData: () => Promise<void>;
  trackUserInterest: (c: string) => void;
  isRTL: boolean;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
  setShowAdminModal: (val: boolean) => void;
  setCurrentUser: (u: User | null) => void;
  editingItem: Mod | MinecraftServer | null;
  setEditingItem: (item: Mod | MinecraftServer | null) => void;
  db: any;
  onLoadMoreMods: () => void;
  hasMoreMods: boolean;
  isLoadingMoreMods: boolean;
  onRequireLogin: () => void;
}

const PageRenderer: React.FC<PageRendererProps> = ({
  activePage, onNavigate,
  currentUser, mods, servers, newsSnippet, userDownloads,
  searchTerm, setSearchTerm, isRefreshing, initializeData, trackUserInterest,
  isRTL, isAdminAuthenticated, setIsAdminAuthenticated, setShowAdminModal, setCurrentUser,
  editingItem, setEditingItem, db, onRequireLogin
}) => {

  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isStaticPage = (id: string) => {
    const staticPages = [
      'home', 'settings', 'profile', 'servers', 'news', 'upload',
      'join-creators', 'notifications', 'downloads', 'friends',
      'earnings', 'contests', 'edit-profile', 'admin', 'stats',
      'login', 'questions', 'complete-profile', 'download',
      'ad-stats', 'verify' // ✅ أضفنا verify هنا
    ];
    return staticPages.includes(id.toLowerCase());
  };

  const normalizedPageId = activePage.toLowerCase();
  const isStatic = isStaticPage(normalizedPageId);

  useEffect(() => {
    if (isStatic) {
      setSelectedMod(null);
    }

    setFetchedUser(null);
    setNotFound(false);

    if (!isStatic) {
      if (activePage.startsWith('@')) {
        setLoadingDynamic(true);
        fetchUserByUsername(activePage.substring(1));
      }
    } else {
      setLoadingDynamic(false);
    }
  }, [activePage, isStatic]);

  const fetchUserByUsername = async (username: string) => {
    try {
      const q = query(collection(firestore, 'users'), where('username', '==', username.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFetchedUser(snap.docs[0].data() as User);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoadingDynamic(false);
    }
  };

  const handleModClick = (m: Mod) => {
    setSelectedMod(m);
    trackUserInterest(m.category);
  };

  if (loadingDynamic) {
    return (
      <div className="flex flex-col items-center justify-center py-40 min-h-[50vh]">
        <Loader2 className="animate-spin text-lime-500 mb-4" size={48} />
        <p className="text-zinc-500 font-black">جاري التحميل...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center min-h-[50vh]">
        <Ghost size={64} className="text-zinc-800 mb-6" />
        <h2 className="text-2xl font-black text-white">الصفحة غير موجودة</h2>
        <button onClick={() => onNavigate('home')} className="mt-8 px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // --- STATIC ROUTING LOGIC ---

  if (normalizedPageId === 'verify') {
    return <VerifyEmailView />;
  }

  if (normalizedPageId === 'complete-profile') {
    return <CompleteProfileView currentUser={currentUser} onComplete={(u) => { setCurrentUser(u); onNavigate('home'); }} />;
  }

  if (selectedMod) {
    return <ModDetails mod={selectedMod} allMods={mods} currentUser={currentUser} onBack={() => setSelectedMod(null)} onModClick={handleModClick} isOnline={true} isAdmin={isAdminAuthenticated || currentUser?.role === 'Admin'} />;
  }

  if (normalizedPageId === 'home') {
    return <HomeView mods={mods} currentUser={currentUser} searchTerm={searchTerm} setSearchTerm={setSearchTerm} isRefreshing={isRefreshing} onRefresh={initializeData} onModClick={handleModClick} onNavigate={onNavigate} isRTL={isRTL} trackUserInterest={trackUserInterest} />;
  }

  if (normalizedPageId === 'login') {
    return <LoginView onLogin={(u) => { setCurrentUser(u); onNavigate('home'); }} />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-40 min-h-[50vh]">
      <Loader2 className="animate-spin text-lime-500 mb-4" size={48} />
      <p className="text-zinc-500 font-black">جاري المعالجة...</p>
    </div>
  );
};

export default PageRenderer;
