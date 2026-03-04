import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { auth } from '../db';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

interface VerifyEmailViewProps {
  onNavigate: (page: string) => void;
}

const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(''); // Optional: to show which email is being reset

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const modeParam = queryParams.get('mode');
    const codeParam = queryParams.get('oobCode');

    setMode(modeParam);
    setOobCode(codeParam);

    if (!codeParam) {
      setStatus('error');
      setErrorMessage('رابط غير صالح. رمز التحقق مفقود.');
      return;
    }

    // Optional: Verify code validity on mount for password reset to show email
    if (modeParam === 'resetPassword' && codeParam) {
       verifyPasswordResetCode(auth, codeParam).then((email) => {
          setEmail(email);
       }).catch((e) => {
          // Don't block UI, just let confirmPasswordReset handle the error on submit, 
          // or show invalid link immediately.
          // Better UX: Show invalid link immediately.
          setStatus('error');
          setErrorMessage('رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.');
       });
    }

    // Auto-verify email if mode is verifyEmail? 
    // The previous implementation required a click. Let's keep it manual or make it auto?
    // User requirement: "If mode=verifyEmail: Use Firebase Auth to verify... Show success message"
    // I'll make it auto-trigger for better UX, but with a small delay or just immediate.
    // Actually, let's keep the "Click to verify" for email to be consistent with previous behavior, 
    // UNLESS the user wants it seamless. "The page should read... Use Firebase Auth".
    // I will stick to the manual button for email verification to avoid confusion, 
    // but I will update the UI to reflect the mode.
    
  }, []);

  const handleVerifyEmail = async () => {
    if (!oobCode) return;
    setStatus('verifying');
    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
    } catch (error: any) {
      console.error("Email verification failed", error);
      setStatus('error');
      setErrorMessage(translateAuthError(error));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    
    if (newPassword.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return; // Just show error in UI, don't switch to 'error' status which hides form
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمات المرور غير متطابقة');
      return;
    }

    setStatus('verifying');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch (error: any) {
      console.error("Password reset failed", error);
      setStatus('error');
      setErrorMessage(translateAuthError(error));
    }
  };

  const translateAuthError = (err: any): string => {
    const msg = err.code || err.message || '';
    if (msg.includes('auth/expired-action-code')) return 'رابط التحقق منتهي الصلاحية.';
    if (msg.includes('auth/invalid-action-code')) return 'رابط التحقق غير صالح أو تم استخدامه مسبقاً.';
    if (msg.includes('auth/user-disabled')) return 'تم تعطيل هذا الحساب.';
    if (msg.includes('auth/user-not-found')) return 'المستخدم غير موجود.';
    if (msg.includes('auth/weak-password')) return 'كلمة المرور ضعيفة جداً.';
    return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl animate-in zoom-in duration-300">
        
        {/* --- LOADING STATE --- */}
        {status === 'verifying' && (
          <div className="py-12">
            <Loader2 className="animate-spin text-lime-500 mx-auto mb-6" size={48} />
            <h3 className="text-xl font-bold text-white">جاري المعالجة...</h3>
          </div>
        )}

        {/* --- SUCCESS STATE --- */}
        {status === 'success' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4">
              {mode === 'resetPassword' ? 'تم تغيير كلمة المرور' : 'تم تأكيد البريد الإلكتروني'}
            </h2>
            <p className="text-zinc-400 mb-8">
              {mode === 'resetPassword' 
                ? 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.' 
                : 'تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن استخدام حسابك.'}
            </p>
            <button 
              onClick={() => onNavigate('login')}
              className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg hover:bg-zinc-200 active:scale-95 transition-all"
            >
              تسجيل الدخول
            </button>
          </div>
        )}

        {/* --- ERROR STATE --- */}
        {status === 'error' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4">فشل العملية</h2>
            <p className="text-red-400 mb-8 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              {errorMessage}
            </p>
            <button 
              onClick={() => onNavigate('login')}
              className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black text-lg hover:bg-zinc-700 active:scale-95 transition-all"
            >
              العودة لصفحة الدخول
            </button>
          </div>
        )}

        {/* --- IDLE STATE (FORMS) --- */}
        {status === 'idle' && (
          <>
            {mode === 'verifyEmail' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-black text-white mb-4">تأكيد البريد الإلكتروني</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                  اضغط على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.
                </p>
                <button 
                  onClick={handleVerifyEmail}
                  className="w-full py-4 bg-lime-500 text-black rounded-2xl font-black text-lg hover:bg-lime-400 active:scale-95 transition-all"
                >
                  تأكيد البريد الآن
                </button>
              </div>
            )}

            {mode === 'resetPassword' && (
              <form onSubmit={handleResetPassword} className="text-right animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <KeyRound className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 text-center">إعادة تعيين كلمة المرور</h2>
                <p className="text-zinc-500 mb-8 text-center text-sm">
                  {email ? `للحساب: ${email}` : 'أدخل كلمة المرور الجديدة أدناه'}
                </p>

                {errorMessage && status === 'idle' && (
                   <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                     {errorMessage}
                   </div>
                )}

                <div className="space-y-4 mb-8">
                  <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:theme-text-primary transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="كلمة المرور الجديدة" 
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
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 theme-bg-primary text-black rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all"
                >
                  تغيير كلمة المرور
                </button>
              </form>
            )}
            
            {!mode && (
               <div className="py-12 text-center">
                  <Loader2 className="animate-spin text-zinc-700 mx-auto mb-4" size={32} />
                  <p className="text-zinc-500">جاري التحقق من الرابط...</p>
               </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmailView;
