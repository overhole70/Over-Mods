import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!adRef.current) return;
    if (scriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = "https://pl28807799.effectivegatecpm.com/5abcb578c2999656ffa1d5f947d53422/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    adRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-950 
                    border border-yellow-500/30 
                    rounded-[2.5rem] overflow-hidden 
                    flex flex-col justify-between 
                    min-h-[320px] 
                    shadow-lg hover:shadow-yellow-500/10 
                    transition-all duration-300">

      {/* شارة إعلان واضحة */}
      <div className="absolute top-3 right-3 
                      bg-yellow-500 text-black 
                      text-[10px] px-3 py-1 
                      rounded-lg font-black uppercase tracking-widest">
        إعلان
      </div>

      {/* محتوى الإعلان */}
      <div
        id="container-5abcb578c2999656ffa1d5f947d53422"
        ref={adRef}
        className="w-full h-full flex items-center justify-center p-4"
      />

      {/* تذييل بسيط لتمييزه أكثر */}
      <div className="text-center text-[11px] text-yellow-400 
                      font-bold py-3 border-t border-yellow-500/20 bg-black/30">
        Sponsored Content
      </div>
    </div>
  );
};

export default AdCard;
