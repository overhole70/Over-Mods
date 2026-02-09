
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { Mail, ShieldCheck, Loader2, Image as ImageIcon, AlertCircle, Send, CheckCircle2, User as UserIcon, Lock, Camera, CheckCircle, ArrowLeft, Eye, EyeOff, Hash, AlertTriangle, FileText, Check as CheckIcon, X } from 'lucide-react';
import { db, auth } from '../db';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<{ field?: string, message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  
  // Legal Modal States
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean, type: 'privacy' | 'terms' }>({ isOpen: false, type: 'privacy' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) setError(null);
  }, [email, password, displayName, username, confirmPassword, avatarFile, agreedToPolicies]);

  const translateAuthError = (err: any): string => {
    const msg = err.code || err.message || '';
    if (msg.includes('auth/email-already-in-use')) {
      return 'هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول إلى حسابك الحالي.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'البريد الإلكتروني المدخل غير صالح.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى.';
    }
    if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    return 'حدث خطأ في المصادقة. يرجى التأكد من البيانات والمحاولة مجدداً.';
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) return setError({ field: 'avatar', message: 'حجم الصورة كبير جداً (الأقصى 2MB)' });
      try {
        const resized = await db.resizeImage(file, 400, 400);
        setAvatarPreview(resized);
        setAvatarFile(file);
      } catch (err) {
        setError({ message: 'فشل في معالجة الصورة' });
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    
    if (activeTab === 'register') {
      if (!displayName.trim()) return setError({ field: 'displayName', message: 'يرجى كتابة اسمك الحقيقي أو المستعار' });
      if (!username.trim() || username.length < 3) return setError({ field: 'username', message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' });
      if (!email.trim()) return setError({ field: 'email', message: 'البريد الإلكتروني مطلوب' });
      if (password.length < 6) return setError({ field: 'password', message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      if (password !== confirmPassword) return setError({ field: 'confirm', message: 'كلمات المرور غير متطابقة' });
      if (!avatarFile) return setError({ field: 'avatar', message: 'يجب اختيار صورة شخصية' });
      if (!agreedToPolicies) return setError({ message: 'يجب الموافقة على سياسة الخصوصية وشروط الاستخدام' });
    } else {
      if (!email.trim() || !password) {
        triggerShake();
        return setError({ message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
      }
    }

    setIsLoading(true);
    try {
      if (activeTab === 'register') {
        setStatusMessage('جاري إنشاء الحساب...');
        await db.register(email, password, displayName, username, avatarFile);
        setSuccessMsg('تم إنشاء حسابك! يرجى التحقق من بريدك الإلكتروني لتفعيله قبل تسجيل الدخول.');
        setActiveTab('login');
        setPassword('');
      } else {
        setStatusMessage('جاري التحقق...');
        const firebaseUser = await db.login(email, password);
        const profile = await db.get('users', firebaseUser.uid);
        
        if (profile) {
          if (profile.isBlocked) {
            await db.logout();
            const reason = profile.blockedReason || 'مخالفة سياسات المنصة';
            throw new Error(`هذا الحساب محظور حالياً. السبب: ${reason}`);
          }
          onLogin(profile as User);
        } else {
          throw new Error('تعذر العثور على بيانات المستخدم في قاعدة البيانات.');
        }
      }
    } catch (err: any) {
      triggerShake();
      setError({ message: translateAuthError(err) });
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const LegalContent = () => {
    if (legalModal.type === 'privacy') {
      return (
        <div className="space-y-6 text-right" dir="rtl">
          <h2 className="text-2xl font-black theme-text-primary">سياسة الخصوصية</h2>
          <div className="space-y-4 text-zinc-400 font-medium text-sm leading-relaxed">
            <p>مرحباً بك في Over Mods. نحن نولي خصوصيتك أهمية قصوى ونلتزم بحماية بياناتك الشخصية.</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>بياناتك في أمان تام ومحمية بأفضل المعايير الأمنية المتاحة.</li>
              <li>نحن <span className="text-white font-black">لا نقوم ببيع</span> أو تسريب أو مشاركة بياناتك الشخصية مع أي طرف ثالث لأي أغراض تسويقية.</li>
              <li>تُستخدم المعلومات التي تقدمها فقط لتوفير ميزات التطبيق الأساسية مثل (إنشاء الحساب، الدردشة مع الأصدقاء، رفع المودات، وإضافة السيرفرات).</li>
              <li>نطبق تدابير أمنية تقنية وإدارية لحماية حسابك ومعلوماتك من الوصول غير المصرح به.</li>
              <li>يحق لمديري المنصة مراجعة المحتوى العام والخاص (عند الضرورة) لأغراض الإشراف، منع الاستغلال، وضمان سلامة المجتمع فقط.</li>
              <li>يمكنك في أي وقت إدارة خيارات الخصوصية الخاصة بك من قسم الإعدادات داخل التطبيق.</li>
            </ul>
            <div className="pt-4 border-t border-white/5">
              <p>لأي استفسارات تتعلق بالخصوصية، يمكنك التواصل معنا عبر:</p>
              <p className="text-white font-black mt-1">privacy@overmods.com</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-6 text-right" dir="rtl">
          <h2 className="text-2xl font-black theme-text-primary">شروط الاستخدام</h2>
          <div className="space-y-4 text-zinc-400 font-medium text-sm leading-relaxed">
            <p>باستخدامك لمنصة Over Mods، فإنك توافق على الالتزام بالشروط والقواعد التالية:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>يجب على جميع المستخدمين اتباع قواعد المنصة وإرشادات المجتمع العامة واحترام الآخرين.</li>
              <li>للمسؤولين والمشرفين الحق الكامل والمطلق في:
                <ul className="list-circle pr-5 mt-2 space-y-1">
                  <li>تقييد الوصول إلى ميزات معينة.</li>
                  <li>تعليق الحسابات مؤقتاً.</li>
                  <li>حظر الحسابات نهائياً من المنصة.</li>
                </ul>
              </li>
              <li>يحق للإدارة اتخاذ أي إجراء إداري تراه مناسباً <span className="text-white font-black">بذكر أو بدون ذكر الأسباب</span> لضمان استقرار وسلامة المنصة.</li>
              <li>يُمنع منعاً باتاً الإساءة للآخرين، إرسال الرسائل المزعجة (Spam)، محاولات الاختراق، الاستغلال، أو أي سلوك ضار بالمجتمع.</li>
              <li>المنصة غير مسؤولة قانونياً عن المحتوى الذي يتم إنشاؤه أو رفعه من قبل المستخدمين، ولكننا نقوم بمراقبته لضمان الجودة.</li>
              <li>أي مخالفة لهذه الشروط قد تؤدي إلى تعليق حسابك أو حظره نهائياً دون سابق إنذار.</li>
              <li>استمرارك في استخدام التطبيق يعتبر موافقة ضمنية ومتجددة على هذه الشروط.</li>
            </ul>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className={`max-w-md w-full transition-transform duration-500 ${shake ? 'animate-shake' : ''}`}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .animate-shake { animation: shake 0.3s ease-in-out; }
        `}</style>
        
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-white/5">
            <button 
              disabled={isLoading}
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-6 text-sm font-black transition-all ${activeTab === 'login' ? 'theme-text-primary bg-primary-alpha' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              تسجيل دخول
            </button>
            <button 
              disabled={isLoading}
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-6 text-sm font-black transition-all ${activeTab === 'register' ? 'theme-text-primary bg-primary-alpha' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              إنشاء حساب
            </button>
          </div>

          <div className="p-8 md:p-10">
            {/* Error/Success alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[11px] font-black animate-in slide-in-from-top-2">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="leading-relaxed">{error.message}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 p-4 theme-bg-primary-alpha theme-border-primary-alpha rounded-2xl flex items-center gap-3 theme-text-primary text-[11px] font-black">
                <CheckCircle2 size={18} /> {successMsg}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {activeTab === 'register' && (
                <>
                  <div className="flex flex-col items-center mb-8">
                     <div 
                      onClick={() => !isLoading && fileInputRef.current?.click()}
                      className={`w-24 h-24 rounded-[2rem] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden bg-zinc-950 relative group ${error?.field === 'avatar' ? 'border-red-500' : 'border-zinc-800 hover:theme-border-primary'}`}
                     >
                       {avatarPreview ? (
                         <img src={avatarPreview} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                       ) : (
                         <Camera size={32} className="text-zinc-800 group-hover:theme-text-primary" />
                       )}
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black text-white uppercase">تغيير الصورة</span>
                       </div>
                     </div>
                     <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                     {error?.field === 'avatar' && <p className="text-[9px] text-red-500 font-bold mt-2">يجب اختيار صورة شخصية</p>}
                  </div>

                  <div className="relative group">
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
                    <input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="الاسم الكامل" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm outline-none focus:theme-border-primary-alpha" required />
                  </div>

                  <div className="relative group">
                    <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
                    <input type="text" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="اسم المستخدم (بالإنجليزي)" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" required />
                  </div>
                </>
              )}

              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" required />
              </div>

              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-12 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" required />
                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>

              {activeTab === 'register' && (
                <>
                  <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
                    <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" required />
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
                    <div 
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${agreedToPolicies ? 'theme-bg-primary theme-border-primary' : 'border-zinc-800 bg-zinc-950'}`}
                      onClick={() => setAgreedToPolicies(!agreedToPolicies)}
                    >
                      {agreedToPolicies && <CheckIcon size={12} className="text-black" strokeWidth={4} />}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 leading-relaxed">
                      أوافق على <span className="text-white underline cursor-pointer hover:theme-text-primary transition-colors" onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}>سياسة الخصوصية</span> و <span className="text-white underline cursor-pointer hover:theme-text-primary transition-colors" onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}>شروط الاستخدام</span> الخاصة بمنصة Over Mods.
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4">
                {isLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="animate-spin theme-text-primary mx-auto mb-2" size={28} />
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{statusMessage}</p>
                  </div>
                ) : (
                  <button 
                    type="submit" 
                    className="w-full py-5 theme-bg-primary text-black rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {activeTab === 'login' ? 'دخول آمن' : 'بدء رحلة الإبداع'}
                    <Send size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Legal Modal Overlay */}
      {legalModal.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setLegalModal({ ...legalModal, isOpen: false })}></div>
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
               <div className="w-12 h-12 theme-bg-primary-alpha theme-text-primary rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} />
               </div>
               <button onClick={() => setLegalModal({ ...legalModal, isOpen: false })} className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-all active:scale-90">
                  <X size={24} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
              <LegalContent />
            </div>
            
            <div className="p-8 border-t border-white/5 shrink-0">
              <button 
                onClick={() => setLegalModal({ ...legalModal, isOpen: false })}
                className="w-full py-5 theme-bg-primary text-black rounded-[1.5rem] font-black text-lg active:scale-95 transition-all"
              >
                فهمت وأوافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
