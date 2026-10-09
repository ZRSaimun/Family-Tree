(() => {
  const state={lang:localStorage.getItem('familyTreeLang')||'en',allExpanded:false,query:''};
  const generationColors=['var(--gen-1)','var(--gen-2)','var(--gen-3)','var(--gen-4)','var(--gen-5)','var(--gen-6)','var(--gen-7)'];
  const byId=id=>document.getElementById(id);
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const t=key=>translations[state.lang][key]||key;
  const pick=(obj,enKey,bnKey)=>state.lang==='bn'?(obj[bnKey]||obj[enKey]||''):(obj[enKey]||obj[bnKey]||'');

  function childEntries(person){
    const direct=(person.children||[]).map(child=>({person:child,viaEn:'',viaBn:''}));
    const grouped=(person.spouseGroups||[]).flatMap((g,i)=>(g.children||[]).map(child=>({person:child,viaEn:`Wife ${i+1} branch`,viaBn:`${i+1} নম্বর স্ত্রীর সন্তান`})));
    return [...direct,...grouped];
  }
  const searchText=p=>[p.en,p.bn,...(p.spouses||[]).flatMap(s=>[s.en,s.bn]),...(p.spouseGroups||[]).flatMap(g=>[g.spouseEn,g.spouseBn])].filter(Boolean).join(' ').toLowerCase();

  function spouseBlock(person){
    const rows=[];
    (person.spouses||[]).forEach((s,i)=>{
      const label=state.lang==='bn'?(person.spouses.length>1?`${i+1} নম্বর স্বামী/স্ত্রী`:'স্বামী/স্ত্রী'):(person.spouses.length>1?`Spouse ${i+1}`:'Spouse');
      const status=state.lang==='bn'?s.statusBn:s.statusEn;
      rows.push(`<div class="spouse-row"><span class="spouse-label">${esc(label)}</span><span class="spouse-name">${esc(s[state.lang]||s.en||'')}${status?` · ${esc(status)}`:''}</span></div>`);
    });
    (person.spouseGroups||[]).forEach((g,i)=>{
      const status=state.lang==='bn'?g.statusBn:g.statusEn;
      rows.push(`<div class="spouse-row"><span class="spouse-label">${state.lang==='bn'?`${i+1} নম্বর স্ত্রী`:`Wife ${i+1}`}</span><span class="spouse-name">${esc(state.lang==='bn'?g.spouseBn:g.spouseEn)}${status?` · ${esc(status)}`:''}</span></div>`);
    });
    return rows.length?`<div class="spouse-list">${rows.join('')}</div>`:'';
  }

  function familyPath(parent,via){
    if(!parent)return '';
    let familyName=parent[state.lang]||parent.en;
    if(!via && (parent.spouses||[]).length===1){const s=parent.spouses[0];familyName+=` + ${s[state.lang]||s.en}`;}
    const viaText=via?(state.lang==='bn'?via.viaBn:via.viaEn):'';
    return `<p class="family-path"><span>${state.lang==='bn'?'পরিবার:':'From family:'}</span> ${esc(familyName)}${viaText?` <b>• ${esc(viaText)}</b>`:''}</p>`;
  }

  function card(person,depth,parent,via){
    const kids=childEntries(person),note=pick(person,'noteEn','noteBn'),relation=pick(person,'relationEn','relationBn');
    const hit=state.query&&searchText(person).includes(state.query.toLowerCase());
    const initiallyCollapsed=depth>=2;
    return `<article class="person-card${person.placeholder?' placeholder-card':''}${hit?' search-hit':''}" data-search="${esc(searchText(person))}">
      <div class="person-main">${familyPath(parent,via)}<div class="person-name-row"><div><h3 class="person-name">${esc(person[state.lang]||person.en)}</h3><span class="person-role">${esc(relation||`${t('generation')} ${depth}`)}</span></div>${person.deceased?`<span class="status-badge deceased">${esc(t('deceased'))}</span>`:''}</div>${note?`<p class="person-note">${esc(note)}</p>`:''}</div>
      ${spouseBlock(person)}
      ${kids.length?`<div class="node-actions"><button class="toggle-children" type="button" data-node="${esc(person.id)}">${esc(initiallyCollapsed?t('showChildren'):t('hideChildren'))} · ${kids.length}</button></div>`:''}
    </article>`;
  }

  function node(person,depth=1,parent=null,via=null){
    const kids=childEntries(person),color=generationColors[(depth-1)%generationColors.length];
    const collapsed=depth>=2?' collapsed':'';
    return `<div class="family-node" style="--g:${color}" data-person-node="${esc(person.id)}" data-depth="${depth}">${card(person,depth,parent,via)}${kids.length?`<div class="children-wrap${collapsed}" data-children-of="${esc(person.id)}"><div class="children-grid">${kids.map(entry=>`<div class="child-branch">${node(entry.person,depth+1,person,entry)}</div>`).join('')}</div></div>`:''}</div>`;
  }

  function renderRoot(){
    byId('rootTrail').innerHTML=familyData.rootTrail.map(item=>item.type==='missing'?`<div class="missing-generation">${esc(item[state.lang]||item.en)}</div>`:`<div class="root-person"><strong>${esc(item[state.lang]||item.en)}</strong><span>${esc(state.lang==='bn'?item.noteBn:item.noteEn)}</span></div>`).join('<span class="root-arrow" aria-hidden="true"></span>');
  }
  function renderLegend(){byId('legend').innerHTML=generationColors.slice(0,6).map((c,i)=>`<span class="legend-item"><span class="legend-dot" style="--g:${c}"></span>${esc(t('generation'))} ${i+1}</span>`).join('');}
  function bindToggles(){document.querySelectorAll('.toggle-children').forEach(btn=>btn.addEventListener('click',()=>{const wrap=document.querySelector(`[data-children-of="${CSS.escape(btn.dataset.node)}"]`);if(!wrap)return;const collapsed=wrap.classList.toggle('collapsed');const count=wrap.querySelectorAll(':scope > .children-grid > .child-branch').length;btn.textContent=`${collapsed?t('showChildren'):t('hideChildren')} · ${count}`;}));}
  function renderTrees(){byId('mohabbatTree').innerHTML=`<div class="tree-root">${node(familyData.main,1)}</div>`;byId('abdullahTree').innerHTML=`<div class="tree-root">${node(familyData.secondary,1)}</div>`;bindToggles();applySearch();}
  function translateUI(){document.documentElement.lang=state.lang==='bn'?'bn':'en';document.body.classList.toggle('lang-bn',state.lang==='bn');document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(t(k))el.textContent=t(k)});byId('searchInput').placeholder=t('searchPlaceholder');byId('mohabbatTitle').textContent=t('branchTitleMain');byId('abdullahTitle').textContent=t('branchTitleSecondary');document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));}
  function setLanguage(lang){state.lang=lang;localStorage.setItem('familyTreeLang',lang);translateUI();renderLegend();renderRoot();renderTrees();byId('expandAllBtn').textContent=state.allExpanded?t('collapseAll'):t('expandAll');}
  function applySearch(){
    const q=state.query.trim().toLowerCase();document.querySelectorAll('.tree-board .no-results').forEach(el=>el.remove());
    if(!q){document.querySelectorAll('.family-node,.child-branch').forEach(el=>el.style.display='');byId('clearSearch').classList.add('hidden');return;}
    byId('clearSearch').classList.remove('hidden');document.querySelectorAll('.family-node,.child-branch').forEach(el=>el.style.display='none');document.querySelectorAll('.children-wrap').forEach(el=>el.classList.remove('collapsed'));
    document.querySelectorAll('.person-card').forEach(card=>{const match=(card.dataset.search||'').includes(q);card.classList.toggle('search-hit',match);if(!match)return;let n=card.closest('.family-node');while(n){n.style.display='';const branch=n.closest('.child-branch');if(branch)branch.style.display='';n=branch?branch.parentElement.closest('.family-node'):null;}});
    ['mohabbatTree','abdullahTree'].forEach(id=>{const b=byId(id);if(![...b.querySelectorAll('.person-card')].some(c=>c.classList.contains('search-hit')))b.insertAdjacentHTML('beforeend',`<div class="no-results">${esc(t('noResults'))}</div>`)});
  }
  function toggleAll(){state.allExpanded=!state.allExpanded;document.querySelectorAll('.children-wrap').forEach(w=>w.classList.toggle('collapsed',!state.allExpanded));document.querySelectorAll('.toggle-children').forEach(btn=>{const wrap=document.querySelector(`[data-children-of="${CSS.escape(btn.dataset.node)}"]`);const count=wrap?wrap.querySelectorAll(':scope > .children-grid > .child-branch').length:'';btn.textContent=`${state.allExpanded?t('hideChildren'):t('showChildren')} · ${count}`});byId('expandAllBtn').textContent=state.allExpanded?t('collapseAll'):t('expandAll');}

  document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>setLanguage(btn.dataset.lang)));
  byId('expandAllBtn').addEventListener('click',toggleAll);
  byId('searchInput').addEventListener('input',e=>{state.query=e.target.value;renderTrees()});
  byId('clearSearch').addEventListener('click',()=>{state.query='';byId('searchInput').value='';renderTrees();byId('searchInput').focus()});
  translateUI();renderLegend();renderRoot();renderTrees();byId('expandAllBtn').textContent=t('expandAll');
})();
