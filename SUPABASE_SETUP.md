# Family Tree — Supabase activation

The public family tree is designed so the stable static site keeps working even if the cloud backend is unavailable. Supabase is an optional shared-data layer for central submissions, private admin review, version history and approved photo storage.

## 1. Connect/create the Supabase project

Create or connect a Supabase project, then use these two **public browser values** from the project settings:

- Project URL
- Publishable/anon key

Never use or publish the `service_role` key.

## 2. Create and secure the database

Run the full contents of `supabase/schema.sql` in the Supabase SQL Editor.

The schema creates:

- `family_admins`
- `family_snapshots`
- `family_submissions`
- `family_audit_log`
- Row Level Security policies
- the `family-media` Storage bucket
- an atomic database rule that keeps at most one family snapshot published at a time

At the bottom of `supabase/schema.sql` there is a commented first-admin statement. Replace `YOUR_ADMIN_EMAIL_HERE` with the email you intend to use for magic-link admin login, uncomment that one statement, and run it.

Do not guess or reuse an email just because it appears elsewhere in GitHub; use the address you deliberately choose for family administration.

## 3. Verify the backend before enabling it

Run `supabase/verify.sql` after the schema. It checks:

- all four family tables exist;
- RLS is enabled;
- family/storage policies exist;
- no more than one snapshot is published;
- the admin allow-list is present;
- the media bucket is configured;
- the one-published-version database invariant exists.

## 4. Configure Supabase Auth URLs

In Supabase → Authentication → URL Configuration:

- Site URL: `https://zrsaimun.github.io/Family-Tree/`
- Add the same URL to allowed redirect URLs.

## 5. Activate cloud mode in the website

Edit `backend-config.js`:

```js
window.FAMILY_BACKEND_CONFIG = Object.freeze({
  enabled: true,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLISHABLE_OR_ANON_KEY',
  projectName: 'Family Heritage Tree'
});
```

The publishable/anon key is intentionally used in browser code. Security is enforced by the database Row Level Security policies.

### Why activation is safe

`index.html` always loads the stable tree first. `cloud-loader.js` loads the cloud/admin UI only when all three conditions are true:

1. `enabled` is `true`;
2. a Supabase URL is present;
3. a public anon/publishable key is present.

When cloud mode is off, the Supabase feature code and CSS are not loaded at all. A cloud failure therefore cannot prevent the core family tree from opening.

`backend-preload.js` is separately gated. It only applies a cached official cloud snapshot when cloud mode is explicitly enabled and the cached family data passes structural validation. Invalid/stale cloud cache is discarded.

## 6. First admin sign-in and Version 1

Open the website and use **Family Database**. Request a magic link using exactly the same address listed in `family_admins`.

After admin sign-in:

1. Use **Seed current tree** once to create the first official shared snapshot.
2. Confirm Version 1 is published.
3. Re-run `supabase/verify.sql`; `published_snapshot_count` should be `1`.
4. Open the site in a signed-out/private browser and confirm the public tree loads Version 1.

Future edits publish a new snapshot instead of overwriting history. The database automatically unpublishes the old version in the same transaction, so the public site cannot end up with two official versions.

## Family submissions

Relatives can submit spelling corrections, spouse/child information, parent information, dates, location/occupation, family stories and “This is me” claims.

Anonymous visitors can **insert** a pending submission but cannot read the queue. Only authenticated users whose email exists in `family_admins` can review submissions.

## Photos

Approved media is stored in the public `family-media` bucket. Public visitors may display approved photo URLs. Only authenticated family admins may upload, update or delete Storage objects through the configured policies.

Current limits:

- maximum file size: 10 MB
- JPEG
- PNG
- WEBP
- HEIC

## Security rules

- Never put a Supabase `service_role` key in GitHub, browser code, localStorage, screenshots or chat.
- Admin authorization is enforced in Postgres RLS, not merely by hiding buttons.
- Public visitors can only read published snapshots.
- Public visitors cannot read other relatives' submissions.
- Admin actions are recorded in the family audit log where supported by the UI.
- Keep the static family data as a recovery fallback even after cloud activation.
