# Family Heritage Tree

A bilingual (English / বাংলা) interactive family-history platform for the **Nayeb Chowdhury** lineage.

The connected tree begins:

**Nayeb Chowdhury → Chan Gazi Hawladar → Mohabbat Ali Munsir + Abdullah Chamra → descendants**

## Family-tree experience

- One connected parent → child family tree
- English / Bangla language switch
- Generation colour coding
- Search across English and Bangla names
- Expand / collapse branches
- Pan, zoom, fit-tree and focus controls
- Person profile drawer
- Father and mother shown separately when recorded
- Spouses and multiple marriages
- Children and siblings in profiles
- Lineage breadcrumbs and shareable person links
- Generation navigation
- Relationship finder
- **Find My Family** gathering mode
- Family Gallery (photo-ready)
- Full-tree and person-profile printing
- CSV export and update template
- Installable/offline web-app support
- Gathering QR code

## V5 shared family database

The repository now includes an optional Supabase-backed central database layer.

When `backend-config.js` is connected to a Supabase project, the website gains:

- shared family correction submissions from any relative;
- private magic-link admin login;
- an admin allow-list protected by Postgres Row Level Security;
- pending / approved / rejected review workflow;
- official family-tree publishing from the browser;
- immutable version history and restore;
- structured approval for simple corrections;
- official person editor for names, dates, locations, occupation and family stories;
- add-child, add-spouse and new-marriage-branch tools;
- approved family-photo upload to Supabase Storage;
- audit-log records for publishing and review actions;
- **This is me** claim submissions;
- automatic public sync to the newest published family snapshot.

If Supabase is unavailable or not yet configured, the existing static tree remains the safe fallback.

## Safe versioned publishing

V5 stores each official tree as a versioned JSON snapshot rather than destructively overwriting the previous tree. Public visitors load the newest published snapshot. Older versions remain available to an authenticated family admin and can be restored as a new version.

A cached official snapshot is applied before the visual renderer starts, so the normal family-tree UI can continue using the same tested rendering engine.

## Supabase setup

See **`SUPABASE_SETUP.md`** and **`supabase/schema.sql`**.

The only browser credentials used are the Supabase **Project URL** and **publishable/anon key**. Never place a Supabase `service_role` key in this repository or browser code.

## Rich person information

Person objects can include optional fields such as:

```js
{
  id: 'example-person',
  en: 'Example Person',
  bn: 'উদাহরণ ব্যক্তি',
  photoUrl: 'https://...',
  birth: '1975',
  death: '',
  locationEn: 'Family village / city',
  locationBn: 'পারিবারিক গ্রাম / শহর',
  occupationEn: 'Occupation',
  occupationBn: 'পেশা',
  storyEn: 'Family history or biography',
  storyBn: 'পারিবারিক ইতিহাস বা জীবনী'
}
```

The V5 admin editor can publish these fields without manually editing `data.js` once the shared database is connected.

## Security model

- Public visitors can read only published family snapshots.
- Public visitors can submit corrections but cannot read the submission queue.
- Only authenticated emails listed in `family_admins` can review submissions, publish versions, or upload approved media.
- Database permissions are enforced with Row Level Security, not only hidden UI controls.
- Approved images are served from the public `family-media` bucket; upload/change/delete operations remain admin-only.

## Run locally

Open `index.html` directly, or run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish

GitHub Actions deploys the site to GitHub Pages from the `main` branch. Pages deployments are queued rather than cancelling an active publish.
