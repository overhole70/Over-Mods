import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, Send, Eye, EyeOff, AlertTriangle, Loader2, User as UserIcon, Hash } from 'lucide-react';
import { db } from '../db';
import { useTranslation } from '../LanguageContext';

interface SignupPageProps {
  onLogin: (user: User) => void;
  onNavigate: (view: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onLogin, onNavigate }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username || !email || !password || !confirmPassword) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use a default avatar or handle avatar upload later in profile completion
      // For now, we'll use a placeholder or require avatar upload?
      // The original LoginView required avatar. Let's simplify and use a default one or skip avatar for now.
      // db.register requires avatarFile. We can create a dummy file or modify db.register?
      // Let's create a dummy file object from a fetch or just pass null if db.register allows it?
      // Looking at LoginView, it requires avatarFile.
      // Let's fetch a default avatar blob.
      
      const response = await fetch(`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`);
      const blob = await response.blob();
      const file = new File([blob], "avatar.svg", { type: "image/svg+xml" });

      const newUser = await db.register(email, password, displayName, username, file);
      
      if (newUser) {
        onLogin(newUser);
        onNavigate('complete-profile'); // Or home
      } else {
        throw new Error('فشل إنشاء الحساب');
      }
    } catch (err: any) {
      let msg = err.message || 'حدث خطأ غير متوقع';
      if (msg.includes('auth/email-already-in-use')) msg = 'البريد الإلكتروني مسجل بالفعل';
      if (msg.includes('auth/weak-password')) msg = 'كلمة المرور ضعيفة جداً';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white">إنشاء حساب</h1>
          <p className="text-zinc-500">انضم إلى مجتمع المبدعين</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-black">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            
            <div className="relative group">
              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                placeholder="الاسم الكامل" 
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm outline-none focus:theme-border-primary-alpha" 
                required 
              />
            </div>

            <div className="relative group">
              <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                placeholder="اسم المستخدم (إنجليزي)" 
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" 
                required 
              />
            </div>

            <div className="relative group">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="البريد الإلكتروني" 
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" 
                required 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="كلمة المرور" 
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-12 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" 
                required 
              />
              <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="تأكيد كلمة المرور" 
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" 
                required 
              />
            </div>

            <div className="pt-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin theme-text-primary" size={28} />
                </div>
              ) : (
                <button type="submit" className="w-full py-5 theme-bg-primary text-black rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  إنشاء حساب <Send size={20} />
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm font-medium">
              لديك حساب بالفعل؟{' '}
              <button onClick={() => onNavigate('login')} className="text-white font-black hover:theme-text-primary transition-colors">
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
