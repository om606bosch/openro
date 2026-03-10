# OpenRO — NROI Norway Range Officer Manager

Range Officer management system for NROI Norway (National Range Officers Institute).

## Stack

- **Frontend:** Vite + React (static SPA, hosted on GitHub Pages)
- **Storage:** localStorage (current) → Supabase Postgres (migration target)
- **Auth:** localStorage sessions (current) → Supabase Auth (migration target)

## Project Structure

```
src/
  lib/
    constants.js     ← CERT_LEVELS, DQ_REASONS, MATCH_LEVEL_POINTS, THEMES, etc.
    helpers.js       ← certColor(), roleColor(), fmtDate(), inp/btnS/btnP styles, etc.
    seedData.js      ← seedUsers, seedMatches, seedSeminars, seedClubs, seedDocs
    supabase.js      ← Supabase client singleton (no-op if env vars not set)
  components/
    ui.jsx           ← Badge, Modal, Field, StatCard, UserPicker, RegionSelect, contexts
  pages/
    AuthScreen.jsx
    Dashboard.jsx
    MyProfile.jsx
    UserDatabase.jsx
    ROPage.jsx
    MatchesPage.jsx
    ClubsPage.jsx
    DocsPage.jsx
    PointsPage.jsx
    SeminarsPage.jsx
  App.jsx            ← Shell: nav, sidebar, routing, theme, localStorage persistence
  main.jsx           ← ReactDOM.createRoot entry point
```

## Development

```bash
npm install
npm run dev
```

## Deployment (GitHub Pages)

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions secrets.
2. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

Without Supabase credentials, the app runs entirely on localStorage (good for local dev and testing).

## Supabase Migration Plan

The app currently uses localStorage for all data. The planned migration order:

1. **Supabase Auth** — replace plaintext passwords immediately
2. **`profiles` table** — users persist across devices
3. **`matches` + `ro_participation`** — core business data, replaces `_pointsToDistribute` React flag with a DB trigger
4. **Points trigger** — atomic point distribution on match completion
5. **`seminars` + `clubs`** — secondary data
6. **RLS policies** — added per table as each is created

See `src/lib/supabase.js` for the client setup.

## Domain Rules (NROI Handbook 2026)

| Upgrade | Requirements |
|---|---|
| → RO | 18+, 1yr IPSC, 6 shooter pts (L2+), IROA L1 seminar, 6 provisional RO pts (min 2×L2) |
| → CRO | 2yr as RO, 28 match pts (min 10 as CRO+, 6 as RO on L3+), IROA L2 seminar, 2 written recommendations |
| → RM | Invited by NROI Chairman, 1yr as CRO, 55 pts (min 15 as CRO on L3+), 2×L3 as Provisional RM |

Annual maintenance: RO/CRO/RM each need 6 pts/year (RO: ≥1×L2, CRO: ≥1×L3, RM: ≥2×L3). Missing 1yr → Passive, missing 2yr → Inactive.
