/* Family-approved stories only. No facts or private media are stored in browser caches. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const en = () => document.documentElement.lang !== 'bn';
  const t = (a,b) => en() ? a : b;
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const categories = [['history','Personal history','ব্যক্তিগত ইতিহাস'],['life','Life facts','জীবনের তথ্য'],['occupation','Occupation & achievements','পেশা ও অর্জন'],['childhood','Childhood memories','শৈশবের স্মৃতি'],['family','Family stories','পরিবারের গল্প'],['milestone','Historical milestones','ঐতিহাসিক মাইলফলক'],['ancestors','Ancestors','পূর্বপুরুষ']];
  let rows = [], admin = false, generation = 0, selected = 0, person = null, language = '', scheduled = false;
  const client = () => window.familyCloudClient;
  const pick = (r,key) => en() ? (r[key+'_en'] || r[key+'_bn']) : (r[key+'_bn'] || r[key+'_en']);
  // Restrict media to the private story bucket; never use arbitrary tracking URLs.
  const photoURL = path => path ? client().storage.from('family-fact-photos').createSignedUrl(path,120) : null;
  async function refresh() {
    const epoch = ++generation;
    rows = []; admin = false; render(); decorate();
    const db = client(); if (!db) return;
    const auth = await db.auth.getSession();
    let allowed = false;
    if (auth.data.session) {
      const result = await db.from('family_admins').select('email').limit(1);
      allowed = !result.error && !!result.data?.length;
    }
    const result = await db.from('person_fun_facts').select('*').order('sort_order').order('id');
    if (epoch !== generation) return;
    admin = allowed;
    rows = result.error ? [] : (result.data || []);
    render(); decorate();
  }
  function decorate() {
    document.querySelectorAll('#treeHost .person-card[data-person-id]').forEach(card => {
      const has = rows.some(r => r.person_id === card.dataset.personId && r.approved && r.visibility === 'public');
      let badge = card.querySelector('.fun-facts-badge');
      if (!has) { badge?.remove(); return; }
      if (!badge) { badge = document.createElement('span'); badge.className = 'fun-facts-badge'; card.querySelector('.person-copy')?.append(badge); }
      const text = t('✨ Fun Facts','✨ মজার তথ্য');
      if (badge.textContent !== text) badge.textContent = text;
    });
  }
  function sync() {
    scheduled = false;
    const id = $('profileContent')?.querySelector('[data-focus-person]')?.dataset.focusPerson;
    const lang = document.documentElement.lang;
    if (id !== person || language !== lang || (id && !$('personFunFacts'))) {
      if (id !== person) selected = 0;
      person = id; language = lang; render();
    }
    decorate();
  }
  function queue() { if (!scheduled) { scheduled = true; requestAnimationFrame(sync); } }
  function render() {
    $('personFunFacts')?.remove();
    if (!person || !$('profileContent')?.querySelector('[data-focus-person]')) return;
    const facts = rows.filter(r => r.person_id === person && (admin || (r.approved && r.visibility === 'public')));
    if (!facts.length && !admin) return;
    selected = Math.max(0,Math.min(selected,facts.length-1));
    const fact = facts[selected], section = document.createElement('section');
    section.id = 'personFunFacts'; section.className = 'fun-facts'; section.setAttribute('aria-label',t('Fun Facts','মজার তথ্য'));
    section.innerHTML = `<div class="ff-heading"><h3>✨ ${t('Fun Facts','মজার তথ্য')}</h3>${admin?`<button type="button" data-ff="add">${t('Add Fun Fact','তথ্য যোগ করুন')}</button>`:''}</div>
      ${fact ? `<article class="ff-story" aria-live="polite" aria-atomic="true"><small>${esc(t(...(categories.find(c=>c[0]===fact.category)||categories[0]).slice(1)))}</small><h4>${esc(pick(fact,'title'))}</h4><p>${esc(pick(fact,'body'))}</p><div class="ff-media"></div>${admin?`<small>${esc(fact.visibility)} · ${fact.approved?t('Approved','অনুমোদিত'):t('Draft','খসড়া')}</small>`:''}</article>
      <nav class="ff-nav" aria-label="${t('Story navigation','গল্প দেখুন')}"><button type="button" data-ff="prev" ${selected===0?'disabled':''}>${t('← Previous','← আগের')}</button><span>${selected+1} / ${facts.length}</span><button type="button" data-ff="next" ${selected===facts.length-1?'disabled':''}>${t('Next →','পরের →')}</button></nav>
      ${admin?`<div class="ff-tools"><button type="button" data-ff="edit">${t('Edit','সম্পাদনা')}</button><button type="button" data-ff="up" ${selected===0?'disabled':''}>${t('Move earlier','আগে নিন')}</button><button type="button" data-ff="down" ${selected===facts.length-1?'disabled':''}>${t('Move later','পরে নিন')}</button><button type="button" data-ff="delete">${t('Delete','মুছুন')}</button></div>`:''}`:`<p>${t('No family-approved stories yet.','এখনো পরিবারের অনুমোদিত গল্প নেই।')}</p>`}<div class="ff-status" role="status"></div>`;
    ($('profileContent').querySelector('.profile-body') || $('profileContent')).append(section);
    if (fact?.photo_path) {
      const media = section.querySelector('.ff-media');
      photoURL(fact.photo_path)?.then(result => {
        if (!media.isConnected || result.error) return;
        const figure = document.createElement('figure'), img = document.createElement('img'), caption = document.createElement('figcaption');
        img.src = result.data.signedUrl; img.alt = pick(fact,'caption') || pick(fact,'title') || ''; img.loading = 'lazy';
        caption.textContent = pick(fact,'caption') || ''; figure.append(img,caption); media.append(figure);
      });
    }
    section.addEventListener('click', async e => {
      const action = e.target.closest('[data-ff]')?.dataset.ff; if (!action) return;
      if (action === 'prev' || action === 'next') {
        selected += action === 'next' ? 1 : -1; render();
        $('personFunFacts')?.querySelector(`[data-ff="${action}"]`)?.focus(); return;
      }
      if (!admin) return;
      if (action === 'add' || action === 'edit') { editor(action==='edit'?fact:null); return; }
      if (action==='delete' && !confirm(t('Delete this family fact?','এই তথ্য মুছবেন?'))) return;
      section.querySelectorAll('button').forEach(b=>b.disabled=true);
      try {
        let result;
        if (action === 'delete') result = await client().from('person_fun_facts').delete().eq('id',fact.id).select('id');
        else if (action === 'up' || action === 'down') {
          const other = facts[selected+(action==='up'?-1:1)]; if (!other) return;
          result = await client().rpc('reorder_person_fun_facts',{first_id:fact.id,second_id:other.id});
          selected += action==='up'?-1:1;
        }
        if (result?.error) throw result.error;
        if (action==='delete' && !result.data?.length) throw new Error('Access changed. Sign in again.');
        await refresh();
      } catch (_) { render(); $('personFunFacts').querySelector('.ff-status').textContent=t('Could not save. Check your connection and admin session.','সংরক্ষণ হয়নি। সংযোগ ও অ্যাডমিন লগইন পরীক্ষা করুন।'); }
    });
  }
  function editor(fact) {
    const section = $('personFunFacts'), id = person;
    if (section.querySelector('form')) return;
    const form = document.createElement('form'); form.className='ff-editor';
    const field = (key,label,multiline=false) => `<label>${label}${multiline?`<textarea name="${key}" maxlength="6000" rows="4">${esc(fact?.[key])}</textarea>`:`<input name="${key}" maxlength="200" value="${esc(fact?.[key])}">`}</label>`;
    form.innerHTML = `<h4>${t('Family story editor','পারিবারিক গল্প সম্পাদনা')}</h4><p>${t('Only family-supplied information. Never publish private land or property details.','শুধু পরিবারের দেওয়া তথ্য। ব্যক্তিগত জমি বা সম্পত্তির তথ্য প্রকাশ করবেন না।')}</p>
      <label>${t('Category','বিভাগ')}<select name="category">${categories.map(c=>`<option value="${c[0]}" ${fact?.category===c[0]?'selected':''}>${esc(t(c[1],c[2]))}</option>`).join('')}</select></label>
      ${field('title_en','English title')}${field('title_bn','বাংলা শিরোনাম')}${field('body_en','English story',true)}${field('body_bn','বাংলা গল্প',true)}
      <label>${t('Optional approved photo (JPEG, PNG, WebP; max 5 MB)','অনুমোদিত ছবি (JPEG, PNG, WebP; সর্বোচ্চ ৫ MB)')}<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label>
      ${field('caption_en','English photo caption')}${field('caption_bn','বাংলা ছবির বিবরণ')}
      ${fact?.photo_path?`<label><input type="checkbox" name="remove_photo">${t('Remove photo','ছবি সরান')}</label>`:''}
      <label>${t('Visibility','গোপনীয়তা')}<select name="visibility"><option value="private">${t('Private — admins only','ব্যক্তিগত — শুধু অ্যাডমিন')}</option><option value="public" ${fact?.visibility==='public'?'selected':''}>${t('Public','সর্বজনীন')}</option></select></label>
      <label><input type="checkbox" name="approved" ${fact?.approved?'checked':''}>${t('Family approved; safe to share at chosen visibility','পরিবার অনুমোদিত; নির্বাচিত গোপনীয়তায় দেখানো নিরাপদ')}</label>
      <div class="ff-tools"><button type="submit">${t('Save fact','সংরক্ষণ')}</button><button type="button" data-cancel>${t('Cancel','বাতিল')}</button></div><p role="status"></p>`;
    section.append(form); form.querySelector('input')?.focus();
    form.querySelector('[data-cancel]').onclick=()=>form.remove();
    form.onsubmit=async e=>{
      e.preventDefault(); const data=new FormData(form), payload={person_id:id};
      ['title_en','title_bn','body_en','body_bn','caption_en','caption_bn','category','visibility'].forEach(k=>payload[k]=String(data.get(k)||'').trim());
      payload.approved=data.get('approved')==='on';
      if ((!payload.body_en && !payload.body_bn) || (!payload.title_en && !payload.title_bn)) { form.querySelector('[role=status]').textContent=t('Add a title and story in at least one language.','অন্তত একটি ভাষায় শিরোনাম ও গল্প দিন।'); return; }
      payload.photo_path=data.get('remove_photo')?'':fact?.photo_path||'';
      form.querySelectorAll('button').forEach(b=>b.disabled=true);
      let uploaded = null;
      try {
        const file=data.get('photo');
        if (file?.size) {
          if (file.size>5*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Invalid photo');
          uploaded=`${crypto.randomUUID()}.${{'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type]}`;
          const upload=await client().storage.from('family-fact-photos').upload(uploaded,file,{contentType:file.type}); if(upload.error)throw upload.error;
          payload.photo_path=uploaded;
        }
        if (!fact) {
          // Person IDs come from the existing official tree, never the Different Family workspace.
          const registered=await client().from('fun_fact_people').upsert({person_id:id},{onConflict:'person_id'}); if(registered.error)throw registered.error;
          payload.sort_order=Math.max(-1,...rows.filter(r=>r.person_id===id).map(r=>r.sort_order))+1;
        }
        const result=await (fact?client().from('person_fun_facts').update(payload).eq('id',fact.id):client().from('person_fun_facts').insert(payload)).select('id');
        if(result.error || !result.data?.length)throw result.error||new Error('Access changed');
        await refresh();
      } catch (_) {
        if (uploaded) await client().storage.from('family-fact-photos').remove([uploaded]);
        form.querySelector('[role=status]').textContent=t('Could not save. Check photo size, connection and admin login.','সংরক্ষণ হয়নি। ছবির আকার, সংযোগ ও লগইন পরীক্ষা করুন।');
        form.querySelectorAll('button').forEach(b=>b.disabled=false);
      }
    };
  }
  new MutationObserver(queue).observe($('profileContent'),{childList:true,subtree:true});
  new MutationObserver(queue).observe($('treeHost'),{childList:true,subtree:true});
  new MutationObserver(queue).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('family-cloud-ready',refresh);
  window.addEventListener('family-auth-changed',refresh);
  // Clear private stories synchronously before the auth refresh performs any async work.
  window.addEventListener('storage',e=>{if(e.key?.startsWith('sb-'))refresh();});
  if(client())refresh();
})();
