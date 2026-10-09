(() => {
  const $ = id => document.getElementById(id);

  // Build a lightweight parent index from the same family data used by the tree.
  const rootSource = familyData.rootTrail.find(p => p.id === 'nayeb-chowdhury') || familyData.rootTrail[0];
  const chanSource = familyData.rootTrail.find(p => p.id === 'chan-gazi-hawladar') || familyData.rootTrail[1];
  const root = {...rootSource, children:[{...chanSource, children:[familyData.main, familyData.secondary]}]};
  const parentInfo = new Map();

  const isFemale = person => {
    const en = String(person?.relationEn || '').toLowerCase();
    const bn = String(person?.relationBn || '');
    return en === 'daughter' || bn.includes('মেয়ে') || bn.includes('মেয়ে');
  };
  const isUnknownName = (en='', bn='') => /name (not recorded|unknown)/i.test(en) || /নাম (নথিভুক্ত নেই|অজানা)/.test(bn);
  const personRef = p => p ? {id:p.id || null, en:p.en || '', bn:p.bn || ''} : null;
  const spouseRef = s => {
    if(!s) return null;
    const en = s.en || s.spouseEn || '';
    const bn = s.bn || s.spouseBn || '';
    if((!en && !bn) || isUnknownName(en,bn)) return null;
    return {id:null,en,bn};
  };

  function index(person, parents=null){
    if(!person || !person.id) return;
    if(parents) parentInfo.set(person.id, parents);

    const female = isFemale(person);
    const spouses = person.spouses || [];
    const oneSpouse = spouses.length === 1 ? spouseRef(spouses[0]) : null;

    (person.children || []).forEach(child => {
      const parentsForChild = female
        ? {father: oneSpouse, mother: personRef(person)}
        : {father: personRef(person), mother: oneSpouse};
      index(child, parentsForChild);
    });

    (person.spouseGroups || []).forEach(group => {
      const mother = spouseRef(group);
      (group.children || []).forEach(child => index(child, {father:personRef(person), mother}));
    });
  }
  index(root);

  const labels = {
    en:{father:'Father',mother:'Mother',unknown:'Not recorded'},
    bn:{father:'পিতা',mother:'মাতা',unknown:'নথিভুক্ত নেই'}
  };
  const lang = () => document.documentElement.lang === 'bn' ? 'bn' : 'en';
  const esc = (v='') => String(v).replace(/[&<>\'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function row(label, ref){
    const l = lang();
    const name = ref ? (l === 'bn' ? (ref.bn || ref.en) : (ref.en || ref.bn)) : labels[l].unknown;
    const value = ref?.id
      ? `<button type="button" data-profile-jump="${esc(ref.id)}">${esc(name)}</button>`
      : `<b${ref ? '' : ' class="not-recorded"'}>${esc(name)}</b>`;
    return `<div class="profile-field"><span>${esc(label)}</span>${value}</div>`;
  }

  function decorateProfile(){
    const content = $('profileContent');
    if(!content) return;
    const focusAction = content.querySelector('[data-focus-person]');
    const body = content.querySelector('.profile-body');
    if(!focusAction || !body) return;

    const id = focusAction.dataset.focusPerson;
    const info = parentInfo.get(id);
    if(!info) return;

    // Idempotency guard: do not rewrite a profile that has already been decorated.
    const existing = body.querySelector(`.parent-details[data-person="${CSS.escape(id)}"]`);
    if(existing) return;

    // Remove only the app's generic Parent row, if present.
    [...body.querySelectorAll(':scope > .profile-field')].forEach(field => {
      const label = field.querySelector('span')?.textContent.trim();
      if(label === 'Parent' || label === 'অভিভাবক') field.remove();
    });

    const l = lang();
    const holder = document.createElement('div');
    holder.className = 'parent-details';
    holder.dataset.person = id;
    holder.innerHTML = row(labels[l].father, info.father) + row(labels[l].mother, info.mother);
    body.insertBefore(holder, body.firstChild);
  }

  const profileContent = $('profileContent');
  if(profileContent){
    const observer = new MutationObserver(() => requestAnimationFrame(decorateProfile));
    observer.observe(profileContent,{childList:true,subtree:true});
    decorateProfile();
  }

  // Keep the page behind the mobile profile sheet from scrolling.
  const panel = $('profilePanel');
  if(panel){
    const syncPanelState = () => document.body.classList.toggle('profile-open', panel.classList.contains('open'));
    new MutationObserver(syncPanelState).observe(panel,{attributes:true,attributeFilter:['class']});
    syncPanelState();
  }

  // Close search suggestions when the user taps anywhere outside the search area.
  document.addEventListener('pointerdown', event => {
    const wrap = event.target.closest('.search-wrap');
    if(!wrap) $('searchResults')?.classList.remove('show');
  });

  // Home should truly return to the normal tree, including clearing a shared-person hash.
  $('homeBtn')?.addEventListener('click', () => {
    if(location.hash.startsWith('#person=')) history.replaceState(null,'',location.pathname + location.search);
  });

  // Mobile Safari can occasionally lose the visual result of a fast search-result tap.
  // After the app handles the selection, make sure the chosen card/profile is actually visible.
  $('searchResults')?.addEventListener('click', event => {
    const result = event.target.closest('[data-search-person]');
    if(!result) return;
    const id = result.dataset.searchPerson;
    setTimeout(() => {
      const panelOpen = $('profilePanel')?.classList.contains('open');
      if(panelOpen) return;
      const cardButton = document.querySelector(`[data-open-profile="${CSS.escape(id)}"]`);
      if(cardButton) cardButton.click();
    }, 120);
  });
})();
