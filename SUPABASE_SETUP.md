# Family Tree V5 — Supabase setup

The website is fully prepared for a central family database, shared correction queue, private admin login, version history, and photo storage. Until Supabase is connected, the public site continues to work in local/static mode.

## 1. Create a Supabase project

Create a new Supabase project, then copy these two **public browser values** from the project settings:

- Project URL
- Publishable/anon key

Never use or publish the `service_role` key.

## 2. Create the database

Open Supabase → SQL Editor, paste the full contents of `supabase/schema.sql`, and run it.

At the bottom of that file there is a commented first-admin line. Replace `YOUR_ADMIN_EMAIL_HERE` with the email address you want to use for the private admin magic-link login, uncomment that one line, and run it.

## 3. Configure the website

Open `backend-config.js` and set:

```js
window.FAMILY_BACKEND_CONFIG = Object.freeze({
  enabled: true,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLISHABLE_OR_ANON_KEY',
  projectName: 'Family Heritage Tree'
});
```

The publishable/anon key is intentionally used in the browser. Security is enforced by the Row Level Security policies in `supabase/schema.sql`.

## 4. Supabase Auth URL settings

In Supabase → Authentication → URL Configuration, set the Site URL to:

`https://zrsaimun.github.io/Family-Tree/`

Add the same URL to the allowed redirect URLs.

## 5. First admin sign-in and first publish

Open the website, open **Family Database**, and request a magic link with the same admin email you added to `family_admins`.

After signing in:

1. Press **Seed current tree** once. This copies the current corrected website family data into the central database as Version 1.
2. Future admin edits create a new version instead of overwriting history.
3. Public visitors automatically load the newest published version.

## How publishing works

The current JavaScript tree is the safe fallback. When a published Supabase snapshot exists, the browser caches that official snapshot before the normal family-tree renderer starts. If a newer version is available, the page refreshes once and renders the new official version.

This means:

- family corrections are recoverable;
- approved changes can be published without editing `data.js` manually;
- every published version remains in history;
- the static tree still works if Supabase is temporarily unavailable.

## Family submissions

Relatives can use **Submit family update** without an admin account. They can submit a spelling correction, spouse/child information, parent information, dates, story/history information, or a "This is me" claim.

Public users cannot read the submission queue. Only authenticated admins listed in `family_admins` can review it.

## Photos

The SQL creates a public `family-media` bucket. Public visitors can view approved photos, but only authenticated family admins can upload, change, or delete files. The configured maximum file size is 10 MB and the allowed formats are JPEG, PNG, WEBP, and HEIC.

## Security notes

- Never put the Supabase `service_role` key in GitHub, browser code, localStorage, screenshots, or chat.
- Admin permissions are enforced in Postgres RLS, not only hidden in the UI.
- Anonymous relatives can insert correction submissions but cannot read other submissions.
- Public visitors can only read published snapshots.
- Admin actions create audit records where possible.
