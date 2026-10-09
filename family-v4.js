(() => {
  const $ = id => document.getElementById(id);
  const lang = () => document.documentElement.lang === 'bn' ? 'bn' : 'en';
  const esc = (v='') => String(v).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
  const csvEsc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const text = {
    en:{tools:'More Tools',title:'Family Utilities',sub:'Printing, exports, data-quality checks and gathering helpers.',printTree:'Print full tree',printPerson:'Print person profile',exportCsv:'Export people CSV',audit:'Run data audit',template:'Download update template',copyLink:'Copy gathering link',history:'Family history',story:'Story / notes',quick:'Quick actions',suggest:'Suggest update',relation:'Find relationship',installed:'Offline support is ready after the site has been opened once.',auditTitle:'Data quality summary',missingPhoto:'Missing photos',missingParents:'People with incomplete recorded parents',unnamed:'Unnamed / placeholder entries',duplicates:'Repeated English display names',missingSpouse:'Recorded child groups without a spouse name',people:'People',generation:'Generation',father:'Father',mother:'Mother',spouses:'Spouse(s)',children:'Children',notRecorded:'Not recorded',copyDone:'Link copied',openProfileFirst:'Open a family profile first.',profile:'Family profile',download:'Download',close:'Close'},
    bn:{tools:'আরও টুলস',title:'পারিবারিক ইউটিলিটি',sub:'প্রিন্ট, এক্সপোর্ট, ডেটা যাচাই ও পারিবারিক সমাবেশের সহায়ক টুল।',printTree:'পুরো বৃক্ষ প্রিন্ট',printPerson:'ব্যক্তির পরিচয় প্রিন্ট',exportCsv:'সদস্যদের CSV এক্সপোর্ট',audit:'ডেটা যাচাই',template:'আপডেট টেমপ্লেট ডাউনলোড',copyLink:'সমাবেশের লিংক কপি',history:'পারিবারিক ইতিহাস',story:'গল্প / নোট',quick:'দ্রুত কাজ',suggest:'তথ্য সংশোধনের প্রস্তাব',relation:'সম্পর্ক খুঁজুন',installed:'সাইটটি একবার খুললে অফলাইন ব্যবহারের জন্য প্রস্তুত থাকবে।',auditTitle:'ডেটা মান যাচাই',missingPhoto:'যাদের ছবি নেই',missingParents:'যাদের পিতা/মাতার তথ্য অসম্পূর্ণ',unnamed:'নামহীন / প্লেসহোল্ডার এন্ট্রি',duplicates:'একই ইংরেজি নাম একাধিকবার',missingSpouse:'সন্তানের শাখা আছে কিন্তু স্বামী/স্ত্রীর নাম নেই',people:'ব্যক্তি',generation:'প্রজন্ম',father:'পিতা',mother:'মাতা',spouses:'স্বামী/স্ত্রী',children:'সন্তান',notRecorded:'নথিভুক্ত নেই',copyDone:'লিংক কপি হয়েছে',openProfileFirst:'প্রথমে একজনের পরিচয় খুলুন।',profile:'পারিবারিক পরিচয়',download:'ডাউনলোড',close:'বন্ধ করুন'}
  };
  const t = k => text[lang()][k] || k;

  function buildRoot(){
    const n=familyData.rootTrail.find(p=>p.id==='nayeb-chowdhury')||familyData.rootTrail.find(p=>p.id==='nayer-chowdhury')||familyData.rootTrail.find(p=>p.type==='person')||familyData.rootTrail[0];
    const c=familyData.rootTrail.find(p=>p.id==='chan-gazi-hawladar')||familyData.rootTrail.find(p=>p.en?.includes('Chan Gazi'));
    return {...n,children:[{...c,children:[familyData.main,familyData.secondary]}]};
  }
  const root=buildRoot(), people=[], byId=new Map(), parentById=new Map(), depthById=new Map(), parentsById=new Map(), kidsById=new Map();
  const female=p=>String(p?.relationEn||'').toLowerCase()==='daughter'||/মেয়ে|মেয়ে/.test(String(p?.relationBn||''));
  const unknown=(en='',bn='')=>/name (not recorded|unknown)/i.test(en)||/নাম (নথিভুক্ত নেই|অজানা)/.test(bn);
  const pref=p=>p?{id:p.id||null,en:p.en||'',bn:p.bn||''}:null;
  const sref=s=>{if(!s)return null;const en=s.en||s.spouseEn||'',bn=s.bn||s.spouseBn||'';return(!en&&!bn)||unknown(en,bn)?null:{id:null,en,bn};};
  function index(p,parent=null,depth=1,parents=null){
    if(!p?.id)return;
    if(!byId.has(p.id)){people.push(p);byId.set(p.id,p);} depthById.set(p.id,depth); if(parent) parentById.set(p.id,parent); if(parents) parentsById.set(p.id,parents);
    const kids=[]; kidsById.set(p.id,kids); const isFemale=female(p), spouse=(p.spouses||[]).length===1?sref(p.spouses[0]):null;
    (p.children||[]).forEach(ch=>{kids.push(ch.id); index(ch,p,depth+1,isFemale?{father:spouse,mother:pref(p)}:{father:pref(p),mother:spouse});});
    (p.spouseGroups||[]).forEach(g=>{const sr=sref(g); (g.children||[]).forEach(ch=>{kids.push(ch.id); index(ch,p,depth+1,isFemale?{father:sr,mother:pref(p)}:{father:pref(p),mother:sr});});});
  }
  index(root);
  const name=p=>lang()==='bn'?(p?.bn||p?.en||''):(p?.en||p?.bn||'');
  const photo=p=>p?.photoUrl||p?.photo||p?.image||'';
  const spouseNames=p=>[...(p.spouses||[]).map(s=>lang()==='bn'?(s.bn||s.en):(s.en||s.bn)),...(p.spouseGroups||[]).map(g=>lang()==='bn'?(g.spouseBn||g.spouseEn):(g.spouseEn||g.spouseBn))].filter(Boolean).filter(x=>!unknown(x,x));
  const selectedId=()=>document.querySelector('#profileContent [data-focus-person]')?.dataset.focusPerson||new URLSearchParams(location.hash.replace(/^#/,'')).get('person')||'';

  function downloadFile(name,content,type='text/plain;charset=utf-8'){
    const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function toast(msg){const el=$('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1600);}
  function copy(text){navigator.clipboard?.writeText(text).then(()=>toast(t('copyDone'))).catch(()=>prompt('Copy',text));}

  function csv(){
    const rows=[['id','english_name','bangla_name','generation','father','mother','spouses','children','birth','death','location','occupation','photo_url']];
    people.forEach(p=>{const pr=parentsById.get(p.id)||{}, ref=r=>r?(r.en||r.bn||''):'', kids=(kidsById.get(p.id)||[]).map(id=>byId.get(id)?.en||'').filter(Boolean).join(' | '); rows.push([p.id,p.en||'',p.bn||'',depthById.get(p.id)||'',ref(pr.father),ref(pr.mother),spouseNames(p).join(' | '),kids,p.birth||p.birthYear||'',p.death||p.deathYear||'',p.locationEn||p.location||'',p.occupationEn||p.occupation||'',photo(p)]);});
    return '\ufeff'+rows.map(r=>r.map(csvEsc).join(',')).join('\n');
  }
  function updateTemplate(){
    const rows=[['person_id','english_name','bangla_name','field_to_update','current_value','correct_value','source_or_note','submitted_by'],['example-person','Example Name','উদাহরণ নাম','spouse','','Spouse Name','Family confirmation','Your name']];
    return '\ufeff'+rows.map(r=>r.map(csvEsc).join(',')).join('\n');
  }
  function auditData(){
    const duplicateMap=new Map(); people.forEach(p=>{const k=(p.en||'').trim().toLowerCase();if(k){if(!duplicateMap.has(k))duplicateMap.set(k,[]);duplicateMap.get(k).push(p);}});
    const duplicates=[...duplicateMap.values()].filter(x=>x.length>1);
    const missingPhotos=people.filter(p=>!photo(p));
    const incompleteParents=people.filter(p=>{if(depthById.get(p.id)<=2)return false;const pr=parentsById.get(p.id);return !pr||!pr.father||!pr.mother;});
    const unnamed=people.filter(p=>p.placeholder||unknown(p.en||'',p.bn||'')||/name not recorded/i.test(p.en||''));
    const missingSpouse=people.filter(p=>(p.spouseGroups||[]).some(g=>!sref(g)&&(g.children||[]).length));
    return {duplicates,missingPhotos,incompleteParents,unnamed,missingSpouse};
  }

  function ensureTools(){
    const dock=$('featureDock'); if(!dock||$('finishToolsBtn'))return;
    const b=document.createElement('button'); b.id='finishToolsBtn';b.className='feature-btn';b.type='button';b.textContent=t('tools');dock.appendChild(b);
    b.addEventListener('click',openTools);
  }
  function openTools(){
    let back=$('finishBackdrop'), modal=$('finishModal');
    if(!back){back=document.createElement('div');back.id='finishBackdrop';back.className='finish-backdrop';document.body.appendChild(back);back.addEventListener('click',closeTools);}
    if(!modal){modal=document.createElement('section');modal.id='finishModal';modal.className='finish-modal';document.body.appendChild(modal);}
    const a=auditData();
    modal.innerHTML=`<div class="finish-head"><div><h2>${esc(t('title'))}</h2><p>${esc(t('sub'))}</p></div><button id="finishClose" type="button">×</button></div><div class="finish-body">
      <div class="finish-grid">
        <button data-finish="print-tree">🖨️ <b>${esc(t('printTree'))}</b></button>
        <button data-finish="print-person">📄 <b>${esc(t('printPerson'))}</b></button>
        <button data-finish="csv">⬇️ <b>${esc(t('exportCsv'))}</b></button>
        <button data-finish="template">🧾 <b>${esc(t('template'))}</b></button>
        <button data-finish="copy-link">🔗 <b>${esc(t('copyLink'))}</b></button>
      </div>
      <div class="audit-card"><h3>${esc(t('auditTitle'))}</h3><div class="audit-stats">
        <span><b>${people.length}</b>${esc(t('people'))}</span><span><b>${a.missingPhotos.length}</b>${esc(t('missingPhoto'))}</span><span><b>${a.incompleteParents.length}</b>${esc(t('missingParents'))}</span><span><b>${a.unnamed.length}</b>${esc(t('unnamed'))}</span><span><b>${a.duplicates.length}</b>${esc(t('duplicates'))}</span><span><b>${a.missingSpouse.length}</b>${esc(t('missingSpouse'))}</span>
      </div></div><p class="offline-note">${esc(t('installed'))}</p></div>`;
    modal.querySelector('#finishClose').addEventListener('click',closeTools);
    modal.querySelectorAll('[data-finish]').forEach(btn=>btn.addEventListener('click',()=>handleTool(btn.dataset.finish)));
    back.classList.add('show');modal.classList.add('show');
  }
  function closeTools(){$('finishBackdrop')?.classList.remove('show');$('finishModal')?.classList.remove('show');}
  function handleTool(action){
    if(action==='print-tree'){closeTools();setTimeout(()=>window.print(),100);}
    if(action==='csv')downloadFile('family-tree-people.csv',csv(),'text/csv;charset=utf-8');
    if(action==='template')downloadFile('family-update-template.csv',updateTemplate(),'text/csv;charset=utf-8');
    if(action==='copy-link')copy(location.origin+location.pathname);
    if(action==='print-person'){const id=selectedId();if(!id||!byId.has(id)){toast(t('openProfileFirst'));return;}printPerson(id);}
  }

  function printPerson(id){
    const p=byId.get(id), pr=parentsById.get(id)||{}, kids=(kidsById.get(id)||[]).map(x=>byId.get(x)).filter(Boolean), sp=spouseNames(p);
    const ref=r=>r?(lang()==='bn'?(r.bn||r.en):(r.en||r.bn)):t('notRecorded');
    const story=lang()==='bn'?(p.storyBn||p.historyBn||p.noteBn||''):(p.storyEn||p.historyEn||p.noteEn||'');
    const w=window.open('','_blank');if(!w)return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(name(p))}</title><style>body{font-family:Arial,'Noto Sans Bengali',sans-serif;margin:38px;color:#172033}h1{margin-bottom:4px}.muted{color:#6d7684}.box{border:1px solid #ddd;border-radius:14px;padding:18px;margin-top:18px}.row{display:grid;grid-template-columns:120px 1fr;padding:7px 0;border-bottom:1px solid #eee}.row:last-child{border:0}.chips{display:flex;flex-wrap:wrap;gap:7px}.chip{border:1px solid #ddd;border-radius:999px;padding:6px 9px}@media print{button{display:none}}</style></head><body><button onclick="print()">Print</button><h1>${esc(name(p))}</h1><div class="muted">${esc(t('generation'))} ${depthById.get(id)}</div><div class="box"><div class="row"><b>${esc(t('father'))}</b><span>${esc(ref(pr.father))}</span></div><div class="row"><b>${esc(t('mother'))}</b><span>${esc(ref(pr.mother))}</span></div><div class="row"><b>${esc(t('spouses'))}</b><span>${esc(sp.join(', ')||t('notRecorded'))}</span></div><div class="row"><b>${esc(t('children'))}</b><div class="chips">${kids.length?kids.map(k=>`<span class="chip">${esc(name(k))}</span>`).join(''):esc(t('notRecorded'))}</div></div></div>${story?`<div class="box"><h3>${esc(t('history'))}</h3><p>${esc(story)}</p></div>`:''}<p class="muted">${esc(location.origin+location.pathname+'#person='+encodeURIComponent(id))}</p></body></html>`);w.document.close();
  }

  function enrichProfile(){
    const content=$('profileContent'); if(!content)return;
    const id=selectedId(), p=byId.get(id); if(!p)return;
    const body=content.querySelector('.profile-body'); if(!body||body.querySelector('.finish-profile-tools'))return;
    const story=lang()==='bn'?(p.storyBn||p.historyBn||''):(p.storyEn||p.historyEn||'');
    if(story){const sec=document.createElement('div');sec.className='finish-history';sec.innerHTML=`<span>${esc(t('history'))}</span><p>${esc(story)}</p>`;body.appendChild(sec);}
    const tools=document.createElement('div');tools.className='finish-profile-tools';tools.innerHTML=`<div class="finish-profile-title">${esc(t('quick'))}</div><div><button data-q="print">🖨️ ${esc(t('printPerson'))}</button><button data-q="suggest">✏️ ${esc(t('suggest'))}</button><button data-q="relation">↔ ${esc(t('relation'))}</button></div>`;body.appendChild(tools);
    tools.addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(!b)return;if(b.dataset.q==='print')printPerson(id);if(b.dataset.q==='suggest'){$('[data-open-modal="correctionModal"]')?.click();setTimeout(()=>{const s=$('correctionPerson');if(s)s.value=id;},80);}if(b.dataset.q==='relation'){$('[data-open-modal="relationshipModal"]')?.click();setTimeout(()=>{const a=$('relationshipA')||$('relPersonA');if(a)a.value=id;},80);}});
  }

  function registerSW(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});}
  function relabel(){const b=$('finishToolsBtn');if(b)b.textContent=t('tools');}
  function boot(){ensureTools();enrichProfile();registerSW();new MutationObserver(()=>{ensureTools();enrichProfile();relabel();}).observe(document.body,{childList:true,subtree:true});document.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{relabel();enrichProfile();},50)));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();