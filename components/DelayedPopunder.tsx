import React, { useEffect, useRef } from 'react';

const DelayedPopunder: React.FC = () => {
  const scriptInjected = useRef(false);

  useEffect(() => {
    /*
    // Check if already triggered in this session
    const hasTriggered = sessionStorage.getItem('popunder_triggered');
    if (hasTriggered) return;

    const timer = setTimeout(() => {
      if (scriptInjected.current) return;

      try {
        const script = document.createElement('script');
        script.src = '//pl28808129.effectivegatecpm.com/cc/17/25/cc17251483ea5adb754f75eb46ccfcbf.js';
        script.async = true;
        
        // Append to body
        document.body.appendChild(script);
        
        scriptInjected.current = true;
        sessionStorage.setItem('popunder_triggered', 'true');
        
        console.log("Popunder script injected");
      } catch (e) {
        console.error("Popunder injection failed", e);
      }
    }, 60000); // 60 seconds delay

    return () => clearTimeout(timer);
    */
  }, []);

  return null; // This component renders nothing visible
};

export default DelayedPopunder;
