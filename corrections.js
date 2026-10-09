(() => {
  const allPeople = [];
  function collect(person) {
    if (!person || typeof person !== 'object') return;
    allPeople.push(person);
    (person.children || []).forEach(collect);
    (person.spouseGroups || []).forEach(group => (group.children || []).forEach(collect));
  }
  collect(familyData.main);
  collect(familyData.secondary);
  const byId = id => allPeople.find(person => person.id === id);
  const patch = (id, values) => Object.assign(byId(id) || {}, values);

  familyData.rootTrail = [
    {
      type: 'person', id: 'nayeb-chowdhury',
      en: 'Nayeb Chowdhury', bn: 'নায়েব চৌধুরী',
      noteEn: 'Zamindar; earliest named ancestor in the supplied family record.',
      noteBn: 'জমিদার; প্রদত্ত পারিবারিক নথিতে উল্লেখিত প্রাচীনতম নাম।'
    },
    {
      type: 'person', id: 'chan-gazi-hawladar',
      en: 'Chan Gazi Hawladar', bn: 'চাঁন গাজী হাওলাদার',
      noteEn: 'Recorded ancestor of the Mohabbat Ali Munsir and Abdullah Chamra branches.',
      noteBn: 'মোহাব্বত আলি মুনসির ও আব্দুল্লাহ চামড়া শাখার নথিভুক্ত পূর্বপুরুষ।'
    }
  ];

  patch('noor-mia', {
    en: 'Nur Mia', bn: 'নূর মিয়া',
    noteEn: '4 sons and 2 daughters are recorded; the supplied document names the 4 sons below.',
    noteBn: '৪ ছেলে ও ২ মেয়ে নথিভুক্ত; প্রদত্ত নথিতে নিচের ৪ ছেলের নাম উল্লেখ আছে।'
  });
  patch('abul-khayer', { en: 'Abul Khayer', bn: 'আবুল খায়ের', noteEn: 'Known as Kari Saheb.', noteBn: 'কারী সাহেব নামে পরিচিত।' });
  patch('ibrahim-boro-boba', { en: 'Ibrahim (boro boba)', bn: 'ইব্রাহিম (boro boba)' });
  patch('yusuf-maijja-boba', { en: 'Yusuf (maijja boba)', bn: 'ইউসুফ (maijja boba)' });
  patch('choiyeed-ahmed', { en: 'Chhaiyad Ahmed', bn: 'ছৈইয়দ আহমেদ', noteEn: '5 sons and 5 daughters recorded.', noteBn: '৫ ছেলে ও ৫ মেয়ে নথিভুক্ত।' });
  patch('anowar-son-choiyeed', { en: 'Anowar', bn: 'আনোয়ার' });
  patch('delowar', { en: 'Delowar', bn: 'দেলোয়ার' });
  patch('lokman', { en: 'Lokman', bn: 'লোকমান' });
  patch('mayan', { en: 'Mayan', bn: 'মায়ান' });
  patch('amena', { en: 'Amena', bn: 'আমেনা' });
  patch('jahanara-janu', { en: 'Janatara Janu', bn: 'জানাতারা জানু' });
  patch('mofizur-rahman', { noteEn: '4 sons and 3 daughters recorded.', noteBn: '৪ ছেলে ও ৩ মেয়ে নথিভুক্ত।' });
  patch('saifur-rahman-tipu', { en: 'Saifur Rahman Tipu', bn: 'সাইফুর রহমান টিপু' });
  patch('arifur-rahman-tiku', { en: 'Arifur Rahman Tinku', bn: 'আরিফুর রহমান টিঙ্কু' });
  patch('russell', { en: 'Rasel', bn: 'রাসেল' });
  patch('mary', { en: 'Meri', bn: 'মেরি' });
  const mominul = byId('mominul-islam');
  if (mominul) {
    mominul.noteEn = '3 sons are recorded; Piyas is the only son named in the supplied document and is deceased.';
    mominul.noteBn = '৩ ছেলে নথিভুক্ত; প্রদত্ত নথিতে পিয়াসের নাম উল্লেখ আছে এবং তিনি মৃত্যুবরণ করেছেন।';
    mominul.children = (mominul.children || []).filter(child => child.id === 'piyas');
    if (mominul.children[0]) mominul.children[0].bn = 'পিয়াস';
  }

  patch('anowar-ullah', { bn: 'আনোয়ার উল্লাহ' });
  const anowar = byId('anowar-ullah');
  if (anowar && anowar.spouseGroups) {
    if (anowar.spouseGroups[1]) {
      const second = anowar.spouseGroups[1];
      second.spouseBn = 'দ্বিতীয় স্ত্রী — নাম নথিভুক্ত নেই';
      const tajgora = (second.children || []).find(c => c.id === 'tara-begum');
      if (tajgora) Object.assign(tajgora, { en: 'Tajgora', bn: 'তাজগোরা' });
      const hosneAra = (second.children || []).find(c => c.id === 'hosenara');
      if (hosneAra) Object.assign(hosneAra, { en: 'Hosne Ara', bn: 'হোসনেআরা' });
    }
    if (anowar.spouseGroups[2]) {
      const third = anowar.spouseGroups[2];
      third.spouseEn = 'Third wife (Chowdhury Buija)';
      third.spouseBn = 'তৃতীয় স্ত্রী (চৌধুরী বুইজা)';
      const saleha = (third.children || []).find(c => c.id === 'salema');
      if (saleha) Object.assign(saleha, { en: 'Saleha', bn: 'সালেহা' });
      const rezia = (third.children || []).find(c => c.id === 'rezia');
      if (rezia) rezia.bn = 'রেজিয়া';
      const sufia = (third.children || []).find(c => c.id === 'sufia-begum-moni');
      if (sufia) sufia.bn = 'সুফিয়া বেগম মনি';
    }
  }

  patch('afaz-mia', { bn: 'আফাজ মিয়া' });
  patch('abdul-haq', { bn: 'আব্দুল হক', noteEn: '5 sons and 3 daughters recorded.', noteBn: '৫ ছেলে ও ৩ মেয়ে নথিভুক্ত।' });
  patch('piyara-begum-ledi', { en: 'Peyara Begum Ledi', bn: 'পেয়ারা বেগম লেদি' });
  patch('ayesha', { bn: 'আয়েশা' });

  patch('dr-abul-hasem', { spouses: [{ en: 'Sadia Khatun', bn: 'সাদিয়া খাতুন' }], noteBn: '৫ ছেলে ও ৫ মেয়ে নথিভুক্ত।' });
  patch('saiful-islam-sobor', { en: 'Saiful Islam Sorob', bn: 'সাইফুল ইসলাম সোরব' });
  patch('redwanul-islam-muna', { en: 'Redwanul Islam Munna', bn: 'রেদওয়ানুল ইসলাম মুন্না' });
  patch('mahbub-alam-mamun', { en: 'Mahbub Alam Masum', bn: 'মাহবুব আলম মাসুম' });
  patch('ajmeri-sultana-afsana', { bn: 'আজমেরী সুলতানা আফসানা', noteBn: '১১ বছর বয়সে মৃত্যুবরণ।' });

  const monowara = byId('monowara-begum');
  if (monowara) {
    monowara.bn = 'মনোয়ারা বেগম';
    monowara.noteEn = '1 daughter is recorded; her name is not given in the supplied document.';
    monowara.noteBn = '১ কন্যা নথিভুক্ত; প্রদত্ত নথিতে তার নাম উল্লেখ নেই।';
    delete monowara.children;
  }
  patch('anowara-begum', { bn: 'আনোয়ারা বেগম' });
  patch('shamsun-nahar-nani', { en: 'Shamsur Nahar Noni', bn: 'শামসুর নাহার ননি' });
  patch('raiha-binte-moumumi', { en: 'Raisa Binte Mousumi', bn: 'রাইসা বিনতে মৌসুমি' });
  const nurjahan = byId('nurjahan-nur');
  if (nurjahan && nurjahan.children) {
    const sumi = nurjahan.children.find(c => c.id === 'rumi');
    if (sumi) Object.assign(sumi, { en: 'Sumi', bn: 'সুমি' });
    const foli = nurjahan.children.find(c => c.id === 'rahima-akter-poly');
    if (foli) Object.assign(foli, { en: 'Rahima Akter Foli', bn: 'রহিমা আক্তার ফলি' });
  }
  patch('rati', { bn: 'রাতি' });
  patch('akuri', { en: 'A: Kuri', bn: 'আঃ কুরি' });

  patch('abdullah-chamra', { bn: 'আব্দুল্লাহ চামড়া', noteEn: 'Related branch • 6 sons are recorded.', noteBn: 'সম্পর্কিত শাখা • ৬ ছেলে নথিভুক্ত।' });
  patch('yunus-mia', { en: 'Yunus Meya', bn: 'ইউনুস মেয়া' });
  patch('safik-ur-rahman-chamra', { en: 'Safik Ur Rahman (Chamra)', bn: 'সাফিক উর রহমান (চামড়া)' });
  patch('afsana-yunus', { en: 'Apjan', bn: 'আপজান' });
  const haidar = byId('haydar-ali');
  if (haidar) {
    haidar.en = 'Haidar Ali';
    haidar.bn = 'হায়দার আলী';
    haidar.noteEn = '2 sons are named; 3 daughters are recorded but their names are not listed.';
    haidar.noteBn = '২ ছেলের নাম উল্লেখ আছে; ৩ মেয়ে নথিভুক্ত, তবে তাদের নাম উল্লেখ নেই।';
    haidar.children = (haidar.children || []).filter(child => !child.placeholder);
  }
  patch('lalu-mia', { en: 'Latu Meya', bn: 'লাতু মেয়া' });
  patch('abul-kashem', { en: 'Abul Kasem', bn: 'আবুল কাসেম' });
  patch('akub-ali', { en: 'Ekub Ali', bn: 'একুব আলী' });
  patch('ramar-bap', { en: 'Romar Bap', bn: 'রমার বাপ' });
  patch('badiyar-bap', { en: 'Bodiyar Bap', bn: 'বদিয়ার বাপ' });
  patch('ruhul-amin-er-bap', { en: "Ruhul Amin's Father", bn: 'রুহুল আমিন এর বাপ' });

  Object.assign(translations.en, {
    brandSub: 'Nayeb Chowdhury lineage',
    sourceNote: 'Compiled from the supplied family lineage document. Names are preserved from that source and transliterated consistently for the English view.'
  });
  Object.assign(translations.bn, {
    brandTitle: 'পারিবারিক বংশ পরিচয়',
    brandSub: 'নায়েব চৌধুরীর বংশধারা',
    sourceNote: 'প্রদত্ত পারিবারিক বংশ পরিচয়ের নথি থেকে তথ্য সাজানো হয়েছে। বাংলা নাম উৎস অনুযায়ী রাখা হয়েছে এবং ইংরেজি সংস্করণে একইভাবে রোমান হরফে লেখা হয়েছে।'
  });
})();