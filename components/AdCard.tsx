import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src =
      'https://pl28807799.effectivegatecpm.com/5abcb578c2999656ffa1d5f947d53422/invoke.js';

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div
      className="
        relative
        bg-zinc-900/40
        border border-white/5
        rounded-[2.5rem]
        overflow-hidden
        w-full
        max-w-[380px]
        h-[320px]
        flex items-center justify-center
      "
    >
      {/* علامة إعلان واضحة */}
      <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-md text-[10px] text-zinc-400 font-black uppercase tracking-widest z-10">
        Sponsored
      </div>

      {/* الكونتينر الفعلي للإعلان */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
      />
    </div>
  );
};

export default AdCard;
