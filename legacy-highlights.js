(() => {
  'use strict';

  const LEGACY = [
    {
      id:'mohabbat-ali-munsir',
      rank:'FOUNDATIONAL LEGACY',
      rankBn:'বংশের ভিত্তি',
      role:'Foundational family pillar',
      roleBn:'পরিবারের অন্যতম ভিত্তি',
      lines:[
        'Remembered by the family as one of the most important contributors to the lineage.',
        'His branch became one of the central pathways through which the family expanded across generations.'
      ],
      linesBn:[
        'পরিবারের স্মৃতিতে বংশের অন্যতম গুরুত্বপূর্ণ অবদানকারী হিসেবে তিনি স্মরণীয়।',
        'তাঁর শাখা প্রজন্মের পর প্রজন্ম ধরে পরিবারের বিস্তারের অন্যতম প্রধান পথ হয়ে ওঠে।'
      ],
      icon:'✦', theme:'legacy-foundation'
    },
    {
      id:'dr-abul-hasem',
      rank:'SERVICE & ROOTS',
      rankBn:'সেবা ও শিকড়',
      role:'Doctor • Family contributor • Farmer at heart',
      roleBn:'চিকিৎসক • পরিবারের অবদানকারী • কৃষি ও মাটির প্রতি গভীর অনুরাগী',
      lines:[
        'Remembered as a respected doctor who contributed greatly to the family.',
        'Beyond medicine, he carried a deep love for farming, the soil and working with the land.'
      ],
      linesBn:[
        'সম্মানিত চিকিৎসক হিসেবে এবং পরিবারের জন্য গুরুত্বপূর্ণ অবদানের কারণে তিনি স্মরণীয়।',
        'চিকিৎসার পাশাপাশি কৃষি, মাটি ও জমির সঙ্গে কাজ করার প্রতি তাঁর ছিল গভীর ভালোবাসা।'
      ],
      icon:'✚', theme:'legacy-roots'
    },
    {
      id:'mohammad-ali-jinnah',
      rank:'LEADERSHIP & SERVICE',
      rankBn:'নেতৃত্ব ও সেবা',
      role:'Senior banker • Former Assistant General Manager (AGM), Sonali Bank PLC',
      roleBn:'সিনিয়র ব্যাংকার • সাবেক অ্যাসিস্ট্যান্ট জেনারেল ম্যানেজার (AGM), সোনালী ব্যাংক',
      lines:[
        'Remembered by the family for sustained support, responsibility and contribution across generations.',
        'His banking career progressed through many promotions before retirement as an Assistant General Manager.'
      ],
      linesBn:[
        'দায়িত্ব, সহায়তা এবং প্রজন্মজুড়ে পরিবারের প্রতি অবদানের জন্য তিনি বিশেষভাবে স্মরণীয়।',
        'দীর্ঘ ব্যাংকিং জীবনে একাধিক পদোন্নতির পর তিনি অ্যাসিস্ট্যান্ট জেনারেল ম্যানেজার হিসেবে অবসর নেন।'
      ],
      icon:'◆', theme:'legacy-leadership'
    }
  ];

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>document.documentElement.lang==='bn'?'bn':'en';
  const childrenOf=p=>[...(p?.children||[]),...(p?.spouseGroups||[]).flatMap(g=>g.children||[])];
  let byId=new Map(), parent=new Map(), depth=new Map(), seenScene=0, legacyCursor=0, observer=null, busy=false;

  function sourceRoot(){
    const d=window.familyData;
    if(!d)return null;
    const r=(d.rootTrail||[]).find(p=>p.id==='nayeb-chowdhury')||(d.rootTrail||[])[0];
    const c=(d.rootTrail||[]).find(p=>p.id==='chan-gazi-hawladar')||(d.rootTrail||[])[1];
    return r&&c?{...r,children:[{...c,children:[d.main,d.secondary]}]}:null;
  }

  function index(){
    byId=new Map();parent=new Map();depth=new Map();
    const walk=(p,par=null,d=1)=>{if(!p?.id)return;byId.set(p.id,p);depth.set(p.id,d);if(par)parent.set(p.id,par);childrenOf(p).forEach(c=>walk(c,p,d+1));};
    walk(sourceRoot());
  }

  function lineage(p){const out=[];let cur=p;while(cur){out.unshift(cur);cur=parent.get(cur.id);}return out;}
  function descendants(p){const out=[];const walk=x=>childrenOf(x).forEach(c=>{out.push(c);walk(c);});walk(p);return out;}
  function personName(p){return lang()==='bn'?(p?.bn||p?.en||''):(p?.en||p?.bn||'');}

  function tributeHtml(meta){
    const p=byId.get(meta.id);if(!p)return '';
    const bn=lang()==='bn';
    const chain=lineage(p).slice(-4);
    const kids=childrenOf(p).slice(0,8);
    const total=descendants(p).length;
    const lines=bn?meta.linesBn:meta.lines;
    const rank=bn?meta.rankBn:meta.rank;
    const role=bn?meta.roleBn:meta.role;
    const legacyLabel=bn?'পারিবারিক লেগ্যাসি':'FAMILY LEGACY';
    const contributionLabel=bn?'অবদান ও স্মৃতি':'CONTRIBUTION & MEMORY';
    const branchLabel=bn?'বংশধর':'recorded descendants';
    return `
      <div class="cinema-scene legacy-tribute ${meta.theme}" data-legacy-person="${esc(meta.id)}">
        <div class="legacy-aura"><i></i><i></i><i></i></div>
        <div class="legacy-kicker"><span>${esc(meta.icon)}</span>${esc(legacyLabel)} · ${esc(rank)}</div>
        <h1>${esc(personName(p))}</h1>
        <div class="legacy-role">${esc(role)}</div>
        <div class="legacy-story"><span>${esc(contributionLabel)}</span><p>${esc(lines[0])}</p><p>${esc(lines[1])}</p></div>
        <div class="legacy-lineage">${chain.map((x,i)=>`<div style="--i:${i}"><i></i><b>${esc(personName(x))}</b></div>`).join('')}</div>
        ${kids.length?`<div class="legacy-branch"><span>${esc(String(total))} ${esc(branchLabel)}</span><div>${kids.map((x,i)=>`<b style="--i:${i}">${esc(personName(x))}</b>`).join('')}</div></div>`:''}
      </div>`;
  }

  function decorateExisting(stage){
    const text=stage.textContent||'';
    for(const meta of LEGACY){
      const p=byId.get(meta.id);if(!p)continue;
      const en=p.en||'',bn=p.bn||'';
      if((en&&text.includes(en))||(bn&&text.includes(bn))){stage.classList.add('legacy-presence');stage.dataset.legacy=meta.id;return;}
    }
    stage.classList.remove('legacy-presence');delete stage.dataset.legacy;
  }

  function inject(stage){
    if(busy||!document.getElementById('cinemaRoot')?.classList.contains('active'))return;
    const holder=stage.lastElementChild;
    if(!holder||holder.dataset.legacyInjected==='1')return;
    seenScene++;
    decorateExisting(stage);
    // Every fifth generated scene becomes a curated legacy chapter. The three figures rotate,
    // guaranteeing prominence without turning the presentation into a repetitive tribute reel.
    if(seenScene<3||seenScene%5!==0)return;
    const meta=LEGACY[legacyCursor%LEGACY.length];legacyCursor++;
    const html=tributeHtml(meta);if(!html)return;
    busy=true;
    holder.dataset.legacyInjected='1';
    holder.classList.add('legacy-transition-out');
    setTimeout(()=>{
      if(!holder.isConnected){busy=false;return;}
      holder.innerHTML=html;
      holder.classList.remove('legacy-transition-out');
      holder.classList.add('legacy-injected');
      const root=document.getElementById('cinemaRoot');
      if(root)root.dataset.legacyTheme=meta.theme;
      stage.classList.add('legacy-presence');stage.dataset.legacy=meta.id;
      busy=false;
    },520);
  }

  function attach(){
    index();
    const stage=document.getElementById('cinemaStage');
    if(!stage){setTimeout(attach,500);return;}
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>inject(stage));
    observer.observe(stage,{childList:true,subtree:false});
    inject(stage);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#cinemaLaunch')){seenScene=0;legacyCursor=Math.floor(Math.random()*LEGACY.length);setTimeout(()=>{index();attach();},180);}
    if(e.target.closest('#cinemaLang'))setTimeout(()=>{const stage=document.getElementById('cinemaStage');const active=stage?.querySelector('[data-legacy-person]');if(active){const meta=LEGACY.find(x=>x.id===active.dataset.legacyPerson);if(meta){const holder=active.closest('.cinema-scene-wrap');if(holder)holder.innerHTML=tributeHtml(meta);}}},80);
  });

  function boot(){index();attach();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();