(() => {
  try {
    const raw = localStorage.getItem('familyTreeCloudSnapshot');
    if (!raw || typeof familyData === 'undefined') return;
    const cached = JSON.parse(raw);
    if (!cached || !cached.data || typeof cached.data !== 'object') return;
    Object.keys(familyData).forEach(key => delete familyData[key]);
    Object.assign(familyData, cached.data);
    window.__FAMILY_CLOUD_SNAPSHOT_VERSION__ = cached.version || null;
  } catch (error) {
    console.warn('Family cloud snapshot preload skipped:', error);
  }
})();
