import React, { useEffect, useRef, useState } from 'react';
import { db } from '../db';

const DelayedPopunder: React.FC = () => {
  const scriptInjected = useRef(false);
  const [scriptContent, setScriptContent] = useState('');

  useEffect(() => {
    db.getAdConfig().then(config => {
      if (config.popunderScript) {
        setScriptContent(config.popunderScript);
      }
    });
  }, []);

  useEffect(() => {
    if (!scriptContent) return;

    // Check if already triggered in this session
    const hasTriggered = sessionStorage.getItem('popunder_triggered');
    if (hasTriggered) {
      console.log("Popunder already triggered in this session.");
      return;
    }

    const timer = setTimeout(() => {
      if (scriptInjected.current) return;

      try {
        console.log("Injecting Popunder Script...");
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = scriptContent;

        Array.from(tempDiv.childNodes).forEach(node => {
          if (node.nodeName === 'SCRIPT') {
            const oldScript = node as HTMLScriptElement;
            const newScript = document.createElement('script');
            
            Array.from(oldScript.attributes).forEach(attr => {
              newScript.setAttribute(attr.name, attr.value);
            });
            
            if (oldScript.src) {
              newScript.src = oldScript.src;
            } else {
              newScript.innerHTML = oldScript.innerHTML;
            }
            
            document.body.appendChild(newScript);
          }
        });
        
        scriptInjected.current = true;
        sessionStorage.setItem('popunder_triggered', 'true');
        
        console.log("Popunder script injected successfully.");
      } catch (e) {
        console.error("Popunder injection failed", e);
      }
    }, 60000); // 60 seconds delay (Wait, user said "Once per page load", but previous request said "after 60 seconds". The new request says "Trigger only once per page load". It doesn't explicitly mention 60s delay, but "Restore previous ad system exactly". Previous system had 60s delay. I will keep 60s delay unless user says otherwise. Wait, user request 3) says "Trigger only once per page load". It doesn't mention delay. But "Restore previous ad system" implies keeping the delay. I will keep it.)

    return () => clearTimeout(timer);
  }, [scriptContent]);

  return null;
};

export default DelayedPopunder;
