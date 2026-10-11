(() => {
  'use strict';

  const childrenOf=p=>[...(p?.children||[]),...(p?.spouseGroups||[]).flatMap(g=>g.children||[])];
  const deceased=new Map();

  function index(){
    deceased.clear();
    const d=window.familyData;
    if(!d)return;
    const walk=p=>{if(!p?.id)return;if(p.deceased)deceased.set(p.id,p);childrenOf(p).forEach(walk);};
    (d.rootTrail||[]).forEach(walk);walk(d.main);walk(d.secondary);
  }

  const lang=()=>document.documentElement.lang==='bn'?'bn':'en';
  const personName=p=>lang()==='bn'?(p.bn||p.en||''):(p.en||p.bn||'');
  const label=()=>lang()==='bn'?'স্মরণে':'Remembered';

  function findByHeading(text){
    const normalized=(text||'').trim();
    for(const p of deceased.values()){
      if(normalized===personName(p)||(p.en&&normalized===p.en)||(p.bn&&normalized===p.bn))return p;
    }
    return null;
  }

  function decorateScene(scene){
    if(!scene)return;
    const legacyId=scene.dataset.legacyPerson;
    const heading=scene.querySelector('h1');
    const p=legacyId?deceased.get(legacyId):findByHeading(heading?.textContent);
    scene.classList.toggle('memorial-scene',!!p);
    const old=scene.querySelector('.cinema-memorial-status');
    if(!p){old?.remove();return;}
    if(old){old.textContent=label();return;}
    if(!heading)return;
    const badge=document.createElement('div');
    badge.className='cinema-memorial-status';
    badge.textContent=label();
    heading.insertAdjacentElement('afterend',badge);
  }

  function decorateAll(){
    index();
    document.querySelectorAll('#cinemaStage .cinema-scene').forEach(decorateScene);
  }

  function attach(){
    const stage=document.getElementById('cinemaStage');
    if(!stage){setTimeout(attach,400);return;}
    new MutationObserver(()=>requestAnimationFrame(decorateAll)).observe(stage,{childList:true,subtree:true});
    decorateAll();
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#cinemaLaunch')||e.target.closest('#cinemaLang'))setTimeout(decorateAll,220);
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();