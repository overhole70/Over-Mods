import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const AdScriptManager: React.FC = () => {
  const [config, setConfig] = useState<any>({
    homeBannerScript: '',
    modPageBannerScript: '',
    popunderScript: '',
    cardAdScript: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await db.getAdConfig();
      setConfig((prev: any) => ({ ...prev, ...data }));
    } catch (e) {
      console.error("Failed to load ad config", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await db.saveAdConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-zinc-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-black text-white">إدارة الإعلانات</h2>
           <p className="text-zinc-500 text-sm mt-1">تحكم في أكواد الإعلانات التي تظهر في الموقع</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-900/20"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : (success ? <CheckCircle size={18} /> : <Save size={18} />)}
          {saving ? 'جاري الحفظ...' : (success ? 'تم الحفظ!' : 'حفظ التغييرات')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label className="text-sm font-bold text-zinc-400 block">Home Banner Script (300x250)</label>
           <textarea 
             value={config.homeBannerScript || ''}
             onChange={e => setConfig({...config, homeBannerScript: e.target.value})}
             className="w-full h-40 bg-zinc-900 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 outline-none focus:border-green-500/50 resize-none placeholder:text-zinc-700"
             placeholder="<script>...</script>"
           />
        </div>

        <div className="space-y-2">
           <label className="text-sm font-bold text-zinc-400 block">Mod Page Banner Script (728x90)</label>
           <textarea 
             value={config.modPageBannerScript || ''}
             onChange={e => setConfig({...config, modPageBannerScript: e.target.value})}
             className="w-full h-40 bg-zinc-900 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 outline-none focus:border-green-500/50 resize-none placeholder:text-zinc-700"
             placeholder="<script>...</script>"
           />
        </div>

        <div className="space-y-2">
           <label className="text-sm font-bold text-zinc-400 block">Popunder Script</label>
           <textarea 
             value={config.popunderScript || ''}
             onChange={e => setConfig({...config, popunderScript: e.target.value})}
             className="w-full h-40 bg-zinc-900 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 outline-none focus:border-green-500/50 resize-none placeholder:text-zinc-700"
             placeholder="<script>...</script>"
           />
        </div>

        <div className="space-y-2">
           <label className="text-sm font-bold text-zinc-400 block">Card Ad Script (Grid)</label>
           <textarea 
             value={config.cardAdScript || ''}
             onChange={e => setConfig({...config, cardAdScript: e.target.value})}
             className="w-full h-40 bg-zinc-900 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 outline-none focus:border-green-500/50 resize-none placeholder:text-zinc-700"
             placeholder="<script>...</script>"
           />
        </div>
      </div>
      
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
         <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
         <div className="text-xs text-yellow-200/80 leading-relaxed">
            <strong>تنبيه هام:</strong> تأكد من صحة الأكواد قبل الحفظ. الأكواد الخاطئة قد تسبب مشاكل في عرض الموقع.
            <br/>سيتم تطبيق التغييرات فوراً على جميع المستخدمين.
         </div>
      </div>
    </div>
  );
};

export default AdScriptManager;
