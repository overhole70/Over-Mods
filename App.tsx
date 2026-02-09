
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Mod, User, View, ModType, MinecraftServer, NewsItem, VerificationStatus } from './types';
import { db, auth, firestore } from './db';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ModCard from './components/ModCard';
import UploadForm from './components/UploadForm';
import StatsDashboard from './components/StatsDashboard';
import ModDetails from './components/ModDetails';
import { ProfileView } from './components/ProfileView';
import LoginView from './components/LoginView';
import SettingsView from './components/SettingsView';
import AdminDashboard from './components/AdminDashboard';
import NotificationsView from './components/NotificationsView';
import EditProfileView from './components/EditProfileView';
import DownloadsView from './components/DownloadsView';
import FriendsView from './components/FriendsView';
import NewsView from './components/NewsView';
import ServersView from './components/ServersView';
import MonetizationView from './components/MonetizationView';
import ContestsView from './components/ContestsView';
import CreatorVerification from './components/CreatorVerification';
import { MOD_TYPES, CATEGORIES } from './components/constants';
import { Loader2, Lock, Zap, Newspaper, ArrowRight, Mail, Search, RotateCw, LayoutGrid, ShieldCheck, UserCheck, AlertTriangle, SlidersHorizontal, ArrowDownNarrowWide, Clock, TrendingUp, Star, Filter, Ghost, AlertCircle, Youtube, Home, Users, Settings, ShieldAlert, BarChart3, Server } from 'lucide-react';
import { useTranslation } from './LanguageContext';

const ADMIN_EMAIL = 'overmods1@gmail.com';
const ADMIN_CODE = 'Aiopwbxj';

type SortType = 'newest' | 'most_viewed' | 'highest_rated' | 'recommended';

