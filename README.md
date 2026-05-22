# `@vox-pop/embed` — standalone iframe SPA

Vite + React static SPA serving the chrome-less prompt iframe at
`embed.phonicfactory.com`. Deploys to Firebase Hosting (multi-site —
target `embed`).

## Why a separate app

- **CSP isolation**: a compromise in the iframe origin can't touch
  apps/web's session storage.
- **Bundle size**: ~50KB gzipped (Vite SPA) vs the full Next.js
  manifest apps/web's `?mode=embed` route ships.
- **Self-host story**: drop `dist/` behind any static host;
  no Next.js dependency.
- **Aggressive caching**: long max-age headers work cleanly with no
  per-request SSR.

apps/web's existing `?mode=embed` route keeps working — it emits a
`<link rel="canonical">` pointing here, so existing iframes in the
wild aren't broken.

## URL shape

Mirrors apps/web — `/@handle/promptId`. Browsers fetch
`GET ${CORE_API_BASE_URL}/api/v1/prompts/public/{handle}/{promptId}`
and render an `EmbedPublicPrompt`-shaped composition.

## Local development

```bash
# Copy env defaults — points at local core-api + apps/web.
cp apps/embed/.env.example apps/embed/.env

# Start core-api (separate terminal).
npm run dev -w @vox-pop/core-api

# Start the embed app — http://localhost:5173/@your-handle/your-prompt-id
npm run dev -w @vox-pop/embed
```

For full e2e (record → upload → top-frame redirect) you also need
apps/web running at the URL in `VITE_HOST_APP_BASE_URL`.

## Build

```bash
npm run build -w @vox-pop/embed
# Output: apps/embed/dist/
```

`tsc --noEmit` runs as a pre-step; build fails on type errors.

Vite picks up `.env.production` automatically (committed, points at
the production core-api + apps/web origins). To build against
different origins for a one-off deploy, create
`apps/embed/.env.production.local` — gitignored, takes precedence.

## Deploy (manual ops)

One-time setup (done in the Firebase Console):

1. **Create the Hosting site**: project → Hosting → Add another
   site → `embed-phonicfactory` (or similar — note the site ID).
2. **Apply target locally**:
   ```bash
   firebase target:apply hosting embed embed-phonicfactory
   ```
   This writes the target → site ID mapping into `.firebaserc`.
3. **Custom domain**: in the Firebase Console for the new site,
   add `embed.phonicfactory.com` as a custom domain. Follow the
   DNS verification steps (TXT record + A record).
4. **CORS**: add `https://embed.phonicfactory.com` to core-api's
   `ALLOWED_ORIGINS` in `apps/core-api/apphosting.yaml` (already
   done in this PR; redeploy core-api so the new origin takes
   effect — auto-syncs to the public mirror, App Hosting
   redeploys from there).

Then to deploy a build:

```bash
npm run build -w @vox-pop/embed
firebase deploy --only hosting:embed
```

## Public mirror

This package is included in the open-source mirror at
`bbthorson/vox-pop-core` — the sync workflow
(`.github/workflows/sync-public-core.yml`) copies it alongside
`apps/core-api`, `packages/core`, `packages/shared`,
`packages/design-tokens`, and `packages/embed-ui`. Edit on the
private repo's `master` branch; the public side is one-way.
