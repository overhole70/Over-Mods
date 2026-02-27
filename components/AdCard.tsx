import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    // منع التكرار
    if (adRef.current.querySelector('script')) return;

    const script = document.createElement('script');
    script.async = true;
    script.dataset.zone = '10661370';
    script.src = 'https://nap5k.com/tag.min.js';

    adRef.current.appendChild(script);

  }, []);

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 
                    rounded-[2.5rem] overflow-hidden 
                    flex items-center justify-center 
                    min-h-[280px] relative">

      <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 
                      rounded-md text-[9px] text-zinc-400 
                      font-black uppercase tracking-widest 
                      border border-white/5">
        AD
      </div>

      <div
        ref={adRef}
        className="w-full h-full flex items-center justify-center"
      />
    </div>
  );
};

export default AdCard;
