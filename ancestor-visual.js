/* Educational ancestor-slot visual. Never reads private trees or invents relatives. */
(() => {
  'use strict';
  const bn = () => document.documentElement.lang === 'bn';
  const t = (en, bangla) => bn() ? bangla : en;
  const count = g => 2 ** g;
  const number = n => new Intl.NumberFormat(bn() ? 'bn-BD' : 'en-GB').format(n);
  let queued = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mount() {
    queued = false;
    const host = document.getElementById('personFunFacts');
    if (!host || host.querySelector('.ancestor-visual')) return;
    const card = document.createElement('div'); card.className = 'ancestor-visual';
    card.innerHTML = `<h4>${t('How many ancestors lead to you?','আপনাকে পৃথিবীতে আনতে কতজন পূর্বপুরুষ লেগেছে?')}</h4>
      <p class="av-generation"></p><strong class="av-count"></strong><p class="av-slots">${t('theoretical ancestor slots in this generation','এই প্রজন্মে পূর্বপুরুষের তাত্ত্বিক স্থান')}</p>
      <div class="av-scene"><canvas role="img"></canvas><span class="av-person"></span></div>
      <div class="av-buttons"><button type="button" data-av="back">${t('← Back','← পেছনে')}</button><button type="button" data-av="play">${t('▶ Play journey','▶ যাত্রা দেখুন')}</button><button type="button" data-av="next">${t('Next →','পরের →')}</button></div>
      <label class="av-slider-label">${t('Generations back','কত প্রজন্ম আগে')}<input type="range" min="1" max="33" step="1" value="2"></label>
      <label class="av-overlap"><input type="checkbox">${t('Show overlapping ancestry','পূর্বপুরুষের পুনরাবৃত্তি দেখুন')}</label>
      <p class="av-explanation" aria-live="polite"></p>
      <details><summary>${t('How this is calculated','হিসাবটি কীভাবে করা হয়')}</summary><p>${t('Two parents, four grandparents: generation g has 2^g slots. The same person can occupy several slots (pedigree collapse), so slots are not unique people. The golden lines are an illustration, not verified family relationships. Dense generations use a sample of lines.','দুইজন পিতা-মাতা, চারজন দাদা-দাদি ও নানা-নানি: g প্রজন্মে ২^g স্থান। একই ব্যক্তি একাধিক স্থানে থাকতে পারেন, তাই এটি আলাদা মানুষের সংখ্যা নয়। সোনালি রেখাগুলো ধারণামূলক, যাচাইকৃত পারিবারিক সম্পর্ক নয়। বড় প্রজন্মে কিছু নমুনা রেখা দেখানো হয়।')}</p><p>${t('No birth date or historical year is assumed. This visual does not calculate how many times a specific ancestor appears in this family.','কোনো জন্মতারিখ বা ঐতিহাসিক সাল ধরে নেওয়া হয়নি। এই পরিবারে নির্দিষ্ট পূর্বপুরুষ কতবার এসেছেন তা এখানে গণনা করা হয় না।')}</p><a href="https://isogg.org/wiki/Pedigree_collapse" target="_blank" rel="noopener">${t('Read about pedigree collapse ↗','পূর্বপুরুষের পুনরাবৃত্তি সম্পর্কে পড়ুন ↗')}</a></details>`;
    host.querySelector('.ff-heading').after(card);
    let g = 2, timer = null;
    const canvas = card.querySelector('canvas'), ctx = canvas.getContext('2d');
    const slider = card.querySelector('[type=range]'), overlap = card.querySelector('[type=checkbox]');
    card.querySelector('.av-person').textContent = document.querySelector('#profileContent h2')?.textContent || t('This person','এই ব্যক্তি');
    function stop() { clearInterval(timer); timer = null; card.querySelector('[data-av=play]').textContent = t('▶ Play journey','▶ যাত্রা দেখুন'); }
    function draw() {
      const width = Math.max(240,card.clientWidth), height = 410, ratio = Math.min(devicePixelRatio || 1,2);
      canvas.width = width*ratio; canvas.height = height*ratio;
      if (!ctx) return;
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
      const rootY = height-30, topY = 22, centre = width/2;
      const glow = ctx.createRadialGradient(centre,rootY,0,centre,rootY,70);
      glow.addColorStop(0,'#ffd98577');glow.addColorStop(1,'#ffd98500');ctx.fillStyle=glow;ctx.fillRect(0,rootY-70,width,100);
      function x(level,i,n) {
        const spread = Math.min(.93, .025 + .905*Math.pow(level/g,.72));
        let spreadFactor = 1;
        if(overlap.checked && level/g>.6) spreadFactor = Math.max(.025,1-(level/g-.6)/.4);
        return centre + ((i+.5)/n-.5)*width*spread*spreadFactor;
      }
      const pos = (level,i,n) => [level===0?centre:x(level,i,n),rootY-(rootY-topY)*level/g];
      ctx.lineWidth = g>12 ? .42 : .85;
      for(let level=1;level<=g;level++) {
        const n=Math.min(count(level),192), parents=Math.min(count(level-1),192);
        ctx.strokeStyle = level>8?'rgba(230,167,73,.27)':'rgba(255,206,127,.78)';ctx.beginPath();
        for(let i=0;i<n;i++) {
          const [px,py]=pos(level-1,Math.min(parents-1,Math.floor(i*parents/n)),parents),[cx,cy]=pos(level,i,n);
          ctx.moveTo(px,py);ctx.bezierCurveTo(px,py-(py-cy)*.55,cx,cy+(py-cy)*.45,cx,cy);
        }ctx.stroke();
        if(level<=6){ctx.fillStyle='#ffdfac';for(let i=0;i<n;i++){const [cx,cy]=pos(level,i,n);ctx.beginPath();ctx.arc(cx,cy,g<7?1.8:1,0,Math.PI*2);ctx.fill();}}
      }
      ctx.shadowColor='#ffc867';ctx.shadowBlur=20;ctx.fillStyle='#fff3ca';ctx.beginPath();ctx.arc(centre,rootY,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(overlap.checked){ctx.shadowColor='#ffca69';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(centre,topY,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
      if(g<=2){ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#f8deb1';const labels=g===1?[t('Parent','পিতা/মাতা'),t('Parent','পিতা/মাতা')]:[t('Grandparent','নানা/নানি'),t('Grandparent','নানা/নানি'),t('Grandparent','দাদা/দাদি'),t('Grandparent','দাদা/দাদি')];labels.forEach((label,i)=>ctx.fillText(label,x(g,i,labels.length),12));}
    }
    function update() {
      slider.value=g;slider.setAttribute('aria-valuetext',`${g} ${t('generations','প্রজন্ম')}`);
      card.querySelector('.av-generation').textContent=t(`${g} generations back`,`${number(g)} প্রজন্ম আগে`);
      card.querySelector('.av-count').textContent=number(count(g));
      card.querySelector('[data-av=back]').disabled=g===1;card.querySelector('[data-av=next]').disabled=g===33;
      card.querySelector('.av-explanation').textContent=overlap.checked?t('Repeated ancestors can connect different branches. This overlap is illustrative; the actual number of unique ancestors is unknown.','একই পূর্বপুরুষ একাধিক শাখায় থাকতে পারেন। এই মিলন ধারণামূলক; আলাদা পূর্বপুরুষের প্রকৃত সংখ্যা জানা নেই।'):t('Each generation doubles the slots: 2 → 4 → 8 → 16. These are not counts of unique or recorded relatives.','প্রতি প্রজন্মে স্থান দ্বিগুণ: ২ → ৪ → ৮ → ১৬। এটি আলাদা বা নথিভুক্ত আত্মীয়ের সংখ্যা নয়।');
      canvas.setAttribute('aria-label',t(`Golden ancestry illustration: ${g} generations, ${number(count(g))} theoretical slots.`, `সোনালি বংশধারার চিত্র: ${number(g)} প্রজন্ম, ${number(count(g))} তাত্ত্বিক স্থান।`));draw();
    }
    slider.oninput=()=>{stop();g=Number(slider.value);update();}; overlap.onchange=update;
    card.addEventListener('click',e=>{
      const action=e.target.closest('[data-av]')?.dataset.av;if(!action)return;
      if(action==='play'){
        if(timer){stop();return;}
        if(reduced()){g=g===33?1:Math.min(33,g+1);update();return;}
        if(g===33)g=1;
        card.querySelector('[data-av=play]').textContent=t('Ⅱ Pause','Ⅱ থামান');
        timer=setInterval(()=>{if(!card.isConnected || document.hidden){stop();return;}g=Math.min(33,g+1);update();if(g===33)stop();},650);
      }else{stop();g=Math.max(1,Math.min(33,g+(action==='next'?1:-1)));update();}
    });
    const resize = new ResizeObserver(()=>{if(card.isConnected)draw();else{resize.disconnect();stop();}});resize.observe(card);
    const removal = new MutationObserver(()=>{if(!card.isConnected){stop();resize.disconnect();removal.disconnect();}});removal.observe(document.getElementById('profileContent'),{childList:true,subtree:true});
    update();
  }
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(mount);}}).observe(document.getElementById('profileContent'),{childList:true,subtree:true});mount();
})();
