(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const rand = (a=0,b=1) => a + Math.random()*(b-a);
  const choice = a => a[Math.floor(Math.random()*a.length)];
  const shuffle = a => { const out=[...a]; for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out; };

  const copy = v => JSON.parse(JSON.stringify(v));
  const childrenOf = p => [
    ...(p?.children || []),
    ...(p?.spouseGroups || []).flatMap(g => g.children || [])
  ];

  function buildRoot(data=window.familyData || familyData){
    const r=(data.rootTrail||[]).find(p=>p.id==='nayeb-chowdhury') || (data.rootTrail||[])[0];
    const c=(data.rootTrail||[]).find(p=>p.id==='chan-gazi-hawladar') || (data.rootTrail||[])[1];
    return r&&c ? {...copy(r),children:[{...copy(c),children:[copy(data.main),copy(data.secondary)]}]} : null;
  }

  const TEXT={
    en:{
      launch:'Presentation Mode', launchSub:'Cinematic family show', exit:'Exit', pause:'Pause', play:'Play', next:'Next', speed:'Speed',
      heritage:'Family Heritage', lineage:'Nayeb Chowdhury Lineage', from:'From', to:'to', generation:'Generation', descendants:'recorded descendants', children:'children',
      branch:'Family Branch', journey:'A journey through generations', together:'One family. Many stories.', roots:'Where our story begins',
      discover:'Discovering another branch…', connected:'Connected through generations', familyOf:'Family of', spouse:'Spouse', wives:'Marriage branches',
      cinematic:'Cinematic', relaxed:'Relaxed', lively:'Lively', auto:'Generative Heritage Engine', live:'LIVE FAMILY STORY',
      tip:'Space: pause • →: next • Esc: exit'
    },
    bn:{
      launch:'পারিবারিক প্রদর্শনী', launchSub:'সিনেমাটিক পরিবার শো', exit:'বন্ধ করুন', pause:'বিরতি', play:'চালু করুন', next:'পরবর্তী', speed:'গতি',
      heritage:'পারিবারিক ঐতিহ্য', lineage:'নায়েব চৌধুরীর বংশধারা', from:'থেকে', to:'থেকে', generation:'প্রজন্ম', descendants:'নথিভুক্ত বংশধর', children:'সন্তান',
      branch:'পারিবারিক শাখা', journey:'প্রজন্মের পর প্রজন্মের গল্প', together:'এক পরিবার। অসংখ্য গল্প।', roots:'যেখান থেকে আমাদের গল্প শুরু',
      discover:'আরেকটি শাখা আবিষ্কার করা হচ্ছে…', connected:'প্রজন্মের বন্ধনে সংযুক্ত', familyOf:'পরিবার', spouse:'স্বামী/স্ত্রী', wives:'বিবাহের শাখা',
      cinematic:'সিনেমাটিক', relaxed:'ধীর', lively:'দ্রুত', auto:'জেনারেটিভ হেরিটেজ ইঞ্জিন', live:'জীবন্ত পারিবারিক গল্প',
      tip:'Space: বিরতি • →: পরবর্তী • Esc: বন্ধ'
    }
  };

  const state={
    active:false, paused:false, timer:null, raf:null, startedAt:0, duration:12000,
    speed:1, sceneNo:0, lastTypes:[], recentKeys:[], current:null, people:[], byId:new Map(), parent:new Map(), depth:new Map(), branch:new Map(), root:null,
    particles:[], ctx:null, canvas:null, width:0, height:0, dpr:1, themeIndex:0
  };

  const lang = () => document.documentElement.lang==='bn' ? 'bn' : 'en';
  const t = k => TEXT[lang()][k] || k;
  const name = p => lang()==='bn' ? (p?.bn||p?.en||'') : (p?.en||p?.bn||'');
  const note = p => lang()==='bn' ? (p?.noteBn||p?.noteEn||'') : (p?.noteEn||p?.noteBn||'');

  function indexData(){
    state.root=buildRoot(); state.people=[]; state.byId=new Map(); state.parent=new Map(); state.depth=new Map(); state.branch=new Map();
    const walk=(p,parent=null,depth=1,branch='root')=>{
      if(!p?.id)return;
      if(!state.byId.has(p.id)){state.people.push(p);state.byId.set(p.id,p);} state.depth.set(p.id,depth); if(parent)state.parent.set(p.id,parent);
      let b=branch;
      if(p.id==='mohabbat-ali-munsir')b='mohabbat'; if(p.id==='abdullah-chamra')b='abdullah';
      state.branch.set(p.id,b);
      childrenOf(p).forEach(c=>walk(c,p,depth+1,b));
    };
    if(state.root) walk(state.root);
  }

  function lineage(p){
    const out=[]; let cur=p; while(cur){out.unshift(cur);cur=state.parent.get(cur.id);} return out;
  }
  function descendants(p){
    const out=[]; const walk=x=>childrenOf(x).forEach(c=>{out.push(c);walk(c);}); walk(p); return out;
  }
  function descendantCount(p){return descendants(p).length;}
  function spouses(p){return [...(p.spouses||[]).map(s=>name(s)),...(p.spouseGroups||[]).map(g=>lang()==='bn'?(g.spouseBn||g.spouseEn):(g.spouseEn||g.spouseBn))].filter(Boolean);}
  function branchRoot(key){return state.byId.get(key==='abdullah'?'abdullah-chamra':'mohabbat-ali-munsir');}

  const THEMES=['aurora','nebula','ember','ocean','violet','gold'];
  function nextTheme(){state.themeIndex=(state.themeIndex+1+Math.floor(Math.random()*2))%THEMES.length;return THEMES[state.themeIndex];}

  function createUI(){
    if($('cinemaRoot')) return;
    const launch=document.createElement('button');
    launch.id='cinemaLaunch'; launch.className='tool-btn cinema-launch'; launch.type='button';
    launch.innerHTML='<span class="cinema-launch-icon">✦</span><span class="cinema-launch-copy"><b>Presentation Mode</b><small>Cinematic family show</small></span>';
    launch.addEventListener('click', start);
    const controls=document.querySelector('.controls');
    const fullscreen=$('fullscreenBtn');
    if(controls) controls.insertBefore(launch,fullscreen||null);

    document.body.insertAdjacentHTML('beforeend',`
      <section id="cinemaRoot" class="cinema-root" aria-hidden="true">
        <canvas id="cinemaParticles" class="cinema-particles"></canvas>
        <div class="cinema-grid"></div><div class="cinema-vignette"></div><div class="cinema-orb cinema-orb-a"></div><div class="cinema-orb cinema-orb-b"></div>
        <header class="cinema-hud">
          <div class="cinema-brand"><span class="cinema-sigil">FT</span><span><b id="cinemaBrandTitle">Family Heritage</b><small id="cinemaBrandSub">Generative Heritage Engine</small></span></div>
          <div class="cinema-live"><i></i><span id="cinemaLiveLabel">LIVE FAMILY STORY</span></div>
        </header>
        <main id="cinemaStage" class="cinema-stage" aria-live="off"></main>
        <div class="cinema-progress"><i id="cinemaProgress"></i></div>
        <div class="cinema-controls" id="cinemaControls">
          <button id="cinemaPause" type="button">Pause</button>
          <button id="cinemaNext" type="button">Next</button>
          <button id="cinemaSpeed" type="button">Speed: Cinematic</button>
          <button id="cinemaLang" type="button">বাংলা</button>
          <button id="cinemaExit" type="button">Exit</button>
        </div>
        <div class="cinema-tip" id="cinemaTip">Space: pause • →: next • Esc: exit</div>
      </section>`);

    $('cinemaPause').addEventListener('click',togglePause);
    $('cinemaNext').addEventListener('click',()=>nextScene(true));
    $('cinemaExit').addEventListener('click',stop);
    $('cinemaLang').addEventListener('click',toggleLang);
    $('cinemaSpeed').addEventListener('click',cycleSpeed);
    window.addEventListener('keydown',keyHandler);
  }

  function updateLabels(){
    if(!$('cinemaRoot'))return;
    $('cinemaBrandTitle').textContent=t('heritage'); $('cinemaBrandSub').textContent=t('auto'); $('cinemaLiveLabel').textContent=t('live');
    $('cinemaPause').textContent=state.paused?t('play'):t('pause'); $('cinemaNext').textContent=t('next'); $('cinemaExit').textContent=t('exit'); $('cinemaTip').textContent=t('tip');
    $('cinemaLang').textContent=lang()==='bn'?'English':'বাংলা';
    const speedLabel=state.speed===0.72?t('relaxed'):state.speed===1.28?t('lively'):t('cinematic'); $('cinemaSpeed').textContent=`${t('speed')}: ${speedLabel}`;
    const b=$('cinemaLaunch'); if(b){b.querySelector('b').textContent=t('launch');b.querySelector('small').textContent=t('launchSub');}
  }

  function keyHandler(e){
    if(!state.active)return;
    if(e.key==='Escape'){e.preventDefault();stop();}
    else if(e.key===' '){e.preventDefault();togglePause();}
    else if(e.key==='ArrowRight'){e.preventDefault();nextScene(true);}
  }

  function toggleLang(){
    const next=lang()==='bn'?'en':'bn';
    document.documentElement.lang=next;
    localStorage.setItem('familyTreeLang',next);
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===next));
    updateLabels(); if(state.active) renderCurrent();
  }
  function cycleSpeed(){
    state.speed=state.speed===1?0.72:state.speed===0.72?1.28:1; updateLabels(); if(state.active&&!state.paused)schedule(state.duration/state.speed);
  }

  async function start(){
    indexData(); if(!state.root)return;
    state.active=true;state.paused=false;state.sceneNo=0;state.lastTypes=[];state.recentKeys=[];
    const root=$('cinemaRoot');root.classList.add('active');root.setAttribute('aria-hidden','false');document.body.classList.add('cinema-open');
    updateLabels(); resizeCanvas(); initParticles(); animateParticles();
    try{if(root.requestFullscreen&&!document.fullscreenElement)await root.requestFullscreen();}catch(_){ }
    nextScene(true);
  }
  function stop(){
    state.active=false;state.paused=false;clearTimeout(state.timer);cancelAnimationFrame(state.raf);state.timer=null;
    const root=$('cinemaRoot');if(root){root.classList.remove('active');root.setAttribute('aria-hidden','true');}
    document.body.classList.remove('cinema-open');
    try{if(document.fullscreenElement)document.exitFullscreen();}catch(_){ }
  }
  function togglePause(){
    if(!state.active)return;state.paused=!state.paused;updateLabels();
    if(state.paused){clearTimeout(state.timer);$('cinemaRoot').classList.add('paused');}
    else{$('cinemaRoot').classList.remove('paused');schedule(Math.max(2200,state.duration*0.55/state.speed));}
  }

  function pickNonRecent(items,keyFn,limit=30){
    const fresh=items.filter(x=>!state.recentKeys.includes(keyFn(x))); const pool=fresh.length?fresh:items; const picked=choice(pool); remember(keyFn(picked),limit); return picked;
  }
  function remember(k,limit=48){if(!k)return;state.recentKeys.push(k);if(state.recentKeys.length>limit)state.recentKeys.splice(0,state.recentKeys.length-limit);}
  function pickType(){
    const types=['genesis','branch','path','spotlight','constellation','generation','family','mosaic','flow'];
    const candidates=types.filter(x=>!state.lastTypes.includes(x)); const type=choice(candidates.length?candidates:types);state.lastTypes.push(type);if(state.lastTypes.length>3)state.lastTypes.shift();return type;
  }
  function makeScene(){
    state.sceneNo++;
    if(state.sceneNo===1 || state.sceneNo%19===0)return sceneGenesis();
    const type=pickType();
    return ({genesis:sceneGenesis,branch:sceneBranch,path:scenePath,spotlight:sceneSpotlight,constellation:sceneConstellation,generation:sceneGeneration,family:sceneFamily,mosaic:sceneMosaic,flow:sceneFlow}[type])();
  }

  function sceneGenesis(){
    const l=[state.root,...childrenOf(state.root).slice(0,1),branchRoot('mohabbat'),branchRoot('abdullah')].filter(Boolean);
    return {type:'genesis',key:'genesis-'+state.sceneNo%3,duration:14500,theme:nextTheme(),html:`
      <div class="cinema-scene genesis">
        <div class="cinema-eyebrow">${esc(t('roots'))}</div><h1>${esc(t('lineage'))}</h1><p>${esc(t('journey'))}</p>
        <div class="genesis-line">${l.map((p,i)=>`<div class="genesis-node" style="--i:${i}"><span>${esc(name(p))}</span>${i<l.length-1?'<i></i>':''}</div>`).join('')}</div>
        <div class="cinema-caption">${esc(t('together'))}</div>
      </div>`};
  }

  function sceneBranch(){
    const root=pickNonRecent([branchRoot('mohabbat'),branchRoot('abdullah')].filter(Boolean),p=>'branch:'+p.id,8);
    const kids=shuffle(childrenOf(root)).slice(0,8);const count=descendantCount(root);
    return {type:'branch',key:'branch:'+root.id,duration:13000,theme:nextTheme(),html:`
      <div class="cinema-scene branch-reveal"><div class="cinema-eyebrow">${esc(t('branch'))}</div><h1>${esc(name(root))}</h1>
      <p>${count} ${esc(t('descendants'))}</p><div class="branch-core"><div class="core-node"><span>${esc(name(root))}</span></div>${kids.map((p,i)=>`<div class="sat-node" style="--a:${(360/kids.length)*i+rand(-12,12)}deg;--r:${rand(190,310)}px;--d:${rand(0,1.8)}s"><b>${esc(name(p))}</b><small>${esc(t('generation'))} ${state.depth.get(p.id)||''}</small></div>`).join('')}</div></div>`};
  }

  function scenePath(){
    const leaves=state.people.filter(p=>childrenOf(p).length===0 && (state.depth.get(p.id)||0)>=5);const target=pickNonRecent(leaves.length?leaves:state.people,p=>'path:'+p.id,55);const path=lineage(target);
    return {type:'path',key:'path:'+target.id,duration:15000,theme:nextTheme(),html:`
      <div class="cinema-scene lineage-path"><div class="cinema-eyebrow">${esc(t('connected'))}</div><h1>${esc(name(target))}</h1>
      <div class="path-track">${path.map((p,i)=>`<div class="path-person" style="--i:${i}"><span class="path-dot"></span><div><b>${esc(name(p))}</b><small>${esc(t('generation'))} ${state.depth.get(p.id)||i+1}</small></div></div>`).join('')}</div></div>`};
  }

  function sceneSpotlight(){
    const pool=state.people.filter(p=>(state.depth.get(p.id)||0)>2);const p=pickNonRecent(pool,p=>'spot:'+p.id,60);const par=state.parent.get(p.id);const kids=childrenOf(p).slice(0,6);const sp=spouses(p);
    return {type:'spotlight',key:'spot:'+p.id,duration:12000,theme:nextTheme(),html:`
      <div class="cinema-scene spotlight"><div class="spot-halo"></div><div class="cinema-eyebrow">${esc(t('discover'))}</div><h1>${esc(name(p))}</h1><p>${esc(note(p))}</p>
      <div class="spot-meta">${par?`<span><small>${esc(t('from'))}</small><b>${esc(name(par))}</b></span>`:''}${sp.length?`<span><small>${esc(t('spouse'))}</small><b>${esc(sp.slice(0,2).join(' • '))}</b></span>`:''}${kids.length?`<span><small>${esc(t('children'))}</small><b>${kids.length}</b></span>`:''}</div>
      ${kids.length?`<div class="spot-kids">${kids.map((c,i)=>`<span style="--i:${i}">${esc(name(c))}</span>`).join('')}</div>`:''}</div>`};
  }

  function sceneConstellation(){
    const root=pickNonRecent([branchRoot('mohabbat'),branchRoot('abdullah')].filter(Boolean),p=>'const:'+p.id+':'+Math.floor(state.sceneNo/2),20);const pool=shuffle([root,...descendants(root)]).slice(0,18);
    return {type:'constellation',key:'const:'+root.id,duration:14500,theme:nextTheme(),html:`<div class="cinema-scene constellation"><div class="cinema-eyebrow">${esc(name(root))}</div><h1>${esc(t('familyOf'))} ${esc(name(root))}</h1><div class="constellation-field">${pool.map((p,i)=>{const a=(i/pool.length)*Math.PI*2+rand(-.3,.3),r=18+Math.sqrt(i+1)*12;return `<div class="const-node" style="--x:${50+Math.cos(a)*r}%;--y:${53+Math.sin(a)*r*.55}%;--i:${i}"><i></i><span>${esc(name(p))}</span></div>`;}).join('')}</div></div>`};
  }

  function sceneGeneration(){
    const depths=[3,4,5,6,7].filter(d=>state.people.filter(p=>state.depth.get(p.id)===d).length>2);const d=choice(depths);const members=shuffle(state.people.filter(p=>state.depth.get(p.id)===d)).slice(0,16);remember('gen:'+d+':'+members.map(x=>x.id).slice(0,3).join('-'),30);
    return {type:'generation',key:'gen:'+d,duration:12500,theme:nextTheme(),html:`<div class="cinema-scene generation-wave"><div class="cinema-eyebrow">${esc(t('generation'))}</div><h1>${esc(t('generation'))} ${d}</h1><div class="generation-river">${members.map((p,i)=>`<div class="river-name" style="--i:${i};--lane:${i%3}">${esc(name(p))}</div>`).join('')}</div></div>`};
  }

  function sceneFamily(){
    const parents=state.people.filter(p=>childrenOf(p).length>=2);const p=pickNonRecent(parents,p=>'family:'+p.id,50);const kids=childrenOf(p);return {type:'family',key:'family:'+p.id,duration:14000,theme:nextTheme(),html:`
      <div class="cinema-scene family-cluster"><div class="cinema-eyebrow">${esc(t('familyOf'))}</div><h1>${esc(name(p))}</h1>
      <div class="family-parent"><span>${esc(name(p))}</span></div><div class="family-stem"></div><div class="family-children">${kids.slice(0,10).map((c,i)=>`<div style="--i:${i}"><i></i><b>${esc(name(c))}</b></div>`).join('')}</div></div>`};
  }

  function sceneMosaic(){
    const members=shuffle(state.people.filter(p=>(state.depth.get(p.id)||0)>2)).slice(0,14);remember('mosaic:'+members.slice(0,4).map(p=>p.id).join('-'),40);
    return {type:'mosaic',key:'mosaic',duration:11000,theme:nextTheme(),html:`<div class="cinema-scene name-mosaic"><div class="cinema-eyebrow">${esc(t('together'))}</div><div class="mosaic-grid">${members.map((p,i)=>`<div style="--i:${i}" class="mosaic-name ${i%5===0?'major':''}"><small>G${state.depth.get(p.id)||''}</small><b>${esc(name(p))}</b></div>`).join('')}</div></div>`};
  }

  function sceneFlow(){
    const b=choice(['mohabbat','abdullah']);const root=branchRoot(b);const lines=shuffle(descendants(root)).slice(0,20);
    return {type:'flow',key:'flow:'+b,duration:16000,theme:nextTheme(),html:`<div class="cinema-scene data-flow"><div class="cinema-eyebrow">${esc(name(root))}</div><h1>${esc(t('journey'))}</h1><div class="flow-lanes">${lines.map((p,i)=>`<div class="flow-chip" style="--i:${i};--lane:${i%4};--speed:${rand(9,16)}s"><i></i>${esc(name(p))}</div>`).join('')}</div></div>`};
  }

  function renderCurrent(){
    if(!state.current)return; const stage=$('cinemaStage'); if(!stage)return;
    const old=stage.firstElementChild;if(old){old.classList.add('scene-out');setTimeout(()=>{if(old.parentNode)old.remove();},900);}
    const holder=document.createElement('div');holder.className='cinema-scene-wrap';holder.innerHTML=state.current.html;stage.appendChild(holder);
    $('cinemaRoot').dataset.theme=state.current.theme;
    requestAnimationFrame(()=>holder.classList.add('scene-in'));
  }
  function nextScene(manual=false){
    if(!state.active)return; clearTimeout(state.timer);state.current=makeScene();state.duration=state.current.duration;renderCurrent();state.startedAt=performance.now();updateProgress();
    if(!state.paused)schedule(state.duration/state.speed);
    if(manual) wakeControls();
  }
  function schedule(ms){clearTimeout(state.timer);state.timer=setTimeout(()=>nextScene(false),Math.max(2500,ms));}

  function updateProgress(){
    const p=$('cinemaProgress');if(!p||!state.active)return;
    const tick=()=>{if(!state.active)return; if(!state.paused){const elapsed=(performance.now()-state.startedAt)*state.speed;const q=clamp(elapsed/state.duration,0,1);p.style.transform=`scaleX(${q})`;if(q<1)requestAnimationFrame(tick);} };requestAnimationFrame(tick);
  }

  let controlTimer=null;
  function wakeControls(){const c=$('cinemaControls');if(!c)return;c.classList.add('awake');clearTimeout(controlTimer);controlTimer=setTimeout(()=>c.classList.remove('awake'),4200);}

  function resizeCanvas(){
    const c=$('cinemaParticles');if(!c)return;state.canvas=c;state.ctx=c.getContext('2d');state.dpr=Math.min(2,window.devicePixelRatio||1);state.width=innerWidth;state.height=innerHeight;c.width=state.width*state.dpr;c.height=state.height*state.dpr;c.style.width=state.width+'px';c.style.height=state.height+'px';state.ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
  }
  function initParticles(){
    const n=Math.round(clamp((state.width*state.height)/17000,45,120));state.particles=Array.from({length:n},()=>({x:rand(0,state.width),y:rand(0,state.height),r:rand(.5,2.2),vx:rand(-.08,.08),vy:rand(-.16,-.03),a:rand(.12,.62),pulse:rand(0,Math.PI*2)}));
  }
  function animateParticles(){
    if(!state.active||!state.ctx)return;const ctx=state.ctx;ctx.clearRect(0,0,state.width,state.height);const now=performance.now()/1700;
    for(const p of state.particles){p.x+=p.vx;p.y+=p.vy;if(p.y<-5){p.y=state.height+5;p.x=rand(0,state.width);}if(p.x<0)p.x=state.width;if(p.x>state.width)p.x=0;ctx.beginPath();ctx.fillStyle=`rgba(210,235,255,${p.a*(.65+.35*Math.sin(now+p.pulse))})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
    state.raf=requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize',()=>{if(state.active){resizeCanvas();initParticles();}});
  document.addEventListener('mousemove',()=>{if(state.active)wakeControls();},{passive:true});
  document.addEventListener('touchstart',()=>{if(state.active)wakeControls();},{passive:true});

  function boot(){createUI();updateLabels();if(new URLSearchParams(location.search).get('presentation')==='1')setTimeout(start,900);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();