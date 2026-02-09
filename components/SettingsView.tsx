import React, { useState, useEffect } from 'react';
import { User as UserIcon, LogOut, Loader2, ChevronRight, ArrowRight, Lock, Eye, Copy, CheckCircle2, ShieldCheck, Globe, Users, Calendar, Lock as LockIcon, Clock, AlertTriangle, MessageSquare, HeartHandshake, Send, ChevronLeft, Mail, ShieldAlert, Check, Shield, Hash, Bell, RefreshCw, Key, UserCheck, Smartphone, Palette } from 'lucide-react';
import { db, auth } from '../db';
import { User, PrivacySettings } from '../types';
import { useTranslation } from '../LanguageContext';
import { useTheme, ThemeType } from '../ThemeContext';

const SettingsView: React.FC = () => {
  const { isRTL } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<'menu' | 'account' | 'security' | 'privacy' | 'support' | 'theme'>('menu');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifSent, setVerifSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [accountVerifLoading, setAccountVerifLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Support State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportStatus, setSupportStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Password Reset State
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const f = async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const p = await db.get('users', auth.currentUser.uid);
        setUser({ ...p, email: auth.currentUser.email } as User);
        setIsEmailVerified(auth.currentUser.emailVerified);
      }
      setIsLoading(false);
    };
    f();
  }, [isEmailVerified]);

  const handleVerifyEmail = async () => {
    setVerifLoading(true);
    try {
      const sent = await db.sendVerificationEmail();
      if (sent) {
        setVerifSent(true);
        setShowEmailModal(true);
      }
    } catch (err) { alert("حدث خطأ أثناء إرسال البريد. حاول مجدداً لاحقاً."); }
    finally { setVerifLoading(false); }
  };

  const handlePasswordReset = async () => {
    if (!user?.email || resetLoading) return;
    setResetLoading(true);
    try {
      await db.sendPasswordReset(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      alert("حدث خطأ أثناء إرسال رابط إعادة التعيين.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(field);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleUpdatePrivacy = async (key: keyof PrivacySettings) => {
    if (!user) return;
    const currentPrivacy = user.privacySettings || { showInSearch: true, showFollowersList: true, showJoinDate: true, privateCollections: false, showOnlineStatus: true, messagingPermission: 'everyone' };
    const updatedPrivacy = { ...currentPrivacy, [key]: !currentPrivacy[key] };
    setUser({ ...user, privacySettings: updatedPrivacy });
    await db.updateAccount(user.id, { privacySettings: updatedPrivacy });
  };

  const handleUpdateMessagingPermission = async (val: 'everyone' | 'followers' | 'none') => {
    if (!user) return;
    const currentPrivacy = user.privacySettings || { showInSearch: true, showFollowersList: true, showJoinDate: true, privateCollections: false, showOnlineStatus: true, messagingPermission: 'everyone' };
    const updatedPrivacy = { ...currentPrivacy, messagingPermission: val };
    setUser({ ...user, privacySettings: updatedPrivacy });
    await db.updateAccount(user.id, { privacySettings: updatedPrivacy });
  };

  const handleToggleSecurityNotifs = async () => {
    if (!user) return;
    const newVal = !user.securityNotificationsEnabled;
    setUser({ ...user, securityNotificationsEnabled: newVal });
    await db.updateAccount(user.id, { securityNotificationsEnabled: newVal });
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supportMsg.trim()) return;
    setSupportStatus('loading');
    try {
      await db.createComplaint(user.id, user.displayName, supportSubject || 'عام', supportMsg);
      setSupportStatus('success');
      setSupportMsg('');
      setSupportSubject('');
      setTimeout(() => setSupportStatus('idle'), 3000);
    } catch (err) {
      alert("فشل في إرسال تذكرة الدعم.");
      setSupportStatus('idle');
    }
  };

  const ListRow = ({ label, icon: Icon, colorClass, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/5 transition-all group active:bg-white/10">
       <div className="flex items-center gap-5">
          <div className={`w-11 h-11 bg-zinc-900 rounded-xl flex items-center justify-center ${colorClass} border border-white/5`}><Icon size={22} /></div>
          <span className="text-white font-black text-base">{label}</span>
       </div>
       <ChevronLeft className={`${isRTL ? '' : 'rotate-180'} text-zinc-800 group-hover:text-zinc-600 transition-colors`} size={20} />
    </button>
  );

  const themeOptions: { id: ThemeType; label: string; color: string }[] = [
    { id: 'green', label: 'الأخضر (افتراضي)', color: 'bg-[#84cc16]' },
    { id: 'blue', label: 'الأزرق الملكي', color: 'bg-[#3b82f6]' },
    { id: 'purple', label: 'الأرجواني', color: 'bg-[#a855f7]' },
    { id: 'orange', label: 'البرتقالي', color: 'bg-[#f97316]' },
  ];

  if (isLoading) return <div className="py-32 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin theme-text-primary" size={48} /></div>;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300 pb-32">
      {activeSection === 'menu' ? (
        <div className="space-y-4">
           <div className="px-6 py-8">
              <h2 className="text-3xl font-black text-white">الإعدادات</h2>
              <p className="text-zinc-600 text-[10px] font-black mt-1 uppercase tracking-widest">Platform & Preferences</p>
           </div>
           <div className="bg-zinc-950/20 border-t border-b border-white/5">
              <ListRow label="مظهر المنصة" icon={Palette} colorClass="theme-text-primary" onClick={() => setActiveSection('theme')} />
              <ListRow label="بيانات الحساب" icon={UserIcon} colorClass="theme-text-primary" onClick={() => setActiveSection('account')} />
              <ListRow label="الأمان والوصول" icon={Lock} colorClass="text-blue-500" onClick={() => setActiveSection('security')} />
              <ListRow label="الخصوصية" icon={Eye} colorClass="text-purple-500" onClick={() => setActiveSection('privacy')} />
              <ListRow label="الدعم الفني" icon={HeartHandshake} colorClass="text-pink-500" onClick={() => setActiveSection('support')} />
           </div>
           <div className="px-6 pt-10">
              <button onClick={() => db.logout().then(()=>window.location.reload())} className="w-full py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3">
                 <LogOut size={18} /> تسجيل الخروج
              </button>
           </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-left-4">
           <div className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
              <button onClick={() => setActiveSection('menu')} className="p-2.5 bg-zinc-900 rounded-xl text-zinc-400 active:scale-90 transition-all hover:text-white"><ArrowRight className={isRTL ? '' : 'rotate-180'} /></button>
              <h2 className="text-xl font-black text-white">
                {activeSection === 'theme' ? 'مظهر المنصة' : activeSection === 'security' ? 'الأمان' : activeSection === 'account' ? 'بيانات الحساب' : activeSection === 'privacy' ? 'الخصوصية' : 'الدعم الفني'}
              </h2>
           </div>
           
           <div className="px-6 space-y-10 mt-10">
              {activeSection === 'theme' && (
                <div className="space-y-8 animate-in fade-in">
                   <div className="bg-zinc-900/30 p-8 rounded-[3rem] border border-white/5">
                      <h4 className="text-white font-black text-lg mb-2">تخصيص اللون الأساسي</h4>
                      <p className="text-zinc-500 text-xs font-medium leading-relaxed">اختر لونك المفضل لتطبيقه على كافة الأزرار والعناصر التفاعلية في المنصة.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-3">
                      {themeOptions.map((opt) => (
                        <button 
                          key={opt.id}
                          onClick={() => setTheme(opt.id)}
                          className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all active:scale-98 ${theme === opt.id ? 'theme-border-primary theme-bg-primary-alpha' : 'bg-zinc-950 border-white/5 hover:border-white/10'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl shadow-lg ${opt.color}`}></div>
                              <span className={`font-black text-sm ${theme === opt.id ? 'text-white' : 'text-zinc-500'}`}>{opt.label}</span>
                           </div>
                           {theme === opt.id && <CheckCircle2 className="theme-text-primary" size={24} />}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {activeSection === 'support' && (
                <div className="space-y-8 animate-in fade-in">
                   <div className="bg-zinc-900/30 p-8 rounded-[3rem] border border-white/5 text-center">
                      <div className="w-16 h-16 bg-pink-600/10 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-500/20 shadow-lg">
                         <HeartHandshake size={32} />
                      </div>
                      <h4 className="text-white font-black text-xl mb-2">مركز المساعدة والشكاوى</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك وحل بلاغاتك في أسرع وقت.</p>
                   </div>
                   
                   <form onSubmit={handleSupportSubmit} className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2">موضوع الطلب</label>
                         <input 
                           type="text" 
                           value={supportSubject} 
                           onChange={e => setSupportSubject(e.target.value)}
                           className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 px-6 text-white font-black text-sm outline-none focus:border-pink-500/50 shadow-inner" 
                           placeholder="مثلاً: مشكلة في التحميل، بلاغ عن مستخدم..."
                           required
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2">تفاصيل المشكلة</label>
                         <textarea 
                           value={supportMsg} 
                           onChange={e => setSupportMsg(e.target.value)}
                           className="w-full bg-zinc-900 border border-white/5 rounded-[2rem] py-5 px-6 text-white font-medium text-sm outline-none focus:border-pink-500/50 resize-none shadow-inner" 
                           rows={6}
                           placeholder="اشرح المشكلة بوضوح لنتمكن من مساعدتك..."
                           required
                         />
                      </div>

                      <button 
                        type="submit" 
                        disabled={supportStatus === 'loading' || supportStatus === 'success'}
                        className={`w-full py-6 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl ${supportStatus === 'success' ? 'bg-lime-500 text-black' : 'bg-pink-600 text-white shadow-pink-900/20'}`}
                      >
                         {supportStatus === 'loading' ? <Loader2 className="animate-spin" /> : supportStatus === 'success' ? <CheckCircle2 /> : <Send size={20} />}
                         {supportStatus === 'loading' ? 'جاري الإرسال...' : supportStatus === 'success' ? 'تم الإرسال بنجاح' : 'إرسال تذكرة الدعم'}
                      </button>
                   </form>
                </div>
              )}

              {activeSection === 'account' && user && (
                <div className="space-y-8 animate-in fade-in">
                   <div className="flex flex-col items-center gap-4 bg-zinc-900/30 p-8 rounded-[3rem] border border-white/5">
                      <img src={user.avatar} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-zinc-900 shadow-2xl" />
                      <div className="text-center">
                        <h3 className="text-2xl font-black text-white">{user.displayName}</h3>
                        <p className="text-zinc-500 font-bold ltr">@{user.username}</p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mr-2">المعلومات الأساسية</h4>
                      <div className="grid grid-cols-1 gap-4">
                         {[
                           { label: 'الاسم المستعار', value: user.displayName, field: 'displayName' },
                           { label: 'اسم المستخدم', value: user.username, field: 'username', prefix: '@' },
                           { label: 'معرف الحساب (ID)', value: user.numericId || user.id, field: 'id' }
                         ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-6 bg-zinc-900/20 border border-white/5 rounded-3xl group">
                              <div>
                                 <p className="text-zinc-500 font-bold text-[10px] mb-1 uppercase tracking-widest">{item.label}</p>
                                 <span className="text-white font-black text-base">{item.prefix}{item.value}</span>
                              </div>
                              <button 
                                onClick={() => handleCopy(item.value, item.field)}
                                className={`p-3 rounded-xl transition-all ${copyFeedback === item.field ? 'theme-bg-primary text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                              >
                                 {copyFeedback === item.field ? <Check size={18}/> : <Copy size={18}/>}
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeSection === 'security' && user && (
                <div className="space-y-6">
                   <div className="p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg">
                            <Key size={28} />
                         </div>
                         <div className="text-center md:text-right">
                            <h4 className="text-white font-black text-lg">تغيير كلمة المرور</h4>
                            <p className="text-zinc-500 text-[10px] font-bold mt-1">إرسال رابط آمن لبريدك الإلكتروني</p>
                         </div>
                      </div>
                      <button 
                        onClick={handlePasswordReset}
                        disabled={resetLoading || resetSent}
                        className={`px-8 py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 ${resetSent ? 'theme-bg-primary text-black' : 'bg-white text-black active:scale-95'}`}
                      >
                         {resetLoading ? <Loader2 className="animate-spin" size={20}/> : resetSent ? 'تم إرسال الرابط' : 'إرسال رابط إعادة التعيين'}
                      </button>
                   </div>

                   <div className={`p-8 rounded-[2.5rem] border flex flex-col gap-6 transition-all ${isEmailVerified ? 'theme-bg-primary-alpha theme-border-primary-alpha' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isEmailVerified ? 'theme-bg-primary text-black theme-shadow-primary-soft' : 'bg-red-500 text-white shadow-xl shadow-red-900/20'}`}>
                               {isEmailVerified ? <ShieldCheck size={28}/> : <ShieldAlert size={28}/>}
                            </div>
                            <div>
                               <h4 className="text-white font-black text-lg">تفعيل البريد الإلكتروني</h4>
                               <p className="text-zinc-500 text-xs font-bold">{isEmailVerified ? 'حسابك مؤمن بالكامل' : 'يرجى تأكيد ملكية بريدك'}</p>
                            </div>
                         </div>
                         {isEmailVerified && <CheckCircle2 className="theme-text-primary" size={32} />}
                      </div>
                      {!isEmailVerified && (
                         <button onClick={handleVerifyEmail} disabled={verifLoading || verifSent} className={`w-full py-5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 ${verifSent ? 'theme-bg-primary text-black theme-shadow-primary-soft' : 'bg-white text-black active:scale-95'}`}>
                            {verifLoading ? <Loader2 className="animate-spin" size={18}/> : verifSent ? 'تم إرسال الرابط بنجاح' : 'إرسال رابط التفعيل الآن'}
                         </button>
                      )}
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-zinc-900/20 border border-white/5 rounded-[2rem] cursor-pointer hover:bg-zinc-900/40 transition-all" onClick={handleToggleSecurityNotifs}>
                         <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-zinc-900 rounded-xl flex items-center justify-center text-orange-500 border border-white/5">
                               <Bell size={22} />
                            </div>
                            <div>
                               <h4 className="text-white font-black text-sm">إشعارات تسجيل الدخول</h4>
                               <p className="text-zinc-600 text-[10px] font-bold mt-1">تنبيهك عند الدخول من جهاز جديد</p>
                            </div>
                         </div>
                         <div className={`w-12 h-6 rounded-full relative transition-all ${user.securityNotificationsEnabled ? 'theme-bg-primary' : 'bg-zinc-800'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.securityNotificationsEnabled ? 'right-7' : 'right-1'}`}></div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeSection === 'privacy' && user && (
                <div className="space-y-6 animate-in fade-in">
                   {[
                     { key: 'showInSearch', label: 'الظهور في نتائج البحث', desc: 'السماح للآخرين بإيجاد حسابك عند البحث' },
                     { key: 'showFollowersList', label: 'إظهار قائمة المتابعين', desc: 'السماح للآخرين برؤية من يتابعك' },
                     { key: 'privateCollections', label: 'مجموعات خاصة', desc: 'إخفاء موداتك المفضلة عن العامة' },
                     { key: 'showOnlineStatus', label: 'حالة الاتصال / آخر ظهور', desc: 'السماح للآخرين برؤية ما إذا كنت متصلاً بالإنترنت حالياً' }
                   ].map((item) => (
                     <div key={item.key} onClick={() => handleUpdatePrivacy(item.key as any)} className="flex items-center justify-between p-6 bg-zinc-900/20 border border-white/5 rounded-[2rem] cursor-pointer hover:bg-zinc-900/40 transition-all">
                        <div>
                           <h4 className="text-white font-black text-sm">{item.label}</h4>
                           <p className="text-zinc-600 text-[10px] font-bold mt-1">{item.desc}</p>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${user.privacySettings?.[item.key as keyof PrivacySettings] ? 'theme-bg-primary' : 'bg-zinc-800'}`}>
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.privacySettings?.[item.key as keyof PrivacySettings] ? 'right-7' : 'right-1'}`}></div>
                        </div>
                     </div>
                   ))}

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div>
                         <h4 className="text-white font-black text-sm flex items-center gap-2">
                            <MessageSquare className="theme-text-primary" size={18} /> من يمكنه مراسلتي؟
                         </h4>
                         <p className="text-zinc-600 text-[10px] font-bold mt-1">تحكم في من يسمح له ببدء محادثة خاصة معك</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                         {[
                           { id: 'everyone', label: 'الجميع', icon: <Globe size={16}/> },
                           { id: 'followers', label: 'المتابعين فقط', icon: <Users size={16}/> },
                           { id: 'none', label: 'لا أحد', icon: <LockIcon size={16}/> }
                         ].map(opt => (
                           <button 
                             key={opt.id}
                             onClick={() => handleUpdateMessagingPermission(opt.id as any)}
                             className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 active:scale-95 ${user.privacySettings?.messagingPermission === opt.id ? 'theme-bg-primary-alpha theme-border-primary theme-text-primary' : 'bg-zinc-900/40 border-white/5 text-zinc-600 hover:text-zinc-400'}`}
                           >
                              {opt.icon}
                              <span className="text-[10px] font-black">{opt.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEmailModal(false)}></div>
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-sm relative z-10 text-center animate-in zoom-in">
            <div className="w-16 h-16 bg-lime-500/10 text-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-white font-black text-lg mb-6">تم إرسال رسالة التحقق إلى بريدك الإلكتروني</h3>
            <button onClick={() => setShowEmailModal(false)} className="w-full py-4 bg-lime-500 text-black rounded-xl font-black">حسنًا</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;