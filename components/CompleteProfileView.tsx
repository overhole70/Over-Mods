import React, { useState, useRef } from 'react';
import { User } from '../types';
import { db } from '../db';
import { Camera, Send, Hash, User as UserIcon, Lock, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';

interface CompleteProfileViewProps {
  currentUser: any;
  onComplete: (user: User) => void;
}

const CompleteProfileView: React.FC<CompleteProfileViewProps> = ({ currentUser, onComplete }) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser.avatar || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      try {
        const resized = await db.resizeImage(file, 400, 400);
        setAvatarPreview(resized);
      } catch (err) {
        setAvatarPreview(URL.createObjectURL(file));
      }
    }
  };

  const isRestrictedName = (name: string) => {
    if (currentUser.email === 'overmods1@gmail.com') return false;
    const forbidden = ['over mods', 'over_mods', 'overmods'];
    const lower = name.toLowerCase();
    return forbidden.some(f => lower.includes(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return setError("الاسم الكامل مطلوب");
    
    if (isRestrictedName(displayName)) {
      return setError("عذراً، هذا الاسم محجوز للمسؤول فقط");
    }

    if (!username.trim() || username.length < 3) return setError("اسم المستخدم قصير جداً");
    
    if (isRestrictedName(username)) {
      return setError("عذراً، اسم المستخدم هذا محجوز للمسؤول فقط");
    }
    
    // Password is optional for Google users, but if provided, validate length
    if (password && password.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await db.completeGoogleProfile(currentUser.id, {
        displayName,
        username,
        password: password || undefined,
        avatarFile: avatarFile || undefined
      });
      onComplete(updatedUser as User);
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        setError("فشل الاتصال بالخادم. يرجى التحقق من الإنترنت.");
      } else {
        setError(err.message || "حدث خطأ أثناء إكمال الملف الشخصي");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">إكمال الملف الشخصي</h2>
          <p className="text-zinc-500 text-xs font-bold">يرجى إكمال بياناتك للمتابعة</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[11px] font-black animate-in slide-in-from-top-2">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
             <div 
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-zinc-800 hover:theme-border-primary flex items-center justify-center cursor-pointer transition-all overflow-hidden bg-zinc-950 relative group"
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
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="الاسم الكامل" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm outline-none focus:theme-border-primary-alpha" required />
            </div>

            <div className="relative group">
              <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input type="text" value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="اسم المستخدم (بالإنجليزي)" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" required />
            </div>

            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور (اختياري)" className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pr-12 pl-12 text-white text-sm ltr outline-none focus:theme-border-primary-alpha" />
              <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-5 theme-bg-primary text-black rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> إكمال التسجيل</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileView;
