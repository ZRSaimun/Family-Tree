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
      <button type="button" class="av-origin-button" data-av="origin">${t("☪ Islamic origin: Adam & Hawwa","☪ ইসলামী উৎস: আদম ও হাওয়া")}</button>
      <div class="av-origin-note" hidden><p>${t("Islamic belief: humanity shares its origin through Adam and Hawwa. Their points represent two people, not one parent. The intervening generations are not known; these lines are symbolic, not a documented family chain.","ইসলামী বিশ্বাস অনুযায়ী মানবজাতির উৎস আদম ও হাওয়া। দুটি বিন্দু দুজন মানুষকে বোঝায়, একজন অভিভাবককে নয়। মধ্যবর্তী প্রজন্মের সংখ্যা জানা নেই; রেখাগুলো প্রতীকী, নথিভুক্ত বংশতালিকা নয়।")}</p><p>${t("Exact year: not established. Generations to this person: unknown. Friday is mentioned in Sahih Muslim 854a; it does not supply a calendar year.","সঠিক সাল: প্রতিষ্ঠিত নয়। এই ব্যক্তি পর্যন্ত প্রজন্মের সংখ্যা: অজানা। সহিহ মুসলিম ৮৫৪ক-তে শুক্রবারের উল্লেখ আছে; কোনো ক্যালেন্ডারের সাল দেওয়া নেই।")}</p><details><summary>${t("Qur’an and sahih hadith sources","কুরআন ও সহিহ হাদিসের সূত্র")}</summary><p>${t("Paraphrase: Qur’an 4:1 describes humanity spreading from a single soul and its mate. Sahih al-Bukhari 3340 identifies Adam as the father of humanity. These establish origin, not a dated genealogy.","ভাবার্থ: কুরআন ৪:১-এ এক সত্তা ও তার সঙ্গিনী থেকে মানবজাতি বিস্তারের কথা আছে। সহিহ বুখারি ৩৩৪০-এ আদমকে মানবজাতির পিতা বলা হয়েছে। এগুলো উৎস বোঝায়, তারিখসহ বংশতালিকা নয়।")}</p><a href="https://quran.com/4/1" target="_blank" rel="noopener">Qur’an 4:1 ↗</a> · <a href="https://sunnah.com/bukhari:3340" target="_blank" rel="noopener">Bukhari 3340 ↗</a> · <a href="https://sunnah.com/muslim:854a" target="_blank" rel="noopener">Muslim 854a ↗</a><p><a href="https://islamqa.info/en/answers/20907" target="_blank" rel="noopener">${t("Scholarly discussion of the unknown chronology ↗","অজানা সময়কাল সম্পর্কে আলেমের আলোচনা ↗")}</a></p></details></div>
      <label class="av-slider-label">${t('Generations back','কত প্রজন্ম আগে')}<input type="range" min="1" max="33" step="1" value="2"></label>
      <label class="av-overlap"><input type="checkbox">${t('Show overlapping ancestry','পূর্বপুরুষের পুনরাবৃত্তি দেখুন')}</label>
      <p class="av-explanation" aria-live="polite"></p>
      <details><summary>${t('How this is calculated','হিসাবটি কীভাবে করা হয়')}</summary><p>${t('Two parents, four grandparents: generation g has 2^g slots. The same person can occupy several slots (pedigree collapse), so slots are not unique people. The golden lines are an illustration, not verified family relationships. Dense generations use a sample of lines.','দুইজন পিতা-মাতা, চারজন দাদা-দাদি ও নানা-নানি: g প্রজন্মে ২^g স্থান। একই ব্যক্তি একাধিক স্থানে থাকতে পারেন, তাই এটি আলাদা মানুষের সংখ্যা নয়। সোনালি রেখাগুলো ধারণামূলক, যাচাইকৃত পারিবারিক সম্পর্ক নয়। বড় প্রজন্মে কিছু নমুনা রেখা দেখানো হয়।')}</p><p>${t('No birth date or historical year is assumed. This visual does not calculate how many times a specific ancestor appears in this family.','কোনো জন্মতারিখ বা ঐতিহাসিক সাল ধরে নেওয়া হয়নি। এই পরিবারে নির্দিষ্ট পূর্বপুরুষ কতবার এসেছেন তা এখানে গণনা করা হয় না।')}</p><a href="https://isogg.org/wiki/Pedigree_collapse" target="_blank" rel="noopener">${t('Read about pedigree collapse ↗','পূর্বপুরুষের পুনরাবৃত্তি সম্পর্কে পড়ুন ↗')}</a></details>`;
    host.querySelector('.ff-heading').after(card);
    let g = 2, timer = null, origin = true, journeyDialog = null, eraIndex = 0;
    const eras = [
      {en:'Adam & Hawwa',bn:'আদম ও হাওয়া',detailEn:'Shared origin of humanity in Islamic belief. The calendar year and the number of generations to this person are not established.',detailBn:'ইসলামী বিশ্বাসে মানবজাতির অভিন্ন উৎস। সঠিক সাল ও এই ব্যক্তি পর্যন্ত প্রজন্মের সংখ্যা প্রতিষ্ঠিত নয়।',url:'https://quran.com/4/1',source:'Qur’an 4:1; Bukhari 3340'},
      {en:'Era of Nuh (AS)',bn:'নূহ (আ.)-এর যুগ',detailEn:'The Qur’an describes Nuh being sent to his people. This marker has no assigned calendar date or generation number.',detailBn:'কুরআনে নূহকে তাঁর সম্প্রদায়ের কাছে পাঠানোর বর্ণনা আছে। এই চিহ্নের কোনো সাল বা প্রজন্মসংখ্যা নির্ধারণ করা হয়নি।',url:'https://quran.com/7/59',source:'Qur’an 7:59'},
      {en:'Ibrahim & Ismail (AS)',bn:'ইবরাহিম ও ইসমাইল (আ.)',detailEn:'The Qur’an describes Ibrahim and Ismail raising the foundations of the House. This is a selected religious-era marker, not a complete genealogy.',detailBn:'কুরআনে ইবরাহিম ও ইসমাইলের কাবার ভিত্তি নির্মাণের বর্ণনা আছে। এটি একটি নির্বাচিত ধর্মীয় যুগচিহ্ন, সম্পূর্ণ বংশতালিকা নয়।',url:'https://quran.com/2/127',source:'Qur’an 2:127'},
      {en:'Era of Musa (AS)',bn:'মুসা (আ.)-এর যুগ',detailEn:'The Qur’an recounts the story of Musa. Placement here follows the conventional broad sequence, not a measured date or a direct parent–child relationship.',detailBn:'কুরআনে মুসার ঘটনা বর্ণিত হয়েছে। এখানে প্রচলিত সামগ্রিক ক্রম দেখানো হয়েছে, নির্দিষ্ট সাল বা সরাসরি পিতা-সন্তানের সম্পর্ক নয়।',url:'https://legacy.quran.com/20/9-111',source:'Qur’an 20:9 onwards'},
      {en:'Dawud & Sulaiman (AS)',bn:'দাউদ ও সুলাইমান (আ.)',detailEn:'The Qur’an describes Sulaiman succeeding Dawud. The spacing of these era markers is schematic and does not measure elapsed years.',detailBn:'কুরআনে দাউদের পরে সুলাইমানের উত্তরাধিকারের বর্ণনা আছে। যুগচিহ্নগুলোর দূরত্ব চিত্রের সুবিধার জন্য, অতিবাহিত বছরের মাপ নয়।',url:'https://quran.com/27/16',source:'Qur’an 27:16'},
      {en:'Era of Isa (AS)',bn:'ঈসা (আ.)-এর যুগ',detailEn:'The Qur’an identifies Isa as the son of Maryam. This does not identify him as an ancestor of the selected person.',detailBn:'কুরআনে ঈসাকে মরিয়মের পুত্র বলা হয়েছে। এর অর্থ এই নয় যে তিনি নির্বাচিত ব্যক্তির পূর্বপুরুষ হিসেবে শনাক্ত হয়েছেন।',url:'https://quran.com/3/45',source:'Qur’an 3:45'},
      {en:'Prophet Muhammad ﷺ',bn:'নবী মুহাম্মদ ﷺ',detailEn:'Conventionally dated c. 570/571–632 CE. The Qur’an calls him the seal of the prophets. Dates come from historical scholarship, not a Qur’anic calendar date.',detailBn:'প্রচলিত ঐতিহাসিক সময়কাল আনুমানিক ৫৭০/৫৭১–৬৩২ খ্রিস্টাব্দ। কুরআনে তাঁকে শেষ নবী বলা হয়েছে। সালগুলো ঐতিহাসিক গবেষণা থেকে, কুরআনে দেওয়া ক্যালেন্ডারের সাল নয়।',url:'https://quran.com/33/40',history:'https://elmi.hbku.edu.qa/en/publications/muhammad-ca-570571-632-ce/',source:'Qur’an 33:40; historical biography'},
      {en:'Imam al-Bukhari · 810–870 CE',bn:'ইমাম বুখারি · ৮১০–৮৭০ খ্রি.',detailEn:'Muhammad ibn Ismail al-Bukhari compiled Sahih al-Bukhari. He was a hadith scholar, not a prophet. This marker does not claim he was an ancestor of this family.',detailBn:'মুহাম্মদ ইবনে ইসমাইল আল-বুখারি সহিহ বুখারি সংকলন করেন। তিনি হাদিসের আলেম, নবী নন। এই চিহ্ন তাঁকে এই পরিবারের পূর্বপুরুষ বলে দাবি করে না।',url:'https://www.encyclopedia.com/religion/encyclopedias-almanacs-transcripts-and-maps/bukhari-al-810-870',source:'Encyclopedia of Religion · historical biography'},
      {en:'Selected family member',bn:'নির্বাচিত পরিবারের সদস্য',detailEn:'This person belongs to the recorded family tree. A named genealogical chain linking this family to the historical figures above has not been established.',detailBn:'এই ব্যক্তি নথিভুক্ত পারিবারিক বৃক্ষের সদস্য। ওপরের ঐতিহাসিক ব্যক্তিদের সঙ্গে এই পরিবারের নামসহ বংশগত সংযোগ প্রতিষ্ঠিত হয়নি।',source:'Existing family record'}
    ];
    const canvas = card.querySelector('canvas'), ctx = canvas.getContext('2d');
    const slider = card.querySelector('[type=range]'), overlap = card.querySelector('[type=checkbox]');
    card.querySelector('.av-person').textContent = document.querySelector('#profileContent h2')?.textContent || t('This person','এই ব্যক্তি');
    const markers=document.createElement('div');markers.className='av-era-markers';
    eras.slice(1,-1).forEach((era,i)=>{const button=document.createElement('button');button.type='button';button.className='av-era-marker';button.dataset.avEra=String(i+1);button.style.top=`${19+i*10}%`;button.textContent=t(era.en,era.bn);button.onclick=()=>{stop();eraIndex=i+1;update();};markers.append(button);});
    card.querySelector('.av-scene').append(markers);
    const eraDetail=document.createElement('div');eraDetail.className='av-era-detail';eraDetail.setAttribute('aria-live','polite');card.querySelector('.av-scene').after(eraDetail);
    const guide=document.createElement('p');guide.className='av-era-guide';guide.textContent=t('Selected eras · schematic spacing, not a dated genealogy. Tap a label to read its source.','নির্বাচিত যুগ · চিত্রের দূরত্ব সালভিত্তিক বংশতালিকা নয়। সূত্র পড়তে নামে চাপুন।');card.querySelector('.av-scene').before(guide);
    const references=document.createElement('details');references.className='av-chart-references';
    references.innerHTML=`<summary>${t('About the supplied family charts','দেওয়া বংশতালিকা সম্পর্কে')}</summary><p>${t('The Genesis chart describes Biblical tradition; the Majestic Islam post republishes an internet chart; QuranExplorer provides a general overview. They are reading references, not proof of every parent–child link. Only individually checked Qur’an/hadith references are used for the selected markers. Missing links remain unknown.','জেনেসিসের চিত্র বাইবেলের ঐতিহ্য নিয়ে; ম্যাজেস্টিক ইসলাম ইন্টারনেটের একটি চিত্র পুনঃপ্রকাশ করেছে; কুরআনএক্সপ্লোরার সামগ্রিক পরিচিতি দিয়েছে। এগুলো পাঠ্যসূত্র, প্রতিটি পিতা-সন্তানের সম্পর্কের প্রমাণ নয়। নির্বাচিত চিহ্নে আলাদাভাবে যাচাই করা কুরআন ও হাদিসের সূত্র ব্যবহার করা হয়েছে। অনুপস্থিত সংযোগ অজানা রাখা হয়েছে।')}</p><a target="_blank" rel="noopener" href="https://en.wikipedia.org/wiki/Genealogies_of_Genesis">Genealogies of Genesis ↗</a><br><a target="_blank" rel="noopener" href="https://majesticislam.wordpress.com/2011/07/06/family-tree-from-adam-to-prophet-muhammed-as/">Majestic Islam chart ↗</a><br><a target="_blank" rel="noopener" href="https://www.quranexplorer.com/blog/Education-In-The-Light-Of-Sunnah-And-Qura%27an/Family_tree_of_prophets_in_Islam_Adam_(AS)_to_Muhammad_SAW">QuranExplorer overview ↗</a>`;card.append(references);
    function stop() { clearInterval(timer); timer = null; card.querySelector('[data-av=play]').textContent = t('▶ Play journey','▶ যাত্রা দেখুন'); }
    function openJourney() {
      if(journeyDialog) return;
      const placeholder=document.createElement('div');placeholder.className='ancestor-visual av-placeholder';placeholder.hidden=true;
      card.before(placeholder);
      const dialog=document.createElement('dialog');journeyDialog=dialog;dialog.className='av-journey-dialog';dialog.setAttribute('aria-label',t('Full-window ancestry journey','পুরো পর্দায় বংশধারার যাত্রা'));
      const close=document.createElement('button');close.type='button';close.className='av-journey-close';close.textContent=t('✕ Close journey','✕ যাত্রা বন্ধ করুন');
      close.onclick=()=>dialog.close();dialog.append(close,card);document.body.append(dialog);
      const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
      dialog.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}
      });
      dialog.addEventListener('close',()=>{
        stop();journeyDialog=null;document.body.style.overflow=previousOverflow;
        if(placeholder.isConnected){placeholder.replaceWith(card);card.querySelector('[data-av=play]').focus();}else card.remove();
        dialog.remove();if(card.isConnected)draw();
      },{once:true});
      dialog.showModal();close.focus();draw();
    }
    function draw() {
      const width = Math.max(240,card.clientWidth), height = canvas.clientHeight || 410, ratio = Math.min(devicePixelRatio || 1,2);
      canvas.width = width*ratio; canvas.height = height*ratio;
      if (!ctx) return;
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
      const rootY = height-30, topY = 22, centre = width/2;
      const glow = ctx.createRadialGradient(centre,rootY,0,centre,rootY,70);
      glow.addColorStop(0,'#ffd98577');glow.addColorStop(1,'#ffd98500');ctx.fillStyle=glow;ctx.fillRect(0,rootY-70,width,100);
      if(origin) {
        // The origin journey is deliberately progressive: the selected person is
        // one point, then each Play/Next step adds the next parent layer. It is a
        // symbolic illustration, never a claim that every intermediate link is
        // documented.
        const depth=Math.max(1,Math.min(8,eraIndex+1));
        const root=[centre,rootY];
        const points=[root];
        for(let level=1;level<=depth;level++){
          const n=2**level, y=rootY-(rootY-topY)*level/Math.max(depth,4);
          const spread=Math.min(width*.44,width*(.08+.075*level));
          const parents=points.filter(point=>point[2]===level-1);
          for(let i=0;i<n;i++){
            const x=centre-spread+(2*spread)*(i+.5)/n;
            const parent=parents[Math.floor(i/2)]||root;
            ctx.beginPath();ctx.moveTo(parent[0],parent[1]);
            ctx.bezierCurveTo(parent[0],parent[1]-(parent[1]-y)*.55,x,y+(parent[1]-y)*.45,x,y);
            ctx.strokeStyle=level===depth?'rgba(255,206,127,.9)':'rgba(255,203,119,.48)';
            ctx.lineWidth=level===depth?1.1:.7;ctx.stroke();
            points.push([x,y,level]);
          }
        }
        ctx.shadowColor='#ffc867';ctx.shadowBlur=18;ctx.fillStyle='#fff1c9';
        points.filter(point=>point[2]===depth).forEach(point=>{ctx.beginPath();ctx.arc(point[0],point[1],depth<4?3:1.7,0,Math.PI*2);ctx.fill();});
        ctx.beginPath();ctx.arc(centre,rootY,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffe1a1';
        if(depth>=7){ctx.fillText(t('Adam (AS)','আদম (আ.)'),centre-width*.16,topY+8);ctx.fillText(t('Hawwa','হাওয়া'),centre+width*.16,topY+8);}
        ctx.fillStyle='#ffe1a1';ctx.font='11px system-ui';
        ctx.fillText(t(`${depth} layer${depth===1?'':'s'} revealed · intervening generations unknown`,`${number(depth)} স্তর প্রকাশিত · মধ্যবর্তী প্রজন্ম অজানা`),centre,Math.max(90,topY+28));
        return;
      }
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
      card.querySelector('h4').textContent=origin?t('Our shared origin & the eras of history','আমাদের অভিন্ন উৎস ও ইতিহাসের যুগ'):t('How many ancestors lead to you?','আপনাকে পৃথিবীতে আনতে কতজন পূর্বপুরুষ লেগেছে?');
      card.querySelector('.av-origin-note').hidden=!origin;
      card.querySelector('.av-origin-button').textContent=origin?t('← Return to generation calculator','← প্রজন্মের হিসাবে ফিরুন'):t('☪ Islamic origin: Adam & Hawwa','☪ ইসলামী উৎস: আদম ও হাওয়া');
      card.querySelector('.av-buttons').hidden=false;
      card.classList.toggle('av-history-mode',origin);markers.hidden=!origin;eraDetail.hidden=!origin;guide.hidden=!origin;references.hidden=!origin;
      card.querySelector('.av-slider-label').hidden=origin;
      card.querySelector('.av-overlap').hidden=origin;
      card.querySelector('.av-slots').hidden=origin;
      card.querySelector('.av-explanation').hidden=origin;
      if(origin){
        const era=eras[eraIndex];
        card.querySelector('.av-generation').textContent=t(`Era journey · ${eraIndex+1} / ${eras.length}`,`যুগের যাত্রা · ${number(eraIndex+1)} / ${number(eras.length)}`);
        eraDetail.replaceChildren();const heading=document.createElement('strong');heading.textContent=t(era.en,era.bn);const paragraph=document.createElement('p');paragraph.textContent=t(era.detailEn,era.detailBn);eraDetail.append(heading,paragraph);
        if(era.url){const link=document.createElement('a');link.href=era.url;link.target='_blank';link.rel='noopener';link.textContent=era.source+' ↗';eraDetail.append(link);}
        if(era.history){const link=document.createElement('a');link.href=era.history;link.target='_blank';link.rel='noopener';link.textContent=t(' · Historical dates ↗',' · ঐতিহাসিক সাল ↗');eraDetail.append(link);}
        markers.querySelectorAll('button').forEach(button=>{const active=Number(button.dataset.avEra)===eraIndex;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
        card.querySelector('[data-av=back]').disabled=eraIndex===0;card.querySelector('[data-av=next]').disabled=eraIndex===eras.length-1;
        card.querySelector('.av-count').textContent=t('Adam & Hawwa','আদম ও হাওয়া');
        canvas.setAttribute('aria-label',t('Symbolic Islamic origin: Adam and Hawwa, unknown intervening generations, then this person. Era markers are context, not documented ancestors; no date or generation count is claimed for the gaps.','প্রতীকী ইসলামী উৎস: আদম ও হাওয়া, অজানা মধ্যবর্তী প্রজন্ম, এরপর এই ব্যক্তি। কোনো সাল বা প্রজন্মসংখ্যা দাবি করা হয়নি।'));
        draw();return;
      }
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
      if(action==='origin'){stop();origin=!origin;update();return;}
      if(action==='play'){
        openJourney();
        if(origin){
          if(timer){stop();return;}if(eraIndex===eras.length-1)eraIndex=0;
          if(reduced()){eraIndex=Math.min(eras.length-1,eraIndex+1);update();return;}
          card.querySelector('[data-av=play]').textContent=t('Ⅱ Pause','Ⅱ থামান');
          timer=setInterval(()=>{if(!card.isConnected||document.hidden){stop();return;}eraIndex=Math.min(eras.length-1,eraIndex+1);update();if(eraIndex===eras.length-1)stop();},1800);update();return;
        }
        if(timer){stop();return;}
        if(reduced()){g=g===33?1:Math.min(33,g+1);update();return;}
        if(g===33)g=1;
        card.querySelector('[data-av=play]').textContent=t('Ⅱ Pause','Ⅱ থামান');
        timer=setInterval(()=>{if(!card.isConnected || document.hidden){stop();return;}g=Math.min(33,g+1);update();if(g===33)stop();},650);
      }else{stop();if(origin){eraIndex=Math.max(0,Math.min(eras.length-1,eraIndex+(action==='next'?1:-1)));update();return;}g=Math.max(1,Math.min(33,g+(action==='next'?1:-1)));update();}
    });
    const resize = new ResizeObserver(()=>{if(card.isConnected)draw();else{resize.disconnect();stop();}});resize.observe(card);
    const removal = new MutationObserver(()=>{if(!card.isConnected){stop();resize.disconnect();removal.disconnect();}});removal.observe(document.getElementById('profileContent'),{childList:true,subtree:true});
    update();
  }
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(mount);}}).observe(document.getElementById('profileContent'),{childList:true,subtree:true});mount();
})();
