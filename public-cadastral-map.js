(() => {
  'use strict';

  const cfg = window.FAMILY_BACKEND_CONFIG || {};
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const $ = id => document.getElementById(id);
  const bn = () => document.documentElement.lang === 'bn';
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => (v === '' || v === null || v === undefined || Number.isNaN(Number(v))) ? null : Number(v);

  let records = [];
  let sheets = [];
  let activeView = 'sheet';
  let traceMode = false;
  let tracePoints = [];
  let googleMap = null;
  let googleLoader = null;
  let refreshTimer = null;
  let listObserver = null;

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

  function selectedId() {
    return document.querySelector('#publicLandList .land-record.active')?.dataset.id || records[0]?.id || null;
  }

  function currentRecord() {
    const id = selectedId();
    return records.find(r => r.id === id) || records[0] || null;
  }

  function recordTitle(r) {
    if (!r) return '';
    return bn()
      ? (r.record_label || r.person_name_bn || r.person_name_en || 'জমির রেকর্ড')
      : (r.record_label || r.person_name_en || r.person_name_bn || 'Land record');
  }

  function currentSheet(r = currentRecord()) {
    if (!r) return null;
    if (r.mouza_map_sheet_id) {
      const exact = sheets.find(s => s.id === r.mouza_map_sheet_id);
      if (exact) return exact;
    }
    const candidates = sheets.filter(s => String(s.mouza || '').toLowerCase() === String(r.mouza || '').toLowerCase());
    if (r.sheet_no) {
      const sameSheet = candidates.find(s => String(s.sheet_no || '') === String(r.sheet_no));
      if (sameSheet) return sameSheet;
    }
    if (r.survey_type) {
      const sameSurvey = candidates.find(s => String(s.survey_type || '').toLowerCase() === String(r.survey_type).toLowerCase());
      if (sameSurvey) return sameSurvey;
    }
    return candidates.length === 1 ? candidates[0] : null;
  }

  function parsePixelPolygon(r) {
    const p = r?.parcel_pixel_polygon;
    if (!p) return [];
    if (Array.isArray(p)) return p.filter(x => Array.isArray(x) && x.length >= 2).map(x => [Number(x[0]), Number(x[1])]);
    if (Array.isArray(p.points)) return p.points.filter(x => Array.isArray(x) && x.length >= 2).map(x => [Number(x[0]), Number(x[1])]);
    return [];
  }

  function parseGeoJson(r) {
    const g = r?.parcel_geojson;
    if (!g) return null;
    if (g.type === 'Feature' && g.geometry) return g;
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') return { type: 'Feature', properties: { land_record_id: r.id }, geometry: g };
    return null;
  }

  function polygonPoints(points) {
    return points.map(([x, y]) => `${Math.max(0, Math.min(1, x)) * 1000},${Math.max(0, Math.min(1, y)) * 1000}`).join(' ');
  }

  function sheetRecords(sheet) {
    if (!sheet) return [];
    return records.filter(r => {
      if (r.mouza_map_sheet_id) return r.mouza_map_sheet_id === sheet.id;
      if (String(r.mouza || '').toLowerCase() !== String(sheet.mouza || '').toLowerCase()) return false;
      if (r.sheet_no && sheet.sheet_no && String(r.sheet_no) !== String(sheet.sheet_no)) return false;
      if (r.survey_type && sheet.survey_type && String(r.survey_type).toLowerCase() !== String(sheet.survey_type).toLowerCase()) return false;
      return true;
    });
  }

  function chooseRecord(id) {
    const search = $('publicLandSearch');
    const mouza = $('publicLandMouza');
    const status = $('publicLandStatus');
    if (search) { search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true })); }
    if (mouza) { mouza.value = ''; mouza.dispatchEvent(new Event('change', { bubbles: true })); }
    if (status) { status.value = ''; status.dispatchEvent(new Event('change', { bubbles: true })); }
    setTimeout(() => {
      const btn = document.querySelector(`#publicLandList .land-record[data-id="${CSS.escape(id)}"]`);
      btn?.click();
      render();
    }, 60);
  }

  function statusLabel(v) {
    const map = bn()
      ? { 'not-mapped':'ম্যাপ করা হয়নি', traced:'শিটে ট্রেস করা', georeferenced:'Google অবস্থান যুক্ত', verified:'যাচাইকৃত সীমানা' }
      : { 'not-mapped':'Not mapped', traced:'Traced on sheet', georeferenced:'Georeferenced', verified:'Verified boundary' };
    return map[v] || v || map['not-mapped'];
  }

  function sheetLabel(s) {
    if (!s) return '';
    return [s.mouza, s.survey_type, s.sheet_no ? `${bn() ? 'শিট' : 'Sheet'} ${s.sheet_no}` : '', s.jl_no ? `JL ${s.jl_no}` : ''].filter(Boolean).join(' · ');
  }

  function cornerSet(sheet) {
    const c = sheet?.geo_corners;
    if (c && c.nw && c.ne && c.se && c.sw) return c;
    const b = sheet?.geo_bounds;
    if (b && [b.north,b.south,b.east,b.west].every(v => num(v) !== null)) {
      return {
        nw: { lat: Number(b.north), lng: Number(b.west) },
        ne: { lat: Number(b.north), lng: Number(b.east) },
        se: { lat: Number(b.south), lng: Number(b.east) },
        sw: { lat: Number(b.south), lng: Number(b.west) }
      };
    }
    return null;
  }

  function pixelToLatLng(sheet, point) {
    const c = cornerSet(sheet);
    if (!c) return null;
    const x = Math.max(0, Math.min(1, Number(point[0])));
    const y = Math.max(0, Math.min(1, Number(point[1])));
    const wNW = (1-x)*(1-y), wNE = x*(1-y), wSE = x*y, wSW = (1-x)*y;
    return {
      lat: c.nw.lat*wNW + c.ne.lat*wNE + c.se.lat*wSE + c.sw.lat*wSW,
      lng: c.nw.lng*wNW + c.ne.lng*wNE + c.se.lng*wSE + c.sw.lng*wSW
    };
  }

  function geoFromPixels(sheet, points, recordId) {
    // Do not claim an exact Google parcel boundary from an unverified sheet alignment.
    if (!sheet || sheet.georef_status !== 'verified' || points.length < 3) return null;
    const coords = points.map(p => pixelToLatLng(sheet, p));
    if (coords.some(x => !x)) return null;
    const ring = coords.map(p => [p.lng, p.lat]);
    ring.push([...ring[0]]);
    return {
      type: 'Feature',
      properties: { land_record_id: recordId, source: 'mouza-sheet-georeference', accuracy: sheet.georef_status || 'pending' },
      geometry: { type: 'Polygon', coordinates: [ring] }
    };
  }

  function geoCentroid(feature) {
    const ring = feature?.geometry?.type === 'Polygon' ? feature.geometry.coordinates?.[0] : null;
    if (!Array.isArray(ring) || !ring.length) return null;
    const pts = ring.slice(0, -1).length ? ring.slice(0, -1) : ring;
    const sum = pts.reduce((a, p) => [a[0] + Number(p[0]), a[1] + Number(p[1])], [0, 0]);
    return { lng: sum[0] / pts.length, lat: sum[1] / pts.length };
  }

  function allGeoCoords(feature) {
    if (!feature?.geometry) return [];
    if (feature.geometry.type === 'Polygon') return feature.geometry.coordinates.flat(1);
    if (feature.geometry.type === 'MultiPolygon') return feature.geometry.coordinates.flat(2);
    return [];
  }

  function renderHeader() {
    const r = currentRecord();
    const s = currentSheet(r);
    const title = $('cadastralTitle');
    const meta = $('cadastralMeta');
    if (title) title.textContent = r ? recordTitle(r) : (bn() ? 'ডিজিটাল মৌজা ম্যাপ' : 'Digital Mouza Map');
    if (meta) meta.textContent = r
      ? `${[r.mouza, r.dag_no ? `${bn() ? 'দাগ' : 'Dag'} ${r.dag_no}` : '', r.khatian_no ? `${bn() ? 'খতিয়ান' : 'Khatian'} ${r.khatian_no}` : ''].filter(Boolean).join(' · ')} · ${statusLabel(r.parcel_boundary_status)}`
      : (bn() ? 'রেকর্ড নির্বাচন করুন' : 'Select a land record');
    $('cadastralSheetTab')?.classList.toggle('active', activeView === 'sheet');
    $('cadastralGoogleTab')?.classList.toggle('active', activeView === 'google');
    const badge = $('cadastralSheetBadge');
    if (badge) badge.textContent = s ? sheetLabel(s) : (bn() ? 'শিট যুক্ত নয়' : 'No sheet attached');
  }

  function renderSheet() {
    const stage = $('cadastralStage');
    const r = currentRecord();
    const s = currentSheet(r);
    if (!stage) return;
    if (!r) {
      stage.innerHTML = `<div class="cadastral-empty">${bn() ? 'একটি জমির রেকর্ড নির্বাচন করুন।' : 'Select a land record.'}</div>`;
      return;
    }
    if (!s || !s.image_url) {
      stage.innerHTML = `<div class="cadastral-empty cadastral-setup-empty">
        <b>${bn() ? 'এই জমির অফিসিয়াল মৌজা শিট এখনো যুক্ত হয়নি' : 'Official mouza sheet not attached yet'}</b>
        <span>${bn() ? 'DLRS থেকে সঠিক CS/SA/RS/BRS/BDS শিট নিয়ে এখানে image URL ও corner coordinates দিন। তারপর প্রতিটি দাগের সীমানা ক্লিক করে ট্রেস করা যাবে।' : 'Get the correct CS/SA/RS/BRS/BDS sheet from DLRS, add its image URL and corner coordinates here, then trace each dag by clicking its boundary.'}</span>
        <div><button class="cadastral-btn primary" id="cadastralConfigureSheet" type="button">${bn() ? 'মৌজা শিট সেটআপ' : 'Configure mouza sheet'}</button><a class="cadastral-btn" target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">${bn() ? 'অফিসিয়াল DLRS ম্যাপ' : 'Official DLRS maps'}</a></div>
      </div>`;
      $('cadastralConfigureSheet')?.addEventListener('click', () => toggleSheetForm(true));
      const countMapped = records.filter(x => parsePixelPolygon(x).length >= 3).length;
      const byMouza = [...new Set(records.map(x => String(x.mouza || '').trim()).filter(Boolean))];
      const groups = byMouza.map(mouza => {
        const items = records.filter(x => String(x.mouza || '').trim() === mouza);
        const cards = items.map(x => {
          const dag = x.dag_no ? `${bn() ? 'দাগ' : 'Dag'} ${esc(x.dag_no)}` : (bn() ? 'দাগ নম্বর নেই' : 'Dag not recorded');
          const khatian = x.khatian_no ? `${bn() ? 'খতিয়ান' : 'Khatian'} ${esc(x.khatian_no)}` : (bn() ? 'খতিয়ান অপেক্ষমাণ' : 'Khatian pending');
          const area = x.area_decimal != null ? `${esc(x.area_decimal)} ${bn() ? 'শতক' : 'decimal'}` : '';
          const owner = bn() ? (x.owner_name_bn || x.owner_name_en || x.person_name_bn || x.person_name_en || '') : (x.owner_name_en || x.owner_name_bn || x.person_name_en || x.person_name_bn || '');
          return `<button type="button" class="cadastral-index-card ${x.id === r.id ? 'active' : ''}" data-record-id="${esc(x.id)}" aria-label="${dag}">
              <strong>${dag}</strong><span>${esc(x.record_label || '')}</span>
              <small>${khatian}${area ? ' · ' + area : ''}</small>
              ${owner ? `<small>${bn() ? 'হিসাবের নাম' : 'Recorded against'}: ${esc(owner)}</small>` : ''}
              <em>${esc(statusLabel(x.parcel_boundary_status))}</em></button>`;
        }).join('');
        return `<section class="cadastral-index-group"><h4>${esc(mouza)} <span>${items.length} ${bn() ? 'টি হিসাব' : 'records'}</span></h4><div class="cadastral-index-grid">${cards}</div></section>`;
      }).join('');
      stage.insertAdjacentHTML('beforeend', `<section class="cadastral-index" aria-label="Land parcel register">
        <div class="cadastral-index-head"><div><h3>${bn() ? 'দাগভিত্তিক জমির তালিকা' : 'Clickable dag register'}</h3>
        <p>${bn() ? 'এটি জমির অবস্থানের নকশা নয়। অফিসিয়াল মৌজা শিট না পাওয়া পর্যন্ত কোন জমির সীমানা অনুমান করা হচ্ছে না।' : 'This is an index, NOT a geographical parcel map. No plot location or boundary is guessed without the official survey sheet.'}</p></div>
        <span>${countMapped}/${records.length} ${bn() ? 'টি ট্রেস করা' : 'traced'}</span></div>
        ${groups || `<p>${bn() ? 'জমির হিসাব পাওয়া যায়নি' : 'No land records loaded'}</p>`}
        <p class="cadastral-index-help">${bn() ? 'দাগে ট্যাপ করুন → ডান পাশে মালিকানা, হিসাব, দলিল ও অন্যান্য তথ্য দেখুন। নকশা সংগ্রহ: অফিসিয়াল DLRS পোর্টালে জেলা নোয়াখালী, উপজেলা চাটখিল, মৌজা ভীমপুর/ভাওর এবং সঠিক জরিপ নির্বাচন করুন।' : 'Tap a dag above to open its ownership, share, deed and other details. To acquire the map, select Noakhali → Chatkhil → Bhimpur/Bhaor and the correct survey at the DLRS portal.'}</p>
      </section>`);
      stage.querySelectorAll('.cadastral-index-card').forEach(button => {
        button.addEventListener('click', () => chooseRecord(button.dataset.recordId));
      });
      return;
    }

    const attached = sheetRecords(s);
    const current = r.id;
    const polygons = attached.map(x => {
      const pts = parsePixelPolygon(x);
      if (pts.length < 3) return '';
      return `<polygon tabindex="0" role="button" aria-label="${esc(recordTitle(x))}" class="cadastral-parcel ${x.id === current ? 'active' : ''}" data-record-id="${esc(x.id)}" points="${polygonPoints(pts)}"></polygon>`;
    }).join('');
    const trace = tracePoints.length
      ? `<polyline class="cadastral-trace-line" points="${polygonPoints(tracePoints)}"></polyline>${tracePoints.map(([x,y]) => `<circle class="cadastral-trace-point" cx="${x*1000}" cy="${y*1000}" r="8"></circle>`).join('')}`
      : '';

    stage.innerHTML = `<div class="cadastral-image-shell">
      <div class="cadastral-image-wrap ${traceMode ? 'tracing' : ''}" id="cadastralImageWrap">
        <img id="cadastralSheetImage" src="${esc(s.image_url)}" alt="${esc(sheetLabel(s) || 'Mouza map sheet')}" draggable="false">
        <svg class="cadastral-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Clickable land parcels">${polygons}${trace}</svg>
      </div>
      <div class="cadastral-image-caption"><b>${esc(sheetLabel(s))}</b><span>${bn() ? 'সীমানায় ট্যাপ করলে সেই জমির পুরো রেকর্ড খুলবে।' : 'Tap a parcel boundary to open that land record.'}</span></div>
    </div>
    <div class="cadastral-trace-toolbar">
      <button class="cadastral-btn ${traceMode ? 'danger' : 'primary'}" id="cadastralTraceToggle" type="button">${traceMode ? (bn() ? 'ট্রেস বাতিল' : 'Cancel tracing') : (bn() ? 'এই দাগ ট্রেস করুন' : 'Trace this parcel')}</button>
      ${traceMode ? `<button class="cadastral-btn" id="cadastralTraceUndo" type="button">${bn() ? 'শেষ পয়েন্ট মুছুন' : 'Undo point'}</button><button class="cadastral-btn primary" id="cadastralTraceSave" type="button" ${tracePoints.length < 3 ? 'disabled' : ''}>${bn() ? 'সীমানা সংরক্ষণ' : 'Save boundary'}</button>` : ''}
      <button class="cadastral-btn" id="cadastralConfigureSheet" type="button">${bn() ? 'শিট / জিওরেফারেন্স' : 'Sheet / georeference'}</button>
    </div>`;

    stage.querySelectorAll('.cadastral-parcel').forEach(poly => {
      const choose = e => { e.stopPropagation(); chooseRecord(poly.dataset.recordId); };
      poly.addEventListener('click', choose);
      poly.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') choose(e); });
    });
    $('cadastralTraceToggle')?.addEventListener('click', () => {
      traceMode = !traceMode;
      tracePoints = traceMode ? parsePixelPolygon(r) : [];
      render();
    });
    $('cadastralTraceUndo')?.addEventListener('click', () => { tracePoints.pop(); render(); });
    $('cadastralTraceSave')?.addEventListener('click', saveTrace);
    $('cadastralConfigureSheet')?.addEventListener('click', () => toggleSheetForm(true));

    const wrap = $('cadastralImageWrap');
    if (wrap && traceMode) {
      wrap.addEventListener('click', e => {
        if (e.target.closest('.cadastral-parcel')) return;
        const rect = wrap.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        tracePoints.push([
          Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
          Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
        ]);
        render();
      });
    }
  }

  async function saveTrace() {
    const r = currentRecord();
    const s = currentSheet(r);
    if (!r || !s || tracePoints.length < 3) return;
    const feature = geoFromPixels(s, tracePoints, r.id);
    const centroid = geoCentroid(feature);
    const body = {
      parcel_pixel_polygon: tracePoints.map(p => [Number(p[0].toFixed(7)), Number(p[1].toFixed(7))]),
      parcel_geojson: feature,
      parcel_boundary_status: feature ? 'georeferenced' : 'traced',
      parcel_centroid_lat: centroid?.lat ?? null,
      parcel_centroid_lng: centroid?.lng ?? null,
      updated_at: new Date().toISOString()
    };
    try {
      await api(`admin_land_records?id=eq.${encodeURIComponent(r.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', Prefer:'return=minimal' },
        body: JSON.stringify(body)
      });
      traceMode = false;
      tracePoints = [];
      await refreshData();
      toast(bn() ? 'দাগের সীমানা সংরক্ষণ হয়েছে' : 'Parcel boundary saved');
    } catch (err) {
      toast((bn() ? 'সীমানা সংরক্ষণ করা যায়নি: ' : 'Could not save boundary: ') + err.message);
    }
  }

  function mapCenter(r, feature) {
    const c = geoCentroid(feature);
    if (c) return c;
    const lat = num(r?.parcel_centroid_lat ?? r?.latitude);
    const lng = num(r?.parcel_centroid_lng ?? r?.longitude);
    return lat !== null && lng !== null ? { lat, lng } : null;
  }

  async function loadGoogleApi() {
    if (window.google?.maps) return window.google.maps;
    const key = cfg.googleMapsApiKey || window.GOOGLE_MAPS_API_KEY || '';
    if (!key) return null;
    if (googleLoader) return googleLoader;
    googleLoader = new Promise((resolve, reject) => {
      const cb = `__familyGoogleMapsReady_${Date.now()}`;
      window[cb] = () => { delete window[cb]; resolve(window.google?.maps || null); };
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cb}&v=weekly`;
      s.async = true;
      s.onerror = () => reject(new Error('Google Maps API failed to load'));
      document.head.appendChild(s);
    });
    return googleLoader;
  }

  async function renderGoogle() {
    const stage = $('cadastralStage');
    const r = currentRecord();
    if (!stage) return;
    if (!r) {
      stage.innerHTML = `<div class="cadastral-empty">${bn() ? 'একটি জমির রেকর্ড নির্বাচন করুন।' : 'Select a land record.'}</div>`;
      return;
    }
    const feature = parseGeoJson(r);
    const center = mapCenter(r, feature);
    if (!center) {
      stage.innerHTML = `<div class="cadastral-empty"><b>${bn() ? 'Google Maps-এর জন্য এখনো parcel geometry নেই' : 'No Google parcel geometry yet'}</b><span>${bn() ? 'আগে অফিসিয়াল মৌজা শিট জিওরেফারেন্স করে এই দাগটি ট্রেস করুন।' : 'First georeference the official mouza sheet and trace this dag.'}</span></div>`;
      return;
    }

    const key = cfg.googleMapsApiKey || window.GOOGLE_MAPS_API_KEY || '';
    const gLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.lat},${center.lng}`)}`;
    if (!key) {
      stage.innerHTML = `<div class="cadastral-google-fallback">
        <iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(`${center.lat},${center.lng}`)}&z=19&output=embed"></iframe>
        <div class="cadastral-google-note"><b>${feature ? (bn() ? 'Parcel polygon প্রস্তুত' : 'Parcel polygon ready') : (bn() ? 'Parcel centre' : 'Parcel centre')}</b><span>${feature ? (bn() ? 'সীমানাটি Google Maps-এর ওপর আঁকতে একটি domain-restricted Google Maps JavaScript API key যোগ করতে হবে। এখন কেন্দ্রবিন্দু দেখানো হচ্ছে।' : 'A domain-restricted Google Maps JavaScript API key is needed to draw the boundary on top of Google Maps. The parcel centre is shown for now.') : (bn() ? 'পূর্ণ সীমানার জন্য parcel trace করুন।' : 'Trace the parcel for the full boundary.')}</span><a class="cadastral-btn primary" target="_blank" rel="noopener" href="${esc(gLink)}">${bn() ? 'Google Maps-এ খুলুন' : 'Open in Google Maps'}</a></div>
      </div>`;
      return;
    }

    stage.innerHTML = `<div id="cadastralGoogleMap" class="cadastral-google-map"></div><div class="cadastral-google-actions"><a class="cadastral-btn" target="_blank" rel="noopener" href="${esc(gLink)}">${bn() ? 'Google Maps-এ খুলুন' : 'Open in Google Maps'}</a></div>`;
    try {
      const maps = await loadGoogleApi();
      if (!maps || !$('cadastralGoogleMap')) throw new Error('Google Maps unavailable');
      googleMap = new maps.Map($('cadastralGoogleMap'), { center, zoom: 19, mapTypeId: 'hybrid', gestureHandling: 'greedy' });
      if (feature) {
        googleMap.data.addGeoJson(feature);
        googleMap.data.setStyle({ fillOpacity: 0.22, strokeWeight: 3 });
        const bounds = new maps.LatLngBounds();
        allGeoCoords(feature).forEach(([lng, lat]) => bounds.extend({ lat:Number(lat), lng:Number(lng) }));
        if (!bounds.isEmpty()) googleMap.fitBounds(bounds, 44);
        googleMap.data.addListener('click', () => chooseRecord(r.id));
      }
    } catch (err) {
      stage.innerHTML = `<div class="cadastral-empty">${esc(err.message)}</div>`;
    }
  }

  function render() {
    if (!$('cadastralWorkspace')) return;
    renderHeader();
    if (activeView === 'sheet') renderSheet();
    else renderGoogle();
    fillSheetForm();
  }

  function toggleSheetForm(show) {
    const form = $('cadastralSheetFormWrap');
    if (!form) return;
    form.classList.toggle('show', show ?? !form.classList.contains('show'));
    if (form.classList.contains('show')) fillSheetForm();
  }

  function fillSheetForm() {
    const form = $('cadastralSheetForm');
    const r = currentRecord();
    const s = currentSheet(r);
    if (!form || !r) return;
    const set = (name, value) => { if (form.elements[name] && document.activeElement !== form.elements[name]) form.elements[name].value = value ?? ''; };
    set('sheet_id', s?.id || '');
    set('mouza', s?.mouza || r.mouza || '');
    set('mouza_bn', s?.mouza_bn || r.mouza_bn || '');
    set('jl_no', s?.jl_no || r.jl_no || '');
    set('survey_type', s?.survey_type || r.survey_type || '');
    set('sheet_no', s?.sheet_no || r.sheet_no || '');
    set('image_url', s?.image_url || '');
    set('official_source_url', s?.official_source_url || 'https://map.settlement.gov.bd/');
    set('georef_status', s?.georef_status || 'pending');
    const c = cornerSet(s);
    ['nw','ne','se','sw'].forEach(k => {
      set(`${k}_lat`, c?.[k]?.lat ?? '');
      set(`${k}_lng`, c?.[k]?.lng ?? '');
    });
  }

  async function saveSheet(event) {
    event.preventDefault();
    const r = currentRecord();
    if (!r) return;
    const fd = new FormData(event.currentTarget);
    const id = String(fd.get('sheet_id') || '').trim();
    const corners = {};
    let completeCorners = true;
    ['nw','ne','se','sw'].forEach(k => {
      const lat = num(fd.get(`${k}_lat`));
      const lng = num(fd.get(`${k}_lng`));
      if (lat === null || lng === null) completeCorners = false;
      corners[k] = { lat, lng };
    });
    const body = {
      mouza: String(fd.get('mouza') || '').trim(),
      mouza_bn: String(fd.get('mouza_bn') || '').trim() || null,
      jl_no: String(fd.get('jl_no') || '').trim() || null,
      survey_type: String(fd.get('survey_type') || '').trim() || null,
      sheet_no: String(fd.get('sheet_no') || '').trim() || null,
      image_url: String(fd.get('image_url') || '').trim() || null,
      official_source_url: String(fd.get('official_source_url') || '').trim() || 'https://map.settlement.gov.bd/',
      georef_status: String(fd.get('georef_status') || 'pending'),
      geo_corners: completeCorners ? corners : null,
      geo_bounds: completeCorners ? {
        north: Math.max(corners.nw.lat, corners.ne.lat, corners.se.lat, corners.sw.lat),
        south: Math.min(corners.nw.lat, corners.ne.lat, corners.se.lat, corners.sw.lat),
        east: Math.max(corners.nw.lng, corners.ne.lng, corners.se.lng, corners.sw.lng),
        west: Math.min(corners.nw.lng, corners.ne.lng, corners.se.lng, corners.sw.lng)
      } : null,
      updated_at: new Date().toISOString()
    };
    if (!body.mouza) { toast(bn() ? 'মৌজার নাম দিন' : 'Mouza is required'); return; }

    try {
      let sheetId = id;
      if (id) {
        await api(`admin_mouza_map_sheets?id=eq.${encodeURIComponent(id)}`, {
          method:'PATCH', headers:{'Content-Type':'application/json', Prefer:'return=minimal'}, body:JSON.stringify(body)
        });
      } else {
        const created = await api('admin_mouza_map_sheets?select=*', {
          method:'POST', headers:{'Content-Type':'application/json', Prefer:'return=representation'}, body:JSON.stringify(body)
        });
        sheetId = Array.isArray(created) ? created[0]?.id : null;
      }
      if (sheetId) {
        await api(`admin_land_records?id=eq.${encodeURIComponent(r.id)}`, {
          method:'PATCH', headers:{'Content-Type':'application/json', Prefer:'return=minimal'},
          body:JSON.stringify({ mouza_map_sheet_id: sheetId, sheet_no: body.sheet_no || r.sheet_no, survey_type: body.survey_type || r.survey_type, jl_no: body.jl_no || r.jl_no, updated_at:new Date().toISOString() })
        });
      }
      await refreshData();
      toggleSheetForm(false);
      toast(bn() ? 'মৌজা শিট সংরক্ষণ হয়েছে' : 'Mouza sheet saved');
    } catch (err) {
      toast((bn() ? 'শিট সংরক্ষণ করা যায়নি: ' : 'Could not save sheet: ') + err.message);
    }
  }

  function toast(message) {
    const el = $('publicLandToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  async function refreshData() {
    if (!$('cadastralWorkspace')) return;
    try {
      const [r, s] = await Promise.all([
        api('admin_land_records?select=*&order=created_at.asc'),
        api('admin_mouza_map_sheets?select=*&order=created_at.asc')
      ]);
      records = Array.isArray(r) ? r : [];
      sheets = Array.isArray(s) ? s : [];
      render();
    } catch (err) {
      const stage = $('cadastralStage');
      if (stage) stage.innerHTML = `<div class="cadastral-empty">${esc(err.message)}</div>`;
    }
  }

  function mount() {
    const panel = document.querySelector('#publicLandShell .land-map-panel');
    if (!panel || $('cadastralWorkspace')) return;
    panel.classList.add('has-cadastral');
    const portal = panel.querySelector('.land-portal-row');
    const html = `<section id="cadastralWorkspace" class="cadastral-workspace">
      <div class="cadastral-head">
        <div><h2 id="cadastralTitle">${bn() ? 'ডিজিটাল মৌজা ম্যাপ' : 'Digital Mouza Map'}</h2><p id="cadastralMeta"></p></div>
        <div class="cadastral-tabs"><button id="cadastralSheetTab" class="active" type="button">${bn() ? 'মৌজা শিট' : 'Mouza sheet'}</button><button id="cadastralGoogleTab" type="button">Google Maps</button></div>
      </div>
      <div class="cadastral-sheet-line"><span>${bn() ? 'সংযুক্ত শিট:' : 'Attached sheet:'}</span><b id="cadastralSheetBadge"></b></div>
      <div id="cadastralStage" class="cadastral-stage"><div class="cadastral-empty">${bn() ? 'লোড হচ্ছে…' : 'Loading…'}</div></div>
      <div id="cadastralSheetFormWrap" class="cadastral-sheet-form-wrap">
        <form id="cadastralSheetForm" class="cadastral-sheet-form">
          <input type="hidden" name="sheet_id">
          <div class="cadastral-form-title"><b>${bn() ? 'অফিসিয়াল মৌজা শিট ও Google georeference' : 'Official mouza sheet & Google georeference'}</b><button type="button" id="cadastralSheetFormClose">×</button></div>
          <label>${bn() ? 'মৌজা' : 'Mouza'}<input name="mouza" required></label>
          <label>${bn() ? 'মৌজা (বাংলা)' : 'Mouza (Bangla)'}<input name="mouza_bn"></label>
          <label>JL No.<input name="jl_no"></label>
          <label>${bn() ? 'সার্ভে' : 'Survey'}<input name="survey_type" placeholder="CS / SA / RS / BRS / BDS"></label>
          <label>${bn() ? 'শিট নম্বর' : 'Sheet no.'}<input name="sheet_no"></label>
          <label>${bn() ? 'জিওরেফারেন্স অবস্থা' : 'Georeference status'}<select name="georef_status"><option value="pending">Pending</option><option value="approximate">Approximate</option><option value="verified">Verified</option></select></label>
          <label class="wide">${bn() ? 'মৌজা শিট image URL' : 'Mouza sheet image URL'}<input name="image_url" type="url" placeholder="https://..."></label>
          <label class="wide">${bn() ? 'অফিসিয়াল উৎস URL' : 'Official source URL'}<input name="official_source_url" type="url"></label>
          <fieldset class="cadastral-corners"><legend>${bn() ? 'চার কোণের latitude / longitude' : 'Four corner latitude / longitude'}</legend>
            ${['nw','ne','se','sw'].map(k => `<label>${k.toUpperCase()} lat<input name="${k}_lat" inputmode="decimal"></label><label>${k.toUpperCase()} lng<input name="${k}_lng" inputmode="decimal"></label>`).join('')}
          </fieldset>
          <div class="wide cadastral-form-actions"><a class="cadastral-btn" target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">${bn() ? 'DLRS ম্যাপ খুঁজুন' : 'Find DLRS map'}</a><button class="cadastral-btn primary" type="submit">${bn() ? 'শিট সংরক্ষণ' : 'Save sheet'}</button></div>
          <p class="wide cadastral-form-help">${bn() ? 'শিটের চার কোণের বাস্তব latitude/longitude দিলে image-এর প্রতিটি traced point Google coordinate-এ রূপান্তর হবে। Verified কেবল তখনই দিন যখন alignment বাস্তবে মিলিয়ে দেখা হয়েছে।' : 'Enter the real latitude/longitude of all four sheet corners so traced image points can be converted to Google coordinates. Use Verified only after checking the alignment against real-world features.'}</p>
        </form>
      </div>
    </section>`;
    if (portal) portal.insertAdjacentHTML('beforebegin', html);
    else panel.insertAdjacentHTML('beforeend', html);

    $('cadastralSheetTab').onclick = () => { activeView = 'sheet'; render(); };
    $('cadastralGoogleTab').onclick = () => { activeView = 'google'; render(); };
    $('cadastralSheetForm').onsubmit = saveSheet;
    $('cadastralSheetFormClose').onclick = () => toggleSheetForm(false);

    const list = $('publicLandList');
    if (list) {
      listObserver?.disconnect();
      listObserver = new MutationObserver(() => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshData, 180);
      });
      listObserver.observe(list, { childList:true, subtree:false });
    }

    refreshData();
  }

  function watch() {
    const obs = new MutationObserver(() => mount());
    obs.observe(document.body, { childList:true, subtree:true });
    mount();
    document.addEventListener('click', e => {
      if (e.target.closest('#publicLandList .land-record')) setTimeout(render, 80);
      if (e.target.closest('#publicLandBtn')) setTimeout(() => { mount(); refreshData(); }, 120);
      if (e.target.closest('.lang-btn')) setTimeout(() => { mount(); refreshData(); }, 180);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();