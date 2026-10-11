(() => {
  try {
    const config = window.FAMILY_BACKEND_CONFIG || {};

    // If cloud mode is not enabled, never let an old cached cloud snapshot
    // replace the current official static family data.
    if (!config.enabled) {
      localStorage.removeItem('familyTreeCloudSnapshot');
      delete window.__FAMILY_CLOUD_SNAPSHOT_VERSION__;
      return;
    }

    const raw = localStorage.getItem('familyTreeCloudSnapshot');
    if (!raw || typeof familyData === 'undefined') return;

    const cached = JSON.parse(raw);
    const data = cached && cached.data;
    const valid = data && typeof data === 'object'
      && Array.isArray(data.rootTrail)
      && data.rootTrail.length >= 2
      && data.main && typeof data.main === 'object'
      && data.secondary && typeof data.secondary === 'object';

    if (!valid) {
      localStorage.removeItem('familyTreeCloudSnapshot');
      delete window.__FAMILY_CLOUD_SNAPSHOT_VERSION__;
      console.warn('Removed an invalid cached family cloud snapshot.');
      return;
    }

    Object.keys(familyData).forEach(key => delete familyData[key]);
    Object.assign(familyData, data);
    window.__FAMILY_CLOUD_SNAPSHOT_VERSION__ = cached.version || null;
  } catch (error) {
    localStorage.removeItem('familyTreeCloudSnapshot');
    delete window.__FAMILY_CLOUD_SNAPSHOT_VERSION__;
    console.warn('Family cloud snapshot preload skipped and cache cleared:', error);
  }
})();
