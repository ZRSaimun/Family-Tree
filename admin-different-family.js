(() => {
  'use strict';

  const cfg = window.FAMILY_BACKEND_CONFIG || {};
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const $ = id => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang = () => document.documentElement.lang === 'bn' ? 'bn' : 'en';
  let record = null;
  let watcher = null;

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

  function personHtml(p,depth=0){
    const kids=p.children||[];
    const relation=lang()==='bn'?(p.relationBn||''):(p.relationEn||'');
    const note=noteOf(p),unclear=unclearOf(p);
    return `<div class="df-person" style="--depth:${depth}">
      <div class="df-person-card">
        <div class="df-person-main"><b>${esc(nameOf(p))}</b>${relation?`<small>${esc(relation)}</small>`:''}</div>
        ${note?`<p>${esc(note)}</p>`:''}
        ${unclear?`<div class="df-unconfirmed">${esc(lang()==='bn'?'নিশ্চিত নয়: ':'Needs confirmation: ')}${esc(unclear)}</div>`:''}
      </div>
      ${kids.length?`<div class="df-children">${kids.map(c=>personHtml(c,depth+1)).join('')}</div>`:''}
    </div>`;
  }

  function branchHtml(branch,i){
    const title=lang()==='bn'?(branch.titleBn||branch.titleEn):(branch.titleEn||branch.titleBn);
    const total=branch.root?countPeople(branch.root):0;
    return `<section class="df-branch ${i===0?'open':''}">
      <button class="df-branch-head" type="button" aria-expanded="${i===0?'true':'false'}">
        <span><b>${esc(title)}</b><small>${esc(String(total))} ${esc(lang()==='bn'?'জন নথিভুক্ত ব্যক্তি':'recorded people')}</small></span><i>⌄</i>
      </button>
      <div class="df-branch-body">${branch.root?personHtml(branch.root):''}</div>
    </section>`;
  }

  function render(){
    if(!record?.data) return;
    const d=record.data,bn=lang()==='bn';
    const title=bn?(d.titleBn||record.label_bn):(d.titleEn||record.label_en);
    const source=bn?(d.sourceNoteBn||''):(d.sourceNoteEn||'');
    const unresolved=bn?(d.unresolvedNotesBn||[]):(d.unresolvedNotesEn||[]);
    $('dfTitle').textContent=title|| (bn?'পৃথক পরিবার':'Different Family');
    $('dfSubtitle').textContent=bn?'শুধু অ্যাডমিনের জন্য · মূল পরিবার থেকে আলাদা':'Admin only · separate from the main family tree';
    $('dfContent').innerHTML=`${source?`<div class="df-info">${esc(source)}</div>`:''}
      <div class="df-branches">${(d.branches||[]).map(branchHtml).join('')}</div>
      ${unresolved.length?`<details class="df-needs"><summary>${esc(bn?'নিশ্চিতকরণ প্রয়োজন':'Needs confirmation')}</summary><div>${unresolved.map(x=>`<p>${esc(x)}</p>`).join('')}</div></details>`:''}`;
    $('dfContent').querySelectorAll('.df-branch-head').forEach(btn=>btn.onclick=()=>{
      const branch=btn.closest('.df-branch');
      branch.classList.toggle('open');
      btn.setAttribute('aria-expanded',String(branch.classList.contains('open')));
    });
    const launch=$('differentFamilyBtn');
    if(launch) launch.textContent=bn?'পৃথক পরিবার':'Different Family';
  }

  function ensureUI(){
    if($('differentFamilyBtn')) return;
    const dock=$('featureDock')||document.querySelector('.controls');
    if(!dock) return;
    const btn=document.createElement('button');
    btn.id='differentFamilyBtn';btn.className='feature-btn df-launch';btn.type='button';btn.textContent=lang()==='bn'?'পৃথক পরিবার':'Different Family';
    btn.onclick=open;
    dock.appendChild(btn);
    document.body.insertAdjacentHTML('beforeend',`<div id="dfBackdrop" class="df-backdrop"></div><aside id="dfDrawer" class="df-drawer" aria-hidden="true"><header><div><span class="df-private">${esc(lang()==='bn'?'ADMIN ONLY':'ADMIN ONLY')}</span><h2 id="dfTitle"></h2><p id="dfSubtitle"></p></div><button id="dfClose" type="button" aria-label="Close">×</button></header><div id="dfContent" class="df-content"></div></aside>`);
    $('dfBackdrop').onclick=close;$('dfClose').onclick=close;
    render();
  }

  function destroyUI(){
    $('differentFamilyBtn')?.remove();$('dfBackdrop')?.remove();$('dfDrawer')?.remove();record=null;
  }
  function open(){$('dfBackdrop')?.classList.add('show');$('dfDrawer')?.classList.add('show');$('dfDrawer')?.setAttribute('aria-hidden','false');render();}
  function close(){$('dfBackdrop')?.classList.remove('show');$('dfDrawer')?.classList.remove('show');$('dfDrawer')?.setAttribute('aria-hidden','true');}

  async function check(){
    const status=$('cloudStatusBtn');
    if(!status) return;
    if(!status.classList.contains('admin')){destroyUI();return;}
    const privateTree=await fetchPrivateTree();
    if(!privateTree){destroyUI();return;}
    record=privateTree;ensureUI();render();
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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchAdmin);else watchAdmin();
})();