import React, { useState, useEffect, useRef } from 'react';
import { Mod, User, View, MinecraftServer, NewsItem } from './types';
import { db, auth, firestore } from './db';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PageRenderer from './components/PageRenderer';
import GlobalPopup from './components/GlobalPopup';
import SecurityCheckpoint from './components/SecurityCheckpoint';
import { useTranslation } from './LanguageContext';

const ADMIN_EMAIL = 'overmods1@gmail.com';

export default function App() {
  const { isRTL } = useTranslation();

  // ✅ قراءة المسار الحالي
  const getPathView = () => {
    const path = window.location.pathname.replace('/', '');
    return path || 'home';
  };

  const [currentView, setCurrentView] = useState<string>(getPathView());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [servers, setServers] = useState<MinecraftServer[]>([]);
  const [newsSnippet, setNewsSnippet] = useState<NewsItem | null>(null);
  const [userDownloads, setUserDownloads] = useState<Mod[]>([]);
  const [editingItem, setEditingItem] = useState<Mod | MinecraftServer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initialLoadDone = useRef(false);

  // ✅ متابعة زر الرجوع (Back button)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getPathView());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ✅ تنقل احترافي
  const handleNavClick = (view: string) => {
    if (view === currentView) return;

    window.history.pushState({}, '', view === 'home' ? '/' : `/${view}`);
    setEditingItem(null);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  // ✅ Auth
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = db.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeProfile = onSnapshot(
          doc(firestore, 'users', firebaseUser.uid),
          async (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data() as User;
              const verified = auth.currentUser?.emailVerified || false;

              setCurrentUser({
                ...profile,
                email: firebaseUser.email || '',
                emailVerified: verified,
              });

              if (!initialLoadDone.current) {
                initializeData();
              }
            }
          }
        );
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setCurrentUser(null);

        // لا نكسر المسار الحالي
        if (getPathView() !== 'login') {
          handleNavClick('login');
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const initializeData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const [modsData, serversData, newsData] = await Promise.all([
        db.getAll('mods'),
        db.getAll('servers', 10),
        db.getAll('news', 1),
      ]);

      setMods(modsData as Mod[]);
      setServers(serversData as MinecraftServer[] || []);
      if (newsData && newsData.length > 0)
        setNewsSnippet(newsData[0] as NewsItem);

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
          onLogout={() => {
            db.logout();
            setCurrentUser(null);
            handleNavClick('login');
          }}
          isAdminUser={currentUser?.email === ADMIN_EMAIL}
          onAdminClick={() => {}}
        />
      )}

      <div className={`flex-1 flex flex-col ${!isLoginPage ? 'lg:mr-72' : ''} min-h-screen relative`}>
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
              setShowAdminModal={() => {}}
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
