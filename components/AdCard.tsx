import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const isCapacitor =
    typeof window !== 'undefined' &&
    (window as any).Capacitor !== undefined;

  useEffect(() => {
    if (isCapacitor) return;
    if (!containerRef.current) return;

    // تنظيف أي إعلان قديم
    containerRef.current.innerHTML = '';

    // إنشاء سكربت الإعلان
    const script = document.createElement('script');
    script.src = 'https://nap5k.com/tag.min.js';
    script.async = true;
    script.type = 'text/javascript';
    script.setAttribute('data-zone', '10661166');

    // إضافته داخل البطاقة
    containerRef.current.appendChild(script);

    return () => {
      // تنظيف عند إزالة المكون
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isCapacitor]);

  if (isCapacitor) return null;

  return (
    <div
      ref={containerRef}
      className="relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] min-h-[300px] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute top-3 right-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
        Advertisement
      </div>
    </div>
  );
};

export default AdCard;
