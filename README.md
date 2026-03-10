# OpenRO 

Range Officer management system

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
