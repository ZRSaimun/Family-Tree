-- Family Heritage Tree backend verification
-- Safe/read-only checks to run after supabase/schema.sql.

-- 1) Core tables should all exist.
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('family_admins','family_snapshots','family_submissions','family_audit_log')
order by table_name;

-- 2) RLS should be enabled on all family tables.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('family_admins','family_snapshots','family_submissions','family_audit_log')
order by tablename;

-- 3) Inspect the policies installed for family data and storage.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename like 'family_%')
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- 4) There must never be more than one published snapshot.
select count(*) as published_snapshot_count,
       max(version) as published_version
from public.family_snapshots
where is_published = true;

-- 5) Show recent snapshot versions without exposing family JSON in this check.
select id, version, is_published, note, created_at, created_by_email
from public.family_snapshots
order by version desc
limit 10;

-- 6) Confirm an admin row exists after first-admin setup.
select email, created_at
from public.family_admins
order by created_at;

-- 7) Confirm the media bucket settings.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'family-media';

-- 8) Confirm the one-published invariant index exists.
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'family_snapshots'
order by indexname;
