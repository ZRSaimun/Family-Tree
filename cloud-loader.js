(() => {
  const cfg = window.FAMILY_BACKEND_CONFIG || {};
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const addCss = () => {
    if (document.querySelector('link[data-family-cloud-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'family-v5.css?v=3';
    link.dataset.familyCloudCss = '1';
    document.head.appendChild(link);
  };

  const addScript = () => {
    if (document.querySelector('script[data-family-cloud-js]')) return;
    const script = document.createElement('script');
    script.src = 'family-v5.js?v=3';
    script.defer = true;
    script.dataset.familyCloudJs = '1';
    script.onerror = () => console.warn('Family cloud tools could not load; the core tree remains available.');
    document.body.appendChild(script);
  };

  const start = () => {
    addCss();
    addScript();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
