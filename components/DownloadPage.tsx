import React, { useEffect, useState } from 'react';
import { Smartphone, Save, Loader2, Edit } from 'lucide-react';
import { useTranslation } from '../LanguageContext';
import { User } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../db';

interface DownloadPageProps {
  currentUser?: User | null;
}

const DownloadPage: React.FC<DownloadPageProps> = ({ currentUser }) => {
  const [isWebView, setIsWebView] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('https://apk.e-droid.net/apk/app3905250-i471nb.apk?v=5');
  const [adminUrl, setAdminUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/wv|WebView|Capacitor/i.test(userAgent)) {
      setIsWebView(true);
    }

    // Fetch download URL
    const fetchUrl = async () => {
      try {
        // Use 'mods' collection as it is publicly readable. 
        // We use a specific ID that won't conflict with auto-generated IDs.
        // We don't add 'createdAt' so it won't appear in mod lists.
        const docRef = doc(firestore, 'mods', 'app_config_doc');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().androidDownloadUrl) {
          setDownloadUrl(snap.data().androidDownloadUrl);
          setAdminUrl(snap.data().androidDownloadUrl);
        } else {
           setAdminUrl('https://apk.e-droid.net/apk/app3905250-i471nb.apk?v=5');
        }
      } catch (e) {
        console.error("Failed to fetch download URL", e);
        // Fallback is already set in state
      } finally {
        setIsLoadingUrl(false);
      }
    };
    fetchUrl();
  }, []);

  const handleSaveUrl = async () => {
    if (!adminUrl) return;
    setIsSaving(true);
    try {
      const docRef = doc(firestore, 'mods', 'app_config_doc');
      // We store it in 'mods' collection but acts as config.
      await setDoc(docRef, { androidDownloadUrl: adminUrl }, { merge: true });
      setDownloadUrl(adminUrl);
      alert('Download URL updated successfully!');
    } catch (e) {
      console.error("Failed to save URL", e);
      alert('Failed to update URL');
    } finally {
      setIsSaving(false);
    }
  };

  if (isWebView) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-zinc-500">
        <p>This page is not available in the app.</p>
      </div>
    );
  }

  const isAdmin = currentUser?.email === 'overmods1@gmail.com';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* App Image */}
        <div className="relative group">
          <div className="absolute inset-0 bg-lime-500/20 rounded-[2.5rem] blur-xl group-hover:bg-lime-500/30 transition-all duration-500"></div>
          <img 
            src="https://i.ibb.co/tpRPVZJ6/1769809398081-2.jpg" 
            alt="Over Mods App" 
            className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] shadow-2xl relative z-10 object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Over Mods
          </h1>
          <p className="text-zinc-400 text-sm md:text-base font-medium max-w-xs mx-auto leading-relaxed">
            منصة المبدعين الأولى لمودات وسيرفرات ماين كرافت بيدروك. حمل التطبيق الآن واستمتع بتجربة فريدة.
          </p>
        </div>

        {/* Download Button */}
        <a 
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative w-full max-w-xs bg-white hover:bg-zinc-100 text-black p-1 rounded-[2rem] transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] active:scale-95 block text-decoration-none"
        >
          <div className="absolute inset-0 rounded-[2rem] border-2 border-black/5"></div>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Download for</span>
              <span className="text-xl font-black">Android</span>
            </div>
            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {isLoadingUrl ? <Loader2 className="animate-spin" size={24} /> : <Smartphone size={24} fill="currentColor" />}
            </div>
          </div>
        </a>

        {/* Footer Info */}
        <div className="pt-8 flex flex-col gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
          <span>Version 5.0 • Free Download</span>
          <span>© 2025 Over Mods</span>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="w-full mt-12 pt-8 border-t border-white/5 animate-in slide-in-from-bottom-4">
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 text-zinc-400">
                <Edit size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Admin Control</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Android Download URL</label>
                  <input 
                    type="url" 
                    value={adminUrl}
                    onChange={(e) => setAdminUrl(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-lime-500/50 transition-colors placeholder:text-zinc-700"
                    placeholder="https://..."
                  />
                </div>
                
                <button 
                  onClick={handleSaveUrl}
                  disabled={isSaving}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  {isSaving ? 'Saving...' : 'Update URL'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DownloadPage;
