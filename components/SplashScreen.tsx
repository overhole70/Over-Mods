import React, { useEffect } from 'react';

const SplashScreen: React.FC = () => {
  useEffect(() => {
    console.log("SPLASH RENDERED");
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#080808] flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-lime-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-lime-500/20 rounded-full blur-xl animate-pulse"></div>
        </div>
      </div>
      <h1 className="mt-8 text-2xl font-black text-white tracking-widest uppercase animate-pulse">Over Mods</h1>
      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Loading Experience</p>
    </div>
  );
};

export default SplashScreen;
