(() => {
  const $ = id => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>\'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const lang = () => document.documentElement.lang === 'bn' ? 'bn' : 'en';
  const pick = (obj,en,bn) => lang()==='bn' ? (obj?.[bn]||obj?.[en]||'') : (obj?.[en]||obj?.[bn]||'');
  const colors=['var(--g1)','var(--g2)','var(--g3)','var(--g4)','var(--g5)','var(--g6)','var(--g7)'];
  const text={
    en:{find:'Find My Family',relationship:'Relationship Finder',gallery:'Family Gallery',correct:'Suggest Correction',admin:'Admin Tools',generation:'Generation',all:'All',lineage:'Lineage',siblings:'Siblings',details:'Details',birth:'Birth',death:'Death',location:'Location',occupation:'Occupation',notRecorded:'Not recorded',moreDetails:'More details can be added later without changing the tree structure.',familyGathering:'Family Gathering Mode',gatheringSub:'Search your name and instantly open your part of the family tree.',searchName:'Type a family member name…',relTitle:'Find how two family members are related',personA:'First person',personB:'Second person',findRelationship:'Find relationship',selectPerson:'Select a person',through:'Relationship through',samePerson:'This is the same person.',siblingsRel:'siblings',halfSiblings:'half-siblings',parentRel:'parent',childRel:'child',grandparent:'grandparent',grandchild:'grandchild',greatGrandparent:'great-grandparent',greatGrandchild:'great-grandchild',auntUncle:'aunt/uncle',nieceNephew:'niece/nephew',cousin:'cousin',removed:'removed',once:'once',twice:'twice',times:'times',noRelationship:'No blood-line relationship could be calculated from the recorded tree.',photos:'Family photographs',noPhotos:'No family photographs have been added to the official tree yet.',noPhotosSub:'The gallery is ready. When photos are added to a person record, they will appear here automatically.',suggestPhoto:'Suggest a photo',correctionTitle:'Add or correct family information',person:'Family member',type:'What needs changing?',detailsField:'Correction / new information',submitter:'Your name (optional)',save:'Save suggestion',share:'Share suggestion',github:'Open GitHub issue',saved:'Suggestion saved on this device.',nameSpelling:'Name spelling',spouse:'Spouse',child:'Child',parents:'Father / Mother',photo:'Photo',dates:'Birth / death / details',other:'Other',adminTitle:'Local Admin Tools',adminSub:'Review this device’s saved suggestions and export family data. This is a browser tool, not a secure server login.',people:'People',generations:'Generations',photosCount:'Photos',suggestions:'Suggestions',audit:'Data audit',noPhoto:'People without photos',placeholders:'Placeholder/unnamed entries',exportSuggestions:'Export suggestions',exportTree:'Export family snapshot',clearSuggestions:'Clear local suggestions',noSuggestions:'No saved suggestions on this device.',copied:'Copied',savedOnDevice:'Saved only on this browser/device.',openPerson:'Open person',born:'Born',died:'Died'},
    bn:{find:'আমার পরিবার খুঁজুন',relationship:'সম্পর্ক খুঁজুন',gallery:'পারিবারিক গ্যালারি',correct:'তথ্য সংশোধন করুন',admin:'অ্যাডমিন টুলস',generation:'প্রজন্ম',all:'সব',lineage:'বংশধারা',siblings:'ভাই-বোন',details:'বিস্তারিত',birth:'জন্ম',death:'মৃত্যু',location:'স্থান',occupation:'পেশা',notRecorded:'নথিভুক্ত নেই',moreDetails:'গাছের কাঠামো পরিবর্তন না করেই পরে আরও তথ্য যোগ করা যাবে।',familyGathering:'পারিবারিক সমাবেশ মোড',gatheringSub:'নিজের নাম খুঁজে পরিবারের শাখা দ্রুত খুলুন।',searchName:'পরিবারের সদস্যের নাম লিখুন…',relTitle:'দুই পরিবারের সদস্যের সম্পর্ক খুঁজুন',personA:'প্রথম ব্যক্তি',personB:'দ্বিতীয় ব্যক্তি',findRelationship:'সম্পর্ক দেখুন',selectPerson:'একজনকে নির্বাচন করুন',through:'যার মাধ্যমে সম্পর্ক',samePerson:'এটি একই ব্যক্তি।',siblingsRel:'ভাই-বোন',halfSiblings:'সৎ ভাই-বোন',parentRel:'পিতা/মাতা',childRel:'সন্তান',grandparent:'দাদা/দাদি/নানা/নানি',grandchild:'নাতি/নাতনি',greatGrandparent:'প্রপিতামহ/প্রমাতামহ',greatGrandchild:'প্রপৌত্র/প্রপৌত্রী',auntUncle:'চাচা/মামা/খালা/ফুফু',nieceNephew:'ভাতিজা/ভাতিজি/ভাগ্নে/ভাগ্নি',cousin:'কাজিন',removed:'প্রজন্ম ব্যবধান',once:'এক',twice:'দুই',times:'বার',noRelationship:'নথিভুক্ত বংশধারা থেকে সম্পর্ক নির্ণয় করা যায়নি।',photos:'পারিবারিক ছবি',noPhotos:'এখনও কোনো পারিবারিক ছবি অফিসিয়াল গাছে যোগ করা হয়নি।',noPhotosSub:'গ্যালারি প্রস্তুত। কোনো ব্যক্তির রেকর্ডে ছবি যোগ হলে তা এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।',suggestPhoto:'ছবি যোগের প্রস্তাব দিন',correctionTitle:'পারিবারিক তথ্য যোগ বা সংশোধন করুন',person:'পরিবারের সদস্য',type:'কী পরিবর্তন দরকার?',detailsField:'সংশোধন / নতুন তথ্য',submitter:'আপনার নাম (ঐচ্ছিক)',save:'প্রস্তাব সংরক্ষণ',share:'শেয়ার করুন',github:'GitHub issue খুলুন',saved:'এই ডিভাইসে প্রস্তাব সংরক্ষিত হয়েছে।',nameSpelling:'নামের বানান',spouse:'স্বামী/স্ত্রী',child:'সন্তান',parents:'পিতা / মাতা',photo:'ছবি',dates:'জন্ম / মৃত্যু / অন্যান্য তথ্য',other:'অন্যান্য',adminTitle:'লোকাল অ্যাডমিন টুলস',adminSub:'এই ডিভাইসের প্রস্তাব দেখুন এবং পারিবারিক ডেটা এক্সপোর্ট করুন। এটি নিরাপদ সার্ভার লগইন নয়।',people:'ব্যক্তি',generations:'প্রজন্ম',photosCount:'ছবি',suggestions:'প্রস্তাব',audit:'ডেটা যাচাই',noPhoto:'যাদের ছবি নেই',placeholders:'নামহীন/প্লেসহোল্ডার এন্ট্রি',exportSuggestions:'প্রস্তাব এক্সপোর্ট',exportTree:'ফ্যামিলি স্ন্যাপশট এক্সপোর্ট',clearSuggestions:'লোকাল প্রস্তাব মুছুন',noSuggestions:'এই ডিভাইসে কোনো সংরক্ষিত প্রস্তাব নেই।',copied:'কপি হয়েছে',savedOnDevice:'শুধু এই ব্রাউজার/ডিভাইসে সংরক্ষিত।',openPerson:'ব্যক্তি খুলুন',born:'জন্ম',died:'মৃত্যু'}
  };
  const t=k=>text[lang()][k]||k;

  function buildRoot(){
    const n=familyData.rootTrail.find(p=>p.id==='nayeb-chowdhury')||familyData.rootTrail.find(p=>p.id==='nayer-chowdhury')||familyData.rootTrail[0];
    const c=familyData.rootTrail.find(p=>p.id==='chan-gazi-hawladar')||familyData.rootTrail[1];
    return {...n,children:[{...c,children:[familyData.main,familyData.secondary]}]};
  }
  const root=buildRoot();
  const people=[],byId=new Map(),parentById=new Map(),depthById=new Map(),parentInfo=new Map(),childrenById=new Map();
  const isFemale=p=>String(p?.relationEn||'').toLowerCase()==='daughter'||String(p?.relationBn||'').includes('মেয়ে')||String(p?.relationBn||'').includes('মেয়ে');
  const isUnknown=(en='',bn='')=>/name (not recorded|unknown)/i.test(en)||/নাম (নথিভুক্ত নেই|অজানা)/.test(bn);
  const personRef=p=>p?{id:p.id||null,en:p.en||'',bn:p.bn||''}:null;
  const spouseRef=s=>{if(!s)return null;const en=s.en||s.spouseEn||'',bn=s.bn||s.spouseBn||'';return (!en&&!bn)||isUnknown(en,bn)?null:{id:null,en,bn};};
  function entries(p){
    const direct=(p.children||[]).map(ch=>({person:ch,group:null}));
    const grouped=(p.spouseGroups||[]).flatMap((g,i)=>(g.children||[]).map(ch=>({person:ch,group:g,groupIndex:i})));
    return [...direct,...grouped];
  }
  function index(p,parent=null,depth=1,parents=null){
    if(!p?.id)return;
    if(!byId.has(p.id)){people.push(p);byId.set(p.id,p);} depthById.set(p.id,depth);
    if(parent)parentById.set(p.id,parent); if(parents)parentInfo.set(p.id,parents);
    const kids=[]; childrenById.set(p.id,kids);
    const female=isFemale(p), single=(p.spouses||[]).length===1?spouseRef(p.spouses[0]):null;
    (p.children||[]).forEach(ch=>{kids.push(ch.id); index(ch,p,depth+1,female?{father:single,mother:personRef(p)}:{father:personRef(p),mother:single});});
    (p.spouseGroups||[]).forEach(g=>{const s=spouseRef(g);(g.children||[]).forEach(ch=>{kids.push(ch.id);index(ch,p,depth+1,female?{father:s,mother:personRef(p)}:{father:personRef(p),mother:s});});});
  }
  index(root);
  const maxDepth=Math.max(...depthById.values());
  const personName=p=>lang()==='bn'?(p.bn||p.en||''):(p.en||p.bn||'');
  const initials=p=>lang()==='bn'?personName(p).slice(0,2):personName(p).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const photoOf=p=>p?.photoUrl||p?.photo||p?.image||'';
  function lineage(id){const arr=[];let p=byId.get(id);while(p){arr.unshift(p);p=parentById.get(p.id);}return arr;}
  function siblings(id){const p=parentById.get(id);if(!p)return[];return (childrenById.get(p.id)||[]).filter(x=>x!==id).map(x=>byId.get(x)).filter(Boolean);}
  function sameMother(a,b){const pa=parentInfo.get(a),pb=parentInfo.get(b);const key=x=>x?`${x.id||''}|${x.en||''}|${x.bn||''}`:'';return key(pa?.mother)&&key(pa?.mother)===key(pb?.mother);}
  function searchText(p){return [p.en,p.bn,p.noteEn,p.noteBn,p.occupationEn,p.occupationBn,p.locationEn,p.locationBn,...(p.spouses||[]).flatMap(s=>[s.en,s.bn]),...(p.spouseGroups||[]).flatMap(g=>[g.spouseEn,g.spouseBn])].filter(Boolean).join(' ').toLowerCase();}

  function openPerson(id){
    const p=byId.get(id);if(!p)return;
    const input=$('searchInput');if(!input)return;
    input.value=p.en||p.bn||'';input.dispatchEvent(new Event('input',{bubbles:true}));
    setTimeout(()=>{const r=document.querySelector(`[data-search-person="${CSS.escape(id)}"]`);if(r)r.click();else{const c=document.querySelector(`[data-open-profile="${CSS.escape(id)}"]`);c?.click();}},60);
  }

  function modalShell(id,title,sub,body){return `<section id="${id}" class="family-modal" aria-hidden="true"><div class="family-modal-head"><div><h2>${esc(title)}</h2><p>${esc(sub||'')}</p></div><button class="family-modal-close" type="button" data-close-modal>×</button></div><div class="family-modal-body">${body}</div></section>`;}
  function ensureUI(){
    if($('featureDock'))return;
    const controls=document.querySelector('.controls');
    const dock=document.createElement('div');dock.id='featureDock';dock.className='feature-dock';controls.insertAdjacentElement('afterend',dock);
    const trail=document.createElement('div');trail.id='activeTrail';trail.className='active-trail';dock.insertAdjacentElement('afterend',trail);
    document.body.insertAdjacentHTML('beforeend',`<div id="familyModalBackdrop" class="family-modal-backdrop"></div><div id="familyModalMount"></div>`);
    renderFeatureDock();buildModals();bindV3();
  }
  function renderFeatureDock(){
    const dock=$('featureDock');if(!dock)return;
    dock.innerHTML=`<button class="feature-btn primary" data-open-modal="gatheringModal">${esc(t('find'))}</button><button class="feature-btn" data-open-modal="relationshipModal">${esc(t('relationship'))}</button><button class="feature-btn" data-open-modal="galleryModal">${esc(t('gallery'))}</button><button class="feature-btn" data-open-modal="correctionModal">${esc(t('correct'))}</button><button class="feature-btn" data-open-modal="adminModal">${esc(t('admin'))}<span class="count" id="suggestionCount">0</span></button><div class="generation-strip"><button class="generation-btn all active" data-generation="all">${esc(t('all'))}</button>${Array.from({length:maxDepth},(_,i)=>`<button class="generation-btn" data-generation="${i+1}">${i+1}</button>`).join('')}</div>`;
    updateSuggestionCount();
  }
  function buildModals(){
    const opts=people.map(p=>`<option value="${esc(p.id)}">${esc(personName(p))}</option>`).join('');
    const bodyGather=`<div class="gathering-hero"><div class="family-icon">FT</div><h3>${esc(t('familyGathering'))}</h3><p>${esc(t('gatheringSub'))}</p></div><div class="form-row"><label class="field-label">${esc(t('searchName'))}</label><input id="gatheringSearch" class="family-field" type="search" autocomplete="off" placeholder="${esc(t('searchName'))}"><div id="gatheringResults" class="finder-results"></div></div><div class="quick-actions"><button data-switch-modal="relationshipModal">${esc(t('relationship'))}</button><button data-switch-modal="correctionModal">${esc(t('correct'))}</button><button data-switch-modal="galleryModal">${esc(t('gallery'))}</button></div>`;
    const bodyRel=`<div class="relationship-pickers"><div><label class="field-label">${esc(t('personA'))}</label><select id="relationshipA" class="family-select"><option value="">${esc(t('selectPerson'))}</option>${opts}</select></div><div class="relationship-vs">↔</div><div><label class="field-label">${esc(t('personB'))}</label><select id="relationshipB" class="family-select"><option value="">${esc(t('selectPerson'))}</option>${opts}</select></div></div><div class="modal-actions"><button id="findRelationshipBtn" class="primary" type="button">${esc(t('findRelationship'))}</button></div><div id="relationshipOutput"></div>`;
    const bodyGallery=`<div id="galleryContent"></div>`;
    const types=[['name',t('nameSpelling')],['spouse',t('spouse')],['child',t('child')],['parents',t('parents')],['photo',t('photo')],['dates',t('dates')],['other',t('other')]];
    const bodyCorrection=`<div class="form-grid"><div class="form-row"><label class="field-label">${esc(t('person'))}</label><select id="correctionPerson" class="family-select"><option value="">${esc(t('selectPerson'))}</option>${opts}</select></div><div class="form-row"><label class="field-label">${esc(t('type'))}</label><select id="correctionType" class="family-select">${types.map(x=>`<option value="${x[0]}">${esc(x[1])}</option>`).join('')}</select></div></div><div class="form-row"><label class="field-label">${esc(t('detailsField'))}</label><textarea id="correctionDetails" class="family-textarea"></textarea></div><div class="form-row"><label class="field-label">${esc(t('submitter'))}</label><input id="correctionSubmitter" class="family-field" type="text"></div><div class="modal-actions"><button id="saveSuggestionBtn" class="primary" type="button">${esc(t('save'))}</button><button id="shareSuggestionBtn" class="warm" type="button">${esc(t('share'))}</button><a id="githubIssueLink" href="#" target="_blank" rel="noopener">${esc(t('github'))}</a></div><p class="modal-note">${esc(t('savedOnDevice'))}</p>`;
    const bodyAdmin=`<div id="adminContent"></div>`;
    $('familyModalMount').innerHTML=modalShell('gatheringModal',t('find'),t('gatheringSub'),bodyGather)+modalShell('relationshipModal',t('relationship'),t('relTitle'),bodyRel)+modalShell('galleryModal',t('gallery'),t('photos'),bodyGallery)+modalShell('correctionModal',t('correct'),t('correctionTitle'),bodyCorrection)+modalShell('adminModal',t('admin'),t('adminSub'),bodyAdmin);
    renderGallery();renderAdmin();renderGatheringResults('');
  }
  function openModal(id){document.querySelectorAll('.family-modal.open').forEach(m=>{m.classList.remove('open');m.setAttribute('aria-hidden','true')});const m=$(id);if(!m)return;m.classList.add('open');m.setAttribute('aria-hidden','false');$('familyModalBackdrop').classList.add('show');document.body.style.overflow='hidden';if(id==='galleryModal')renderGallery();if(id==='adminModal')renderAdmin();}
  function closeModals(){document.querySelectorAll('.family-modal.open').forEach(m=>{m.classList.remove('open');m.setAttribute('aria-hidden','true')});$('familyModalBackdrop')?.classList.remove('show');document.body.style.overflow='';}

  function decoratePhotos(){
    document.querySelectorAll('.person-card[data-person-id]').forEach(card=>{const p=byId.get(card.dataset.personId),url=photoOf(p),av=card.querySelector('.avatar');if(url&&av&&!av.querySelector('img')){av.classList.add('has-photo');av.innerHTML=`<img src="${esc(url)}" alt="${esc(personName(p))}">`;}});
    const focus=$('profileContent')?.querySelector('[data-focus-person]');if(focus){const p=byId.get(focus.dataset.focusPerson),url=photoOf(p),av=$('profileContent').querySelector('.profile-avatar');if(url&&av&&!av.querySelector('img')){av.classList.add('has-photo');av.innerHTML=`<img src="${esc(url)}" alt="${esc(personName(p))}">`;}}
  }
  function detailValue(p,key){return pick(p,key+'En',key+'Bn')||p[key]||'';}
  function decorateProfile(){
    const content=$('profileContent');if(!content)return;const focus=content.querySelector('[data-focus-person]');if(!focus)return;const id=focus.dataset.focusPerson,p=byId.get(id),body=content.querySelector('.profile-body');if(!p||!body)return;
    decoratePhotos();
    let crumbs=body.querySelector('.profile-breadcrumbs');if(!crumbs){crumbs=document.createElement('div');crumbs.className='profile-breadcrumbs';body.insertBefore(crumbs,body.firstChild);}const line=lineage(id);crumbs.innerHTML=line.map((x,i)=>`${i?'<i>›</i>':''}<button type="button" data-v3-open-person="${esc(x.id)}">${esc(personName(x))}</button>`).join('');
    let rich=body.querySelector('.profile-v3-sections');if(!rich){rich=document.createElement('div');rich.className='profile-v3-sections';body.appendChild(rich);}const sibs=siblings(id);const detailPairs=[[t('birth'),detailValue(p,'birth')||detailValue(p,'born')],[t('death'),detailValue(p,'death')||detailValue(p,'died')],[t('location'),detailValue(p,'location')],[t('occupation'),detailValue(p,'occupation')]].filter(x=>x[1]);
    rich.innerHTML=`<div class="profile-section"><div class="profile-section-head"><span>${esc(t('siblings'))}</span><b>${sibs.length}</b></div>${sibs.length?`<div class="sibling-chips">${sibs.map(s=>`<button type="button" data-v3-open-person="${esc(s.id)}">${esc(personName(s))}</button>`).join('')}</div>`:`<p class="detail-empty">${esc(t('notRecorded'))}</p>`}</div><div class="profile-section"><div class="profile-section-head"><span>${esc(t('details'))}</span></div>${detailPairs.length?`<div class="detail-grid">${detailPairs.map(x=>`<div class="detail-cell"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('')}</div>`:`<p class="detail-empty">${esc(t('moreDetails'))}</p>`}<div class="profile-extra-actions"><button class="accent" type="button" data-correct-person="${esc(id)}">${esc(t('correct'))}</button><button type="button" data-relationship-person="${esc(id)}">${esc(t('relationship'))}</button></div></div>`;
    updateTrail(id);
  }
  function updateTrail(id){const el=$('activeTrail');if(!el)return;const line=lineage(id);el.classList.toggle('show',!!line.length);el.innerHTML=`<span class="trail-label">${esc(t('lineage'))}</span>${line.map((p,i)=>`${i?'<span class="trail-arrow">›</span>':''}<button class="trail-node" type="button" data-v3-open-person="${esc(p.id)}">${esc(personName(p))}</button>`).join('')}`;}

  function focusGeneration(g){
    document.querySelectorAll('.generation-btn').forEach(b=>b.classList.toggle('active',b.dataset.generation===String(g)));
    if(g==='all'){document.querySelectorAll('.person-card').forEach(c=>c.classList.remove('generation-dimmed','generation-highlight'));return;}
    if(document.querySelectorAll('.person-card').length<people.length){const b=$('expandAllBtn');if(b)b.click();}
    setTimeout(()=>{document.querySelectorAll('.person-card[data-person-id]').forEach(c=>{const match=depthById.get(c.dataset.personId)===Number(g);c.classList.toggle('generation-highlight',match);c.classList.toggle('generation-dimmed',!match);});const first=[...document.querySelectorAll('.person-card.generation-highlight')][0];first?.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});},90);
  }

  function relationship(a,b){
    if(!a||!b)return null;if(a===b)return{label:t('samePerson'),path:[a]};
    const A=lineage(a).map(p=>p.id),B=lineage(b).map(p=>p.id);let i=0;while(i<Math.min(A.length,B.length)&&A[i]===B[i])i++;const lca=A[i-1],up=A.length-i,down=B.length-i;const path=[...A.slice(i).reverse(),lca,...B.slice(i)];let label='';
    if(up===0||down===0){const d=Math.max(up,down),aIsAncestor=up===0;if(d===1)label=aIsAncestor?t('parentRel'):t('childRel');else if(d===2)label=aIsAncestor?t('grandparent'):t('grandchild');else label=aIsAncestor?t('greatGrandparent'):t('greatGrandchild');}
    else if(up===1&&down===1)label=sameMother(a,b)?t('siblingsRel'):t('halfSiblings');
    else if(up===1&&down>=2)label=t('auntUncle');
    else if(up>=2&&down===1)label=t('nieceNephew');
    else{const degree=Math.min(up,down)-1,removed=Math.abs(up-down);label=`${ordinal(degree)} ${t('cousin')}`+(removed?` · ${removed===1?t('once'):removed===2?t('twice'):removed+' '+t('times')} ${t('removed')}`:'');}
    return{label,path,lca};
  }
  function ordinal(n){if(lang()==='bn')return`${n}`;const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
  function renderRelationship(){const a=$('relationshipA')?.value,b=$('relationshipB')?.value,out=$('relationshipOutput');if(!out)return;if(!a||!b){out.innerHTML='';return;}const r=relationship(a,b);if(!r){out.innerHTML=`<div class="relationship-output"><p>${esc(t('noRelationship'))}</p></div>`;return;}const lca=byId.get(r.lca);out.innerHTML=`<div class="relationship-output"><h3 class="relationship-title">${esc(r.label)}</h3>${lca?`<p class="relationship-sub">${esc(t('through'))}: <b>${esc(personName(lca))}</b></p>`:''}<div class="relationship-path">${r.path.map((id,i)=>`${i?'<i>→</i>':''}<button type="button" data-v3-open-person="${esc(id)}">${esc(personName(byId.get(id)))}</button>`).join('')}</div></div>`;}

  function renderGatheringResults(q){const box=$('gatheringResults');if(!box)return;const s=(q||'').trim().toLowerCase();const matches=(s?people.filter(p=>searchText(p).includes(s)):people.slice(0,12)).slice(0,18);box.innerHTML=matches.map(p=>`<button class="finder-result" type="button" data-gathering-person="${esc(p.id)}"><span class="round" style="--g:${colors[(depthById.get(p.id)-1)%colors.length]}">${esc(initials(p))}</span><span><b>${esc(personName(p))}</b><small>${esc(t('generation'))} ${depthById.get(p.id)}</small></span></button>`).join('');}

  const suggestionKey='familyTreeSuggestionsV1';
  const getSuggestions=()=>{try{return JSON.parse(localStorage.getItem(suggestionKey)||'[]')}catch(_){return[]}};
  const setSuggestions=x=>localStorage.setItem(suggestionKey,JSON.stringify(x));
  function suggestionPayload(){const id=$('correctionPerson')?.value,p=byId.get(id),type=$('correctionType')?.value||'other',details=$('correctionDetails')?.value.trim()||'',submitter=$('correctionSubmitter')?.value.trim()||'';if(!p||!details)return null;return{id,type,personEn:p.en||'',personBn:p.bn||'',details,submitter,createdAt:new Date().toISOString()};}
  function suggestionText(s){return `Family Tree Suggestion\nPerson: ${s.personEn}${s.personBn?` / ${s.personBn}`:''}\nType: ${s.type}\nDetails: ${s.details}${s.submitter?`\nSubmitted by: ${s.submitter}`:''}`;}
  function saveSuggestion(){const s=suggestionPayload();if(!s)return;const arr=getSuggestions();arr.unshift(s);setSuggestions(arr);updateSuggestionCount();renderAdmin();showToast(t('saved'));updateIssueLink(s);}
  async function shareSuggestion(){const s=suggestionPayload();if(!s)return;const msg=suggestionText(s);if(navigator.share){try{await navigator.share({title:'Family Tree Suggestion',text:msg,url:location.href});return}catch(_){}}try{await navigator.clipboard.writeText(msg);showToast(t('copied'))}catch(_){window.prompt('Copy',msg)}}
  function updateIssueLink(s=suggestionPayload()){const a=$('githubIssueLink');if(!a)return;if(!s){a.href='https://github.com/ZRSaimun/Family-Tree/issues/new';return;}a.href=`https://github.com/ZRSaimun/Family-Tree/issues/new?title=${encodeURIComponent('Family tree correction: '+s.personEn)}&body=${encodeURIComponent(suggestionText(s))}`;}
  function openCorrection(id,type){openModal('correctionModal');if(id&&$('correctionPerson'))$('correctionPerson').value=id;if(type&&$('correctionType'))$('correctionType').value=type;updateIssueLink();setTimeout(()=>$('correctionDetails')?.focus(),80);}
  function updateSuggestionCount(){const el=$('suggestionCount');if(el)el.textContent=getSuggestions().length;}

  function renderGallery(){const box=$('galleryContent');if(!box)return;const withPhotos=people.filter(p=>photoOf(p));if(!withPhotos.length){box.innerHTML=`<div class="empty-state"><strong>${esc(t('noPhotos'))}</strong><p>${esc(t('noPhotosSub'))}</p><div class="modal-actions" style="justify-content:center"><button class="warm" type="button" data-suggest-photo>${esc(t('suggestPhoto'))}</button></div></div>`;return;}box.innerHTML=`<div class="gallery-grid">${withPhotos.map(p=>`<button class="gallery-card" type="button" data-v3-open-person="${esc(p.id)}"><div class="gallery-photo"><img src="${esc(photoOf(p))}" alt="${esc(personName(p))}"></div><div><b>${esc(personName(p))}</b><small>${esc(t('generation'))} ${depthById.get(p.id)}</small></div></button>`).join('')}</div>`;}
  function download(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  function renderAdmin(){const box=$('adminContent');if(!box)return;const suggestions=getSuggestions(),photos=people.filter(p=>photoOf(p)).length,placeholders=people.filter(p=>p.placeholder||isUnknown(p.en,p.bn)).length;box.innerHTML=`<div class="admin-stats"><div class="admin-stat"><b>${people.length}</b><span>${esc(t('people'))}</span></div><div class="admin-stat"><b>${maxDepth}</b><span>${esc(t('generations'))}</span></div><div class="admin-stat"><b>${photos}</b><span>${esc(t('photosCount'))}</span></div><div class="admin-stat"><b>${suggestions.length}</b><span>${esc(t('suggestions'))}</span></div></div><div class="profile-section"><div class="profile-section-head"><span>${esc(t('audit'))}</span></div><div class="audit-list"><div class="audit-row"><span>${esc(t('noPhoto'))}</span><b>${people.length-photos}</b></div><div class="audit-row"><span>${esc(t('placeholders'))}</span><b>${placeholders}</b></div></div></div><div class="profile-section"><div class="profile-section-head"><span>${esc(t('suggestions'))}</span><b>${suggestions.length}</b></div>${suggestions.length?`<div class="suggestion-list">${suggestions.slice(0,30).map(s=>`<div class="suggestion-item"><b>${esc(s.personEn||s.personBn)} · ${esc(s.type)}</b><p>${esc(s.details)}</p><small>${esc(new Date(s.createdAt).toLocaleString())}</small></div>`).join('')}</div>`:`<p class="detail-empty">${esc(t('noSuggestions'))}</p>`}</div><div class="modal-actions"><button id="exportSuggestionsBtn" type="button">${esc(t('exportSuggestions'))}</button><button id="exportTreeBtn" type="button">${esc(t('exportTree'))}</button><button id="clearSuggestionsBtn" type="button">${esc(t('clearSuggestions'))}</button></div>`;}
  function snapshot(){return people.map(p=>({id:p.id,en:p.en||'',bn:p.bn||'',generation:depthById.get(p.id),parentId:parentById.get(p.id)?.id||null,parents:parentInfo.get(p.id)||null,spouses:p.spouses||[],spouseGroups:(p.spouseGroups||[]).map(g=>({spouseEn:g.spouseEn||'',spouseBn:g.spouseBn||''})),photo:photoOf(p)||null,noteEn:p.noteEn||'',noteBn:p.noteBn||''}));}
  function showToast(msg){const el=$('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1600);}

  function bindV3(){
    document.addEventListener('click',e=>{
      const om=e.target.closest('[data-open-modal]');if(om){openModal(om.dataset.openModal);return;}
      if(e.target.closest('[data-close-modal]')){closeModals();return;}
      const sm=e.target.closest('[data-switch-modal]');if(sm){openModal(sm.dataset.switchModal);return;}
      const op=e.target.closest('[data-v3-open-person]');if(op){closeModals();openPerson(op.dataset.v3OpenPerson);return;}
      const gp=e.target.closest('[data-gathering-person]');if(gp){closeModals();openPerson(gp.dataset.gatheringPerson);return;}
      const cp=e.target.closest('[data-correct-person]');if(cp){openCorrection(cp.dataset.correctPerson);return;}
      const rp=e.target.closest('[data-relationship-person]');if(rp){openModal('relationshipModal');$('relationshipA').value=rp.dataset.relationshipPerson;return;}
      const gb=e.target.closest('[data-generation]');if(gb){focusGeneration(gb.dataset.generation);return;}
      if(e.target.closest('[data-suggest-photo]')){openCorrection('', 'photo');return;}
      if(e.target.id==='exportSuggestionsBtn'){download('family-tree-suggestions.json',getSuggestions());return;}
      if(e.target.id==='exportTreeBtn'){download('family-tree-snapshot.json',snapshot());return;}
      if(e.target.id==='clearSuggestionsBtn'){if(confirm('Clear saved suggestions from this device?')){setSuggestions([]);updateSuggestionCount();renderAdmin();}return;}
    });
    $('familyModalBackdrop')?.addEventListener('click',closeModals);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModals();});
    document.addEventListener('input',e=>{if(e.target.id==='gatheringSearch')renderGatheringResults(e.target.value);if(['correctionPerson','correctionType','correctionDetails','correctionSubmitter'].includes(e.target.id))updateIssueLink();});
    document.addEventListener('change',e=>{if(['correctionPerson','correctionType'].includes(e.target.id))updateIssueLink();});
    document.addEventListener('click',e=>{if(e.target.id==='findRelationshipBtn')renderRelationship();if(e.target.id==='saveSuggestionBtn')saveSuggestion();if(e.target.id==='shareSuggestionBtn')shareSuggestion();});
    const pc=$('profileContent');if(pc)new MutationObserver(()=>requestAnimationFrame(decorateProfile)).observe(pc,{childList:true,subtree:true});
    const th=$('treeHost');if(th)new MutationObserver(()=>requestAnimationFrame(decoratePhotos)).observe(th,{childList:true,subtree:true});
    new MutationObserver(()=>{renderFeatureDock();buildModals();decorateProfile();decoratePhotos();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }

  ensureUI();decoratePhotos();decorateProfile();
})();