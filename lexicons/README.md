# Vox Pop AT Protocol Lexicons

This directory holds the canonical AT Protocol lexicon JSON files for Vox Pop record types, plus the mapping tables that document how each lexicon corresponds to the internal Firestore record shapes in [`packages/shared/types/records.ts`](../packages/shared/types/records.ts).

These lexicons are part of the **open-core** surface — protocol definitions that self-hosters and federation peers need in order to interoperate. They are MIT-licensed (see [`LICENSE`](./LICENSE) — kept alongside the JSON so the licensing travels with any future subtree split).

## Antiphony namespace (`dev.antiphony.*`) — the new canonical contract

The `dev.antiphony.*` lexicons are the **Antiphony canonical data model** (`specs/antiphony-data-model.md`), authored in Stream 1. They supersede `com.voxpop.*` (below), which are **deprecated** and will be removed once `apps/web` migrates off them (Stream 4). The single biggest shape change: **prompts and replies are one `dev.antiphony.audio.post` collection** (`reply`-presence discriminates), the audio moves into a standard **`dev.antiphony.embed.audio`** embed, and the transcript becomes a **platform-enrichment record** (`dev.antiphony.audio.transcript`) lifted into the embed `#view` at read time — never stored on the post.

> **"Canonical" ≠ "public."** Unlike `com.voxpop.audio.reply` (which was kept off the network entirely), replies are now first-class `dev.antiphony.audio.post` records. Because PDS/federation is deferred, these are **stored centrally**, not federated to a public firehose; reply privacy is enforced by **multi-tenant origin-app scoping + per-viewer view state**, not by omitting replies from the schema.

| NSID | File | Kind | Notes |
| :--- | :--- | :--- | :--- |
| `dev.antiphony.audio.post` | [`dev/antiphony/audio/post.json`](./dev/antiphony/audio/post.json) | record | Single content collection. `reply` present → reply; absent → prompt. Bsky-mirrored (`text`, `embed`, `reply`, `langs`, `labels`) + optional `title`. |
| `dev.antiphony.embed.audio` | [`dev/antiphony/embed/audio.json`](./dev/antiphony/embed/audio.json) | embed | Antiphony's audio-embed contribution. `main` = stored (blob, `durationMs`, `alt`, `waveform`); `#view` = hydrated (signed `url` + lifted `transcript`). |
| `dev.antiphony.embed.recordWithAudio` | [`dev/antiphony/embed/recordWithAudio.json`](./dev/antiphony/embed/recordWithAudio.json) | embed | Quote a record AND attach audio (analogue of `app.bsky.embed.recordWithMedia`). |
| `dev.antiphony.audio.transcript` | [`dev/antiphony/audio/transcript.json`](./dev/antiphony/audio/transcript.json) | record | **Platform enrichment.** Timed transcript (`segments` + optional `text`) referencing the post by StrongRef. Lifted into `embed.audio#view.transcript`. |
| `dev.antiphony.actor.profile` | [`dev/antiphony/actor/profile.json`](./dev/antiphony/actor/profile.json) | record | Port of `com.voxpop.actor.profile`. |

## Status by record type — `com.voxpop.*` (DEPRECATED, removed in Stream 4)

| NSID | File | Phase | Status |
| :--- | :--- | :--- | :--- |
| `com.voxpop.audio.prompt` | [`com/voxpop/audio/prompt.json`](./com/voxpop/audio/prompt.json) | 4c | **Deprecated** — superseded by `dev.antiphony.audio.post`. Still live for Vox Pop until Stream 4. |
| `com.voxpop.audio.reply` | _(none)_ | **Not published** | Was private/off-network. Superseded by `dev.antiphony.audio.post` (reply-kind), now a canonical-but-centralized record (see note above). |
| `com.voxpop.actor.profile` | [`com/voxpop/actor/profile.json`](./com/voxpop/actor/profile.json) | 4c | **Deprecated** — superseded by `dev.antiphony.actor.profile`. |

The pure record-to-lexicon transformation lives in [`packages/core/services/atproto-lexicon.ts`](../packages/core/services/atproto-lexicon.ts). The PDS I/O (`repo.uploadBlob`, `repo.putRecord`) lives in apps/web alongside the OAuth client — see `specs/4c-atproto-prompts.md` in the upstream private repo for the full split rationale.

Future lexicons under consideration:

- **`com.voxpop.people.contact`** + `com.voxpop.people.*` RPC namespace — for the eventual `apps/relationships/` contact-directory surface. Prior-art survey and proposed shape in [`specs/people-lexicon-prior-art.md`](../specs/people-lexicon-prior-art.md). Not yet authored; gated on `apps/relationships/` actually being on the roadmap.

## 1. com.voxpop.audio.prompt

Maps to our `PromptRecord`.

