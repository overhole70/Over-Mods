import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    // منع تكرار تحميل الإعلان
    if (adRef.current.innerHTML !== '') return;

    // سكربت الإعدادات
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

    // سكربت الاستدعاء
    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/abe8878265d343329914593501516933/invoke.js';
    invokeScript.async = true;

    adRef.current.appendChild(optionsScript);
    adRef.current.appendChild(invokeScript);

  }, []);

  return (
    <div className="relative bg-zinc-900/40 border border-yellow-500/30 
                    rounded-2xl overflow-hidden flex items-center 
                    justify-center min-h-[250px] p-4">

      {/* شارة إعلان واضحة */}
      <div className="absolute top-2 right-2 bg-yellow-500 text-black 
                      text-[10px] font-bold px-2 py-1 rounded-md z-10">
        إعلان
      </div>

      <div ref={adRef} className="w-[300px] h-[250px]" />
    </div>
  );
};

export default AdCard;
