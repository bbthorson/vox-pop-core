---
title: What is Vox Pop Core?
description: An overview of the open-core surface.
---

Vox Pop Core is the **MIT-licensed open-source engine** behind [voxpop.com](https://voxpop.com) — an audio-reply platform for podcasters, content creators, and anyone who wants their audience to talk back.

This repository (`vox-pop-core`) contains the open-core tier: the API surface, business logic, and shared types. The hosted product layers proprietary features on top.

## What's in the open core

- **Hono HTTP service** at `apps/core-api/` — the `/api/v1/*` JSON API surface.
- **Service bindings** at `packages/core/` — pure TypeScript services (`UserService`, `PromptService`, `ReplyService`, `OrganizationService`, `FeedService`, …) with pluggable dependency interfaces. Swap in your own backend without touching the route layer.
- **Shared types and Zod schemas** at `packages/shared/` — records, views, and request codecs. The same schemas validate the wire format and generate this API reference.

## What's intentionally not in the open core

- **IVR / call-forwarding** — Twilio integration, phone-number provisioning, carrier detection.
- **Embed widget hosting** — the iframe distribution layer for `<vox-pop-widget>`.
- **Team and billing features** — the hosted product's organization-tier extensions.

These live in the closed-source layer that runs at `voxpop.com`. The open core is everything you need to run identity, prompts, replies, and the public API.

## Who is this for?

- **Self-hosters** who want a turnkey audio-reply backend without depending on the hosted product.
- **Contributors** who want to extend the API surface, add new services, or swap the Firebase backend for something else.
- **API consumers** building mobile apps, embed widgets, or integrations against `api.phonicfactory.com`.

## Where next?

- New to the project? Read the [architecture overview](/introduction/architecture/).
- Want to run it locally? [Quick start](/self-hosting/quick-start/).
- Building your own surface on the core? [Build your own app](/build-your-own/overview/).
- Building against the API? [API reference](/api/overview/).
- Looking for the **creator** side (how end users record prompts and manage replies on the hosted product)? See the [creator help center](https://voxpop.app/help) at voxpop.app.
