(() => {
  const $ = id => document.getElementById(id);
  const rootSource = familyData.rootTrail.find(p => p.id === 'nayeb-chowdhury') || familyData.rootTrail[0];
  const chanSource = familyData.rootTrail.find(p => p.id === 'chan-gazi-hawladar') || familyData.rootTrail[1];
  const root = {...rootSource, children:[{...chanSource, children:[familyData.main, familyData.secondary]}]};
  const parentInfo = new Map();

  const isFemale = person => {
    const en = String(person?.relationEn || '').toLowerCase();
    const bn = String(person?.relationBn || '');
    return en === 'daughter' || bn.includes('মেয়ে') || bn.includes('মেয়ে');
  };
  const isUnknownName = (en='', bn='') => /name (not recorded|unknown)/i.test(en) || /নাম (নথিভুক্ত নেই|অজানা)/.test(bn);
  const personRef = p => p ? {id:p.id || null, en:p.en || '', bn:p.bn || ''} : null;
  const spouseRef = s => {
    if(!s) return null;
    const en = s.en || s.spouseEn || '';
    const bn = s.bn || s.spouseBn || '';
    if(!en && !bn) return null;
    if(isUnknownName(en,bn)) return null;
    return {id:null,en,bn};
  };

  function index(person, parents=null){
    if(!person || !person.id) return;
    if(parents) parentInfo.set(person.id, parents);

    const female = isFemale(person);
    const spouses = person.spouses || [];
    const oneSpouse = spouses.length === 1 ? spouseRef(spouses[0]) : null;

    (person.children || []).forEach(child => {
      const parentsForChild = female
        ? {father: oneSpouse, mother: personRef(person)}
        : {father: personRef(person), mother: oneSpouse};
      index(child, parentsForChild);
    });

    (person.spouseGroups || []).forEach(group => {
      const mother = spouseRef(group);
      (group.children || []).forEach(child => index(child, {
        father: personRef(person),
        mother
      }));
    });
  }
  index(root);

  const labels = {
    en:{father:'Father',mother:'Mother',unknown:'Not recorded'},
    bn:{father:'পিতা',mother:'মাতা',unknown:'নথিভুক্ত নেই'}
  };
  const lang = () => document.documentElement.lang === 'bn' ? 'bn' : 'en';
  const esc = (v='') => String(v).replace(/[&<>\'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function row(label, ref){
    const l = lang();
    const name = ref ? (l === 'bn' ? (ref.bn || ref.en) : (ref.en || ref.bn)) : labels[l].unknown;
    const value = ref?.id
      ? `<button type="button" data-profile-jump="${esc(ref.id)}">${esc(name)}</button>`
      : `<b${ref ? '' : ' style="color:#8a8f94;font-weight:750"'}>${esc(name)}</b>`;
    return `<div class="profile-field parent-detail"><span>${esc(label)}</span>${value}</div>`;
  }

  function decorate(){
    const content = $('profileContent');
    if(!content) return;
    const action = content.querySelector('[data-focus-person]');
    if(!action) return;
    const id = action.dataset.focusPerson;
    const info = parentInfo.get(id);
    if(!info) return;
    const body = content.querySelector('.profile-body');
    if(!body) return;

    body.querySelectorAll('.parent-detail').forEach(el => el.remove());
    const oldParent = [...body.querySelectorAll('.profile-field')].find(row => {
      const txt = row.querySelector('span')?.textContent.trim();
      return txt === 'Parent' || txt === 'অভিভাবক';
    });
    if(oldParent) oldParent.remove();

    const l = lang();
    const holder = document.createElement('div');
    holder.className = 'parent-details';
    holder.innerHTML = row(labels[l].father, info.father) + row(labels[l].mother, info.mother);
    body.insertBefore(holder, body.firstChild);
  }

  const content = $('profileContent');
  if(content){
    new MutationObserver(() => decorate()).observe(content,{childList:true,subtree:true});
    decorate();
  }
})();