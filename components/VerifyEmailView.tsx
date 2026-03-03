import React, { useState } from 'react';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../db';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';

const VerifyEmailView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get('oobCode');

    if (!oobCode) {
      setStatus('error');
      setMessage('رابط التحقق غير صالح أو منتهي.');
      return;
    }

    try {
      setLoading(true);
      await applyActionCode(auth, oobCode);
      setStatus('success');
      setMessage('تم تأكيد بريدك الإلكتروني بنجاح 🎉');
    } catch (error) {
      setStatus('error');
      setMessage('فشل التحقق. ربما الرابط منتهي أو تم استخدامه.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 w-full max-w-lg text-center shadow-2xl">

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-[2rem] flex items-center justify-center bg-lime-500/10 text-lime-500">
          {status === 'success' ? (
            <CheckCircle size={40} />
          ) : status === 'error' ? (
            <XCircle size={40} />
          ) : (
            <Mail size={40} />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white mb-4">
          {status === 'success'
            ? 'تم التحقق بنجاح'
            : status === 'error'
            ? 'حدث خطأ'
            : 'تأكيد البريد الإلكتروني'}
        </h2>

        {/* Description */}
        <p className="text-zinc-400 mb-8 leading-relaxed">
          {status === 'idle' &&
            'اضغط على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك بالكامل.'}
          {status !== 'idle' && message}
        </p>

        {/* Button */}
        {status === 'idle' && (
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full py-4 theme-bg-primary text-black font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                جاري التحقق...
              </>
            ) : (
              'تأكيد البريد الآن'
            )}
          </button>
        )}

        {status === 'success' && (
          <button
            onClick={() => (window.location.href = '/home')}
            className="w-full py-4 bg-zinc-800 text-white font-black rounded-2xl hover:bg-zinc-700 transition-all"
          >
            الذهاب إلى الرئيسية
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailView;