export default function App() {
  const { t, isRTL } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null); 
  const [mods, setMods] = useState<Mod[]>([]);
  const [servers, setServers] = useState<MinecraftServer[]>([]);
  const [newsSnippet, setNewsSnippet] = useState<NewsItem | null>(null);
  const [userDownloads, setUserDownloads] = useState<Mod[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
  const [editingItem, setEditingItem] = useState<Mod | MinecraftServer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ModType | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortType>('recommended');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isBottomBarIdle, setIsBottomBarIdle] = useState(false);
  // Use any for timeout ref to avoid NodeJS namespace issues in frontend-only environments
  const idleTimerRef = useRef<any>(null);
  const initialLoadDone = useRef(false);

  const trackUserInterest = (category: string) => {
    if (!category) return;
    const stored = localStorage.getItem('user_interests');
    const interests = stored ? JSON.parse(stored) : {};
    interests[category] = (interests[category] || 0) + 1;
    localStorage.setItem('user_interests', JSON.stringify(interests));
  };

  const resetIdleTimer = () => {
    setIsBottomBarIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsBottomBarIdle(true);
    }, 3000);
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    const authUnsubscribe = db.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Request Permission & Token on login
        try {
          await db.requestFcmToken(firebaseUser.uid);
        } catch (e) { console.error(e); }

        profileUnsubscribe = onSnapshot(doc(firestore, 'users', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as User;
            if (profile.isBlocked && profile.email !== ADMIN_EMAIL) {
              await db.logout(); setCurrentUser(null); setCurrentView('login');
              setIsInitialized(true);
              return;
            }
            const verified = auth.currentUser?.emailVerified || false;
            setCurrentUser({ ...profile, email: firebaseUser.email || '', emailVerified: verified });
          }
          setIsInitialized(true); 
        }, (err) => {
          console.error("Profile snapshot error:", err);
          setIsInitialized(true);
        });
      } else { 
        if (profileUnsubscribe) profileUnsubscribe();
        setCurrentUser(null); setIsAdminAuthenticated(false);
        setUserDownloads([]);
        setIsInitialized(true);
      }
    });

    if (!initialLoadDone.current) {
      initializeData();
      initialLoadDone.current = true;
    }

    // Foreground Message Listener
    db.onMessageListener().then((payload: any) => {
      console.log('Foreground Message:', payload);
      // Optional: Show custom toast UI
      if (Notification.permission === 'granted') {
         new Notification(payload.notification.title, { body: payload.notification.body });
      }
    });

    return () => { 
      authUnsubscribe(); 
      if (profileUnsubscribe) profileUnsubscribe(); 
    };
  }, []);

  // Fix: Sync verification status across the app immediately when currentUser status changes
  useEffect(() => {
    if (currentUser?.isVerified && initialLoadDone.current) {
      initializeData();
    }
  }, [currentUser?.isVerified]);

  const initializeData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [m, s, n] = await Promise.all([
        db.getAll('mods', 100),
        db.getAll('servers', 24),
        db.getAll('news', 1)
      ]);
      setMods(m as Mod[] || []);
      setServers(s as MinecraftServer[] || []);
      if (n && n.length > 0) setNewsSnippet(n[0] as NewsItem);
      setIsOffline(false);
    } catch (e) {
      setIsOffline(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const processedMods = useMemo(() => {
    const userInterests = JSON.parse(localStorage.getItem('user_interests') || '{}');
    const s = searchTerm.toLowerCase().trim();
    
    let list = mods.filter(m => {
      const matchSearch = s === '' || 
        m.title?.toLowerCase().includes(s) || 
        m.shareCode?.toLowerCase().includes(s);
      const matchType = filterType === 'All' || m.type === filterType;
      const matchCat = filterCategory === 'All' || m.category === filterCategory;
      return matchSearch && matchType && matchCat && m.type !== 'Server';
    });

    return list.sort((a, b) => {
      if (sortBy === 'most_viewed') return (b.stats?.views || 0) - (a.stats?.views || 0);
      if (sortBy === 'highest_rated') return (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0);
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

      const weightA = (userInterests[a.category] || 0) * 10 + ((a.stats?.uniqueViews || 0) / 500) + (new Date(a.createdAt || 0).getTime() / 100000000);
      const weightB = (userInterests[b.category] || 0) * 10 + ((b.stats?.uniqueViews || 0) / 500) + (new Date(b.createdAt || 0).getTime() / 100000000);
      return weightB - weightA;
    });
  }, [mods, searchTerm, filterType, filterCategory, sortBy]);

  const handleNavClick = (view: View) => {
    resetIdleTimer();
    if (!currentUser && ['upload', 'profile', 'notifications', 'stats', 'settings', 'edit-profile', 'friends', 'earnings', 'downloads', 'join-creators'].includes(view)) {
      setCurrentView('login'); return;
    }

    if (view === 'upload' && currentUser) {
      // Rule 1: NO user is allowed to publish an add-on unless they go through the verification flow.
      if (!currentUser.verificationStatus || currentUser.verificationStatus === 'none') {
        setCurrentView('join-creators');
        return;
      }
    }

    if (view === 'profile') setTargetUser(currentUser);
    if (view !== 'upload') setEditingItem(null); 
    setCurrentView(view); window.scrollTo(0, 0);
  };

  const isAdmin = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'Admin';

  if (!isInitialized) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin theme-text-primary" size={48} /></div>;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#050505] text-white overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onViewChange={handleNavClick} currentUser={currentUser} onLogout={() => { db.logout(); setCurrentUser(null); setCurrentView('login'); }} isAdminUser={isAdmin || currentUser?.role === 'Helper'} onAdminClick={() => isAdminAuthenticated ? setCurrentView('admin') : setShowAdminModal(true)} />

      <div className="flex-1 flex flex-col lg:mr-72 min-h-screen relative pb-28">
        <Navbar currentUser={currentUser} onViewChange={handleNavClick} onSearch={setSearchTerm} isOnline={!isOffline} currentView={currentView} onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* YouTuber video submission reminder */}
            {currentUser && currentUser.verificationStatus === 'youtuber_no_video' && (
              <div className="mb-8 p-6 bg-red-600/10 border border-red-500/20 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Youtube size={28} /></div>
                    <div className="text-right">
                       <h4 className="text-white font-black text-lg">بانتظار فيديو التوثيق</h4>
                       <p className="text-zinc-500 text-sm font-medium">يرجى رفع فيديو "غير مدرج" لإثبات ملكية قناتك والحصول على شارة التوثيق.</p>
                    </div>
                 </div>
                 <button onClick={() => setCurrentView('join-creators')} className="px-8 py-3 bg-red-600 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-xl">إكمال التوثيق</button>
              </div>
            )}

            {currentView === 'home' && (
              <div className="space-y-12">
                <div className="py-16 md:py-24 px-6 text-center space-y-8 relative overflow-hidden rounded-[3rem] md:rounded-[5rem] border border-white/5 bg-[#080808] shadow-2xl">
                   <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none"></div>
                   <div className="relative z-10 space-y-6">
                      <div className="inline-flex items-center gap-2 px-6 py-2 bg-zinc-900/50 border border-white/5 rounded-full theme-text-primary text-[10px] font-black uppercase tracking-[0.3em]"><Zap size={14} fill="currentColor" /> Over Mods Discovery</div>
                      <h1 className="text-4xl md:text-7xl font-black text-white leading-tight">إبداعات <span className="theme-text-primary">البيدروك</span></h1>
                      <p className="text-zinc-500 max-w-xl mx-auto font-medium text-sm md:text-lg leading-relaxed">اكتشف مودات مخصصة لاهتماماتك بناءً على نشاطك في المنصة.</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative group flex-1 w-full">
                      <Search className={`absolute ${isRTL ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:theme-text-primary transition-colors`} size={20} />
                      <input 
                        type="text" 
                        placeholder="ابحث عن مود، ريسورس باك..." 
                        value={searchTerm} 
                        className={`w-full bg-zinc-900 border border-white/5 rounded-[2rem] py-5 ${isRTL ? 'pr-16 pl-6' : 'pl-16 pr-6'} focus:theme-border-primary-alpha text-white font-bold transition-all shadow-inner outline-none`} 
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if (e.target.value.length > 3) trackUserInterest(filterCategory);
                        }} 
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                       <button 
                         onClick={() => setIsFilterOpen(!isFilterOpen)} 
                         className={`h-16 px-6 rounded-2xl border transition-all flex items-center gap-3 font-black text-xs ${isFilterOpen ? 'theme-bg-primary text-black border-transparent shadow-xl' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                       >
                          <SlidersHorizontal size={20} />
                          {isFilterOpen ? 'إغلاق الفلاتر' : 'تصفية النتائج'}
                       </button>
                       <button onClick={initializeData} className="w-16 h-16 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:theme-text-primary transition-all active:scale-90"><RotateCw size={24} className={isRefreshing ? "animate-spin" : ""} /></button>
                    </div>
                  </div>

                  {isFilterOpen && (
                    <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-[3rem] grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-300">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2"><ArrowDownNarrowWide size={14}/> ترتيب حسب</label>
                          <div className="flex flex-wrap gap-2">
                             {[
                               { id: 'recommended', label: 'المقترح لك', icon: <Zap size={14}/> },
                               { id: 'newest', label: 'الأحدث', icon: <Clock size={14}/> },
                               { id: 'most_viewed', label: 'الأكثر مشاهدة', icon: <TrendingUp size={14}/> },
                               { id: 'highest_rated', label: 'الأعلى تقييماً', icon: <Star size={14}/> }
                             ].map(opt => (
                               <button 
                                 key={opt.id} 
                                 onClick={() => setSortBy(opt.id as any)}
                                 className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${sortBy === opt.id ? 'theme-bg-primary text-black' : 'bg-zinc-950 text-zinc-500 hover:text-white'}`}
                               >
                                  {opt.icon} {opt.label}
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2"><LayoutGrid size={14}/> النوع</label>
                          <div className="flex flex-wrap gap-2">
                             <button onClick={() => setFilterType('All')} className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all ${filterType === 'All' ? 'theme-bg-primary text-black' : 'bg-zinc-950 text-zinc-500 hover:text-white'}`}>الكل</button>
                             {MOD_TYPES.filter(t => t.value !== 'Server').map(t => (
                               <button key={t.value} onClick={() => setFilterType(t.value)} className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all ${filterType === t.value ? 'theme-bg-primary text-black' : 'bg-zinc-950 text-zinc-500 hover:text-white'}`}>{t.label}</button>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2"><Filter size={14}/> الفئة</label>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar p-1">
                             <button onClick={() => setFilterCategory('All')} className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all ${filterCategory === 'All' ? 'theme-bg-primary text-black' : 'bg-zinc-950 text-zinc-500 hover:text-white'}`}>الكل</button>
                             {CATEGORIES.map(cat => (
                               <button key={cat} onClick={() => { setFilterCategory(cat); trackUserInterest(cat); }} className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all ${filterCategory === cat ? 'theme-bg-primary text-black' : 'bg-zinc-950 text-zinc-500 hover:text-white'}`}>{cat}</button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
                    {processedMods.map(m => (
                      <ModCard 
                        key={m.id} 
                        mod={m} 
                        onClick={() => { trackUserInterest(m.category); setSelectedMod(m); setCurrentView('details'); }} 
                        isFollowing={currentUser?.following?.includes(m.publisherId) || false} 
                        onFollow={(e) => { e.stopPropagation(); db.followUser(currentUser!.id, m.publisherId); }} 
                      />
                    ))}
                  </div>
                  
                  {processedMods.length === 0 && !isRefreshing && (
                    <div className="py-40 text-center border-2 border-dashed border-zinc-900 rounded-[4rem] text-zinc-700 font-black animate-in fade-in">
                       <Ghost size={48} className="mx-auto mb-6 opacity-20" />
                       <p className="text-xl">لم نجد أي إضافات تطابق اختياراتك</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {currentView === 'details' && selectedMod && (
              <ModDetails 
                mod={selectedMod} 
                allMods={mods} 
                currentUser={currentUser} 
                onBack={() => setCurrentView('home')} 
                onModClick={(m) => { trackUserInterest(m.category); setSelectedMod(m); }} 
                isOnline={!isOffline} 
                isAdmin={isAdmin} 
                onPublisherClick={(pid) => db.get('users', pid).then(u => { if(u) { setTargetUser(u as User); setCurrentView('profile'); } })} 
                isFollowing={currentUser?.following?.includes(selectedMod.publisherId) || false} 
                onFollow={() => db.followUser(currentUser!.id, selectedMod.publisherId)} 
                onEdit={() => { setEditingItem(selectedMod); setCurrentView('upload'); }} 
                onDelete={() => db.deleteMod(selectedMod.id).then(initializeData)} 
                onDownload={() => trackUserInterest(selectedMod.category)} 
              />
            )}
            {currentView === 'profile' && targetUser && <ProfileView user={targetUser} currentUser={currentUser} isOwnProfile={currentUser?.id === targetUser.id} mods={mods.filter(m => m.publisherId === targetUser.id)} onLogout={() => { db.logout(); setCurrentUser(null); setCurrentView('login'); }} onEditMod={() => {}} onModClick={setSelectedMod} onFollow={async () => { await db.followUser(currentUser!.id, targetUser.id); }} onEditProfile={() => setCurrentView('edit-profile')} onBack={() => setCurrentView('home')} />}
            {currentView === 'stats' && currentUser && <StatsDashboard mods={mods.filter(m => m.publisherId === currentUser.id)} />}
            {currentView === 'servers' && <ServersView servers={servers} currentUser={currentUser} isAdmin={isAdmin} onRefresh={() => db.getAll('servers', 24).then(s => setServers(s as MinecraftServer[]))} onEditServer={(s) => { setEditingItem(s); setCurrentView('upload'); }} />}
            {currentView === 'news' && <NewsView onBack={() => setCurrentView('home')} currentUser={currentUser} onViewProfile={(u) => { setTargetUser(u); setCurrentView('profile'); }} />}
            {currentView === 'upload' && currentUser && (
              <UploadForm 
                initialData={editingItem}
                onBack={() => { setEditingItem(null); setCurrentView('home'); }} 
                onCancel={() => { setEditingItem(null); setCurrentView('home'); }} 
                onUpload={(data) => {
                  const coll = data.type === 'Server' ? 'servers' : 'mods';
                  const payload = { 
                    ...data, 
                    id: editingItem?.id, 
                    publisherId: currentUser?.id, 
                    publisherName: currentUser?.displayName, 
                    publisherAvatar: currentUser?.avatar, 
                    isVerified: currentUser.isVerified,
                    stats: editingItem ? (editingItem as Mod).stats : { views: 0, downloads: 0, likes: 0, dislikes: 0, uniqueViews: 0, ratingCount: 0, averageRating: 0, totalRatingScore: 0 } 
                  };
                  db.put(coll, payload).then(() => { 
                    setEditingItem(null);
                    initializeData(); 
                    setCurrentView('home'); 
                  });
                }} 
              />
            )}
            {currentView === 'join-creators' && currentUser && (
              <CreatorVerification 
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
                onSuccess={async (data, status, videoUrl) => {
                  const update: Partial<User> = {
                    verificationStatus: status,
                  };
                  if (videoUrl) update.verificationVideoUrl = videoUrl;
                  if (data.reason) update.verificationReason = data.reason;
                  if (data.channelUrl) update.channelUrl = data.channelUrl;
                  if (data.subscriberCount) update.subscriberCount = data.subscriberCount;

                  await db.updateAccount(currentUser.id, update);
                  setCurrentView('home');
                  alert('تم إرسال طلبك للإدارة. يمكنك الآن البدء في النشر بينما نراجع بياناتك.');
                }}
              />
            )}
            {currentView === 'notifications' && currentUser && <NotificationsView currentUser={currentUser} onModClick={(id) => {
              // General handling for mod clicks
            }} onBack={() => setCurrentView('home')} />}
            {currentView === 'settings' && <SettingsView />}
            {currentView === 'login' && <LoginView onLogin={(u) => { setCurrentUser(u); setCurrentView('home'); }} />}
            {currentView === 'downloads' && <DownloadsView mods={userDownloads} onModClick={(m) => { setSelectedMod(m); setCurrentView('details'); }} />}
            {currentView === 'friends' && currentUser && <FriendsView currentUser={currentUser} onViewProfile={(u) => { setTargetUser(u); setCurrentView('profile'); }} />}
            {currentView === 'earnings' && <MonetizationView onNavigate={handleNavClick} />}
            {currentView === 'contests' && currentUser && <ContestsView currentUser={currentUser} onBack={() => setCurrentView('earnings')} />}
            {currentView === 'edit-profile' && currentUser && <EditProfileView currentUser={currentUser} onUpdate={(u) => { setCurrentUser(u); setCurrentView('profile'); setTargetUser(u); }} onLogout={() => { db.logout(); setCurrentUser(null); setCurrentView('login'); }} onDelete={() => {}} onBack={() => setCurrentView('profile')} />}
            {currentView === 'admin' && isAdminAuthenticated && <AdminDashboard currentUser={currentUser} onInspectAccount={(u) => { setTargetUser(u); setCurrentView('profile'); }} />}
          </div>
        </main>

        {/* Floating Bottom Navigation */}
        <div 
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 p-2 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-500 ease-in-out ${
            isBottomBarIdle 
              ? 'bg-black/60 backdrop-blur-md border border-white/5 opacity-80 hover:opacity-100 hover:bg-[#0a0a0a]/95 scale-95 hover:scale-100' // Adjusted Transparency: Darker and Higher Opacity
              : 'bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 opacity-100 scale-100' // Normal Active
          }`}
          onClick={resetIdleTimer}
          onTouchStart={resetIdleTimer}
        >
          <button 
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center justify-center w-[4.5rem] h-16 rounded-[2rem] transition-all gap-1 ${currentView === 'home' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20 scale-105' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Home size={22} strokeWidth={currentView === 'home' ? 3 : 2} />
            <span className="text-[9px] font-black">الرئيسية</span>
          </button>
          
          <button 
            onClick={() => handleNavClick('friends')}
            className={`flex flex-col items-center justify-center w-[4.5rem] h-16 rounded-[2rem] transition-all gap-1 ${currentView === 'friends' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20 scale-105' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={22} strokeWidth={currentView === 'friends' ? 3 : 2} />
            <span className="text-[9px] font-black">الأصدقاء</span>
          </button>

          {/* Servers Button (Replacing Stats) */}
          <button 
            onClick={() => handleNavClick('servers')}
            className={`flex flex-col items-center justify-center w-[4.5rem] h-16 rounded-[2rem] transition-all gap-1 ${currentView === 'servers' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20 scale-105' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Server size={22} strokeWidth={currentView === 'servers' ? 3 : 2} />
            <span className="text-[9px] font-black">السيرفرات</span>
          </button>

          <button 
            onClick={() => handleNavClick('settings')}
            className={`flex flex-col items-center justify-center w-[4.5rem] h-16 rounded-[2rem] transition-all gap-1 ${currentView === 'settings' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20 scale-105' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Settings size={22} strokeWidth={currentView === 'settings' ? 3 : 2} />
            <span className="text-[9px] font-black">الإعدادات</span>
          </button>
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowAdminModal(false)}></div>
          <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3.5rem] w-full max-md relative z-10 text-center animate-in zoom-in">
             <div className="w-20 h-20 bg-zinc-900 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl"><Lock size={40} /></div>
             <h3 className="text-2xl font-black mb-8">منطقة المسؤولين</h3>
             <form onSubmit={(e) => { e.preventDefault(); if (adminInput === ADMIN_CODE) { setIsAdminAuthenticated(true); setShowAdminModal(false); setAdminInput(''); setCurrentView('admin'); } else alert('كود الإدارة غير صحيح'); }} className="space-y-6">
                <input type="password" value={adminInput} autoFocus onChange={(e) => setAdminInput(e.target.value)} placeholder="كود الإدارة" className="w-full bg-zinc-900 border border-white/5 rounded-3xl py-5 text-center text-white font-black outline-none focus:border-white/20 tracking-[0.6em] text-xl" />
                <button type="submit" className="w-full py-5 theme-bg-primary text-black rounded-3xl font-black text-lg active:scale-95 transition-all">تحقق ودخول</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
