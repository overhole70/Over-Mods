import React, { useState } from 'react';
import { Mail, AlertCircle, Loader2, Send } from 'lucide-react';
import { auth } from '../db';
import { sendEmailVerification } from 'firebase/auth';
import { User } from '../types';

interface EmailVerificationRequiredViewProps {
  currentUser: User;
}

const EmailVerificationRequiredView: React.FC<EmailVerificationRequiredViewProps> = ({ currentUser }) => {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleResend = async () => {
    if (isSending || !auth.currentUser) return;
    
    setIsSending(true);
    setMessage(null);

    try {
      await sendEmailVerification(auth.currentUser);
      setMessage({ type: 'success', text: 'تم إرسال رابط التحقق بنجاح. يرجى التحقق من بريدك الوارد.' });
    } catch (error: any) {
      console.error("Failed to send verification email", error);
      if (error.code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: 'تم إرسال طلبات كثيرة جداً. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.' });
      } else {
        setMessage({ type: 'error', text: 'فشل إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً.' });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-300">
        
        <div className="w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-4">تأكيد البريد الإلكتروني مطلوب</h2>
        
        <p className="text-zinc-400 mb-2 leading-relaxed">
          مرحباً <span className="text-white font-bold">{currentUser.displayName}</span>،
        </p>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          يجب تأكيد بريدك الإلكتروني <span className="text-zinc-300 font-mono bg-zinc-800/50 px-2 py-0.5 rounded text-sm">{currentUser.email}</span> قبل التمكن من استخدام ميزات الحساب الكاملة.
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-bold ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <button 
          onClick={handleResend}
          disabled={isSending}
          className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black text-lg hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>جاري الإرسال...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>إعادة إرسال رسالة التحقق</span>
            </>
          )}
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-zinc-500 hover:text-white text-sm font-medium transition-colors"
        >
          لقد قمت بالتأكيد بالفعل؟ تحديث الصفحة
        </button>

      </div>
    </div>
  );
};

export default EmailVerificationRequiredView;
