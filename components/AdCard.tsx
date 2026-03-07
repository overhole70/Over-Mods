import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  const isCapacitor =
    typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

  useEffect(() => {
    if (isCapacitor) return;
    if (scriptLoaded.current) return;

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    // Label
    const label = document.createElement('div');
    label.className =
      "absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-lg text-[9px] text-zinc-500 font-black uppercase tracking-widest border border-white/5 z-10";
    label.innerText = "إعلان";
    container.appendChild(label);

    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://js.onclckmn.com/static/onclicka.js";
      script.setAttribute("data-admpid", "429907");

      container.appendChild(script);

      scriptLoaded.current = true;
    } catch (e) {
      console.error("Ad script error", e);
    }
  }, [isCapacitor]);

  if (isCapacitor) return null;

  return (
    <div
      ref={containerRef}
      className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center min-h-[300px] relative group hover:theme-border-primary hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 transition-all duration-500 h-full"
    >
      {/* Ad injected by script */}
    </div>
  );
};

export default AdCard;
