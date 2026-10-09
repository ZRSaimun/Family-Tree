(() => {
  const people=[];
  const collect=p=>{if(!p||typeof p!=='object')return;people.push(p);(p.children||[]).forEach(collect);(p.spouseGroups||[]).forEach(g=>(g.children||[]).forEach(collect));};
  collect(familyData.main); collect(familyData.secondary);
  const byId=id=>people.find(p=>p.id===id);
  const patch=(id,values)=>{const p=byId(id);if(p)Object.assign(p,values);};

  familyData.rootTrail=[
    {type:'person',id:'nayeb-chowdhury',en:'Nayeb Chowdhury',bn:'নায়েব চৌধুরী',noteEn:'Zamindar',noteBn:'জমিদার'},
    {type:'person',id:'chan-gazi-hawladar',en:'Chan Gazi Hawladar',bn:'চাঁন গাজী হাওলাদার'}
  ];

  patch('mohabbat-ali-munsir',{en:'Mohabbat Ali Munsir',bn:'মোহাব্বত আলি মুনসির',noteEn:'4 sons and 2 daughters recorded.',noteBn:'৪ ছেলে ও ২ মেয়ে নথিভুক্ত।'});
  patch('abdullah-chamra',{en:'Abdullah Chamra',bn:'আব্দুল্লাহ চামড়া',noteEn:'6 sons recorded.',noteBn:'৬ ছেলে নথিভুক্ত।'});
  patch('jahanara-janu',{en:'Jahanara Janu',bn:'জাহানারা জানু'});
  patch('akuri',{en:'Aunkuri',bn:'আঃকুরি'});

  const saimun=byId('md-zillur-rahman-saimun');
  if(saimun){delete saimun.relationEn;delete saimun.relationBn;}

  Object.assign(translations.en,{brandSub:'Nayeb Chowdhury lineage',sourceNote:'Family lineage arranged from the supplied family record. Nayeb Chowdhury → Chan Gazi Hawladar → Mohabbat Ali Munsir and Abdullah Chamra.'});
  Object.assign(translations.bn,{brandSub:'নায়েব চৌধুরীর বংশধারা',sourceNote:'প্রদত্ত পারিবারিক নথি অনুযায়ী বংশধারা: নায়েব চৌধুরী → চাঁন গাজী হাওলাদার → মোহাব্বত আলি মুনসির ও আব্দুল্লাহ চামড়া।'});
})();