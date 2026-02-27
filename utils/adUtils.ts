export const injectAdScript = (container: HTMLElement, scriptContent: string) => {
  if (!container || !scriptContent) return;
  
  container.innerHTML = '';
  
  // Add label
  const label = document.createElement('div');
  label.className = "absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-lg text-[9px] text-zinc-500 font-black uppercase tracking-widest border border-white/5 z-10";
  label.innerText = "إعلان";
  container.appendChild(label);

  // Parse script content
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
      
      container.appendChild(newScript);
    } else {
      container.appendChild(node.cloneNode(true));
    }
  });
};
