import React, { useEffect, useRef, useState } from 'react';
import { db } from '../db';
import { injectAdScript } from '../utils/adUtils';

const ModBannerAd: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptContent, setScriptContent] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Check environment
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

  useEffect(() => {
    if (isCapacitor) return;
    
    db.getAdConfig().then(config => {
      console.log("ModBannerAd fetched config:", config);
      if (config.modPageBannerScript) {
        setScriptContent(config.modPageBannerScript);
      }
      setLoaded(true);
    });
  }, [isCapacitor]);

  useEffect(() => {
    if (!scriptContent || !containerRef.current || isCapacitor) return;

    const loadAd = () => {
      if (containerRef.current) {
        console.log("Injecting Mod Banner Ad Script...");
        injectAdScript(containerRef.current, scriptContent);
      }
    };

    loadAd();
    const interval = setInterval(loadAd, 30000); // 30 seconds refresh
    return () => clearInterval(interval);
  }, [scriptContent, isCapacitor]);

  if (isCapacitor) return null;

  // Always render container
  return (
    <div className="w-full flex justify-center my-6">
      <div 
        ref={containerRef}
        className="w-full max-w-[728px] min-h-[90px] bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden relative flex items-center justify-center"
      >
        {!loaded && <div className="text-zinc-600 text-xs animate-pulse">Loading Banner...</div>}
        {loaded && !scriptContent && <div className="text-zinc-700 text-[10px]">No Banner Configured</div>}
      </div>
    </div>
  );
};

export default ModBannerAd;
