(() => {
  'use strict';
  if (typeof familyData === 'undefined') return;

  const people=[];
  const collect=p=>{if(!p||typeof p!=='object')return;people.push(p);(p.children||[]).forEach(collect);(p.spouseGroups||[]).forEach(g=>(g.children||[]).forEach(collect));};
  collect(familyData.main); collect(familyData.secondary);
  const byId=id=>people.find(p=>p.id===id);
  const patch=(id,values)=>{const p=byId(id);if(p)Object.assign(p,values);};
  const mergeChildren=(id,children)=>{const p=byId(id);if(!p)return;const old=Array.isArray(p.children)?p.children:[];const map=new Map(old.filter(x=>x&&x.id).map(x=>[x.id,x]));children.forEach(c=>{if(!map.has(c.id)){old.push(c);map.set(c.id,c);}else Object.assign(map.get(c.id),c);});p.children=old;};
  const setSpouse=(id,en,bn)=>{const p=byId(id);if(!p)return;const old=Array.isArray(p.spouses)?p.spouses:[];if(!old.some(s=>(s.en||'').toLowerCase()===en.toLowerCase()||s.bn===bn))old.push({en,bn});p.spouses=old;};
  const son=(id,en,bn)=>({id,en,bn,relationEn:'Son',relationBn:'ছেলে'});
  const daughter=(id,en,bn)=>({id,en,bn,relationEn:'Daughter',relationBn:'মেয়ে'});
  const person=(id,en,bn)=>({id,en,bn});

  mergeChildren('saiful-islam-sobor',[daughter('aurora-sorob','Aurora','অরোরা'),daughter('arbia-sorob','Arbia','আরবিয়া')]);
  patch('shariful-islam-palash',{noteEn:'2 daughters and 1 son recorded; names not provided.',noteBn:'২ মেয়ে ও ১ ছেলে নথিভুক্ত; নাম দেওয়া হয়নি।'});
  patch('rezaul-islam-peter',{noteEn:'2 daughters and 1 son recorded; names not provided.',noteBn:'২ মেয়ে ও ১ ছেলে নথিভুক্ত; নাম দেওয়া হয়নি।'});
  patch('redwanul-islam-muna',{noteEn:'1 daughter recorded; name not provided.',noteBn:'১ মেয়ে নথিভুক্ত; নাম দেওয়া হয়নি।'});
  patch('mihiron',{noteEn:'Unmarried.',noteBn:'অবিবাহিত।'});

  mergeChildren('tahamina-akter-pinu',[daughter('samina-pinu','Samina','সামিনা'),daughter('cynthia-pinu','Cynthia','সিনথিয়া'),son('taiyeb-pinu','Taiyeb','তাইয়েব'),daughter('suhaira-pinu','Suhaira','সুহাইরা')]);
  mergeChildren('sheikh-farid',[son('ahil-farid','Ahil','আহিল'),son('adil-farid','Adil','আদিল'),daughter('adiba-farid','Adiba','আদিবা')]);
  mergeChildren('harunur-rashid-toha',[son('riyan-toha','Riyan','রিয়ান'),daughter('rida-toha','Rida','রিদা'),daughter('rubaiya-toha','Rubaiya','রুবাইয়া'),daughter('radia-toha','Radia','রাদিয়া')]);

  mergeChildren('mahbub-alam-mamun',[daughter('maisha-masum','Maisha','মাইশা'),son('ayat-masum','Ayat','আয়াত')]);
  patch('nure-alam-tahamim',{noteEn:'No children.',noteBn:'কোনো সন্তান নেই।'});

  mergeChildren('israt-jahan-rumana',[son('raiyan-rumana','Raiyan','রাইয়ান')]);
  mergeChildren('sanjana-jahan-mim',[son('faiyaz-mim','Faiyaz','ফাইয়াজ')]);

  patch('jahid-nur-tapan',{noteEn:'No children.',noteBn:'কোনো সন্তান নেই।'});
  patch('jesmin-akter-baby',{noteEn:'Also known as Jesmin. 1 son recorded.',noteBn:'জেসমিন নামেও পরিচিত। ১ ছেলে নথিভুক্ত।'});
  mergeChildren('jesmin-akter-baby',[son('hannan-sami','Hannan Sami','হান্নান সামি')]);
  patch('shahid-nur-ripon',{noteEn:'1 son and 1 daughter recorded; names not provided.',noteBn:'১ ছেলে ও ১ মেয়ে নথিভুক্ত; নাম দেওয়া হয়নি।'});
  patch('abid-nur-babu',{noteEn:'Also known as Dipon. 1 son and 1 daughter recorded; names not provided.',noteBn:'দীপন নামেও পরিচিত। ১ ছেলে ও ১ মেয়ে নথিভুক্ত; নাম দেওয়া হয়নি।'});

  patch('sahajan-parvin-pakhi',{noteEn:'4 daughters recorded; Monita is the only daughter named in this update.',noteBn:'৪ মেয়ে নথিভুক্ত; এই হালনাগাদে শুধু মনিতার নাম দেওয়া হয়েছে।'});
  mergeChildren('sahajan-parvin-pakhi',[daughter('monita-pakhi','Monita','মনিতা')]);
  mergeChildren('laki',[son('ridim-laki','Ridim','রিদিম')]);
  setSpouse('raiha-binte-moumumi','Zohir','জোহির');
  mergeChildren('raiha-binte-moumumi',[daughter('rimjhim-mousumi','Rimjhim','রিমঝিম'),daughter('rijim-mousumi','Rijim','রিজিম')]);
  patch('akhi',{noteEn:'Unmarried.',noteBn:'অবিবাহিত।'});

  setSpouse('sohel-rana','Urmi','উরমি');
  mergeChildren('sohel-rana',[daughter('isha-sohel','Isha','ইশা'),daughter('raisa-sohel','Raisa','রাইসা'),son('shaheen-sohel','Shaheen','শাহীন')]);
  setSpouse('rumi','Mizan','মিজান');
  mergeChildren('rumi',[son('siyam-sumi','Siyam','সিয়াম'),son('sohan-sumi','Sohan','সোহান'),son('farhan-sumi','Farhan','ফারহান'),daughter('tithi-sumi','Tithi','তিথি')]);
  setSpouse('sarmin-akter-rumi','Masud','মাসুদ');
  mergeChildren('sarmin-akter-rumi',[daughter('mimi-rumi','Mimi','মিমি'),daughter('sara-rumi','Sara','সারা'),daughter('parha-rumi','Parha','পারহা'),son('minhaj-rumi','Minhaj','মিনহাজ')]);
  setSpouse('rahima-akter-poly','Anowar','আনোয়ার');
  mergeChildren('rahima-akter-poly',[son('tanzil-foli','Tanzil','তানজিল'),son('ayas-foli','Ayas','আয়াস'),daughter('ayesha-foli','Ayesha','আয়েশা')]);

  setSpouse('asma-rahman','Naim','নাঈম');
  patch('asma-rahman',{noteEn:'1 son and 1 daughter recorded; only Arapi is named in this update.',noteBn:'১ ছেলে ও ১ মেয়ে নথিভুক্ত; এই হালনাগাদে শুধু আরাপির নাম দেওয়া হয়েছে।'});
  mergeChildren('asma-rahman',[person('arapi-asma','Arapi','আরাপি')]);
  patch('asifur-rahman',{noteEn:'Unmarried.',noteBn:'অবিবাহিত।'});
})();