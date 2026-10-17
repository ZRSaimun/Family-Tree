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
  let panX = 30;
  let panY = 30;
  let drag = null;

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

  function initials(name){
    const bits=String(name||'?').trim().split(/\s+/).filter(Boolean);
    return (bits.slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase();
  }

  function personHtml(p,depth=0){
    const kids=p.children||[];
    const relation=lang()==='bn'?(p.relationBn||''):(p.relationEn||'');
    const note=noteOf(p), unclear=unclearOf(p), name=nameOf(p);
    return `<div class="df-tree-node" style="--df-depth:${depth}">
      <div class="df-card">
        <div class="df-avatar">${esc(initials(name))}</div>
        <div class="df-card-copy"><b>${esc(name)}</b>${relation?`<small>${esc(relation)}</small>`:''}${note?`<p>${esc(note)}</p>`:''}${unclear?`<span class="df-unconfirmed">${esc(lang()==='bn'?'নিশ্চিত নয়: ':'Needs confirmation: ')}${esc(unclear)}</span>`:''}</div>
      </div>
      ${kids.length?`<div class="df-child-row">${kids.map(c=>personHtml(c,depth+1)).join('')}</div>`:''}
    </div>`;
  }

  function branchHtml(branch){
    const title=lang()==='bn'?(branch.titleBn||branch.titleEn):(branch.titleEn||branch.titleBn);
    const total=branch.root?countPeople(branch.root):0;
    return `<section class="df-root-group"><div class="df-root-label"><b>${esc(title||'')}</b><span>${total} ${esc(lang()==='bn'?'জন নথিভুক্ত ব্যক্তি':'recorded people')}</span></div>${branch.root?personHtml(branch.root):''}</section>`;
  }

  function applyTransform(){
    const world=$('dfWorld');
    if(world) world.style.transform=`translate(${panX}px,${panY}px) scale(${scale})`;
    const out=$('dfZoomReadout');
    if(out) out.textContent=`${Math.round(scale*100)}%`;
  }

  function fit(){
    const viewport=$('dfViewport'), world=$('dfWorld'), stage=$('dfStage');
    if(!viewport||!world||!stage) return;
    scale=1; panX=0; panY=0; applyTransform();
    requestAnimationFrame(()=>{
      const sw=Math.max(stage.scrollWidth, stage.getBoundingClientRect().width);
      const sh=Math.max(stage.scrollHeight, stage.getBoundingClientRect().height);
      const vw=viewport.clientWidth-50, vh=viewport.clientHeight-70;
      scale=Math.max(.34,Math.min(1, vw/sw, vh/sh));
      panX=Math.max(24,(viewport.clientWidth-sw*scale)/2);
      panY=34;
      applyTransform();
    });
  }

  function zoom(delta){
    scale=Math.max(.32,Math.min(1.7,scale+delta));
    applyTransform();
  }

  function render(){
    if(!record?.data || !$('dfWorkspace')) return;
    const d=record.data, bn=lang()==='bn';
    const title=bn?(d.titleBn||record.label_bn):(d.titleEn||record.label_en);
    const source=bn?(d.sourceNoteBn||''):(d.sourceNoteEn||'');
    $('dfCanvasTitle').textContent=title||(bn?'পৃথক পরিবার':'Different Family');
    $('dfCanvasSub').textContent=bn?'শুধু অ্যাডমিনের জন্য · মূল পরিবার থেকে আলাদা':'Admin only · separate from the main family tree';
    $('dfBack').textContent=bn?'← মূল পরিবারে ফিরুন':'← Back to Main Family';
    $('dfFit').textContent=bn?'ফিট':'Fit';
    $('dfWorld').innerHTML=`${source?`<div class="df-source-note">${esc(source)}</div>`:''}<div id="dfStage" class="df-stage">${(d.branches||[]).map(branchHtml).join('')}</div>`;
    const launch=$('differentFamilyBtn');
    if(launch) launch.textContent=bn?'পৃথক পরিবার':'Different Family';
    applyTransform();
    if(active) setTimeout(fit,40);
  }

  function open(){
    if(!record) return;
    active=true;
    document.body.classList.add('df-mode');
    $('treeZoom')?.classList.add('df-main-hidden');
    $('dfWorkspace')?.classList.add('show');
    $('differentFamilyBtn')?.classList.add('active');
    render();
    setTimeout(fit,50);
  }

  function close(){
    active=false;
    document.body.classList.remove('df-mode');
    $('treeZoom')?.classList.remove('df-main-hidden');
    $('dfWorkspace')?.classList.remove('show');
    $('differentFamilyBtn')?.classList.remove('active');
  }

  function wirePan(){
    const viewport=$('dfViewport');
    if(!viewport) return;
    viewport.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,.df-card')) return;
      drag={x:e.clientX,y:e.clientY,px:panX,py:panY};
      viewport.setPointerCapture?.(e.pointerId);
      viewport.classList.add('dragging');
    });
    viewport.addEventListener('pointermove',e=>{
      if(!drag) return;
      panX=drag.px+(e.clientX-drag.x);
      panY=drag.py+(e.clientY-drag.y);
      applyTransform();
    });
    const end=()=>{drag=null;viewport.classList.remove('dragging');};
    viewport.addEventListener('pointerup',end);
    viewport.addEventListener('pointercancel',end);
    viewport.addEventListener('wheel',e=>{
      if(!active) return;
      if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(e.deltaY<0?.08:-.08);}
    },{passive:false});
  }

  function ensureUI(){
    if($('differentFamilyBtn')) return;
    const dock=$('featureDock')||document.querySelector('.controls');
    const canvas=$('familyCanvas');
    if(!dock||!canvas) return;

    const btn=document.createElement('button');
    btn.id='differentFamilyBtn';btn.className='feature-btn df-launch';btn.type='button';btn.textContent=lang()==='bn'?'পৃথক পরিবার':'Different Family';btn.onclick=open;
    dock.appendChild(btn);

    canvas.insertAdjacentHTML('beforeend',`<div id="dfWorkspace" class="df-workspace" aria-hidden="true"><div class="df-canvas-bar"><div><span class="df-private">ADMIN ONLY</span><h2 id="dfCanvasTitle"></h2><p id="dfCanvasSub"></p></div><div class="df-canvas-actions"><button id="dfBack" type="button"></button><button id="dfFit" type="button">Fit</button><button id="dfZoomOut" type="button" aria-label="Zoom out">−</button><span id="dfZoomReadout">82%</span><button id="dfZoomIn" type="button" aria-label="Zoom in">+</button></div></div><div id="dfViewport" class="df-viewport"><div id="dfWorld" class="df-world"><div id="dfStage" class="df-stage"></div></div></div></div>`);
    $('dfBack').onclick=close;
    $('dfFit').onclick=fit;
    $('dfZoomOut').onclick=()=>zoom(-.1);
    $('dfZoomIn').onclick=()=>zoom(.1);
    wirePan();
    render();
  }

  function destroyUI(){
    close();
    $('differentFamilyBtn')?.remove();
    $('dfWorkspace')?.remove();
    record=null;
  }

  async function check(){
    const status=$('cloudStatusBtn');
    if(!status) return;
    if(!status.classList.contains('admin')){destroyUI();return;}
    const privateTree=await fetchPrivateTree();
    if(!privateTree){destroyUI();return;}
    record=privateTree;
    ensureUI();
    render();
  }

  function watchAdmin(){
    const attach=()=>{
      const status=$('cloudStatusBtn');
      if(!status){setTimeout(attach,400);return;}
      if(watcher)watcher.disconnect();
      watcher=new MutationObserver(check);
      watcher.observe(status,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
      check();
    };
    attach();
  }

  document.addEventListener('click',e=>{if(e.target.closest('.lang-btn'))setTimeout(()=>{if(record)render();},80);});
  window.addEventListener('resize',()=>{if(active)fit();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchAdmin);else watchAdmin();
})();