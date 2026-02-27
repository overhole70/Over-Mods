import React, { useEffect, useRef, useState } from 'react';
import { db } from '../db';
import { injectAdScript } from '../utils/adUtils';

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptContent, setScriptContent] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Check environment
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

  useEffect(() => {
    if (isCapacitor) return;
    
    db.getAdConfig().then(config => {
      console.log("AdCard fetched config:", config);
      if (config.homeBannerScript) { // Changed from cardAdScript to homeBannerScript based on AdScriptManager fields
        setScriptContent(config.homeBannerScript);
      } else if (config.cardAdScript) {
         // Fallback to cardAdScript if homeBannerScript is empty (legacy support)
         setScriptContent(config.cardAdScript);
      }
      setLoaded(true);
    });
  }, [isCapacitor]);

  useEffect(() => {
    if (!scriptContent || !containerRef.current || isCapacitor) return;

    const loadAd = () => {
      if (containerRef.current) {
        console.log("Injecting Home Ad Script...");
        injectAdScript(containerRef.current, scriptContent);
      }
    };

    loadAd();
    const interval = setInterval(loadAd, 30000); // 30 seconds refresh
    return () => clearInterval(interval);
  }, [scriptContent, isCapacitor]);

  if (isCapacitor) return null;

  // Always render container to maintain layout, even if empty
  return (
    <div 
      ref={containerRef}
      className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center min-h-[300px] relative group hover:theme-border-primary hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 transition-all duration-500 h-full"
    >
       {!loaded && <div className="text-zinc-600 text-xs animate-pulse">Loading Ad...</div>}
       {loaded && !scriptContent && <div className="text-zinc-700 text-[10px]">No Ad Configured</div>}
    </div>
  );
};

export default AdCard;
