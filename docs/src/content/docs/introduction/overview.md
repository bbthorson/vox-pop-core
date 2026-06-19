---
title: What is Vox Pop Core?
description: An overview of the open-core surface.
---

Vox Pop Core is **MIT-licensed, open-source infrastructure for audio-based call-and-response applications** — apps where someone publishes an audio **prompt** (the call) and an audience records audio **replies** (the response). It handles identity, the prompt → reply data model, audio upload and playback, and a public HTTP API, so you can build the app on top instead of rebuilding the plumbing.

It's the kind of backend that sits behind a podcaster's audience-questions feature, a "leave a voice note" embed, an audio AMA, a call-in show's voicemail wall, or any surface built on the same call-and-response shape. [voxpop.com](https://voxpop.com) is one such app, built on this core; this repo also ships a minimal one you can read and run (`apps/embed`).

This repository (`vox-pop-core`) is the open-core tier: the API surface, business logic, and shared types. Apps built on it (open or closed) layer their own features on top.

:::note
The core is backed by **Firebase** (Firestore, Firebase Auth, Cloud Storage) today, reached through swappable adapter interfaces. Generalizing that backend so Firebase isn't a hard dependency is in active progress — see [Architecture](/introduction/architecture/).
:::

## What's in the open core

- **Hono HTTP service** at `apps/core-api/` — the `/api/v1/*` JSON API surface.
- **Service bindings** at `packages/core/` — pure TypeScript services (`UserService`, `PromptService`, `ReplyService`, `OrganizationService`, `FeedService`, …) with pluggable dependency interfaces. Swap in your own backend without touching the route layer.
- **Shared types and Zod schemas** at `packages/shared/` — records, views, and request codecs. The same schemas validate the wire format and generate this API reference.

## What's intentionally not in the open core

These are app- and product-specific features, not infrastructure, so they live outside the core:

- **IVR / call-forwarding** — Twilio integration, phone-number provisioning, carrier detection.
- **Embed widget hosting** — the iframe distribution layer for `<vox-pop-widget>`.
- **Team and billing features** — organization-tier product extensions.

These live in the closed-source layer that runs at `voxpop.com`, one of the apps built on the core. The open core itself is everything you need to run identity, prompts, replies, and the public API.

## Who is this for?

- **Self-hosters** who want a ready-made audio call-and-response backend instead of building one.
- **App builders** putting their own surface — mobile app, embed, bot, static site — on top of the public API.
- **Contributors** who want to extend the API surface, add new services, or help generalize the backend beyond Firebase.

## Where next?

- New to the project? Read the [architecture overview](/introduction/architecture/).
- Want to run it locally? [Quick start](/self-hosting/quick-start/).
- Building your own surface on the core? [Build your own app](/build-your-own/overview/).
- Building against the API? [API reference](/api/overview/).
- Looking for the **end-user** side (how people record prompts and manage replies in a real app built on the core)? See voxpop.com's [help center](https://voxpop.app/help) at voxpop.app.
