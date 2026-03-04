import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, Send, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import { db } from '../db';
import { useTranslation } from '../LanguageContext';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onNavigate: (view: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('يرجى إدخال البريد/اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const firebaseUser = await db.login(identifier.trim(), password);
      const profile = await db.get('users', firebaseUser.uid);
      
      if (profile) {
        if (profile.isBlocked) {
          await db.logout();
          throw new Error(`هذا الحساب محظور حالياً. السبب: ${profile.blockedReason || 'مخالفة سياسات المنصة'}`);
        }
        onLogin(profile as User);
        onNavigate('home');
      } else {
        throw new Error('تعذر العثور على بيانات الملف الشخصي.');
      }
    } catch (err: any) {
      // Simple error translation
      let msg = err.message || 'حدث خطأ غير متوقع';
      if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
        msg = 'بيانات الدخول غير صحيحة.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, isNew } = await db.loginWithGoogle();
      if (user) {
        onLogin(user as User);
        if (isNew || user.profileCompleted === false) {
           onNavigate('complete-profile');
        } else {
           onNavigate('home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول باستخدام Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white">تسجيل الدخول</h1>
          <p className="text-zinc-500">مرحباً بك مجدداً في مجتمع Over Mods</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-black">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm shadow-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 mb-6 active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              متابعة باستخدام Google
            </button>

            <div className="relative group">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                placeholder="البريد الإلكتروني أو اسم المستخدم" 
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

            <div className="pt-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin theme-text-primary" size={28} />
                </div>
              ) : (
                <button type="submit" className="w-full py-5 theme-bg-primary text-black rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  دخول آمن <Send size={20} />
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm font-medium">
              ليس لديك حساب؟{' '}
              <button onClick={() => onNavigate('signup')} className="text-white font-black hover:theme-text-primary transition-colors">
                إنشاء حساب جديد
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
