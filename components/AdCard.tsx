import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const refreshInterval = 60000; // 60 ثانية

  const loadAd = () => {
    if (!containerRef.current) return;

    // تنظيف الإعلان السابق
    containerRef.current.innerHTML = "";

    const scriptConfig = document.createElement("script");
    scriptConfig.type = "text/javascript";
    scriptConfig.innerHTML = `
      atOptions = {
        'key' : 'abe8878265d343329914593501516933',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    const scriptInvoke = document.createElement("script");
    scriptInvoke.type = "text/javascript";
    scriptInvoke.src = "https://www.highperformanceformat.com/abe8878265d343329914593501516933/invoke.js";
    scriptInvoke.async = true;

    containerRef.current.appendChild(scriptConfig);
    containerRef.current.appendChild(scriptInvoke);
  };

  useEffect(() => {
    loadAd(); // أول تحميل

    const interval = setInterval(() => {
      loadAd(); // إعادة تحميل كل دقيقة
    }, refreshInterval);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex justify-center my-6">
      <div className="relative bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
        <div className="absolute top-2 right-2 text-[10px] bg-black/70 px-2 py-1 rounded text-zinc-400">
          إعلان
        </div>

        <div
          ref={containerRef}
          style={{ width: 300, height: 250 }}
        />
      </div>
    </div>
  );
};

export default AdCard;
