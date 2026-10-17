(() => {
  'use strict';
  const cfg=window.FAMILY_BACKEND_CONFIG||{};
  if(!cfg.enabled||!cfg.supabaseUrl||!cfg.supabaseAnonKey)return;
  const $=id=>document.getElementById(id);
  const bn=()=>document.documentElement.lang==='bn';
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function authToken(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);if(!key||!/^sb-.*-auth-token$/.test(key))continue;
        const raw=localStorage.getItem(key);if(!raw)continue;
        const obj=JSON.parse(raw);
        const dig=v=>{if(!v||typeof v!=='object')return null;if(typeof v.access_token==='string')return v.access_token;if(Array.isArray(v)){for(const x of v){const h=dig(x);if(h)return h;}}else{for(const x of Object.values(v)){const h=dig(x);if(h)return h;}}return null;};
        const t=dig(obj);if(t)return t;
      }
    }catch(_){ }
    return null;
  }
  async function fetchRecord(id){
    if(!id)return null;const token=authToken();if(!token)return null;
    try{
      const res=await fetch(`${cfg.supabaseUrl}/rest/v1/admin_land_records?id=eq.${encodeURIComponent(id)}&select=*`,{headers:{apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${token}`,Accept:'application/json'}});
      if(!res.ok)return null;const rows=await res.json();return Array.isArray(rows)?rows[0]||null:null;
    }catch(_){return null;}
  }
  function glossaryHtml(){
    return bn()?`<section class="land-terms" id="landTerms"><div><b>সহজ জমির শব্দ</b><span>পরিবারের হিসাব বুঝতে</span></div><div class="land-term-grid"><span><strong>ডিসিম / ডিসিমেল / শতক</strong><small>একই ক্ষেত্রফল একক · ১ শতক = ০.০১ একর</small></span><span><strong>খতিয়ান / পর্চা</strong><small>Record of Rights; দলিল নয়</small></span><span><strong>দাগ</strong><small>মৌজার নির্দিষ্ট প্লট নম্বর</small></span><span><strong>দলিল</strong><small>ক্রয়/দান/হেবা/বণ্টন ইত্যাদির নিবন্ধিত দলিল</small></span><span><strong>নামজারি</strong><small>হস্তান্তর/উত্তরাধিকারের পর রাজস্ব রেকর্ড হালনাগাদ</small></span><span><strong>Certified Copy</strong><small>সাব-রেজিস্ট্রি অফিস থেকে প্রত্যয়িত দলিলের নকল</small></span></div></section>`:
    `<section class="land-terms" id="landTerms"><div><b>Land terms</b><span>Easy family হিসাব guide</span></div><div class="land-term-grid"><span><strong>Disim / Decimal / Shotok</strong><small>Same area unit · 1 decimal = 1 shotok = 0.01 acre</small></span><span><strong>Khatian / Porcha</strong><small>Record of Rights; it is not the deed itself</small></span><span><strong>Dag</strong><small>Numbered survey plot within a mouza</small></span><span><strong>Dolil / Deed</strong><small>Registered sale/gift/heba/partition document</small></span><span><strong>Mutation / Namjari</strong><small>Revenue-record update after transfer or inheritance</small></span><span><strong>Certified Copy</strong><small>Official copy issued from the Sub-Registry record</small></span></div></section>`;
  }
  function ensureGlossary(){
    const shell=$('landShell');if(!shell||$('landTerms'))return;
    const main=shell.querySelector('.land-main');if(main)main.insertAdjacentHTML('afterbegin',glossaryHtml());
  }
  function ensureFormFields(){
    const form=$('landForm');if(!form||form.querySelector('[data-land-deed-extra]'))return;
    const actions=form.querySelector('.land-form-actions,.land-edit-actions');
    const html=`<fieldset class="land-deed-extra" data-land-deed-extra><legend>${bn()?'দলিল / সার্টিফাইড কপি':'Deed / certified copy'}</legend>
      <label>${bn()?'দলিলের ধরন':'Deed type'}<input name="deed_type" placeholder="Sale / Saf Kabala / Hiba / Partition"></label>
      <label>${bn()?'দলিল নম্বর':'Deed number'}<input name="deed_no"></label>
      <label>${bn()?'দলিলের তারিখ':'Deed date'}<input name="deed_date" type="date"></label>
      <label>${bn()?'সাব-রেজিস্ট্রি অফিস':'Sub-Registry Office'}<input name="sub_registry_office" placeholder="Chatkhil, Noakhali"></label>
      <label class="wide">${bn()?'সার্টিফাইড কপির URL':'Certified-copy URL'}<input name="certified_copy_url" type="url"></label>
      <label class="wide">${bn()?'মৌজার বাংলা নাম':'Mouza (Bangla)'}<input name="mouza_bn"></label>
      <label class="wide">${bn()?'মৌজার অন্য বানান / alias':'Mouza aliases'}<input name="mouza_aliases" placeholder="Vhimpur; Bhimpur; ভীমপুর"></label>
      <label class="wide">${bn()?'যাচাই নোট (বাংলা)':'Verification note (Bangla)'}<textarea name="verification_notes_bn"></textarea></label>
      <label class="wide">${bn()?'যাচাই নোট (English)':'Verification note (English)'}<textarea name="verification_notes_en"></textarea></label>
    </fieldset>`;
    if(actions)actions.insertAdjacentHTML('beforebegin',html);else form.insertAdjacentHTML('beforeend',html);
  }
  async function appendExtendedDetail(){
    const detail=$('landDetail');if(!detail||detail.querySelector('.land-doc-details'))return;
    const active=document.querySelector('.land-record.active');const id=active?.dataset?.id;if(!id)return;
    const r=await fetchRecord(id);if(!r||!document.body.contains(detail)||detail.querySelector('.land-doc-details'))return;
    const rows=[];
    const add=(label,val)=>{if(val!==null&&val!==undefined&&String(val)!=='')rows.push(`<div class="land-kv"><span>${esc(label)}</span><b>${esc(val)}</b></div>`);};
    add(bn()?'মৌজা (বাংলা)':'Mouza (Bangla)',r.mouza_bn);
    add(bn()?'মৌজার alias':'Mouza aliases',r.mouza_aliases);
    add(bn()?'দলিলের ধরন':'Deed type',r.deed_type);
    add(bn()?'দলিল নম্বর':'Deed no.',r.deed_no);
    add(bn()?'দলিলের তারিখ':'Deed date',r.deed_date);
    add(bn()?'সাব-রেজিস্ট্রি অফিস':'Sub-Registry Office',r.sub_registry_office);
    const verification=bn()?(r.verification_notes_bn||r.verification_notes_en):(r.verification_notes_en||r.verification_notes_bn);
    let extra=`<section class="land-doc-details"><h3>${bn()?'দলিল ও যাচাই':'Deed & verification'}</h3>${rows.join('')}`;
    if(verification)extra+=`<div class="land-note">${esc(verification)}</div>`;
    if(r.certified_copy_url)extra+=`<a class="land-btn" target="_blank" rel="noopener" href="${esc(r.certified_copy_url)}">${bn()?'Certified Copy খুলুন':'Open certified copy'}</a>`;
    extra+='</section>';
    detail.insertAdjacentHTML('beforeend',extra);
  }
  function hydrateForm(){
    const form=$('landForm');if(!form)return;
    const active=document.querySelector('.land-record.active');const id=active?.dataset?.id;
    if(!id)return;
    fetchRecord(id).then(r=>{if(!r||!form.isConnected)return;for(const k of ['deed_type','deed_no','deed_date','sub_registry_office','certified_copy_url','mouza_bn','mouza_aliases','verification_notes_bn','verification_notes_en']){const el=form.elements[k];if(el)el.value=r[k]??'';}});
  }
  function tick(){ensureGlossary();ensureFormFields();appendExtendedDetail();}
  const obs=new MutationObserver(()=>{tick();if($('landModal')?.classList.contains('show'))setTimeout(hydrateForm,0);});
  obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',e=>{if(e.target.closest('.lang-btn'))setTimeout(()=>{const t=$('landTerms');if(t)t.outerHTML=glossaryHtml();},100);if(e.target.closest('#landAddBtn'))setTimeout(()=>{ensureFormFields();},0);if(e.target.closest('#landEditRecord'))setTimeout(()=>{ensureFormFields();hydrateForm();},0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();
})();