| Field | Type | Current Mapping | Notes |
| :--- | :--- | :--- | :--- |
| `title` | string | `PromptRecord.title` | Required. |
| `description` | string | `PromptRecord.description` | Optional. |
| `audio` | blob | `PromptRecord.audio` (`BlobRef`) | Maps to an AT Proto blob (CID). The transformation **omits the `audio` field entirely** when the record has no `BlobRef` yet (AT Proto lexicons treat optional fields as absent vs. present — `null` is not a valid value). Apps/web's publisher must call `repo.uploadBlob` first to obtain a CID and augment the record. |
| `createdAt` | datetime | `PromptRecord.createdAt` | ISO 8601 string. |
| `status` | string | `PromptRecord.status` | Enums: `live`, `archived`. The internal `deleted` state is filtered (or defensively mapped to `archived`) by the transformation. |

The publisher writes the resulting AT URI back to `PromptRecord.atprotoUri`.

## 2. com.voxpop.audio.reply

**Not published — by design.** Replies are private and never written to the network; there is no public reply lexicon. The table below documents the *internal* record shape for reference only. Reply *content* never leaves the closed tier; the only reply-derived public signal is an aggregate count surfaced by the AppView/projection at read time (not a stored record field).

| Field | Type | Current Mapping | Notes |
| :--- | :--- | :--- | :--- |
| `prompt` | ref | `ReplyRecord.promptId` | Strong ref to the parent prompt. |
| `audio` | blob | `ReplyRecord.audio` (`BlobRef`) | Maps to an AT Proto blob (CID). |
| `createdAt` | datetime | `ReplyRecord.createdAt` | ISO 8601 string. |
| `replyTo` | ref | `ReplyRecord.replyToUri` | Optional, for nested threading. |
| `notes` | string | `ReplyRecord.notes` | Private — would not appear in the public projection. |
| `transcription` | string | `ReplyRecord.transcription` | **AI-enriched — excluded from public projection.** |
| `aiSummary` | string | `ReplyRecord.aiSummary` | **AI-enriched — excluded from public projection.** |

## 3. com.voxpop.actor.profile

Maps to our `UserRecord`.

| Field | Type | Current Mapping | Notes |
| :--- | :--- | :--- | :--- |
| `handle` | string | `UserRecord.handle` | The Vox Pop handle (e.g. `brad`). Distinct from the AT Protocol handle which lives on the actor's identity document. |
| `usageIntent` | string | `UserRecord.usageIntent` | Metadata about the creator. |
| `rssFeed` | uri | `OrganizationRecord.rssFeedUrl` | External podcast feed. **Lives on the org, not the user record** — the lexicon declares the field but the open-core transformation omits it; publishers must source it from the user's primary org and merge it in. |

## Strategic alignment notes

### Decentralized Identifiers (DIDs)

- **Direction (decided 2026-06-18): DID-native creators.** Creator accounts are DID-rooted — created DID-first, with a phone number as an optional linked secondary. A DID (e.g. `did:plc:123`) is the canonical creator identity from the start, rather than a later UID→DID migration.
- **Current**: the shipped code still keys creators on Firebase UIDs (e.g. `user_123`); the DID-native cutover has not landed yet.
- **Action**: keep treating "User IDs" as opaque strings so the cutover from UID to DID needs no consumer changes.

### Blobs vs. URLs

- **Current**: We store public Firebase Storage URLs (`PromptRecord.audioUrl`) alongside an emerging `BlobRef` (`PromptRecord.audio`) during the migration.
- **Future**: We will store CIDs (Content Identifiers) pointing to the audio blob in a PDS (Personal Data Server).
- **Action**: Maintain the separation between the "Record" (metadata) and the "Blob" (audio binary). The transformation in `atproto-lexicon.ts` emits the canonical `{ $type: 'blob', ref: { $link }, mimeType, size }` wire shape; producers must ensure `ref` is a real CID before publishing.

### URIs

- **Current**: We use internal Firestore IDs.
- **Future**: We will use AT URIs (e.g., `at://did:plc:123/com.voxpop.audio.prompt/abc`).
- **Action**: Cross-record references (Reply → Prompt) should use a distinct field that can hold a full URI string. `PromptRecord.atprotoUri` (added in Phase 4c) is the first such field.

## Identified deviations & action items

| Deviation | Severity | Recommendation |
| :--- | :--- | :--- |
| **authorId vs. DID** | Low | Direction decided (2026-06-18): DID-native creators, so `authorId` resolves to a DID. Until the cutover lands, keep treating all IDs as opaque strings — don't assume Firebase UID format. |
| **Nested Refs** | Medium | Use `replyToUri` (already present) instead of just `parentPromptId` for all future threading. |
| **Blob Metadata** | Low | Audio metadata (`mimeType`, `size`) is now stored on `BlobRef` directly — already aligned with AT Proto. |

### Future-proofing tasks

1. **Strict IDs**: Avoid logic like `id.startsWith('user_')` or similar brittle patterns.
2. **Blob Records**: Continue migrating `audioUrl` callers onto `BlobRef`. Once the migration is complete, drop `audioUrl` and require `audio` on prompt creation.
