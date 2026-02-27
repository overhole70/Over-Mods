import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    // منع إعادة تحميل الإعلان
    if (adRef.current.innerHTML !== '') return;

    const script1 = document.createElement('script');
    script1.innerHTML = `
      atOptions = {
        'key' : 'abe8878265d343329914593501516933',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    const script2 = document.createElement('script');
    script2.src = 'https://www.highperformanceformat.com/abe8878265d343329914593501516933/invoke.js';
    script2.async = true;

    adRef.current.appendChild(script1);
    adRef.current.appendChild(script2);
  }, []);

  return (
    <div className="w-full flex justify-center my-6">
      <div className="relative bg-zinc-900/40 border border-white/5 rounded-2xl p-4">

        {/* شارة إعلان */}
        <div className="absolute top-2 right-2 text-[10px] bg-black/60 px-2 py-1 rounded text-zinc-400">
          إعلان
        </div>

        <div
          ref={adRef}
          style={{ width: 300, height: 250 }}
        />
      </div>
    </div>
  );
};

export default AdCard;
