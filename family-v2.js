(() => {
  const $ = id => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>\'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const state = {
    lang: localStorage.getItem('familyTreeLang') || 'en',
    query: '', selectedId: null, focusId: null,
    allExpanded: false, open: new Set(), closed: new Set(),
    zoom: window.innerWidth < 760 ? 0.62 : 0.82, first: true
  };
  const colors = ['var(--g1)','var(--g2)','var(--g3)','var(--g4)','var(--g5)','var(--g6)','var(--g7)'];
  const ui = {
    en: {
      title:'Our Family Tree', subtitle:'Explore the Nayeb Chowdhury family as one connected living tree.',
      search:'Search a family member…', expand:'Expand all', collapse:'Collapse all', fit:'Fit tree', home:'Home', fullscreen:'Full screen',
      generation:'Generation', spouse:'Spouse', wife:'Wife', children:'Children', parent:'Parent', parents:'Parents', notes:'Family note',
      show:'Show children', hide:'Hide children', deceased:'Deceased', profile:'Family profile', focus:'Focus branch', clearFocus:'Show full tree', share:'Copy person link', copied:'Link copied', close:'Close',
      noResults:'No matching family member found.', noChildren:'No named children are recorded here.', noSpouse:'No spouse name recorded.',
      source:'Nayeb Chowdhury → Chan Gazi Hawladar → Mohabbat Ali Munsir and Abdullah Chamra, followed by their recorded descendants.',
      hint:'Tap any person to open their family profile. Use the canvas like a board: pan, zoom, search and focus on a branch.'
    },
    bn: {
      title:'আমাদের পারিবারিক বংশধারা', subtitle:'নায়েব চৌধুরী থেকে শুরু করে পুরো পরিবারকে একটি সংযুক্ত জীবন্ত পারিবারিক বৃক্ষে দেখুন।',
      search:'পরিবারের সদস্য খুঁজুন…', expand:'সব খুলুন', collapse:'সব বন্ধ করুন', fit:'পুরো বৃক্ষ দেখুন', home:'শুরুতে যান', fullscreen:'পূর্ণ পর্দা',
      generation:'প্রজন্ম', spouse:'স্বামী/স্ত্রী', wife:'স্ত্রী', children:'সন্তান', parent:'অভিভাবক', parents:'অভিভাবক', notes:'পারিবারিক তথ্য',
      show:'সন্তান দেখুন', hide:'সন্তান লুকান', deceased:'মৃত্যুবরণ', profile:'পারিবারিক পরিচয়', focus:'এই শাখায় ফোকাস', clearFocus:'পুরো বৃক্ষ দেখুন', share:'ব্যক্তির লিংক কপি করুন', copied:'লিংক কপি হয়েছে', close:'বন্ধ করুন',
      noResults:'এই নামে কোনো সদস্য পাওয়া যায়নি।', noChildren:'এখানে নামসহ কোনো সন্তান নথিভুক্ত নেই।', noSpouse:'স্বামী/স্ত্রীর নাম নথিভুক্ত নেই।',
      source:'নায়েব চৌধুরী → চাঁন গাজী হাওলাদার → মোহাব্বত আলি মুনসির ও আব্দুল্লাহ চামড়া; এরপর তাদের নথিভুক্ত বংশধর।',
      hint:'যেকোনো ব্যক্তির কার্ডে চাপ দিলে তার পারিবারিক পরিচয় খুলবে। বোর্ডের মতো প্যান, জুম, সার্চ ও শাখায় ফোকাস করুন।'
    }
  };
  const t = k => ui[state.lang][k] || k;
  const pick = (o,en,bn) => state.lang === 'bn' ? (o?.[bn] || o?.[en] || '') : (o?.[en] || o?.[bn] || '');

  function buildRoot(){
    const rootSrc = familyData.rootTrail.find(p=>p.id==='nayeb-chowdhury') || familyData.rootTrail[0];
    const chanSrc = familyData.rootTrail.find(p=>p.id==='chan-gazi-hawladar') || familyData.rootTrail[1];
    const chan = {...chanSrc, children:[familyData.main, familyData.secondary]};
    return {...rootSrc, children:[chan]};
  }

  function childEntries(person){
    const direct = (person.children || []).map(child => ({person:child, viaEn:'', viaBn:''}));
    const grouped = (person.spouseGroups || []).flatMap((g,i)=>(g.children || []).map(child=>({
      person:child, viaEn:`Wife ${i+1} branch`, viaBn:`${i+1} নম্বর স্ত্রীর সন্তান`
    })));
    return [...direct, ...grouped];
  }

  const root = buildRoot();
  const people = [];
  const peopleById = new Map();
  const parentById = new Map();
  const depthById = new Map();
  function index(person, parent=null, depth=1){
    if(!person || !person.id) return;
    if(!peopleById.has(person.id)){ people.push(person); peopleById.set(person.id, person); }
    depthById.set(person.id, depth);
    if(parent) parentById.set(person.id, parent);
    childEntries(person).forEach(e=>index(e.person, person, depth+1));
  }
  index(root);

  function searchText(p){
    return [p.en,p.bn,p.noteEn,p.noteBn,...(p.spouses||[]).flatMap(s=>[s.en,s.bn]),...(p.spouseGroups||[]).flatMap(g=>[g.spouseEn,g.spouseBn])].filter(Boolean).join(' ').toLowerCase();
  }
  function initials(p){
    const n=(p[state.lang]||p.en||'?').trim();
    if(state.lang==='bn') return n.slice(0,2);
    return n.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  }
  function ancestors(id){
    const set=new Set(); let cur=peopleById.get(id);
    while(cur){ set.add(cur.id); cur=parentById.get(cur.id); }
    return set;
  }
  function descendants(id){
    const set=new Set(); const p=peopleById.get(id); if(!p)return set;
    const walk=x=>{ set.add(x.id); childEntries(x).forEach(e=>walk(e.person)); }; walk(p); return set;
  }
  function focusSet(){
    if(!state.focusId)return null;
    return new Set([...ancestors(state.focusId), ...descendants(state.focusId)]);
  }
  function openAncestors(id){
    let cur=peopleById.get(id);
    while(cur){ const p=parentById.get(cur.id); if(p){ state.closed.delete(p.id); state.open.add(p.id); } cur=p; }
  }

  function spouseNames(p){
    const out=[];
    (p.spouses||[]).forEach((s,i)=>out.push({label:(p.spouses.length>1?`${t('spouse')} ${i+1}`:t('spouse')), name:s[state.lang]||s.en||'', status:state.lang==='bn'?s.statusBn:s.statusEn}));
    (p.spouseGroups||[]).forEach((g,i)=>out.push({label:`${t('wife')} ${i+1}`, name:state.lang==='bn'?g.spouseBn:g.spouseEn, status:state.lang==='bn'?g.statusBn:g.statusEn}));
    return out.filter(x=>x.name);
  }

  function spouseBlock(person){
    const rows=spouseNames(person);
    return rows.length ? `<div class="card-spouses">${rows.map(r=>`<div><span>${esc(r.label)}</span><b>${esc(r.name)}${r.status?` · ${esc(r.status)}`:''}</b></div>`).join('')}</div>` : '';
  }

  function card(person, depth, via, showKids, kidCount, fset){
    const name=person[state.lang]||person.en||'';
    const note=pick(person,'noteEn','noteBn');
    let relation=pick(person,'relationEn','relationBn');
    if(String(relation).toLowerCase()==='you'||relation==='আপনি') relation='';
    const hit=state.query && searchText(person).includes(state.query.toLowerCase());
    const focused=state.focusId===person.id;
    const dim=fset && !fset.has(person.id);
    const viaLabel=via ? (state.lang==='bn'?via.viaBn:via.viaEn) : '';
    return `<article class="person-card${hit?' search-hit':''}${focused?' focused':''}${dim?' dimmed':''}" data-person-id="${esc(person.id)}" style="--g:${colors[(depth-1)%colors.length]}">
      <button class="person-open" type="button" data-open-profile="${esc(person.id)}" aria-label="${esc(name)}">
        <span class="avatar" aria-hidden="true">${esc(initials(person))}</span>
        <span class="person-copy">${viaLabel?`<span class="via-label">${esc(viaLabel)}</span>`:''}<strong>${esc(name)}</strong><span class="meta-row"><em>${esc(t('generation'))} ${depth}</em>${relation?`<em>${esc(relation)}</em>`:''}${person.deceased?`<em class="dead">${esc(t('deceased'))}</em>`:''}</span></span>
      </button>
      ${spouseBlock(person)}
      ${note?`<p class="card-note">${esc(note)}</p>`:''}
      ${kidCount?`<button class="children-toggle" type="button" data-toggle="${esc(person.id)}" data-open="${showKids?'1':'0'}">${esc(showKids?t('hide'):t('show'))}<span>${kidCount}</span></button>`:''}
    </article>`;
  }

  function subtreeMatches(person,q){
    if(!q)return true;
    if(searchText(person).includes(q))return true;
    return childEntries(person).some(e=>subtreeMatches(e.person,q));
  }

  function renderNode(person, depth=1, via=null){
    const q=state.query.trim().toLowerCase();
    if(q && !subtreeMatches(person,q)) return '';
    const fset=focusSet();
    const entries=childEntries(person).filter(e=>!q || subtreeMatches(e.person,q));
    const defaultOpen=depth<4;
    const showKids=entries.length && !state.closed.has(person.id) && (q || state.allExpanded || defaultOpen || state.open.has(person.id));
    return `<li data-li-person="${esc(person.id)}">${card(person,depth,via,showKids,entries.length,fset)}${showKids?`<ul>${entries.map(e=>renderNode(e.person,depth+1,e)).join('')}</ul>`:''}</li>`;
  }

  function renderLegend(){
    $('legend').innerHTML=colors.map((c,i)=>`<span class="legend-item"><i style="--c:${c}"></i>${esc(t('generation'))} ${i+1}</span>`).join('');
  }
  function updateText(){
    document.documentElement.lang=state.lang==='bn'?'bn':'en';
    document.body.classList.toggle('lang-bn',state.lang==='bn');
    $('pageTitle').textContent=t('title'); $('pageSubtitle').textContent=t('subtitle'); $('sourceNote').textContent=t('source'); $('canvasHint').textContent=t('hint');
    $('searchInput').placeholder=t('search'); $('expandAllBtn').textContent=state.allExpanded?t('collapse'):t('expand'); $('fitBtn').textContent=t('fit'); $('homeBtn').textContent=t('home'); $('fullscreenBtn').textContent=t('fullscreen');
    $('clearFocusBtn').textContent=t('clearFocus'); $('clearFocusBtn').classList.toggle('hidden',!state.focusId);
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
  }
  function render(){
    updateText(); renderLegend();
    const html=renderNode(root);
    $('treeHost').innerHTML=html?`<div class="org-tree"><ul>${html}</ul></div>`:`<div class="no-results">${esc(t('noResults'))}</div>`;
    applyZoom();
    if(state.selectedId) renderProfile(state.selectedId, false);
    if(state.first){state.first=false;requestAnimationFrame(centerCanvas);}
  }

  function profileRows(person){
    const rows=[];
    const parent=parentById.get(person.id);
    if(parent) rows.push(`<div class="profile-field"><span>${esc(t('parent'))}</span><button type="button" data-profile-jump="${esc(parent.id)}">${esc(parent[state.lang]||parent.en)}</button></div>`);
    spouseNames(person).forEach(s=>rows.push(`<div class="profile-field"><span>${esc(s.label)}</span><b>${esc(s.name)}${s.status?` · ${esc(s.status)}`:''}</b></div>`));
    return rows.join('');
  }
  function renderProfile(id, open=true){
    const p=peopleById.get(id); if(!p)return;
    state.selectedId=id;
    const kids=childEntries(p);
    const note=pick(p,'noteEn','noteBn');
    $('profileContent').innerHTML=`
      <div class="profile-hero" style="--g:${colors[(depthById.get(id)-1)%colors.length]}">
        <div class="profile-avatar">${esc(initials(p))}</div>
        <div><span class="profile-kicker">${esc(t('profile'))}</span><h2>${esc(p[state.lang]||p.en)}</h2><p>${esc(t('generation'))} ${depthById.get(id)}${p.deceased?` · ${esc(t('deceased'))}`:''}</p></div>
      </div>
      <div class="profile-body">${profileRows(p)}${note?`<div class="profile-note"><span>${esc(t('notes'))}</span><p>${esc(note)}</p></div>`:''}
        <div class="profile-children"><div class="profile-section-title"><span>${esc(t('children'))}</span><b>${kids.length}</b></div>
          ${kids.length?`<div class="child-chips">${kids.map(e=>`<button type="button" data-profile-jump="${esc(e.person.id)}">${esc(e.person[state.lang]||e.person.en)}</button>`).join('')}</div>`:`<p class="empty-copy">${esc(t('noChildren'))}</p>`}
        </div>
      </div>
      <div class="profile-actions"><button type="button" class="primary-action" data-focus-person="${esc(id)}">${esc(t('focus'))}</button><button type="button" data-share-person="${esc(id)}">${esc(t('share'))}</button></div>`;
    if(open){ $('profilePanel').classList.add('open'); $('profilePanel').setAttribute('aria-hidden','false'); $('profileBackdrop').classList.add('show'); }
  }
  function closeProfile(){ $('profilePanel').classList.remove('open'); $('profilePanel').setAttribute('aria-hidden','true'); $('profileBackdrop').classList.remove('show'); }

  function applyZoom(){ $('treeZoom').style.zoom=state.zoom; $('zoomReadout').textContent=`${Math.round(state.zoom*100)}%`; }
  function setZoom(delta){ state.zoom=Math.min(1.35,Math.max(.42,Math.round((state.zoom+delta)*100)/100)); applyZoom(); }
  function centerCanvas(){ const c=$('familyCanvas'); c.scrollLeft=Math.max(0,(c.scrollWidth-c.clientWidth)/2); c.scrollTop=0; }
  function centerPerson(id){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const card=document.querySelector(`[data-person-id="${CSS.escape(id)}"]`); if(!card)return;
      const c=$('familyCanvas'); const cr=c.getBoundingClientRect(), r=card.getBoundingClientRect();
      c.scrollLeft += (r.left+r.width/2)-(cr.left+cr.width/2);
      c.scrollTop += (r.top+r.height/2)-(cr.top+Math.min(cr.height*.45,330));
      card.animate([{boxShadow:'0 0 0 0 rgba(37,99,235,0)'},{boxShadow:'0 0 0 10px rgba(37,99,235,.16)'},{boxShadow:'0 0 0 0 rgba(37,99,235,0)'}],{duration:900});
    }));
  }
  function focusPerson(id){
    if(!peopleById.has(id))return;
    state.focusId=id; openAncestors(id); state.query=''; $('searchInput').value=''; $('clearSearch').classList.add('hidden'); render(); renderProfile(id,true); centerPerson(id); location.hash=`person=${encodeURIComponent(id)}`;
  }
  function clearFocus(){ state.focusId=null; history.replaceState(null,'',location.pathname+location.search); render(); requestAnimationFrame(centerCanvas); }
  function toggleAll(){ state.allExpanded=!state.allExpanded; state.open.clear(); state.closed.clear(); render(); requestAnimationFrame(centerCanvas); }

  function renderSearchResults(){
    const q=state.query.trim().toLowerCase();
    if(!q){$('searchResults').classList.remove('show'); $('searchResults').innerHTML=''; return;}
    const matches=people.filter(p=>searchText(p).includes(q)).slice(0,10);
    $('searchResults').innerHTML=matches.length?matches.map(p=>`<button type="button" data-search-person="${esc(p.id)}"><span class="mini-avatar" style="--g:${colors[(depthById.get(p.id)-1)%colors.length]}">${esc(initials(p))}</span><span><b>${esc(p[state.lang]||p.en)}</b><small>${esc(t('generation'))} ${depthById.get(p.id)}</small></span></button>`).join(''):`<div class="search-empty">${esc(t('noResults'))}</div>`;
    $('searchResults').classList.add('show');
  }

  async function sharePerson(id){
    const url=`${location.origin}${location.pathname}#person=${encodeURIComponent(id)}`;
    try{ await navigator.clipboard.writeText(url); showToast(t('copied')); }
    catch(_){ prompt('Copy link',url); }
  }
  function showToast(msg){ const el=$('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1600); }

  $('treeHost').addEventListener('click',e=>{
    const toggle=e.target.closest('[data-toggle]'); if(toggle){ const id=toggle.dataset.toggle, open=toggle.dataset.open==='1'; if(open){state.closed.add(id);state.open.delete(id)}else{state.closed.delete(id);state.open.add(id)} render(); return; }
    const open=e.target.closest('[data-open-profile]'); if(open){ renderProfile(open.dataset.openProfile,true); return; }
  });
  $('profileContent').addEventListener('click',e=>{
    const jump=e.target.closest('[data-profile-jump]'); if(jump){ const id=jump.dataset.profileJump; openAncestors(id); render(); renderProfile(id,true); centerPerson(id); return; }
    const focus=e.target.closest('[data-focus-person]'); if(focus){ focusPerson(focus.dataset.focusPerson); return; }
    const share=e.target.closest('[data-share-person]'); if(share){ sharePerson(share.dataset.sharePerson); return; }
  });
  $('searchResults').addEventListener('click',e=>{ const b=e.target.closest('[data-search-person]'); if(!b)return; state.query=''; $('searchInput').value=''; $('clearSearch').classList.add('hidden'); $('searchResults').classList.remove('show'); focusPerson(b.dataset.searchPerson); });
  document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>{ state.lang=btn.dataset.lang; localStorage.setItem('familyTreeLang',state.lang); render(); renderSearchResults(); }));
  $('searchInput').addEventListener('input',e=>{ state.query=e.target.value; $('clearSearch').classList.toggle('hidden',!state.query); renderSearchResults(); });
  $('searchInput').addEventListener('keydown',e=>{ if(e.key==='Enter'){ const first=$('searchResults').querySelector('[data-search-person]'); if(first)first.click(); }});
  $('clearSearch').addEventListener('click',()=>{ state.query=''; $('searchInput').value=''; $('clearSearch').classList.add('hidden'); renderSearchResults(); });
  $('expandAllBtn').addEventListener('click',toggleAll); $('zoomIn').addEventListener('click',()=>setZoom(.1)); $('zoomOut').addEventListener('click',()=>setZoom(-.1));
  $('fitBtn').addEventListener('click',()=>{ state.zoom=window.innerWidth<760?.62:.82; applyZoom(); requestAnimationFrame(centerCanvas); });
  $('homeBtn').addEventListener('click',()=>{ state.focusId=null; render(); requestAnimationFrame(centerCanvas); });
  $('clearFocusBtn').addEventListener('click',clearFocus);
  $('fullscreenBtn').addEventListener('click',async()=>{ const el=$('familyCanvas'); try{ if(!document.fullscreenElement) await el.requestFullscreen(); else await document.exitFullscreen(); }catch(_){} });
  $('profileClose').addEventListener('click',closeProfile); $('profileBackdrop').addEventListener('click',closeProfile);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeProfile(); if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('searchInput').focus();} });

  const canvas=$('familyCanvas'); let dragging=false,sx=0,sy=0,sl=0,st=0;
  canvas.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button,input'))return; dragging=true;sx=e.clientX;sy=e.clientY;sl=canvas.scrollLeft;st=canvas.scrollTop;canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove',e=>{ if(!dragging)return;canvas.scrollLeft=sl-(e.clientX-sx);canvas.scrollTop=st-(e.clientY-sy); });
  const stop=e=>{ if(!dragging)return;dragging=false;canvas.classList.remove('dragging');try{canvas.releasePointerCapture(e.pointerId)}catch(_){} };
  canvas.addEventListener('pointerup',stop); canvas.addEventListener('pointercancel',stop);

  render();
  const hash=new URLSearchParams(location.hash.replace(/^#/,'')); const person=hash.get('person'); if(person&&peopleById.has(person)){ openAncestors(person); state.focusId=person; render(); renderProfile(person,true); centerPerson(person); }
})();