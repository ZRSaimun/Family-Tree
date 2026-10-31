-- Additive Fun Facts schema. Existing relationships and snapshots are unchanged.
begin;
create table public.fun_fact_people (
 person_id text primary key check(length(person_id) between 1 and 200)
);
alter table public.fun_fact_people enable row level security;
grant select,insert,update on public.fun_fact_people to authenticated;
create policy "admins manage fact person registry" on public.fun_fact_people for all to authenticated using ((select private.is_family_admin())) with check ((select private.is_family_admin()));
insert into public.fun_fact_people(person_id) values
('nayeb-chowdhury'),
('chan-gazi-hawladar'),
('mohabbat-ali-munsir'),
('noor-mia'),
('abul-khayer'),
('ibrahim-boro-boba'),
('yusuf-maijja-boba'),
('belal'),
('milon'),
('sefu'),
('kusum'),
('choiyeed-ahmed'),
('dulal-ahmed'),
('anowar-son-choiyeed'),
('delowar'),
('lokman'),
('khokon-choiyeed'),
('mayan'),
('amena'),
('lilu'),
('jahanara-janu'),
('sahin-daughter-choiyeed'),
('mofizur-rahman'),
('saifur-rahman-tipu'),
('mizanur-rahman-tulu'),
('arifur-rahman-tiku'),
('russell'),
('mukti'),
('mary'),
('munni'),
('mominul-islam'),
('piyas'),
('anowar-ullah'),
('siddik-ullah'),
('mahfuzur-rahman'),
('zilkarnain-khokon'),
('parvin'),
('sahin-siddik'),
('nasrin'),
('nur-jahan-anowar'),
('tara-begum'),
('hosenara'),
('leda'),
('salema'),
('rezia'),
('sufia-begum-moni'),
('noni'),
('kohinur-mukta'),
('manik'),
('afaz-mia'),
('abdul-haq'),
('abdur-nur-babul'),
('abdul-odud-bacchu'),
('golam-nur-sahin'),
('mozammel-hosen-didar'),
('nazmul-hosen'),
('ayesha'),
('maya-afaz'),
('tahura'),
('piyara-begum-ledi'),
('dr-abul-hasem'),
('rafiqul-islam'),
('saiful-islam-sobor'),
('aurora-sorob'),
('arbia-sorob'),
('shariful-islam-palash'),
('rezaul-islam-peter'),
('redwanul-islam-muna'),
('mihiron'),
('shahidul-islam'),
('tahamina-akter-pinu'),
('samina-pinu'),
('cynthia-pinu'),
('taiyeb-pinu'),
('suhaira-pinu'),
('sheikh-farid'),
('ahil-farid'),
('adil-farid'),
('adiba-farid'),
('harunur-rashid-toha'),
('riyan-toha'),
('rida-toha'),
('rubaiya-toha'),
('radia-toha'),
('golam-mostofa'),
('mahbub-alam-mamun'),
('maisha-masum'),
('ayat-masum'),
('nure-alam-tahamim'),
('ajmeri-sultana-afsana'),
('amir-hosen'),
('israt-jahan-rumana'),
('raiyan-rumana'),
('sanjana-jahan-mim'),
('faiyaz-mim'),
('mohammad-ali-jinnah'),
('md-al-amin'),
('sharmin-sultana'),
('md-zillur-rahman-saimun'),
('md-mehdi-hasan-sifat'),
('monowara-begum'),
('anowara-begum'),
('jahid-nur-tapan'),
('jesmin-akter-baby'),
('hannan-sami'),
('shahid-nur-ripon'),
('abid-nur-babu'),
('shamsun-nahar-nani'),
('sahajan-parvin-pakhi'),
('monita-pakhi'),
('laki'),
('ridim-laki'),
('salauddin-roni'),
('raiha-binte-moumumi'),
('rimjhim-mousumi'),
('rijim-mousumi'),
('akhi'),
('nurjahan-nur'),
('sohel-rana'),
('isha-sohel'),
('raisa-sohel'),
('shaheen-sohel'),
('rumi'),
('siyam-sumi'),
('sohan-sumi'),
('farhan-sumi'),
('tithi-sumi'),
('sarmin-akter-rumi'),
('mimi-rumi'),
('sara-rumi'),
('parha-rumi'),
('minhaj-rumi'),
('rubel'),
('rahima-akter-poly'),
('tanzil-foli'),
('ayas-foli'),
('ayesha-foli'),
('fatema-begum'),
('asma-rahman'),
('arapi-asma'),
('asifur-rahman'),
('rati'),
('akuri'),
('abdullah-chamra'),
('yunus-mia'),
('safik-ur-rahman-chamra'),
('nur-nabi'),
('afsana-yunus'),
('haydar-ali'),
('alam-haydar'),
('babul-haydar'),
('yusuf-ali'),
('lalu-mia'),
('abul-kashem'),
('abul-kalam'),
('akub-ali'),
('jahir'),
('rosen'),
('halima'),
('ramar-bap'),
('badiyar-bap'),
('ruhul-amin-er-bap');
create table public.person_fun_facts (
 id uuid primary key default gen_random_uuid(),
 person_id text not null references public.fun_fact_people(person_id) on delete restrict,
 category text not null default 'life' check(category in ('history','life','occupation','childhood','family','milestone','ancestors')),
 title_en text not null default '' check(length(title_en)<=200),
 title_bn text not null default '' check(length(title_bn)<=200),
 body_en text not null default '' check(length(body_en)<=6000),
 body_bn text not null default '' check(length(body_bn)<=6000),
 caption_en text not null default '' check(length(caption_en)<=200),
 caption_bn text not null default '' check(length(caption_bn)<=200),
 photo_path text not null default '' check(photo_path='' or photo_path ~ '^[a-f0-9-]{36}\.(jpg|png|webp)$'),
 visibility text not null default 'private' check(visibility in ('public','private')),
 approved boolean not null default false,
 sort_order integer not null default 0 check(sort_order>=0),
 created_at timestamptz not null default now(),
 check(length(trim(title_en))+length(trim(title_bn))>0),
 check(length(trim(body_en))+length(trim(body_bn))>0)
);
create index person_fun_facts_person_order on public.person_fun_facts(person_id,sort_order,id);
alter table public.person_fun_facts enable row level security;
grant select on public.person_fun_facts to anon;
grant select,insert,update,delete on public.person_fun_facts to authenticated;
create policy "approved public stories" on public.person_fun_facts for select to anon,authenticated using (visibility='public' and approved);
create policy "admins manage stories" on public.person_fun_facts for all to authenticated using ((select private.is_family_admin())) with check ((select private.is_family_admin()));
-- Atomic reorder: adjacent stories only, same person, checked against the existing admin allow-list.
create function public.reorder_person_fun_facts(first_id uuid,second_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare a public.person_fun_facts; b public.person_fun_facts;
begin
 if not private.is_family_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 perform id from public.person_fun_facts where id in(first_id,second_id) order by id for update;
 select * into strict a from public.person_fun_facts where id=first_id;
 select * into strict b from public.person_fun_facts where id=second_id;
 if a.person_id<>b.person_id or a.id=b.id then raise exception 'Invalid reorder'; end if;
 -- Renumber deterministically to handle equal positions and concurrent additions.
 with ordered as (select id,row_number() over(order by sort_order,id)::integer as n from public.person_fun_facts where person_id=a.person_id)
 update public.person_fun_facts f set sort_order=o.n from ordered o where f.id=o.id;
 select * into a from public.person_fun_facts where id=first_id;
 select * into b from public.person_fun_facts where id=second_id;
 update public.person_fun_facts set sort_order=case when id=a.id then b.sort_order else a.sort_order end where id in(a.id,b.id);
end $$;
revoke all on function public.reorder_person_fun_facts(uuid,uuid) from public,anon;
grant execute on function public.reorder_person_fun_facts(uuid,uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('family-fact-photos','family-fact-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy "admins manage story photos" on storage.objects for all to authenticated using(bucket_id='family-fact-photos' and (select private.is_family_admin())) with check(bucket_id='family-fact-photos' and (select private.is_family_admin()));
create policy "approved public story photos" on storage.objects for select to anon,authenticated using(bucket_id='family-fact-photos' and exists(select 1 from public.person_fun_facts f where f.photo_path=name and f.visibility='public' and f.approved));
-- Remove temporary public test policies on private land/property tables.
-- Existing admin policies remain intact; map sheets also receive explicit admin-only access.
drop policy if exists "public_test_read_mouza_map_sheets" on public.admin_mouza_map_sheets;
drop policy if exists "public_test_add_mouza_map_sheets" on public.admin_mouza_map_sheets;
drop policy if exists "public_test_edit_mouza_map_sheets" on public.admin_mouza_map_sheets;
create policy "admins manage mouza sheets" on public.admin_mouza_map_sheets for all to authenticated using((select private.is_family_admin())) with check((select private.is_family_admin()));
drop policy if exists "temporary public test read land records" on public.admin_land_records;
drop policy if exists "temporary public test add land records" on public.admin_land_records;
drop policy if exists "temporary public test edit land records" on public.admin_land_records;
drop policy if exists "temporary public test read land locations" on public.admin_land_locations;
drop policy if exists "temporary public test add land locations" on public.admin_land_locations;
drop policy if exists "temporary public test edit land locations" on public.admin_land_locations;
commit;
