import React, { useState, useEffect, useRef } from 'react';
import { Mod, User, View, MinecraftServer, NewsItem } from './types';
import { db, auth, firestore } from './db';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PageRenderer from './components/PageRenderer';
import GlobalPopup from './components/GlobalPopup';
import SecurityCheckpoint from './components/SecurityCheckpoint';
import { Loader2, Lock, Home, Users, Newspaper, Settings, Server, Youtube } from 'lucide-react';
import { useTranslation } from './LanguageContext';

const ADMIN_EMAIL = 'overmods1@gmail.com';
const ADMIN_CODE = 'Aiopwbxj';

export default function App() {
  const { t, isRTL } = useTranslation();

  // ✅ قراءة المسار من الرابط مباشرة
  const getInitialView = () => {
    const path = window.location.pathname.replace('/', '');
    return path || 'home';
  };

  const [currentView, setCurrentView] = useState<string>(getInitialView());

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLockedBySecurity, setIsLockedBySecurity] = useState(false);
  const [mods, setMods] = useState<Mod[]>([]);
  const [servers, setServers] = useState<MinecraftServer[]>([]);
  const [newsSnippet, setNewsSnippet] = useState<NewsItem | null>(null);
  const [userDownloads, setUserDownloads] = useState<Mod[]>([]);
  const [editingItem, setEditingItem] = useState<Mod | MinecraftServer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBottomBarIdle, setIsBottomBarIdle] = useState(false);

  const idleTimerRef = useRef<any>(null);
  const initialLoadDone = useRef(false);

  // ✅ دعم زر الرجوع
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      setCurrentView(path || 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavClick = (view: string) => {
    window.history.pushState({}, '', `/${view}`);
    setEditingItem(null);
    setCurrentView(view);
  };

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = db.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        profileUnsubscribe = onSnapshot(doc(firestore, 'users', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as User;
            const verified = auth.currentUser?.emailVerified || false;
            setCurrentUser({ ...profile, email: firebaseUser.email || '', emailVerified: verified });

            if (!initialLoadDone.current) {
              initializeData();
            }
          } else {
            setIsInitialized(true);
          }
        });
      } else {
        if (profileUnsubscribe) profileUnsubscribe();
        setCurrentUser(null);
        setCurrentView('login');
        setIsInitialized(true);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const initializeData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [modsData, s, n] = await Promise.all([
        db.getAll('mods'),
        db.getAll('servers', 10),
        db.getAll('news', 1)
      ]);
      setMods(modsData as Mod[]);
      setServers(s as MinecraftServer[] || []);
      if (n && n.length > 0) setNewsSnippet(n[0] as NewsItem);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setIsRefreshing(false);
      initialLoadDone.current = true;
    }
  };

  const isLoginPage = currentView === 'login';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#050505] text-white overflow-x-hidden">
      <GlobalPopup onNavigate={handleNavClick} />

      {!isLoginPage && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentView={currentView as View}
          onViewChange={handleNavClick}
          currentUser={currentUser}
          onLogout={() => { db.logout(); setCurrentUser(null); handleNavClick('login'); }}
          isAdminUser={currentUser?.email === ADMIN_EMAIL}
          onAdminClick={() => setShowAdminModal(true)}
        />
      )}

      <div className={`flex-1 flex flex-col ${!isLoginPage ? 'lg:mr-72' : ''} min-h-screen relative ${!isLoginPage ? 'pb-28' : ''}`}>
        {!isLoginPage && (
          <Navbar
            currentUser={currentUser}
            onViewChange={handleNavClick}
            onSearch={setSearchTerm}
            isOnline={!isOffline}
            currentView={currentView}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        )}

        <main className="flex-1 px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <PageRenderer
              activePage={currentView}
              onNavigate={handleNavClick}
              currentUser={currentUser}
              mods={mods}
              servers={servers}
              newsSnippet={newsSnippet}
              userDownloads={userDownloads}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isRefreshing={isRefreshing}
              initializeData={initializeData}
              trackUserInterest={() => {}}
              isRTL={isRTL}
              isAdminAuthenticated={false}
              setIsAdminAuthenticated={() => {}}
              setShowAdminModal={setShowAdminModal}
              setCurrentUser={setCurrentUser}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              db={db}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
