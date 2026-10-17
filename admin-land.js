(() => {
  'use strict';
  const cfg=window.FAMILY_BACKEND_CONFIG||{};
  if(!cfg.enabled||!cfg.supabaseUrl||!cfg.supabaseAnonKey)return;
  const $=id=>document.getElementById(id);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bn=()=>document.documentElement.lang==='bn';
  let records=[],locations=[],selected=null,watcher=null,editing=null;

  function authToken(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);if(!key||!/^sb-.*-auth-token$/.test(key))continue;
        const raw=localStorage.getItem(key);if(!raw)continue;
        const obj=JSON.parse(raw);
        const dig=v=>{if(!v||typeof v!=='object')return null;if(typeof v.access_token==='string')return v.access_token;if(Array.isArray(v)){for(const x of v){const h=dig(x);if(h)return h;}}else{for(const x of Object.values(v)){const h=dig(x);if(h)return h;}}return null;};
        const token=dig(obj);if(token)return token;
      }
    }catch(_){ }
    return null;
  }
  const headers=()=>({apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${authToken()}`,Accept:'application/json'});
  async function api(path,opts={}){
    const token=authToken();if(!token)throw new Error('No admin session');
    const res=await fetch(`${cfg.supabaseUrl}/rest/v1/${path}`,{...opts,headers:{...headers(),...(opts.headers||{})}});
    if(!res.ok)throw new Error(await res.text()||`HTTP ${res.status}`);
    if(res.status===204)return null;const txt=await res.text();return txt?JSON.parse(txt):null;
  }
  async function load(){
    try{
      const [r,l]=await Promise.all([
        api('admin_land_records?select=*&order=updated_at.desc'),
        api('admin_land_locations?select=*&order=created_at.asc')
      ]);
      records=Array.isArray(r)?r:[];locations=Array.isArray(l)?l:[];
      renderAll();
    }catch(_){ records=[];locations=[];renderAll(); }
  }
  function fmtArea(r){
    const out=[];if(r.area_decimal!=null)out.push(`${r.area_decimal} ${bn()?'শতক':'decimal'}`);if(r.area_acre!=null)out.push(`${r.area_acre} ${bn()?'একর':'acre'}`);return out.join(' · ');
  }
  function statusText(s){return bn()?({'unverified':'যাচাই হয়নি','family-confirmed':'পরিবার নিশ্চিত','government-verified':'সরকারি রেকর্ডে যাচাই'}[s]||s):({'unverified':'Unverified','family-confirmed':'Family confirmed','government-verified':'Government verified'}[s]||s);}
  function recordTitle(r){return bn()?(r.person_name_bn||r.person_name_en||r.record_label||'রেকর্ড'):(r.person_name_en||r.person_name_bn||r.record_label||'Record');}
  function recordMeta(r){return [r.mouza,r.survey_type,r.khatian_no?`${bn()?'খতিয়ান':'Khatian'} ${r.khatian_no}`:'',r.dag_no?`${bn()?'দাগ':'Dag'} ${r.dag_no}`:''].filter(Boolean).join(' · ');}
  function unique(key){return [...new Set(records.map(r=>r[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));}
  function fillFilters(){
    const person=$('landPersonFilter'),mouza=$('landMouzaFilter'),survey=$('landSurveyFilter');if(!person||!mouza||!survey)return;
    const val=[person.value,mouza.value,survey.value];
    person.innerHTML=`<option value="">${bn()?'সব ব্যক্তি':'All people'}</option>`+unique(bn()?'person_name_bn':'person_name_en').map(x=>`<option>${esc(x)}</option>`).join('');
    mouza.innerHTML=`<option value="">${bn()?'সব মৌজা':'All mouzas'}</option>`+unique('mouza').map(x=>`<option>${esc(x)}</option>`).join('');
    survey.innerHTML=`<option value="">${bn()?'সব সার্ভে':'All surveys'}</option>`+unique('survey_type').map(x=>`<option>${esc(x)}</option>`).join('');
    [person.value,mouza.value,survey.value]=val;
  }
  function filtered(){
    const q=($('landSearch')?.value||'').trim().toLowerCase(),p=$('landPersonFilter')?.value||'',m=$('landMouzaFilter')?.value||'',s=$('landSurveyFilter')?.value||'';
    return records.filter(r=>{
      const hay=Object.values(r).filter(v=>typeof v==='string').join(' ').toLowerCase();
      const pn=bn()?(r.person_name_bn||''):(r.person_name_en||'');
      return (!q||hay.includes(q))&&(!p||pn===p)&&(!m||r.mouza===m)&&(!s||r.survey_type===s);
    });
  }
  function renderList(){
    const list=$('landList'),sum=$('landSummary');if(!list||!sum)return;const rows=filtered();
    sum.textContent=bn()?`${rows.length}টি রেকর্ড · ব্যক্তিগত, শুধু অ্যাডমিন`:`${rows.length} records · private, admin only`;
    list.innerHTML=rows.length?rows.map(r=>`<button class="land-record ${selected===r.id?'active':''}" data-id="${esc(r.id)}"><b>${esc(recordTitle(r))}</b><span>${esc(recordMeta(r)|| (bn()?'রেকর্ডের বিস্তারিত':'Record details'))}</span>${fmtArea(r)?`<span>${esc(fmtArea(r))}</span>`:''}<span class="status">${esc(statusText(r.record_status))}</span></button>`).join(''):`<div class="land-empty">${bn()?'এখনও কোনো জমির রেকর্ড যোগ করা হয়নি। আপনার আসল হিসাব দিলে এখানে যোগ করব।':'No land records have been added yet. Your real হিসাব can be added here without exposing it publicly.'}</div>`;
    list.querySelectorAll('.land-record').forEach(b=>b.onclick=()=>{selected=b.dataset.id;renderList();renderDetail();});
  }
  function mapLocation(){
    if(selected){const r=records.find(x=>x.id===selected);if(r?.latitude!=null&&r?.longitude!=null)return r;}
    return locations[0]||null;
  }
  function renderMap(){
    const wrap=$('landMapWrap');if(!wrap)return;const loc=mapLocation();
    if(!loc||loc.latitude==null||loc.longitude==null){wrap.innerHTML=`<div class="land-empty">${bn()?'ম্যাপ লোকেশন নেই':'No map location yet'}</div>`;return;}
    const lat=Number(loc.latitude),lng=Number(loc.longitude);const label=bn()?(loc.label_bn||loc.person_name_bn||loc.label_en||loc.person_name_en||'লোকেশন'):(loc.label_en||loc.person_name_en||loc.label_bn||loc.person_name_bn||'Location');
    const note=bn()?(loc.note_bn||''):(loc.note_en||'');
    wrap.innerHTML=`<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(lat+','+lng)}&z=17&output=embed"></iframe><div class="land-map-label"><b>${esc(label)}</b>${note?`<small>${esc(note)}</small>`:''}</div>`;
  }
  function kv(label,val){return val!==null&&val!==undefined&&String(val)!==''?`<div class="land-kv"><span>${esc(label)}</span><b>${esc(val)}</b></div>`:'';}
  function renderDetail(){
    const box=$('landDetail');if(!box)return;const r=records.find(x=>x.id===selected);
    if(!r){box.innerHTML=`<div class="land-empty">${bn()?'বাম দিক থেকে একটি রেকর্ড নির্বাচন করুন।':'Select a land record from the left to see full khatian/dag details.'}</div>`;renderMap();return;}
    const title=recordTitle(r),notes=bn()?(r.notes_bn||r.notes_en||''):(r.notes_en||r.notes_bn||'');
    box.innerHTML=`<h2>${esc(title)}</h2><div class="sub">${esc(recordMeta(r))}</div>${kv(bn()?'রেকর্ড নাম':'Record label',r.record_label)}${kv(bn()?'বিভাগ':'Division',r.division)}${kv(bn()?'জেলা':'District',r.district)}${kv(bn()?'উপজেলা/থানা':'Upazila / Thana',r.upazila)}${kv(bn()?'মৌজা':'Mouza',r.mouza)}${kv('JL No.',r.jl_no)}${kv(bn()?'সার্ভে':'Survey',r.survey_type)}${kv(bn()?'খতিয়ান':'Khatian',r.khatian_no)}${kv(bn()?'পূর্ব খতিয়ান':'Former khatian',r.former_khatian_no)}${kv(bn()?'দাগ':'Dag',r.dag_no)}${kv(bn()?'পূর্ব দাগ':'Former dag',r.former_dag_no)}${kv('CS Dag',r.cs_dag_no)}${kv(bn()?'শিট':'Sheet',r.sheet_no)}${kv(bn()?'জমির পরিমাণ':'Area',fmtArea(r))}${kv(bn()?'অংশ':'Ownership share',r.ownership_share)}${kv(bn()?'যাচাই':'Verification',statusText(r.record_status))}${notes?`<div class="land-note">${esc(notes)}</div>`:''}<div class="land-edit-actions"><button class="land-btn" id="landEditRecord">${bn()?'সম্পাদনা':'Edit record'}</button>${r.source_url?`<a class="land-btn" target="_blank" rel="noopener" href="${esc(r.source_url)}">${bn()?'উৎস খুলুন':'Open source'}</a>`:''}${r.map_url?`<a class="land-btn" target="_blank" rel="noopener" href="${esc(r.map_url)}">${bn()?'ম্যাপ খুলুন':'Open map'}</a>`:''}</div>`;
    $('landEditRecord').onclick=()=>openForm(r);
    renderMap();
  }
  function renderAll(){fillFilters();renderList();renderDetail();const add=$('landAddBtn');if(add)add.textContent=bn()?'নতুন রেকর্ড':'Add record';const close=$('landCloseBtn');if(close)close.textContent=bn()?'পরিবারে ফিরুন':'Back to family';}
  function toast(t){const e=$('landToast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200);}
  function openForm(r=null){editing=r?.id||null;const f=$('landForm'),title=$('landFormTitle');if(!f||!title)return;const x=r||{};title.textContent=bn()?(r?'জমির রেকর্ড সম্পাদনা':'নতুন জমির রেকর্ড'):(r?'Edit land record':'Add land record');
    const fields=['person_id','person_name_en','person_name_bn','record_label','division','district','upazila','mouza','jl_no','survey_type','khatian_no','former_khatian_no','dag_no','former_dag_no','cs_dag_no','sheet_no','area_acre','area_decimal','ownership_share','source_url','map_url','latitude','longitude','notes_en','notes_bn'];for(const k of fields){const el=f.elements[k];if(el)el.value=x[k]??'';}f.elements.record_status.value=x.record_status||'unverified';$('landModalBackdrop').classList.add('show');$('landModal').classList.add('show');}
  function closeForm(){$('landModalBackdrop')?.classList.remove('show');$('landModal')?.classList.remove('show');editing=null;}
  async function saveForm(e){e.preventDefault();const fd=new FormData(e.currentTarget),body={};for(const [k,v] of fd.entries())body[k]=String(v).trim();for(const k of ['area_acre','area_decimal','latitude','longitude'])body[k]=body[k]===''?null:Number(body[k]);for(const k of Object.keys(body))if(body[k]==='')body[k]=null;body.updated_at=new Date().toISOString();
    try{if(editing){await api(`admin_land_records?id=eq.${encodeURIComponent(editing)}`,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(body)});}else{await api('admin_land_records',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(body)});}closeForm();await load();toast(bn()?'রেকর্ড সংরক্ষণ হয়েছে':'Land record saved');}catch(_){toast(bn()?'সংরক্ষণ করা যায়নি':'Could not save record');}}
  function openShell(){$('landShell')?.classList.add('show');document.body.style.overflow='hidden';load();}
  function closeShell(){$('landShell')?.classList.remove('show');document.body.style.overflow='';closeForm();}
  function ensureUI(){if($('landAdminBtn'))return;const dock=$('featureDock')||document.querySelector('.controls');if(!dock)return;const btn=document.createElement('button');btn.id='landAdminBtn';btn.className='feature-btn land-launch';btn.type='button';btn.textContent=bn()?'জায়গা-জমির হিসাব':'Land & Property';btn.onclick=openShell;dock.appendChild(btn);
    document.body.insertAdjacentHTML('beforeend',`<section id="landShell" class="land-shell" aria-label="Private land records"><header class="land-top"><div class="land-brand"><div class="land-mark">LP</div><div><h1>${bn()?'জায়গা-জমির হিসাব':'Land & Property'}<span class="land-private-badge">ADMIN ONLY</span></h1><p>${bn()?'খতিয়ান · দাগ · মৌজা · ম্যাপ · মালিকানা হিসাব':'Khatian · Dag · Mouza · Map · Ownership records'}</p></div></div><div class="land-actions"><a target="_blank" rel="noopener" href="https://settlement.gov.bd/khatian/search">${bn()?'খতিয়ান যাচাই':'Khatian search'}</a><a target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">${bn()?'মৌজা ম্যাপ':'Mouza map'}</a><button id="landAddBtn" class="primary" type="button"></button><button id="landCloseBtn" type="button"></button></div></header><div class="land-grid"><aside class="land-panel land-sidebar"><div class="land-filter"><input id="landSearch" type="search" placeholder="${bn()?'নাম, খতিয়ান, দাগ খুঁজুন…':'Search name, khatian, dag…'}"><div class="land-filter-row"><select id="landPersonFilter"></select><select id="landMouzaFilter"></select></div><select id="landSurveyFilter"></select></div><div id="landSummary" class="land-summary"></div><div id="landList" class="land-list"></div></aside><section class="land-panel land-map-panel"><div id="landMapWrap" class="land-map-wrap"></div><div class="land-portal-row"><a class="land-btn" target="_blank" rel="noopener" href="https://settlement.gov.bd/khatian/search">settlement.gov.bd</a><a class="land-btn" target="_blank" rel="noopener" href="https://map.settlement.gov.bd/">map.settlement.gov.bd</a></div></section><aside class="land-panel land-detail-panel"><div id="landDetail" class="land-detail"></div></aside></div></section><div id="landModalBackdrop" class="land-modal-backdrop"></div><section id="landModal" class="land-modal"><div class="land-modal-head"><h2 id="landFormTitle"></h2><button id="landFormClose" class="land-btn" type="button">×</button></div><form id="landForm" class="land-form"><label>Person ID<input name="person_id"></label><label>Record label<input name="record_label"></label><label>English person name<input name="person_name_en"></label><label>বাংলা নাম<input name="person_name_bn"></label><label>Division<input name="division" value="Chattogram"></label><label>District<input name="district" value="Noakhali"></label><label>Upazila / Thana<input name="upazila" value="Chatkhil"></label><label>Mouza<input name="mouza"></label><label>JL No.<input name="jl_no"></label><label>Survey type<input name="survey_type" placeholder="CS / SA / RS / BRS"></label><label>Khatian No.<input name="khatian_no"></label><label>Former khatian<input name="former_khatian_no"></label><label>Dag No.<input name="dag_no"></label><label>Former dag<input name="former_dag_no"></label><label>CS Dag<input name="cs_dag_no"></label><label>Sheet No.<input name="sheet_no"></label><label>Area (acre)<input name="area_acre" inputmode="decimal"></label><label>Area (decimal/শতক)<input name="area_decimal" inputmode="decimal"></label><label>Ownership share<input name="ownership_share"></label><label>Verification<select name="record_status"><option value="unverified">Unverified</option><option value="family-confirmed">Family confirmed</option><option value="government-verified">Government verified</option></select></label><label class="full">Source URL<input name="source_url"></label><label class="full">Map URL<input name="map_url"></label><label>Latitude<input name="latitude" inputmode="decimal"></label><label>Longitude<input name="longitude" inputmode="decimal"></label><label class="full">Notes (English)<textarea name="notes_en"></textarea></label><label class="full">নোট (বাংলা)<textarea name="notes_bn"></textarea></label><div class="land-form-actions"><button class="land-btn" id="landCancelForm" type="button">Cancel</button><button class="land-btn primary" type="submit">Save</button></div></form></section><div id="landToast" class="land-toast"></div>`);
    $('landCloseBtn').onclick=closeShell;$('landAddBtn').onclick=()=>openForm();$('landFormClose').onclick=closeForm;$('landCancelForm').onclick=closeForm;$('landModalBackdrop').onclick=closeForm;$('landForm').onsubmit=saveForm;
    for(const id of ['landSearch','landPersonFilter','landMouzaFilter','landSurveyFilter'])$(id).addEventListener(id==='landSearch'?'input':'change',renderList);
  }
  function destroyUI(){closeShell();$('landAdminBtn')?.remove();$('landShell')?.remove();$('landModalBackdrop')?.remove();$('landModal')?.remove();$('landToast')?.remove();records=[];locations=[];selected=null;}
  async function check(){const status=$('cloudStatusBtn');if(!status)return;if(!status.classList.contains('admin')){destroyUI();return;}ensureUI();}
  function watch(){const attach=()=>{const status=$('cloudStatusBtn');if(!status){setTimeout(attach,400);return;}if(watcher)watcher.disconnect();watcher=new MutationObserver(check);watcher.observe(status,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});check();};attach();}
  document.addEventListener('click',e=>{if(e.target.closest('.lang-btn'))setTimeout(()=>{if($('landShell')){destroyUI();check();}},100);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();