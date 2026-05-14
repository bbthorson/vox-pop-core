---
title: Configuration
description: Environment variables and deploy targets for Vox Pop Core.
---

:::note
This page is a stub. Detailed configuration reference coming soon.
:::

## Environment variables

`apps/core-api/` reads the following at runtime:

| Variable | Purpose |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project to authenticate against. |
| `FIREBASE_STORAGE_BUCKET` | GCS bucket for audio uploads. |
| `ADMIN_SERVICE_ACCOUNT_JSON` | Service account JSON for Firebase Admin (production). |
| `VOXPOP_USE_EMULATOR` | When `true`, talks to the local Firebase emulators. |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist for browser-direct calls to `/api/v1/*`. |
| `LOG_LEVEL` | pino log level. Defaults to `info`. |

## Deployment

The hosted production deploy at `api.phonicfactory.com` uses **Firebase App Hosting**. See `apphosting.yaml` at the repo root for the production config and `apps/core-api/README.md` for deploy notes.

Other targets (Cloud Run, Fly.io, self-hosted Node) work too — `core-api` is a plain Node service, no platform-specific dependencies.
