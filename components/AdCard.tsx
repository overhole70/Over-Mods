import React, { useEffect, useRef } from "react";

const AdCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = `
      <div class="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-lg text-[9px] text-zinc-500 font-black uppercase tracking-widest border border-white/5 z-10">
        إعلان
      </div>

      <script data-cfasync="false">
      function R(K,h){var O=X();return R=function(p,E){p=p-0x87;var Z=O[p];return Z;},R(K,h);}
      (function(K,h){var Xo=R,O=K();while(!![]){try{
      var p=parseInt(Xo(0xac))/0x1*(-parseInt(Xo(0x90))/0x2)
      +parseInt(Xo(0xa5))/0x3*(-parseInt(Xo(0x8d))/0x4)
      +parseInt(Xo(0xb5))/0x5*(-parseInt(Xo(0x93))/0x6)
      +parseInt(Xo(0x89))/0x7+-parseInt(Xo(0xa1))/0x8
      +parseInt(Xo(0xa7))/0x9*(parseInt(Xo(0xb2))/0xa)
      +parseInt(Xo(0x95))/0xb*(parseInt(Xo(0x9f))/0xc);
      if(p===h)break;else O['push'](O['shift']());
      }catch(E){O['push'](O['shift']());}}}(X,0x33565),
      (function(){
        var XG=R;
        function K(){
          var Xe=R,h=429909,O='a3klsam';
          var J=document.createElement('script');
          J.setAttribute('data-admpid',h);
          J.async=true;
          J.src='https://js.wpadmngr.com/static/adManager.js';
          document.head.appendChild(J);
        }
        if(document.readyState==='complete'||document.readyState==='interactive'){
          K();
        }else{
          window.addEventListener('DOMContentLoaded',K);
        }
      }()));
      function X(){
        var Xj=['addEventListener','onload','charAt','.com','split','DOMContentLoaded','type',
        'https://','toISOString','src','head','https://js.wpadmngr.com/static/adManager.js',
        'setAttribute','length','.js','readyState','data-admpid','replace','createElement',
        'substring','complete','appendChild','script','async'];
        X=function(){return Xj;};
        return X();
      }
      </script>
    `;
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center min-h-[300px] relative"
    />
  );
};

export default AdCard;
