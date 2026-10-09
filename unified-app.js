(() => {
  const $=id=>document.getElementById(id);
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const state={lang:localStorage.getItem('familyTreeLang')||'en',query:'',allExpanded:false,open:new Set(),closed:new Set(),zoom:window.innerWidth<760?0.60:0.78,first:true};
  const colors=['var(--g1)','var(--g2)','var(--g3)','var(--g4)','var(--g5)','var(--g6)','var(--g7)'];
  const ui={
    en:{title:'Our Family Tree',subtitle:'One connected family tree from Nayeb Chowdhury through every recorded generation.',search:'Search any family member…',expand:'Expand all',collapse:'Collapse all',generation:'Generation',spouse:'Spouse',wife:'Wife',husband:'Husband',children:'children',show:'Show children',hide:'Hide children',deceased:'Deceased',noResults:'No matching family member found.',source:'Family lineage arranged from the supplied family record. Nayeb Chowdhury → Chan Gazi Hawladar → Mohabbat Ali Munsir and Abdullah Chamra.'},
    bn:{title:'আমাদের পারিবারিক বংশধারা',subtitle:'নায়েব চৌধুরী থেকে শুরু করে নথিভুক্ত সব প্রজন্মকে একটি সংযুক্ত পারিবারিক বৃক্ষে দেখানো হয়েছে।',search:'পরিবারের যেকোনো নাম খুঁজুন…',expand:'সব খুলুন',collapse:'সব বন্ধ করুন',generation:'প্রজন্ম',spouse:'স্বামী/স্ত্রী',wife:'স্ত্রী',husband:'স্বামী',children:'সন্তান',show:'সন্তান দেখুন',hide:'সন্তান লুকান',deceased:'মৃত্যুবরণ',noResults:'এই নামে কোনো সদস্য পাওয়া যায়নি।',source:'প্রদত্ত পারিবারিক নথি অনুযায়ী বংশধারা: নায়েব চৌধুরী → চাঁন গাজী হাওলাদার → মোহাব্বত আলি মুনসির ও আব্দুল্লাহ চামড়া।'}
  };
  const t=k=>ui[state.lang][k]||k;
  const pick=(obj,en,bn)=>state.lang==='bn'?(obj[bn]||obj[en]||''):(obj[en]||obj[bn]||'');

  function buildRoot(){
    const rootSource=familyData.rootTrail.find(p=>p.id==='nayeb-chowdhury')||familyData.rootTrail[0];
    const chanSource=familyData.rootTrail.find(p=>p.id==='chan-gazi-hawladar')||familyData.rootTrail[1];
    const root={...rootSource};
    const chan={...chanSource,children:[familyData.main,familyData.secondary]};
    root.children=[chan];
    return root;
  }

  function childEntries(person){
    const direct=(person.children||[]).map(child=>({person:child,viaEn:'',viaBn:''}));
    const grouped=(person.spouseGroups||[]).flatMap((g,i)=>(g.children||[]).map(child=>({person:child,viaEn:`Wife ${i+1} branch`,viaBn:`${i+1} নম্বর স্ত্রীর সন্তান`})));
    return [...direct,...grouped];
  }

  function searchText(p){
    return [p.en,p.bn,p.noteEn,p.noteBn,...(p.spouses||[]).flatMap(s=>[s.en,s.bn]),...(p.spouseGroups||[]).flatMap(g=>[g.spouseEn,g.spouseBn])].filter(Boolean).join(' ').toLowerCase();
  }

  function subtreeMatches(person,q){
    if(!q)return true;
    if(searchText(person).includes(q))return true;
    return childEntries(person).some(e=>subtreeMatches(e.person,q));
  }

  function spouseBlock(person){
    const rows=[];
    (person.spouses||[]).forEach((s,i)=>{
      const label=state.lang==='bn'?'স্বামী/স্ত্রী':(person.spouses.length>1?`Spouse ${i+1}`:'Spouse');
      const status=state.lang==='bn'?s.statusBn:s.statusEn;
      rows.push(`<div class="spouse-row"><span class="spouse-label">${esc(label)}</span><span class="spouse-name">${esc(s[state.lang]||s.en||'')}${status?` · ${esc(status)}`:''}</span></div>`);
    });
    (person.spouseGroups||[]).forEach((g,i)=>{
      const status=state.lang==='bn'?g.statusBn:g.statusEn;
      rows.push(`<div class="spouse-row"><span class="spouse-label">${state.lang==='bn'?`${i+1} নম্বর স্ত্রী`:`Wife ${i+1}`}</span><span class="spouse-name">${esc(state.lang==='bn'?g.spouseBn:g.spouseEn)}${status?` · ${esc(status)}`:''}</span></div>`);
    });
    return rows.length?`<div class="spouses">${rows.join('')}</div>`:'';
  }

  function card(person,depth,via,showKids,kidCount){
    const name=person[state.lang]||person.en||'';
    const note=pick(person,'noteEn','noteBn');
    let relation=pick(person,'relationEn','relationBn');
    if(String(relation).toLowerCase()==='you'||relation==='আপনি')relation='';
    const hit=state.query&&searchText(person).includes(state.query.toLowerCase());
    const viaLabel=via?(state.lang==='bn'?via.viaBn:via.viaEn):'';
    const cls=[person.id==='mohabbat-ali-munsir'?'branch-primary':'',person.id==='abdullah-chamra'?'branch-secondary':''].filter(Boolean).join(' ');
    return `<div class="${cls}"><article class="node-card${hit?' hit':''}" style="--g:${colors[(depth-1)%colors.length]}">
      <div class="node-main">${viaLabel?`<span class="via-label">${esc(viaLabel)}</span>`:''}<h3 class="node-name">${esc(name)}</h3><div class="node-meta"><span class="gen-chip">${esc(t('generation'))} ${depth}</span>${relation?`<span class="relation-chip">${esc(relation)}</span>`:''}${person.deceased?`<span class="deceased">${esc(t('deceased'))}</span>`:''}</div>${note?`<p class="node-note">${esc(note)}</p>`:''}</div>
      ${spouseBlock(person)}
      ${kidCount?`<button class="toggle-children" type="button" data-id="${esc(person.id)}" data-open="${showKids?'1':'0'}">${esc(showKids?t('hide'):t('show'))} · ${kidCount}</button>`:''}
    </article></div>`;
  }

  function renderNode(person,depth=1,via=null){
    const q=state.query.trim().toLowerCase();
    if(q&&!subtreeMatches(person,q))return '';
    const entries=childEntries(person).filter(e=>!q||subtreeMatches(e.person,q));
    const defaultOpen=depth<4;
    const showKids=entries.length&& !state.closed.has(person.id) && (q||state.allExpanded||defaultOpen||state.open.has(person.id));
    const children=showKids?`<ul>${entries.map(e=>renderNode(e.person,depth+1,e)).join('')}</ul>`:'';
    return `<li data-person="${esc(person.id)}">${card(person,depth,via,showKids,entries.length)}${children}</li>`;
  }

  function renderLegend(){
    $('legend').innerHTML=colors.map((c,i)=>`<span class="legend-item"><span class="legend-dot" style="--c:${c}"></span>${esc(t('generation'))} ${i+1}</span>`).join('');
  }

  function render(){
    document.documentElement.lang=state.lang==='bn'?'bn':'en';
    document.body.classList.toggle('lang-bn',state.lang==='bn');
    $('pageTitle').textContent=t('title'); $('pageSubtitle').textContent=t('subtitle'); $('sourceNote').textContent=t('source');
    $('searchInput').placeholder=t('search'); $('expandAllBtn').textContent=state.allExpanded?t('collapse'):t('expand');
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
    renderLegend();
    const root=buildRoot();
    const html=renderNode(root,1,null);
    $('treeHost').innerHTML=html?`<div class="org-tree"><ul>${html}</ul></div>`:`<div class="no-results">${esc(t('noResults'))}</div>`;
    applyZoom();
    if(state.first){state.first=false;requestAnimationFrame(centerCanvas);}
  }

  function applyZoom(){
    $('treeZoom').style.zoom=state.zoom;
    $('zoomReadout').textContent=`${Math.round(state.zoom*100)}%`;
  }
  function centerCanvas(){
    const c=$('familyCanvas'); c.scrollLeft=Math.max(0,(c.scrollWidth-c.clientWidth)/2); c.scrollTop=0;
  }
  function setZoom(delta){state.zoom=Math.min(1.3,Math.max(.42,Math.round((state.zoom+delta)*100)/100));applyZoom();}
  function toggleAll(){state.allExpanded=!state.allExpanded;state.open.clear();state.closed.clear();render();requestAnimationFrame(centerCanvas);}

  $('treeHost').addEventListener('click',e=>{
    const btn=e.target.closest('.toggle-children'); if(!btn)return;
    const id=btn.dataset.id,open=btn.dataset.open==='1';
    if(open){state.closed.add(id);state.open.delete(id);}else{state.closed.delete(id);state.open.add(id);} render();
  });
  document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>{state.lang=btn.dataset.lang;localStorage.setItem('familyTreeLang',state.lang);render();}));
  $('searchInput').addEventListener('input',e=>{state.query=e.target.value;$('clearSearch').classList.toggle('hidden',!state.query);render();});
  $('clearSearch').addEventListener('click',()=>{state.query='';$('searchInput').value='';$('clearSearch').classList.add('hidden');render();});
  $('expandAllBtn').addEventListener('click',toggleAll);
  $('zoomIn').addEventListener('click',()=>setZoom(.1)); $('zoomOut').addEventListener('click',()=>setZoom(-.1));
  $('fitBtn').addEventListener('click',()=>{state.zoom=window.innerWidth<760?.60:.78;applyZoom();requestAnimationFrame(centerCanvas);});

  const canvas=$('familyCanvas'); let dragging=false,sx=0,sy=0,sl=0,st=0;
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button,input'))return;dragging=true;sx=e.clientX;sy=e.clientY;sl=canvas.scrollLeft;st=canvas.scrollTop;canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;canvas.scrollLeft=sl-(e.clientX-sx);canvas.scrollTop=st-(e.clientY-sy);});
  const stop=e=>{if(!dragging)return;dragging=false;canvas.classList.remove('dragging');try{canvas.releasePointerCapture(e.pointerId)}catch(_){}};
  canvas.addEventListener('pointerup',stop); canvas.addEventListener('pointercancel',stop);

  render();
})();