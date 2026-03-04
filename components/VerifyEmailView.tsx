import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '../db';
import { applyActionCode } from 'firebase/auth';

interface VerifyEmailViewProps {
  onNavigate: (page: string) => void;
}

const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async () => {
    // Extract oobCode from URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const oobCode = queryParams.get('oobCode');

    if (!oobCode) {
      setStatus('error');
      setErrorMessage('رابط التحقق غير صالح. الرمز مفقود.');
      return;
    }

    setStatus('verifying');

    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
    } catch (error: any) {
      console.error("Email verification failed", error);
      setStatus('error');
      setErrorMessage(error.message || 'فشل تأكيد البريد الإلكتروني. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-[2rem] p-8 text-center backdrop-blur-xl shadow-2xl">
        
        {status === 'idle' && (
          <>
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4">تأكيد البريد الإلكتروني</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              يجب تأكيد بريدك الإلكتروني قبل استخدام حسابك.
            </p>
            <button 
              onClick={handleVerify}
              className="w-full py-4 bg-lime-500 text-black rounded-2xl font-black text-lg hover:bg-lime-400 active:scale-95 transition-all"
            >
              تأكيد البريد الآن
            </button>
          </>
        )}

        {status === 'verifying' && (
          <div className="py-12">
            <Loader2 className="animate-spin text-lime-500 mx-auto mb-6" size={48} />
            <h3 className="text-xl font-bold text-white">جاري التحقق...</h3>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4">تم تأكيد البريد الإلكتروني</h2>
            <p className="text-zinc-400 mb-8">
              تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن استخدام حسابك.
            </p>
            <button 
              onClick={() => onNavigate('home')}
              className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg hover:bg-zinc-200 active:scale-95 transition-all"
            >
              الذهاب إلى الصفحة الرئيسية
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4">فشل التحقق</h2>
            <p className="text-red-400 mb-8 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              {errorMessage || 'تعذر تأكيد البريد الإلكتروني. قد يكون الرابط غير صالح أو منتهي الصلاحية.'}
            </p>
            <button 
              onClick={() => onNavigate('home')}
              className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black text-lg hover:bg-zinc-700 active:scale-95 transition-all"
            >
              العودة للرئيسية
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmailView;
