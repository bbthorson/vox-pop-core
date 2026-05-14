---
title: Architecture
description: How Vox Pop Core is wired internally.
---

:::note
This page is a stub. Expanded architecture writeup coming soon — covering the route → service → dependency seams, the Firebase-wired composition root, and how to swap in a non-Firebase backend.
:::

## The 30-second version

```
┌─────────────────────────────────────────────────┐
│              apps/core-api/                     │
│                                                 │
│   src/routes/*.ts   ← Hono handlers + Zod       │
│        │                                        │
│        ▼                                        │
│   services/core-services-firebase.ts            │
│   ← composition root, wires Firebase            │
│     implementations of *Dependencies interfaces │
│        │                                        │
│        ▼                                        │
│   packages/core/services/*.ts                   │
│   ← pure-TS service classes (UserService,       │
│     PromptService, ReplyService, …)             │
│        │                                        │
│        ▼                                        │
│   *Dependencies interfaces (firebase-admin)     │
└─────────────────────────────────────────────────┘
```

- **Routes** (`apps/core-api/src/routes/`) handle HTTP — validate with Zod, auth via the bearer middleware, delegate to a service.
- **Services** (`packages/core/services/`) hold business logic. They depend on small `*Dependencies` interfaces, not Firebase directly.
- **Composition root** (`apps/core-api/src/services/core-services-firebase.ts`) wires Firebase-backed implementations of those interfaces.

To run on a non-Firebase backend (Postgres, in-memory tests, …), swap the composition root — no changes to `packages/core/`.
