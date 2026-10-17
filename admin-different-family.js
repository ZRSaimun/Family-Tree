(() => {
  'use strict';

  const cfg = window.FAMILY_BACKEND_CONFIG || {};
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const $ = id => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang = () => document.documentElement.lang === 'bn' ? 'bn' : 'en';

  let record = null;
  let watcher = null;
  let active = false;
  let scale = .82;
  let drag = null;
  let selectedPath = null;

  function authToken(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(!key || !/^sb-.*-auth-token$/.test(key)) continue;
        const raw=localStorage.getItem(key);
        if(!raw) continue;
        const parsed=JSON.parse(raw);
        const findToken=v=>{
          if(!v || typeof v!=='object') return null;
          if(typeof v.access_token==='string') return v.access_token;
          if(Array.isArray(v)){
            for(const x of v){const hit=findToken(x);if(hit)return hit;}
          } else {
            for(const x of Object.values(v)){const hit=findToken(x);if(hit)return hit;}
          }
          return null;
        };
        const token=findToken(parsed);
        if(token) return token;
      }
    }catch(_){ }
    return null;
  }

  async function fetchPrivateTree(){
    const token=authToken();
    if(!token) return null;
    try{
      const url=`${cfg.supabaseUrl}/rest/v1/admin_family_trees?slug=eq.different-family&select=slug,label_en,label_bn,data,updated_at`;
      const res=await fetch(url,{headers:{apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${token}`,Accept:'application/json'}});
      if(!res.ok) return null;
      const rows=await res.json();
      return Array.isArray(rows)?rows[0]||null:null;
    }catch(_){return null;}
  }

  function nameOf(p){return lang()==='bn'?(p?.bn||p?.en||''):(p?.en||p?.bn||'');}
  function noteOf(p){return lang()==='bn'?(p?.noteBn||p?.noteEn||''):(p?.noteEn||p?.noteBn||'');}
  function unclearOf(p){return lang()==='bn'?(p?.sourceUnclearBn||p?.sourceUnclearEn||''):(p?.sourceUnclearEn||p?.sourceUnclearBn||'');}
  function countPeople(p){return 1+(p?.children||[]).reduce((n,c)=>n+countPeople(c),0);}
  function initials(name){const bits=String(name||'?').trim().split(/\s+/).filter(Boolean);return (bits.slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase();}

  function getPerson(path){
    if(!record?.data || !path) return null;
    const bits=String(path).split('.').map(Number);
    const branch=record.data.branches?.[bits.shift()];
    let p=branch?.root||null;
    for(const idx of bits) p=p?.children?.[idx]||null;
    return p;
  }

  function personHtml(p,depth=0,path='0'){
    const kids=p.children||[];
    const relation=lang()==='bn'?(p.relationBn||''):(p.relationEn||'');
    const note=noteOf(p), unclear=unclearOf(p), name=nameOf(p);
    return `<div class="df-tree-node" style="--df-depth:${depth}">
      <button class="df-card" type="button" data-df-path="${esc(path)}" aria-label="${esc(name)}">
        <span class="df-avatar">${esc(initials(name))}</span>
        <span class="df-card-copy"><b>${esc(name)}</b>${relation?`<small>${esc(relation)}</small>`:''}${note?`<p>${esc(note)}</p>`:''}${unclear?`<span class="df-unconfirmed">${esc(lang()==='bn'?'নিশ্চিত নয়: ':'Needs confirmation: ')}${esc(unclear)}</span>`:''}</span>
      </button>
      ${kids.length?`<div class="df-child-row">${kids.map((c,i)=>personHtml(c,depth+1,`${path}.${i}`)).join('')}</div>`:''}
    </div>`;
  }

  function branchHtml(branch,branchIndex){
    const title=lang()==='bn'?(branch.titleBn||branch.titleEn):(branch.titleEn||branch.titleBn);
    const total=branch.root?countPeople(branch.root):0;
    return `<section class="df-root-group"><div class="df-root-label"><b>${esc(title||'')}</b><span>${total} ${esc(lang()==='bn'?'জন নথিভুক্ত ব্যক্তি':'recorded people')}</span></div>${branch.root?personHtml(branch.root,0,String(branchIndex)):''}</section>`;
  }

  function applyZoom(){
    const world=$('dfWorld');
    if(world) world.style.zoom=String(scale);
    const out=$('dfZoomReadout');
    if(out) out.textContent=`${Math.round(scale*100)}%`;
  }

  function fit(){
    const viewport=$('dfViewport'), world=$('dfWorld'), stage=$('dfStage');
    if(!viewport||!world||!stage) return;
    drag=null;viewport.classList.remove('dragging');
    world.style.zoom='1';
    requestAnimationFrame(()=>{
      const sw=Math.max(stage.scrollWidth,stage.offsetWidth,1);
      const sh=Math.max(stage.scrollHeight,stage.offsetHeight,1);
      const vw=Math.max(240,viewport.clientWidth-36);
      const vh=Math.max(240,viewport.clientHeight-36);
      scale=Math.max(.32,Math.min(1,vw/sw,vh/sh));
      applyZoom();
      requestAnimationFrame(()=>{
        viewport.scrollLeft=Math.max(0,(viewport.scrollWidth-viewport.clientWidth)/2);
        viewport.scrollTop=0;
      });
    });
  }

  function zoom(delta){
    const viewport=$('dfViewport');
    if(!viewport) return;
    const cx=(viewport.scrollLeft+viewport.clientWidth/2)/scale;
    const cy=(viewport.scrollTop+viewport.clientHeight/2)/scale;
    scale=Math.max(.32,Math.min(1.7,scale+delta));
    applyZoom();
    requestAnimationFrame(()=>{
      viewport.scrollLeft=Math.max(0,cx*scale-viewport.clientWidth/2);
      viewport.scrollTop=Math.max(0,cy*scale-viewport.clientHeight/2);
    });
  }

  function closeProfile(){
    selectedPath=null;
    $('dfProfileBackdrop')?.classList.remove('show');
    $('dfProfile')?.classList.remove('open');
    $('dfProfile')?.setAttribute('aria-hidden','true');
  }

  function profileDetails(p){
    const bn=lang()==='bn';
    const rows=[];
    if(p.en) rows.push(`<div class="df-profile-row"><span>English</span><b>${esc(p.en)}</b></div>`);
    if(p.bn) rows.push(`<div class="df-profile-row"><span>বাংলা</span><b>${esc(p.bn)}</b></div>`);
    const relation=bn?(p.relationBn||p.relationEn):(p.relationEn||p.relationBn);
    if(relation) rows.push(`<div class="df-profile-row"><span>${bn?'সম্পর্ক':'Relation'}</span><b>${esc(relation)}</b></div>`);
    const note=noteOf(p); if(note) rows.push(`<div class="df-profile-note"><span>${bn?'তথ্য':'Details'}</span><p>${esc(note)}</p></div>`);
    const uncertain=unclearOf(p); if(uncertain) rows.push(`<div class="df-profile-note warn"><span>${bn?'নিশ্চিতকরণ প্রয়োজন':'Needs confirmation'}</span><p>${esc(uncertain)}</p></div>`);
    rows.push(`<div class="df-profile-row"><span>${bn?'সন্তান':'Children'}</span><b>${(p.children||[]).length}</b></div>`);
    return rows.join('');
  }

  function openProfile(path){
    const p=getPerson(path); if(!p) return;
    selectedPath=path;
    const bn=lang()==='bn';
    $('dfProfileContent').innerHTML=`<div class="df-profile-hero"><div class="df-profile-avatar">${esc(initials(nameOf(p)))}</div><div><span>${bn?'পৃথক পরিবারের সদস্য':'Different Family member'}</span><h2>${esc(nameOf(p))}</h2></div></div><div class="df-profile-body">${profileDetails(p)}<div class="df-profile-actions"><button id="dfEditPerson" type="button">${bn?'সম্পাদনা':'Edit details'}</button></div></div>`;
    $('dfEditPerson').onclick=()=>editProfile(path);
    $('dfProfileBackdrop').classList.add('show');
    $('dfProfile').classList.add('open');
    $('dfProfile').setAttribute('aria-hidden','false');
  }

  function editProfile(path){
    const p=getPerson(path); if(!p) return;
    const bn=lang()==='bn';
    $('dfProfileContent').innerHTML=`<div class="df-profile-hero"><div class="df-profile-avatar">${esc(initials(nameOf(p)))}</div><div><span>ADMIN EDIT</span><h2>${esc(nameOf(p))}</h2></div></div><form id="dfEditForm" class="df-edit-form">
      <label>English name<input name="en" value="${esc(p.en||'')}"></label>
      <label>বাংলা নাম<input name="bn" value="${esc(p.bn||'')}"></label>
      <label>Relation (English)<input name="relationEn" value="${esc(p.relationEn||'')}"></label>
      <label>সম্পর্ক (বাংলা)<input name="relationBn" value="${esc(p.relationBn||'')}"></label>
      <label>Details (English)<textarea name="noteEn">${esc(p.noteEn||'')}</textarea></label>
      <label>তথ্য (বাংলা)<textarea name="noteBn">${esc(p.noteBn||'')}</textarea></label>
      <label>Needs confirmation (English)<textarea name="sourceUnclearEn">${esc(p.sourceUnclearEn||'')}</textarea></label>
      <label>নিশ্চিতকরণ প্রয়োজন (বাংলা)<textarea name="sourceUnclearBn">${esc(p.sourceUnclearBn||'')}</textarea></label>
      <div class="df-edit-actions"><button type="button" id="dfCancelEdit">${bn?'বাতিল':'Cancel'}</button><button type="submit" class="primary">${bn?'সংরক্ষণ':'Save changes'}</button></div>
    </form>`;
    $('dfCancelEdit').onclick=()=>openProfile(path);
    $('dfEditForm').onsubmit=async e=>{
      e.preventDefault();
      const fd=new FormData(e.currentTarget);
      for(const key of ['en','bn','relationEn','relationBn','noteEn','noteBn','sourceUnclearEn','sourceUnclearBn']) p[key]=String(fd.get(key)||'').trim();
      const submit=e.currentTarget.querySelector('button[type="submit"]'); submit.disabled=true; submit.textContent=bn?'সংরক্ষণ হচ্ছে…':'Saving…';
      const ok=await savePrivateTree();
      if(ok){render(false);openProfile(path);}else{submit.disabled=false;submit.textContent=bn?'সংরক্ষণ':'Save changes';alert(bn?'সংরক্ষণ করা যায়নি। আবার লগইন করে চেষ্টা করুন।':'Could not save. Please sign in again and retry.');}
    };
  }

  async function savePrivateTree(){
    const token=authToken(); if(!token||!record) return false;
    try{
      const url=`${cfg.supabaseUrl}/rest/v1/admin_family_trees?slug=eq.different-family`;
      const res=await fetch(url,{method:'PATCH',headers:{apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({data:record.data,updated_at:new Date().toISOString()})});
      if(!res.ok) return false;
      const rows=await res.json(); if(Array.isArray(rows)&&rows[0]) record=rows[0];
      return true;
    }catch(_){return false;}
  }

  function render(doFit=true){
    if(!record?.data || !$('dfWorkspace')) return;
    const d=record.data,bn=lang()==='bn';
    const title=bn?(d.titleBn||record.label_bn):(d.titleEn||record.label_en);
    const source=bn?(d.sourceNoteBn||''):(d.sourceNoteEn||'');
    $('dfCanvasTitle').textContent=title||(bn?'পৃথক পরিবার':'Different Family');
    $('dfCanvasSub').textContent=bn?'শুধু অ্যাডমিনের জন্য · মূল পরিবার থেকে আলাদা':'Admin only · separate from the main family tree';
    $('dfBack').textContent=bn?'← মূল পরিবারে ফিরুন':'← Back to Main Family';
    $('dfFit').textContent=bn?'ফিট':'Fit';
    $('dfWorld').innerHTML=`${source?`<div class="df-source-note">${esc(source)}</div>`:''}<div id="dfStage" class="df-stage">${(d.branches||[]).map(branchHtml).join('')}</div>`;
    $('dfWorld').querySelectorAll('.df-card').forEach(btn=>btn.onclick=e=>{e.stopPropagation();openProfile(btn.dataset.dfPath);});
    const launch=$('differentFamilyBtn');if(launch) launch.textContent=bn?'পৃথক পরিবার':'Different Family';
    applyZoom();
    if(active&&doFit) setTimeout(fit,30);
  }

  function open(){
    if(!record) return;
    active=true;drag=null;closeProfile();
    document.body.classList.add('df-mode');
    $('treeZoom')?.classList.add('df-main-hidden');
    $('dfWorkspace')?.classList.add('show');
    $('dfWorkspace')?.setAttribute('aria-hidden','false');
    $('differentFamilyBtn')?.classList.add('active');
    render(true);
  }

  function close(){
    active=false;drag=null;closeProfile();
    $('dfViewport')?.classList.remove('dragging');
    document.body.classList.remove('df-mode');
    $('treeZoom')?.classList.remove('df-main-hidden');
    $('dfWorkspace')?.classList.remove('show');
    $('dfWorkspace')?.setAttribute('aria-hidden','true');
    $('differentFamilyBtn')?.classList.remove('active');
  }

  function wirePan(){
    const viewport=$('dfViewport'); if(!viewport) return;
    const stop=()=>{drag=null;viewport.classList.remove('dragging');};
    viewport.addEventListener('pointerdown',e=>{
      if(!active || (e.pointerType==='mouse'&&e.button!==0) || e.target.closest('.df-card,.df-canvas-bar,button')) return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
      try{viewport.setPointerCapture(e.pointerId);}catch(_){ }
      viewport.classList.add('dragging');e.preventDefault();
    });
    viewport.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId) return;
      if(e.pointerType==='mouse'&&(e.buttons&1)===0){stop();return;}
      viewport.scrollLeft=drag.left-(e.clientX-drag.x);
      viewport.scrollTop=drag.top-(e.clientY-drag.y);
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(evt=>viewport.addEventListener(evt,stop));
    window.addEventListener('blur',stop);
    viewport.addEventListener('wheel',e=>{if(active&&(e.ctrlKey||e.metaKey)){e.preventDefault();zoom(e.deltaY<0?.08:-.08);}},{passive:false});
  }

  function ensureUI(){
    if($('differentFamilyBtn')) return;
    const dock=$('featureDock')||document.querySelector('.controls');
    const canvas=$('familyCanvas');
    if(!dock||!canvas) return;
    const btn=document.createElement('button');btn.id='differentFamilyBtn';btn.className='feature-btn df-launch';btn.type='button';btn.textContent=lang()==='bn'?'পৃথক পরিবার':'Different Family';btn.onclick=open;dock.appendChild(btn);
    canvas.insertAdjacentHTML('beforeend',`<div id="dfWorkspace" class="df-workspace" aria-hidden="true"><div class="df-canvas-bar"><div><span class="df-private">ADMIN ONLY</span><h2 id="dfCanvasTitle"></h2><p id="dfCanvasSub"></p></div><div class="df-canvas-actions"><button id="dfBack" type="button"></button><button id="dfFit" type="button">Fit</button><button id="dfZoomOut" type="button">−</button><span id="dfZoomReadout">82%</span><button id="dfZoomIn" type="button">+</button></div></div><div id="dfViewport" class="df-viewport"><div id="dfWorld" class="df-world"></div></div></div>`);
    document.body.insertAdjacentHTML('beforeend',`<div id="dfProfileBackdrop" class="df-profile-backdrop"></div><aside id="dfProfile" class="df-profile" aria-hidden="true"><button id="dfProfileClose" class="df-profile-close" type="button">×</button><div id="dfProfileContent"></div></aside>`);
    $('dfBack').onclick=close;$('dfFit').onclick=fit;$('dfZoomOut').onclick=()=>zoom(-.1);$('dfZoomIn').onclick=()=>zoom(.1);$('dfProfileClose').onclick=closeProfile;$('dfProfileBackdrop').onclick=closeProfile;
    wirePan();render(false);
  }

  function destroyUI(){close();$('differentFamilyBtn')?.remove();$('dfWorkspace')?.remove();$('dfProfileBackdrop')?.remove();$('dfProfile')?.remove();record=null;}

  async function check(){
    const status=$('cloudStatusBtn');if(!status) return;
    if(!status.classList.contains('admin')){destroyUI();return;}
    const privateTree=await fetchPrivateTree();if(!privateTree){destroyUI();return;}
    record=privateTree;ensureUI();render(false);
  }

  function watchAdmin(){
    const attach=()=>{
      const status=$('cloudStatusBtn');if(!status){setTimeout(attach,400);return;}
      if(watcher)watcher.disconnect();watcher=new MutationObserver(check);watcher.observe(status,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});check();
    };attach();
  }

  document.addEventListener('click',e=>{if(e.target.closest('.lang-btn'))setTimeout(()=>{if(record){render(false);if(selectedPath)openProfile(selectedPath);}},80);});
  window.addEventListener('resize',()=>{if(active)fit();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchAdmin);else watchAdmin();
})();