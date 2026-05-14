---
title: API reference
description: The /api/v1/* endpoints exposed by Vox Pop Core.
---

:::note
The full per-endpoint reference is generated from the Zod schemas at `apps/core-api/src/routes/*.ts` and rendered here via [Scalar](https://scalar.com/). This page is a placeholder while that integration lands.
:::

## What's covered

Every endpoint in this reference lives in **`apps/core-api`** — the open-core service. The hosted product (`voxpop.com`) adds IVR, embed-widget, and team endpoints that are **not** documented here.

## Authentication

All non-public endpoints require a bearer token in the `Authorization` header:

```
Authorization: Bearer <id_token_or_session_cookie>
```

`core-api` accepts both Firebase ID tokens (mobile, embed, browser) and Firebase session cookie values (server-side rendered apps). See [`apps/core-api/src/middleware/auth.ts`](https://github.com/bbthorson/vox-pop-core/blob/main/apps/core-api/src/middleware/auth.ts) for the verification logic.

## Endpoint families

The current surface (22+ endpoints) is grouped by resource:

- **`/users`** — Profile read, current-user write, organization lookups.
- **`/prompts`** — Prompt CRUD, lifecycle, public read.
- **`/replies`** — Reply CRUD, search, bulk actions, notes.
- **`/organizations`** — Org read, member management, profile context.
- **`/handles`** — Handle availability and claim.
- **`/onboarding`** — RSS import for new users.
- **`/uploads`** — Pending audio upload coordination.
- **`/inbox`** — Owner-facing unread/replier feed.
- **`/notifications`** — Push token register / disable.
- **`/people`** — Cross-prompt people view (CRM-style).
- **`/audio`** — Signed-URL audio access.

The auto-generated reference (coming soon) will list every endpoint with parameters, response shape, and example requests.
