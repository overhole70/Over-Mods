import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // امسح أي محتوى سابق
    containerRef.current.innerHTML = '';

    // أنشئ السكربت بنفس طريقة الكود الأصلي
    const script = document.createElement('script');
    script.innerHTML = `
      (function(s){
        s.dataset.zone='10661298',
        s.src='https://nap5k.com/tag.min.js'
      })([document.documentElement, document.body]
        .filter(Boolean)
        .pop()
        .appendChild(document.createElement('script')));
    `;

    containerRef.current.appendChild(script);

  }, []);

  return (
    <div
      className="bg-zinc-900/40 backdrop-blur-md border border-white/5 
                 rounded-[2.5rem] overflow-hidden flex flex-col 
                 items-center justify-center min-h-[300px] 
                 relative transition-all duration-500"
    >
      <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 
                      rounded-md text-[9px] text-zinc-400 
                      font-black uppercase tracking-widest 
                      border border-white/5 z-10">
        Advertisement
      </div>

      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      />
    </div>
  );
};

export default AdCard;
