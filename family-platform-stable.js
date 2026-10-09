(() => {
  const $ = id => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const lang = () => document.documentElement.lang === 'bn' ? 'bn' : 'en';
  const colors = ['var(--g1)','var(--g2)','var(--g3)','var(--g4)','var(--g5)','var(--g6)','var(--g7)'];
  const tx = {
    en:{find:'Find My Family',relation:'Relationship Finder',gallery:'Family Gallery',all:'All',generation:'Generation',lineage:'Lineage',siblings:'Siblings',details:'Details',birth:'Birth',death:'Death',location:'Location',occupation:'Occupation',none:'Not recorded',findTitle:'Find your family',findSub:'Search a name and jump directly to that person in the tree.',search:'Type a family member name…',relTitle:'Find how two people are related',first:'First person',second:'Second person',calculate:'Find relationship',same:'This is the same person.',parent:'parent',child:'child',grandparent:'grandparent',grandchild:'grandchild',greatGrandparent:'great-grandparent',greatGrandchild:'great-grandchild',siblingsRel:'siblings',cousin:'cousins',related:'related',through:'through',galleryTitle:'Family photographs',gallerySub:'Approved photos attached to family records appear here automatically.',noPhotos:'No official family photographs have been added yet.'},
    bn:{find:'আমার পরিবার খুঁজুন',relation:'সম্পর্ক খুঁজুন',gallery:'পারিবারিক গ্যালারি',all:'সব',generation:'প্রজন্ম',lineage:'বংশধারা',siblings:'ভাই-বোন',details:'বিস্তারিত',birth:'জন্ম',death:'মৃত্যু',location:'স্থান',occupation:'পেশা',none:'নথিভুক্ত নেই',findTitle:'নিজের পরিবার খুঁজুন',findSub:'নাম লিখে সরাসরি সেই ব্যক্তির অংশে যান।',search:'পরিবারের সদস্যের নাম লিখুন…',relTitle:'দুই ব্যক্তির সম্পর্ক খুঁজুন',first:'প্রথম ব্যক্তি',second:'দ্বিতীয় ব্যক্তি',calculate:'সম্পর্ক দেখুন',same:'এটি একই ব্যক্তি।',parent:'পিতা/মাতা',child:'সন্তান',grandparent:'দাদা/দাদি/নানা/নানি',grandchild:'নাতি/নাতনি',greatGrandparent:'প্রপিতামহ/প্রমাতামহ',greatGrandchild:'প্রপৌত্র/প্রপৌত্রী',siblingsRel:'ভাই-বোন',cousin:'কাজিন',related:'সম্পর্কিত',through:'মাধ্যমে',galleryTitle:'পারিবারিক ছবি',gallerySub:'পরিবারের রেকর্ডে অনুমোদিত ছবি যোগ হলে এখানে দেখা যাবে।',noPhotos:'এখনও কোনো অফিসিয়াল পারিবারিক ছবি যোগ করা হয়নি।'}
  };
  const t = k => tx[lang()][k] || k;

  function root(){
    const n=familyData.rootTrail.find(p=>p.id==='nayeb-chowdhury')||familyData.rootTrail.find(p=>p.id==='nayer-chowdhury')||familyData.rootTrail[0];
    const c=familyData.rootTrail.find(p=>p.id==='chan-gazi-hawladar')||familyData.rootTrail[1];
    return {...n,children:[{...c,children:[familyData.main,familyData.secondary]}]};
  }
  const people=[],byId=new Map(),parentById=new Map(),depthById=new Map(),childrenById=new Map();
  function entries(p){return [...(p.children||[]),...(p.spouseGroups||[]).flatMap(g=>g.children||[])];}
  function index(p,parent=null,depth=1){if(!p?.id)return;if(!byId.has(p.id)){people.push(p);byId.set(p.id,p);}if(parent)parentById.set(p.id,parent);depthById.set(p.id,depth);const kids=entries(p);childrenById.set(p.id,kids.map(x=>x.id));kids.forEach(ch=>index(ch,p,depth+1));}
  index(root());
  const name=p=>lang()==='bn'?(p?.bn||p?.en||''):(p?.en||p?.bn||'');
  const photo=p=>p?.photoUrl||p?.photo||p?.image||'';
  const searchText=p=>[p.en,p.bn,p.noteEn,p.noteBn,...(p.spouses||[]).flatMap(s=>[s.en,s.bn]),...(p.spouseGroups||[]).flatMap(g=>[g.spouseEn,g.spouseBn])].filter(Boolean).join(' ').toLowerCase();
  const initials=p=>lang()==='bn'?name(p).slice(0,2):name(p).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  function lineage(id){const a=[];let p=byId.get(id);while(p){a.unshift(p);p=parentById.get(p.id);}return a;}
  function siblings(id){const p=parentById.get(id);return p?(childrenById.get(p.id)||[]).filter(x=>x!==id).map(x=>byId.get(x)).filter(Boolean):[];}
  function personOptions(){return `<option value=""></option>${people.map(p=>`<option value="${esc(p.id)}">${esc(name(p))}</option>`).join('')}`;}

  function openPerson(id){
    const p=byId.get(id), input=$('searchInput');if(!p||!input)return;
    input.value=p.en||p.bn||'';input.dispatchEvent(new Event('input',{bubbles:true}));
    setTimeout(()=>{document.querySelector(`[data-search-person="${CSS.escape(id)}"]`)?.click()||document.querySelector(`[data-open-profile="${CSS.escape(id)}"]`)?.click();},80);
  }

  function modal(id,title,sub,body){return `<section id="${id}" class="family-modal"><div class="family-modal-head"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div><button class="family-modal-close" data-close-family type="button">×</button></div><div class="family-modal-body">${body}</div></section>`;}
  function ensureModals(){
    if($('familyStableBackdrop'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="familyStableBackdrop" class="family-modal-backdrop"></div><div id="familyStableMount"></div>`);
    $('familyStableBackdrop').addEventListener('click',closeModal);
    document.addEventListener('click',e=>{if(e.target.closest('[data-close-family]'))closeModal();});
  }
  function showModal(html,id){ensureModals();$('familyStableMount').innerHTML=html;$('familyStableBackdrop').classList.add('show');requestAnimationFrame(()=>$(`${id}`)?.classList.add('open'));}
  function closeModal(){$('familyStableBackdrop')?.classList.remove('show');document.querySelectorAll('.family-modal.open').forEach(m=>m.classList.remove('open'));setTimeout(()=>{if($('familyStableMount'))$('familyStableMount').innerHTML='';},180);}

  function showFinder(){
    showModal(modal('stableFinder',t('findTitle'),t('findSub'),`<div class="form-row"><input id="stableFindInput" class="family-field" placeholder="${esc(t('search'))}"></div><div id="stableFindResults" class="finder-results"></div>`),'stableFinder');
    const input=$('stableFindInput'), results=$('stableFindResults');
    const render=()=>{const q=input.value.trim().toLowerCase();const matches=q?people.filter(p=>searchText(p).includes(q)).slice(0,25):people.slice(0,12);results.innerHTML=matches.map(p=>`<button class="finder-result" data-stable-person="${esc(p.id)}"><span class="round" style="--g:${colors[(depthById.get(p.id)-1)%colors.length]}">${esc(initials(p))}</span><span><b>${esc(name(p))}</b><small>${esc(t('generation'))} ${depthById.get(p.id)}</small></span></button>`).join('');results.querySelectorAll('[data-stable-person]').forEach(b=>b.onclick=()=>{closeModal();openPerson(b.dataset.stablePerson);});};
    input.addEventListener('input',render);render();setTimeout(()=>input.focus(),50);
  }

  function relationship(a,b){
    if(a===b)return {label:t('same'),common:byId.get(a),path:[byId.get(a)]};
    const aa=lineage(a),bb=lineage(b),map=new Map(aa.map((p,i)=>[p.id,{p,d:aa.length-1-i,i}]));let common=null,bd=0;
    for(let i=bb.length-1;i>=0;i--){if(map.has(bb[i].id)){common=map.get(bb[i].id);bd=bb.length-1-i;break;}}
    if(!common)return {label:t('related'),common:null,path:[]};
    const ad=common.d;let label='';
    if(ad===0&&bd===1)label=t('parent');else if(ad===1&&bd===0)label=t('child');else if(ad===0&&bd===2)label=t('grandparent');else if(ad===2&&bd===0)label=t('grandchild');else if(ad===0&&bd>=3)label=t('greatGrandparent');else if(ad>=3&&bd===0)label=t('greatGrandchild');else if(ad===1&&bd===1)label=t('siblingsRel');else if(ad>=2&&bd>=2)label=t('cousin');else label=t('related');
    const aPart=aa.slice(common.i),bIndex=bb.findIndex(p=>p.id===common.p.id),bPart=bb.slice(bIndex+1);return {label,common:common.p,path:[...aPart,...bPart]};
  }
  function showRelationship(){
    showModal(modal('stableRel',t('relTitle'),'',`<div class="relationship-pickers"><label><span class="field-label">${esc(t('first'))}</span><select id="stableA" class="family-select">${personOptions()}</select></label><div class="relationship-vs">↔</div><label><span class="field-label">${esc(t('second'))}</span><select id="stableB" class="family-select">${personOptions()}</select></label></div><div class="modal-actions"><button id="stableCalc" class="primary">${esc(t('calculate'))}</button></div><div id="stableRelOut"></div>`),'stableRel');
    $('stableCalc').onclick=()=>{const a=$('stableA').value,b=$('stableB').value;if(!a||!b)return;const r=relationship(a,b);$('stableRelOut').innerHTML=`<div class="relationship-output"><h3 class="relationship-title">${esc(name(byId.get(a)))} ↔ ${esc(name(byId.get(b)))}</h3><p class="relationship-sub"><b>${esc(r.label)}</b>${r.common?` · ${esc(t('through'))} ${esc(name(r.common))}`:''}</p><div class="relationship-path">${r.path.map((p,i)=>`${i?'<i>→</i>':''}<button data-rel-person="${esc(p.id)}">${esc(name(p))}</button>`).join('')}</div></div>`;$('stableRelOut').querySelectorAll('[data-rel-person]').forEach(x=>x.onclick=()=>{closeModal();openPerson(x.dataset.relPerson);});};
  }

  function showGallery(){
    const withPhotos=people.filter(p=>photo(p));
    const body=withPhotos.length?`<div class="gallery-grid">${withPhotos.map(p=>`<article class="gallery-card"><div class="gallery-photo"><img src="${esc(photo(p))}" alt="${esc(name(p))}"></div><div><b>${esc(name(p))}</b><small>${esc(t('generation'))} ${depthById.get(p.id)}</small></div></article>`).join('')}</div>`:`<div class="empty-state"><strong>${esc(t('noPhotos'))}</strong></div>`;
    showModal(modal('stableGallery',t('galleryTitle'),t('gallerySub'),body),'stableGallery');
  }

  function generationFilter(depth){
    document.querySelectorAll('.person-card').forEach(card=>{const id=card.dataset.personId,d=depthById.get(id);card.classList.toggle('generation-dimmed',!!depth&&d!==depth);card.classList.toggle('generation-highlight',!!depth&&d===depth);});
    document.querySelectorAll('.generation-btn').forEach(b=>b.classList.toggle('active',String(depth||'all')===b.dataset.generation));
  }

  function ensureDock(){
    if($('featureDock'))return;
    const dock=document.createElement('div');dock.id='featureDock';dock.className='feature-dock';document.querySelector('.controls')?.insertAdjacentElement('afterend',dock);
    const find=document.createElement('button');find.className='feature-btn primary';find.textContent=t('find');find.onclick=showFinder;dock.appendChild(find);
    const rel=document.createElement('button');rel.className='feature-btn';rel.textContent=t('relation');rel.onclick=showRelationship;dock.appendChild(rel);
    const gal=document.createElement('button');gal.className='feature-btn';gal.textContent=t('gallery');gal.onclick=showGallery;dock.appendChild(gal);
    const strip=document.createElement('div');strip.className='generation-strip';strip.innerHTML=`<button class="generation-btn all active" data-generation="all">${esc(t('all'))}</button>${[...new Set([...depthById.values()])].sort((a,b)=>a-b).map(d=>`<button class="generation-btn" data-generation="${d}">${d}</button>`).join('')}`;dock.appendChild(strip);strip.querySelectorAll('[data-generation]').forEach(b=>b.onclick=()=>generationFilter(b.dataset.generation==='all'?0:Number(b.dataset.generation)));
    const trail=document.createElement('div');trail.id='activeTrail';trail.className='active-trail';dock.insertAdjacentElement('afterend',trail);
  }

  function decorateProfile(){
    const content=$('profileContent');if(!content)return;const focus=content.querySelector('[data-focus-person]');if(!focus)return;const id=focus.dataset.focusPerson;if(content.querySelector(`[data-stable-profile="${CSS.escape(id)}"]`))return;
    const p=byId.get(id);if(!p)return;const body=content.querySelector('.profile-body');if(!body)return;
    const line=lineage(id),sibs=siblings(id),details=[['birth',p.birth||p.birthEn||p.birthYear],['death',p.death||p.deathEn||p.deathYear],['location',lang()==='bn'?(p.locationBn||p.locationEn||p.location):(p.locationEn||p.locationBn||p.location)],['occupation',lang()==='bn'?(p.occupationBn||p.occupationEn||p.occupation):(p.occupationEn||p.occupationBn||p.occupation)]];
    const wrap=document.createElement('div');wrap.dataset.stableProfile=id;wrap.innerHTML=`<div class="profile-breadcrumbs"><span class="trail-label">${esc(t('lineage'))}</span>${line.map((x,i)=>`${i?'<i>›</i>':''}<button data-line-person="${esc(x.id)}">${esc(name(x))}</button>`).join('')}</div>${sibs.length?`<div class="profile-section"><div class="profile-section-head"><span>${esc(t('siblings'))}</span><b>${sibs.length}</b></div><div class="sibling-chips">${sibs.map(x=>`<button data-line-person="${esc(x.id)}">${esc(name(x))}</button>`).join('')}</div></div>`:''}<div class="profile-section"><div class="profile-section-head"><span>${esc(t('details'))}</span></div><div class="detail-grid">${details.map(([k,v])=>`<div class="detail-cell"><span>${esc(t(k))}</span><b>${esc(v||t('none'))}</b></div>`).join('')}</div></div>`;
    body.insertBefore(wrap,body.firstChild);wrap.querySelectorAll('[data-line-person]').forEach(b=>b.onclick=()=>openPerson(b.dataset.linePerson));
    const trail=$('activeTrail');if(trail){trail.classList.add('show');trail.innerHTML=`<span class="trail-label">${esc(t('lineage'))}</span>${line.map((x,i)=>`${i?'<span class="trail-arrow">›</span>':''}<button class="trail-node" data-trail-person="${esc(x.id)}">${esc(name(x))}</button>`).join('')}`;trail.querySelectorAll('[data-trail-person]').forEach(b=>b.onclick=()=>openPerson(b.dataset.trailPerson));}
  }

  function boot(){ensureDock();ensureModals();decorateProfile();new MutationObserver(()=>requestAnimationFrame(decorateProfile)).observe($('profileContent'),{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
