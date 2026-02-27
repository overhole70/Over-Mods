import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  // Check environment
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

  useEffect(() => {
    if (isCapacitor) return;
    
    const loadAd = () => {
      if (!containerRef.current) return;
      
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Add label
      const label = document.createElement('div');
      label.className = "absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-lg text-[9px] text-zinc-500 font-black uppercase tracking-widest border border-white/5 z-10";
      label.innerText = "إعلان";
      containerRef.current.appendChild(label);

      try {
        // Create options script
        const optionsScript = document.createElement('script');
        optionsScript.innerHTML = `
          atOptions = {
            'key' : 'abe8878265d343329914593501516933',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        `;
        containerRef.current.appendChild(optionsScript);

        // Create invoke script
        const invokeScript = document.createElement('script');
        invokeScript.src = 'https://www.highperformanceformat.com/abe8878265d343329914593501516933/invoke.js';
        containerRef.current.appendChild(invokeScript);
        
        scriptLoaded.current = true;
      } catch (e) {
        console.error("Ad script error", e);
      }
    };

    // Initial load
    loadAd();

    // Auto refresh every 60 seconds
    const interval = setInterval(loadAd, 60000);

    return () => clearInterval(interval);
  }, [isCapacitor]);

  if (isCapacitor) return null;

  return (
    <div 
      ref={containerRef}
      className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center min-h-[300px] relative group hover:theme-border-primary hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 transition-all duration-500 h-full"
    >
       {/* Content injected by useEffect */}
    </div>
  );
};

export default AdCard;
