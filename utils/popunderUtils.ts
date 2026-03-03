/**
 * Utility to handle conditional popunder injection based on download count.
 * Triggers only after every 5 successful downloads.
 */
export const triggerPopunderIfNeeded = () => {
  /*
  try {
    // 1. Get current count
    const currentCount = parseInt(localStorage.getItem('download_count') || '0', 10);
    const newCount = currentCount + 1;

    // 2. Check if threshold reached
    if (newCount >= 5) {
      console.log('Popunder threshold reached. Injecting script...');
      
      // 3. Reset count
      localStorage.setItem('download_count', '0');
      localStorage.setItem('popunder_shown', new Date().toISOString());

      // 4. Check for existing script to prevent duplicates
      const scriptSrc = 'https://al5sm.com/tag.min.js';
      const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
      
      if (!existingScript) {
        // 5. Inject Script
        const script = document.createElement('script');
        script.dataset.zone = '10663475';
        script.src = scriptSrc;
        
        // Target body or documentElement (safe fallback)
        const target = [document.documentElement, document.body].filter(Boolean).pop();
        
        if (target) {
            target.appendChild(script);
            console.log('Popunder script injected successfully.');
        }
      } else {
        console.log('Popunder script already exists. Skipping injection.');
      }

    } else {
      // 6. Update count if not reached
      localStorage.setItem('download_count', newCount.toString());
      console.log(`Download count updated: ${newCount}/5`);
    }
  } catch (e) {
    console.error('Error in triggerPopunderIfNeeded:', e);
  }
  */
};
