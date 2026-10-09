# Family Heritage Tree

A bilingual (English / বাংলা) interactive family-history website for the **Nayeb Chowdhury** lineage.

The connected tree begins:

**Nayeb Chowdhury → Chan Gazi Hawladar → Mohabbat Ali Munsir + Abdullah Chamra → descendants**

## Current features

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
- Lineage breadcrumbs
- Direct shareable person links
- Focus-on-person / focus-on-branch workflow
- Generation navigation
- Relationship finder with the recorded lineage path
- **Find My Family** gathering mode
- Family Gallery (photo-ready)
- Suggest / correct family information workflow
- Suggestions can be saved locally, shared from a phone, or opened as a pre-filled GitHub issue
- Local Admin Tools with suggestion review, data audit and JSON export
- Responsive mobile layout
- Print-friendly styling

## Adding richer person information

Existing person objects can optionally include these fields. The interface will automatically use them when present:

```js
{
  id: 'example-person',
  en: 'Example Person',
  bn: 'উদাহরণ ব্যক্তি',
  photoUrl: 'photos/example-person.jpg',
  birthEn: '1975',
  birthBn: '১৯৭৫',
  deathEn: '',
  deathBn: '',
  locationEn: 'Family village / city',
  locationBn: 'পারিবারিক গ্রাম / শহর',
  occupationEn: 'Occupation',
  occupationBn: 'পেশা'
}
```

A photo can also use `photo` or `image`; `photoUrl` is preferred.

## Suggestions and admin tools

This site is hosted on GitHub Pages, so it does not have a private database server. Family suggestions therefore **do not automatically edit the official tree**. A suggestion may be:

1. saved on the current browser/device,
2. shared using the phone's share sheet, or
3. opened as a pre-filled GitHub issue for review.

The Admin Tools page is a **local browser utility**, not a secure admin login. It can review suggestions saved on that device and export family-tree snapshots as JSON.

## Run locally

Open `index.html` directly, or run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish

GitHub Actions deploys the static site to GitHub Pages from the `main` branch. Pages deployments are queued rather than cancelling an active publish, which avoids overlapping-deployment errors.
