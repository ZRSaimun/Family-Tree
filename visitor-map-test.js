(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const bn = () => document.documentElement.lang === 'bn';
  let observer = null;

  const isAdmin = () => !!$('cloudStatusBtn')?.classList.contains('admin');

  function closeMap() {
    $('visitorMapShell')?.classList.remove('show');
    document.body.style.overflow = '';
  }

  function openMap() {
    $('visitorMapShell')?.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function destroyUI() {
    closeMap();
    $('visitorMapBtn')?.remove();
    $('visitorMapShell')?.remove();
  }

  function createUI() {
    if (isAdmin() || $('visitorMapBtn')) return;
    const dock = $('featureDock') || document.querySelector('.controls');
    if (!dock) return;

    const button = document.createElement('button');
    button.id = 'visitorMapBtn';
    button.className = 'feature-btn land-launch';
    button.type = 'button';
    button.textContent = bn() ? 'ম্যাপ' : 'Maps';
    button.onclick = openMap;
    dock.appendChild(button);

    const title = bn() ? 'ম্যাপ টেস্ট' : 'Map Test';
    const note = bn()
      ? 'ভিজিটরদের জন্য সাধারণ এলাকা দেখানো হচ্ছে। নির্দিষ্ট পারিবারিক জমি ও ব্যক্তিগত মালিকানা তথ্য অ্যাডমিন ভিউতে থাকবে।'
      : 'Visitors can test the map using the general area. Exact family-property markers and private ownership records remain in the admin view.';

    document.body.insertAdjacentHTML('beforeend', `<section id="visitorMapShell" class="land-shell" aria-label="Visitor map test">
      <header class="land-top">
        <div class="land-brand"><div class="land-mark">MAP</div><div><h1>${title}<span class="land-private-badge">${bn() ? 'ভিজিটর' : 'VISITOR'}</span></h1><p>${bn() ? 'চাটখিল · নোয়াখালী · বাংলাদেশ' : 'Chatkhil · Noakhali · Bangladesh'}</p></div></div>
        <div class="land-actions"><a target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">${bn() ? 'মৌজা ম্যাপ' : 'Mouza map'}</a><a target="_blank" rel="noopener" href="https://settlement.gov.bd/khatian/search">${bn() ? 'খতিয়ান অনুসন্ধান' : 'Khatian search'}</a><button id="visitorMapClose" type="button">${bn() ? 'পরিবারে ফিরুন' : 'Back to family'}</button></div>
      </header>
      <div class="land-grid" style="grid-template-columns:1fr;">
        <section class="land-panel land-map-panel">
          <div class="land-note" style="margin-bottom:12px">${note}</div>
          <div class="land-map-wrap"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent('Chatkhil, Noakhali, Bangladesh')}&z=12&output=embed"></iframe><div class="land-map-label"><b>${bn() ? 'চাটখিল, নোয়াখালী' : 'Chatkhil, Noakhali'}</b><small>${bn() ? 'সাধারণ ভিজিটর ম্যাপ টেস্ট' : 'General visitor map test'}</small></div></div>
          <div class="land-portal-row"><a class="land-btn" target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">map.settlement.gov.bd</a><a class="land-btn" target="_blank" rel="noopener" href="https://settlement.gov.bd/khatian/search">settlement.gov.bd</a></div>
        </section>
      </div>
    </section>`);

    $('visitorMapClose').onclick = closeMap;
  }

  function syncAccess() {
    if (isAdmin()) destroyUI();
    else createUI();
  }

  function watch() {
    const attach = () => {
      const status = $('cloudStatusBtn');
      if (!status) {
        setTimeout(attach, 400);
        return;
      }
      observer?.disconnect();
      observer = new MutationObserver(syncAccess);
      observer.observe(status, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
      syncAccess();
    };
    attach();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('.lang-btn')) {
      setTimeout(() => {
        destroyUI();
        syncAccess();
      }, 100);
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
