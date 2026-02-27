import React from 'react';

const AdCard: React.FC = () => {

  // 🚫 الإعلان معطل بالكامل للاختبار
  // لا يوجد أي سكربت يتم تحميله هنا

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
        AD (DISABLED)
      </div>

      <div className="text-zinc-600 text-sm font-bold">
        Advertisement Disabled For Testing
      </div>
    </div>
  );
};

export default AdCard;
