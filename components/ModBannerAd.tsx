import React, { useEffect, useRef } from 'react';

const ModBannerAd: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      label.className = "absolute top-1 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-zinc-500 font-bold uppercase tracking-wider border border-white/5 z-10";
      label.innerText = "Advertisement";
      containerRef.current.appendChild(label);

      try {
        // Create options script
        const optionsScript = document.createElement('script');
        optionsScript.innerHTML = `
          atOptions = {
            'key' : 'db7bfb92da459d5fc73fd39d29501958',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        `;
        containerRef.current.appendChild(optionsScript);

        // Create invoke script
        const invokeScript = document.createElement('script');
        invokeScript.src = 'https://www.highperformanceformat.com/db7bfb92da459d5fc73fd39d29501958/invoke.js';
        containerRef.current.appendChild(invokeScript);
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
    <div className="w-full flex justify-center mt-8 mb-4">
      <div 
        ref={containerRef}
        className="relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden flex items-center justify-center min-h-[90px] min-w-[320px] max-w-[728px] w-full shadow-lg"
      >
         {/* Content injected by useEffect */}
      </div>
    </div>
  );
};

export default ModBannerAd;
