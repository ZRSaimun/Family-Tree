(() => {
  'use strict';

  const cfg = window.FAMILY_BACKEND_CONFIG || {};
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const $ = id => document.getElementById(id);
  const bn = () => document.documentElement.lang === 'bn';
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = v => {
    try {
      const u = new URL(String(v || ''));
      return /^https?:$/.test(u.protocol) ? u.href : '';
    } catch (_) { return ''; }
  };

  let records = [];
  let locations = [];
  let selected = null;
  let editing = null;
  let observer = null;

  const isAdmin = () => !!$('cloudStatusBtn')?.classList.contains('admin');

  async function api(path, opts = {}) {
    const headers = {
      apikey: cfg.supabaseAnonKey,
      Accept: 'application/json',
      ...(opts.headers || {})
    };
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/${path}`, { ...opts, headers });
    if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  function ownerName(r) {
    return bn()
      ? (r.owner_name_bn || r.owner_name_en || r.person_name_bn || r.person_name_en || '')
      : (r.owner_name_en || r.owner_name_bn || r.person_name_en || r.person_name_bn || '');
  }

  function goesToName(r) {
    return bn()
      ? (r.goes_to_bn || r.goes_to_en || '')
      : (r.goes_to_en || r.goes_to_bn || '');
  }

  function recordTitle(r) {
    return bn()
      ? (r.record_label || r.person_name_bn || r.person_name_en || 'জমির রেকর্ড')
      : (r.record_label || r.person_name_en || r.person_name_bn || 'Land record');
  }

  function statusText(v) {
    const en = {
      unverified: 'Unverified',
      'family-confirmed': 'Family confirmed',
      'government-verified': 'Government verified'
    };
    const be = {
      unverified: 'যাচাই হয়নি',
      'family-confirmed': 'পরিবার নিশ্চিত',
      'government-verified': 'সরকারি রেকর্ডে যাচাই'
    };
    return (bn() ? be[v] : en[v]) || v || '';
  }

  function fmtArea(r) {
    const out = [];
    if (r.area_decimal != null && r.area_decimal !== '') out.push(`${r.area_decimal} ${bn() ? 'শতক' : 'decimal'}`);
    if (r.area_acre != null && r.area_acre !== '') out.push(`${r.area_acre} ${bn() ? 'একর' : 'acre'}`);
    return out.join(' · ');
  }

  function recordMeta(r) {
    return [
      r.mouza,
      r.survey_type,
      r.khatian_no ? `${bn() ? 'খতিয়ান' : 'Khatian'} ${r.khatian_no}` : '',
      r.dag_no ? `${bn() ? 'দাগ' : 'Dag'} ${r.dag_no}` : '',
      fmtArea(r)
    ].filter(Boolean).join(' · ');
  }

  function kv(label, value) {
    if (value === null || value === undefined || String(value).trim() === '') value = bn() ? 'তথ্য নেই / যাচাই হয়নি' : 'Not recorded / unverified';
    return `<div class="land-kv"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
  }

  function unique(key) {
    return [...new Set(records.map(r => r[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  }

  function filtered() {
    const q = ($('publicLandSearch')?.value || '').trim().toLowerCase();
    const mouza = $('publicLandMouza')?.value || '';
    const status = $('publicLandStatus')?.value || '';
    return records.filter(r => {
      const hay = Object.values(r).filter(v => typeof v === 'string').join(' ').toLowerCase();
      return (!q || hay.includes(q)) && (!mouza || r.mouza === mouza) && (!status || r.record_status === status);
    });
  }

  function fillFilters() {
    const mouza = $('publicLandMouza');
    const status = $('publicLandStatus');
    if (!mouza || !status) return;
    const oldMouza = mouza.value;
    const oldStatus = status.value;
    mouza.innerHTML = `<option value="">${bn() ? 'সব মৌজা' : 'All mouzas'}</option>` + unique('mouza').map(v => `<option>${esc(v)}</option>`).join('');
    status.innerHTML = `<option value="">${bn() ? 'সব অবস্থা' : 'All statuses'}</option>` +
      ['family-confirmed','government-verified','unverified'].map(v => `<option value="${v}">${esc(statusText(v))}</option>`).join('');
    mouza.value = oldMouza;
    status.value = oldStatus;
  }

  function renderList() {
    const list = $('publicLandList');
    const summary = $('publicLandSummary');
    if (!list || !summary) return;
    const rows = filtered();
    summary.textContent = bn()
      ? `${rows.length}টি রেকর্ড · অস্থায়ী পাবলিক টেস্ট মোড · যোগ/সম্পাদনা চালু`
      : `${rows.length} records · temporary public test mode · add/edit enabled`;

    list.innerHTML = rows.length ? rows.map(r => {
      const owner = ownerName(r);
      const to = goesToName(r);
      return `<button class="land-record ${selected === r.id ? 'active' : ''}" data-id="${esc(r.id)}">
        <b>${esc(recordTitle(r))}</b>
        <span>${esc(recordMeta(r) || (bn() ? 'রেকর্ডের বিস্তারিত' : 'Record details'))}</span>
        ${owner ? `<span><strong>${bn() ? 'মালিক' : 'Owner'}:</strong> ${esc(owner)}</span>` : ''}
        ${to ? `<span><strong>${bn() ? 'যাবে' : 'Goes to'}:</strong> ${esc(to)}</span>` : ''}
        <span class="status">${esc(statusText(r.record_status))}</span>
      </button>`;
    }).join('') : `<div class="land-empty">${bn() ? 'কোনো রেকর্ড পাওয়া যায়নি।' : 'No matching land records.'}</div>`;

    list.querySelectorAll('.land-record').forEach(btn => {
      btn.onclick = () => {
        selected = btn.dataset.id;
        renderList();
        renderDetail();
      };
    });
  }

  function mapSource() {
    const r = records.find(x => x.id === selected);
    if (r && r.latitude != null && r.longitude != null) return { ...r, _kind: 'record' };
    const loc = locations.find(x => x.latitude != null && x.longitude != null);
    return loc ? { ...loc, _kind: 'reference' } : null;
  }

  function renderMap() {
    const wrap = $('publicLandMap');
    if (!wrap) return;
    const loc = mapSource();
    if (!loc) {
      wrap.innerHTML = `<div class="land-empty">${bn() ? 'এই রেকর্ডের ম্যাপ লোকেশন এখনো যোগ করা হয়নি। Edit record থেকে latitude/longitude যোগ করুন।' : 'No map coordinates yet. Use Edit record to add latitude/longitude.'}</div>`;
      return;
    }
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    const title = loc._kind === 'record'
      ? recordTitle(loc)
      : (bn() ? (loc.label_bn || loc.label_en || 'রেফারেন্স লোকেশন') : (loc.label_en || loc.label_bn || 'Reference location'));
    const note = loc._kind === 'record'
      ? (bn() ? 'এই জমির রেকর্ডের ম্যাপ লোকেশন' : 'Map location for this land record')
      : (bn() ? 'সঠিক জমির কো-অর্ডিনেট না থাকায় পারিবারিক রেফারেন্স লোকেশন দেখানো হচ্ছে' : 'Family reference location shown because this record has no exact coordinates yet');
    wrap.innerHTML = `<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=17&output=embed"></iframe>
      <div class="land-map-label"><b>${esc(title)}</b><small>${esc(note)}</small></div>`;
  }

  function renderDetail() {
    const box = $('publicLandDetail');
    if (!box) return;
    const r = records.find(x => x.id === selected);
    if (!r) {
      box.innerHTML = `<div class="land-empty">${bn() ? 'বাম দিক থেকে একটি জমির রেকর্ড নির্বাচন করুন।' : 'Select a land record from the left.'}</div>`;
      renderMap();
      return;
    }

    const notes = bn() ? (r.notes_bn || r.notes_en || '') : (r.notes_en || r.notes_bn || '');
    const verification = bn() ? (r.verification_notes_bn || r.verification_notes_en || '') : (r.verification_notes_en || r.verification_notes_bn || '');
    const source = safeUrl(r.source_url);
    const map = safeUrl(r.map_url);
    const copy = safeUrl(r.certified_copy_url);

    box.innerHTML = `<h2>${esc(recordTitle(r))}</h2>
      <div class="sub">${esc(recordMeta(r))}</div>
      <p class="land-evidence-note">${bn() ? 'পারিবারিক হিসাব বর্তমান আইনি মালিকানার প্রমাণ নয়। খতিয়ান স্বত্বলিপি; একাই চূড়ান্ত মালিকানার দলিল নয়। প্রস্তাবিত উত্তরসূরি থেকে উত্তরাধিকার বণ্টন নির্ধারণ করা হয় না। অনুপস্থিত তথ্য এখনো যাচাই হয়নি।' : 'Family reports do not establish current legal ownership. A khatian is a Record of Rights and alone is not definitive title. Proposed successors do not establish inheritance allocations. Missing information remains unverified.'}</p>
      <section class="land-doc-details">
        <h3>${bn() ? 'মালিকানা ও উত্তরাধিকার' : 'Ownership & destination'}</h3>
        ${kv(bn() ? 'পারিবারিক / ঐতিহাসিক হিসাবে নাম' : 'Name in family / historical record', ownerName(r))}
        ${kv(bn() ? 'প্রস্তাবিত প্রাপক / উত্তরসূরি' : 'Reported destination / proposed successor', goesToName(r))}
        ${kv(bn() ? 'মালিকানার অংশ' : 'Ownership share', r.ownership_share)}
        ${kv(bn() ? 'যাচাই অবস্থা' : 'Verification status', statusText(r.record_status))}
      </section>
      ${kv(bn() ? 'ব্যক্তি ID' : 'Person ID', r.person_id)}
      ${kv(bn() ? 'পরিবারের নাম' : 'Family person', bn() ? (r.person_name_bn || r.person_name_en) : (r.person_name_en || r.person_name_bn))}
      ${kv(bn() ? 'বিভাগ' : 'Division', r.division)}
      ${kv(bn() ? 'জেলা' : 'District', r.district)}
      ${kv(bn() ? 'উপজেলা/থানা' : 'Upazila / Thana', r.upazila)}
      ${kv(bn() ? 'মৌজা' : 'Mouza', r.mouza)}
      ${kv(bn() ? 'মৌজা (বাংলা)' : 'Mouza (Bangla)', r.mouza_bn)}
      ${kv(bn() ? 'মৌজা alias' : 'Mouza aliases', r.mouza_aliases)}
      ${kv('JL No.', r.jl_no)}
      ${kv(bn() ? 'সার্ভে' : 'Survey', r.survey_type)}
      ${kv(bn() ? 'খতিয়ান' : 'Khatian', r.khatian_no)}
      ${kv(bn() ? 'পূর্ব খতিয়ান' : 'Former khatian', r.former_khatian_no)}
      ${kv(bn() ? 'দাগ' : 'Dag', r.dag_no)}
      ${kv(bn() ? 'পূর্ব দাগ' : 'Former dag', r.former_dag_no)}
      ${kv('CS Dag', r.cs_dag_no)}
      ${kv(bn() ? 'শিট' : 'Sheet', r.sheet_no)}
      ${kv(bn() ? 'জমির পরিমাণ' : 'Area', fmtArea(r))}
      <section class="land-doc-details">
        <h3>${bn() ? 'দলিল ও প্রমাণ' : 'Deed & evidence'}</h3>
        ${kv(bn() ? 'দলিলের ধরন' : 'Deed type', r.deed_type)}
        ${kv(bn() ? 'দলিল নম্বর' : 'Deed no.', r.deed_no)}
        ${kv(bn() ? 'দলিলের তারিখ' : 'Deed date', r.deed_date)}
        ${kv(bn() ? 'সাব-রেজিস্ট্রি অফিস' : 'Sub-Registry Office', r.sub_registry_office)}
        ${verification ? `<div class="land-note">${esc(verification)}</div>` : ''}
      </section>
      ${notes ? `<div class="land-note">${esc(notes)}</div>` : ''}
      <div class="land-edit-actions">
        <button class="land-btn primary" id="publicLandEdit">${bn() ? 'রেকর্ড সম্পাদনা' : 'Edit record'}</button>
        ${source ? `<a class="land-btn" target="_blank" rel="noopener" href="${esc(source)}">${bn() ? 'উৎস খুলুন' : 'Open source'}</a>` : ''}
        ${map ? `<a class="land-btn" target="_blank" rel="noopener" href="${esc(map)}">${bn() ? 'ম্যাপ খুলুন' : 'Open map'}</a>` : ''}
        ${copy ? `<a class="land-btn" target="_blank" rel="noopener" href="${esc(copy)}">${bn() ? 'Certified Copy খুলুন' : 'Open certified copy'}</a>` : ''}
      </div>`;

    $('publicLandEdit').onclick = () => openForm(r);
    renderMap();
  }

  function renderAll() {
    fillFilters();
    renderList();
    renderDetail();
  }

  async function load() {
    const summary = $('publicLandSummary');
    if (summary) summary.textContent = bn() ? 'জমির হিসাব লোড হচ্ছে…' : 'Loading land records…';
    try {
      const [r, l] = await Promise.all([
        api('admin_land_records?select=*&order=created_at.asc'),
        api('admin_land_locations?select=*&order=created_at.asc')
      ]);
      records = Array.isArray(r) ? r : [];
      locations = Array.isArray(l) ? l : [];
      if (!selected && records[0]) selected = records[0].id;
      renderAll();
    } catch (err) {
      records = [];
      locations = [];
      if (summary) summary.textContent = bn() ? `লোড করা যায়নি: ${err.message}` : `Could not load: ${err.message}`;
      renderAll();
    }
  }

  function toast(message) {
    const el = $('publicLandToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2600);
  }

  function setForm(form, key, value) {
    if (form.elements[key]) form.elements[key].value = value ?? '';
  }

  function openForm(r = null) {
    editing = r?.id || null;
    const modal = $('publicLandModal');
    const back = $('publicLandBackdrop');
    const form = $('publicLandForm');
    const title = $('publicLandFormTitle');
    if (!modal || !back || !form || !title) return;
    form.reset();
    title.textContent = bn()
      ? (r ? 'জমির রেকর্ড সম্পাদনা' : 'নতুন জমির রেকর্ড')
      : (r ? 'Edit land record' : 'Add land record');

    const x = r || { division: 'Chattogram', district: 'Noakhali', upazila: 'Chatkhil', record_status: 'unverified' };
    const fields = [
      'person_id','person_name_en','person_name_bn','record_label','owner_name_en','owner_name_bn','goes_to_en','goes_to_bn',
      'division','district','upazila','mouza','mouza_bn','mouza_aliases','jl_no','survey_type','khatian_no','former_khatian_no',
      'dag_no','former_dag_no','cs_dag_no','sheet_no','area_acre','area_decimal','ownership_share','record_status',
      'deed_type','deed_no','deed_date','sub_registry_office','source_url','map_url','certified_copy_url','latitude','longitude',
      'notes_en','notes_bn','verification_notes_en','verification_notes_bn'
    ];
    fields.forEach(k => setForm(form, k, x[k]));
    if (!r) setForm(form, 'record_status', 'unverified');
    back.classList.add('show');
    modal.classList.add('show');
  }

  function closeForm() {
    $('publicLandBackdrop')?.classList.remove('show');
    $('publicLandModal')?.classList.remove('show');
    editing = null;
  }

  async function saveForm(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const body = {};
    for (const [k, v] of fd.entries()) body[k] = String(v).trim();
    for (const k of ['area_acre','area_decimal','latitude','longitude']) body[k] = body[k] === '' ? null : Number(body[k]);
    for (const k of Object.keys(body)) if (body[k] === '') body[k] = null;
    body.updated_at = new Date().toISOString();

    try {
      if (editing) {
        await api(`admin_land_records?id=eq.${encodeURIComponent(editing)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(body)
        });
        selected = editing;
      } else {
        const created = await api('admin_land_records?select=*', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify(body)
        });
        if (Array.isArray(created) && created[0]?.id) selected = created[0].id;
      }
      closeForm();
      await load();
      toast(bn() ? 'রেকর্ড সংরক্ষণ হয়েছে' : 'Land record saved');
    } catch (err) {
      toast((bn() ? 'সংরক্ষণ করা যায়নি: ' : 'Could not save: ') + err.message);
    }
  }

  function openShell() {
    $('publicLandShell')?.classList.add('show');
    document.body.style.overflow = 'hidden';
    load();
  }

  function closeShell() {
    $('publicLandShell')?.classList.remove('show');
    document.body.style.overflow = '';
    closeForm();
  }

  function destroyUI() {
    closeShell();
    $('publicLandBtn')?.remove();
    $('publicLandShell')?.remove();
    $('publicLandBackdrop')?.remove();
    $('publicLandModal')?.remove();
    $('publicLandToast')?.remove();
  }

  function ensureUI() {
    if (isAdmin() || $('publicLandBtn')) return;

    $('visitorMapBtn')?.remove();
    $('visitorMapShell')?.remove();

    const dock = $('featureDock') || document.querySelector('.controls');
    if (!dock) return;

    const btn = document.createElement('button');
    btn.id = 'publicLandBtn';
    btn.className = 'feature-btn land-launch tool-btn';
    btn.type = 'button';
    btn.textContent = bn() ? 'জমির হিসাব' : 'Land & Property';
    btn.onclick = openShell;
    dock.appendChild(btn);

    document.body.insertAdjacentHTML('beforeend', `
      <section id="publicLandShell" class="land-shell" aria-label="Public land and property test mode">
        <header class="land-top">
          <div class="land-brand">
            <div class="land-mark">LP</div>
            <div><h1>${bn() ? 'জায়গা-জমির হিসাব' : 'Land & Property'} <span class="land-private-badge">${bn() ? 'পাবলিক টেস্ট' : 'PUBLIC TEST'}</span></h1>
            <p>${bn() ? 'মালিক · উত্তরাধিকারী · খতিয়ান · দাগ · মৌজা · ম্যাপ · দলিল' : 'Owner · successor · khatian · dag · mouza · map · deed'}</p></div>
          </div>
          <div class="land-actions">
            <a target="_blank" rel="noopener" href="https://settlement.gov.bd/Khatian/">${bn() ? 'খতিয়ান যাচাই' : 'Khatian search'}</a>
            <a target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">${bn() ? 'মৌজা ম্যাপ' : 'Mouza map'}</a>
            <button id="publicLandAdd" class="primary" type="button">${bn() ? 'নতুন রেকর্ড' : 'Add record'}</button>
            <button id="publicLandClose" type="button">${bn() ? 'পরিবারে ফিরুন' : 'Back to family'}</button>
          </div>
        </header>
        <div class="land-note" style="margin:12px 16px 0"><b>${bn() ? 'অস্থায়ী টেস্ট মোড:' : 'Temporary test mode:'}</b> ${bn() ? 'সব জমির হিসাব দেখা এবং যোগ/সম্পাদনা করা যাচ্ছে। Delete বন্ধ আছে।' : 'All land records are visible and can be added/edited. Delete remains disabled.'}</div>
        <div class="land-grid">
          <aside class="land-panel land-sidebar">
            <div class="land-filter">
              <input id="publicLandSearch" type="search" placeholder="${bn() ? 'নাম, মালিক, দাগ, খতিয়ান খুঁজুন…' : 'Search name, owner, dag, khatian…'}">
              <div class="land-filter-row"><select id="publicLandMouza"></select><select id="publicLandStatus"></select></div>
            </div>
            <div id="publicLandSummary" class="land-summary"></div>
            <div id="publicLandList" class="land-list"></div>
          </aside>
          <section class="land-panel land-map-panel">
            <div id="publicLandMap" class="land-map-wrap"></div>
            <div class="land-portal-row"><a class="land-btn" target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">map.settlement.gov.bd</a><a class="land-btn" target="_blank" rel="noopener" href="https://settlement.gov.bd/Khatian/">settlement.gov.bd</a></div>
          </section>
          <aside class="land-panel land-detail-panel"><div id="publicLandDetail" class="land-detail"></div></aside>
        </div>
      </section>

      <div id="publicLandBackdrop" class="land-modal-backdrop"></div>
      <section id="publicLandModal" class="land-modal">
        <div class="land-modal-head"><h2 id="publicLandFormTitle"></h2><button id="publicLandFormClose" class="land-btn" type="button">×</button></div>
        <form id="publicLandForm" class="land-form">
          <fieldset class="land-deed-extra"><legend>${bn() ? 'মালিকানা / কার কাছে যাবে' : 'Ownership / who it goes to'}</legend>
            <label>${bn() ? 'মালিক (English)' : 'Owner (English)'}<input name="owner_name_en"></label>
            <label>${bn() ? 'মালিক (বাংলা)' : 'Owner (Bangla)'}<input name="owner_name_bn"></label>
            <label>${bn() ? 'যার কাছে যাবে (English)' : 'Reported destination / proposed successor (English)'}<input name="goes_to_en"></label>
            <label>${bn() ? 'যার কাছে যাবে (বাংলা)' : 'Reported destination / proposed successor (Bangla)'}<input name="goes_to_bn"></label>
          </fieldset>
          <label>Person ID<input name="person_id"></label>
          <label>Record label<input name="record_label"></label>
          <label>English person name<input name="person_name_en"></label>
          <label>বাংলা নাম<input name="person_name_bn"></label>
          <label>Division<input name="division"></label>
          <label>District<input name="district"></label>
          <label>Upazila / Thana<input name="upazila"></label>
          <label>Mouza<input name="mouza"></label>
          <label>মৌজা (বাংলা)<input name="mouza_bn"></label>
          <label>Mouza aliases<input name="mouza_aliases"></label>
          <label>JL No.<input name="jl_no"></label>
          <label>Survey type<input name="survey_type" placeholder="CS / SA / RS / BRS"></label>
          <label>Khatian No.<input name="khatian_no"></label>
          <label>Former khatian<input name="former_khatian_no"></label>
          <label>Dag No.<input name="dag_no"></label>
          <label>Former dag<input name="former_dag_no"></label>
          <label>CS Dag<input name="cs_dag_no"></label>
          <label>Sheet No.<input name="sheet_no"></label>
          <label>Area (acre)<input name="area_acre" inputmode="decimal"></label>
          <label>Area (decimal/শতক)<input name="area_decimal" inputmode="decimal"></label>
          <label class="full">Ownership share<input name="ownership_share"></label>
          <label>Verification<select name="record_status"><option value="unverified">Unverified</option><option value="family-confirmed">Family confirmed</option><option value="government-verified">Government verified</option></select></label>
          <fieldset class="land-deed-extra"><legend>${bn() ? 'দলিল / সার্টিফাইড কপি' : 'Deed / certified copy'}</legend>
            <label>Deed type<input name="deed_type" placeholder="Sale / Saf Kabala / Hiba / Partition"></label>
            <label>Deed number<input name="deed_no"></label>
            <label>Deed date<input name="deed_date" type="date"></label>
            <label>Sub-Registry Office<input name="sub_registry_office"></label>
            <label class="wide">Certified-copy URL<input name="certified_copy_url" type="url"></label>
          </fieldset>
          <label class="full">Source URL<input name="source_url" type="url"></label>
          <label class="full">Map URL<input name="map_url" type="url"></label>
          <label>Latitude<input name="latitude" inputmode="decimal"></label>
          <label>Longitude<input name="longitude" inputmode="decimal"></label>
          <label class="full">Notes (English)<textarea name="notes_en"></textarea></label>
          <label class="full">নোট (বাংলা)<textarea name="notes_bn"></textarea></label>
          <label class="full">Verification note (English)<textarea name="verification_notes_en"></textarea></label>
          <label class="full">যাচাই নোট (বাংলা)<textarea name="verification_notes_bn"></textarea></label>
          <div class="land-form-actions"><button class="land-btn" id="publicLandCancel" type="button">${bn() ? 'বাতিল' : 'Cancel'}</button><button class="land-btn primary" type="submit">${bn() ? 'সংরক্ষণ' : 'Save'}</button></div>
        </form>
      </section>
      <div id="publicLandToast" class="land-toast"></div>`);

    $('publicLandClose').onclick = closeShell;
    $('publicLandAdd').onclick = () => openForm();
    $('publicLandFormClose').onclick = closeForm;
    $('publicLandCancel').onclick = closeForm;
    $('publicLandBackdrop').onclick = closeForm;
    $('publicLandForm').onsubmit = saveForm;
    $('publicLandSearch').addEventListener('input', renderList);
    $('publicLandMouza').addEventListener('change', renderList);
    $('publicLandStatus').addEventListener('change', renderList);
  }

  function syncAccess() {
    if (isAdmin()) destroyUI();
    else ensureUI();
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
        const wasOpen = $('publicLandShell')?.classList.contains('show');
        destroyUI();
        syncAccess();
        if (wasOpen) openShell();
      }, 120);
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
