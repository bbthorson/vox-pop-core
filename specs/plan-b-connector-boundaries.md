# Plan B — Connector boundaries (IVR carve-out + connector-config)

> **Status:** blocked on Plan A merging · **Authored in:** `vox-pop-core` (public
> mirror) · **Executes in:** private `vox-pop` repo (new `apps/ivr`, core-api,
> control-plane primitive), except where noted.
>
> Reads on top of `plan-a-core-api-contract.md` — the design rule, the litmus
> test, and the surface audit there are assumed, not repeated.

## Goal / done-bar

Make the **tier boundaries real**: connectors are their own apps, the core
exposes a uniform **control plane** for their settings, and ingestion of
non-REST modalities flows through one explicit path.

**Done when:**
- IVR is an **app** (`apps/ivr`), not a set of routes inside core-api.
- A **connector-config primitive** exists in core (centralized settings,
  secrets-by-reference) behind a uniform contract — implemented *because IVR
  needs it*, not speculatively.
- The three API planes are explicit and each route lives on the right one.
- The composition/app-coupled routes have a decided disposition (move or keep).

## The model (from the design conversation)

The core is a **hub**; every human- or machine-facing surface is a **directional
connector app**. There are **three API planes**, two of which already exist:

1. **Consumer API** — `/api/v1/*`, documented (Plan A). Apps built on the core.
2. **Ingestion API** — `system/*` behind system-auth. The privileged inbound
   write a connector uses for a non-REST modality. `POST /api/v1/system/replies`
   already *is* this (it's how a captured voicemail becomes a reply).
3. **Control plane** — connector settings. What a management UI (web app) reads
   and writes to configure a connector.

Connector apps own their **data plane** (the modality bridge) and any
connector-specific actions (provision a number, run an OAuth dance). `apps/embed`
is the precedent — a connector already carved out.

## Decisions baked in (carry forward / confirm)

- **Config is centralized in core** as a primitive — one ownership/permission
  model, one management surface, config is just domain data. (Decided.)
- **Secrets are NOT centralized** — OAuth/telephony credentials live in a secret
  store; the config record holds a *reference*, never the raw value. (Decided.)
- **Build the framework incrementally** — extract the uniform connector contract
  when IVR forces it (the 2nd real connector). No connector SDK before ~3 real
  connectors exist. (Decided.)

## Work items

### B1 — Make "core = foundation" explicit *(light; do early)*
- Plan A's A6 added the `apps → packages` dependency-direction lint. B1 just
  names the platform: a short note (root README / `CONTRIBUTING`) designating
  `packages/core`, `packages/shared`, `lexicons`, `apps/core-api` as the
  **platform**, and `apps/*` as **connectors/consumers**. No file moves.
- **Accept:** the platform/connector split is written down; lint enforces it.

### B2 — Spec the connector-config primitive *(do before B3; don't implement yet)*
- Shape: `ConnectorConfigRecord { connectorType, ownerId|orgId, settings (typed
  opaque blob), secretRef?, enabled, status, createdAt, updatedAt }`.
- Uniform contract: `getConfig` / `setConfig` / `getStatus` / `enable|disable`,
  namespaced per connector. **Decision:** path namespace — recommend
  `/api/v1/connectors/{connectorType}/config` (or `/connector-configs`). Pick one.
- **Decision:** validation model — core stores the `settings` blob opaque and the
  connector validates on its own read, **or** core validates against a registered
  per-connector schema. Recommend: opaque first (core enforces envelope +
  ownership only); add schema-registration later if the web app wants
  schema-driven settings forms.
- It's a **primitive** by the litmus test → it goes in the documented contract
  (Plan A rules): `OpenAPIHono` + `createRoute`, new **`Connectors`** tag, and it
  must be added to Plan A's surface snapshot (A5) when it lands.
- **Accept:** a written spec for the record + endpoints + the secret-ref pattern.
  No implementation until B3.

### B3 — Carve `apps/ivr` out of core-api *(the core of Plan B)*
- New private app `apps/ivr` owns the telephony **data plane**: webhook intake,
  voicemail capture, transcoding → writes the result as a reply via
  `POST /api/v1/system/replies` (existing ingestion plane, system-auth).
- Implement the **connector-config primitive (B2)** here — IVR is the forcing
  function. IVR settings (forwarding rules, provisioned number, carrier) live in
  the config record; telephony credentials live in the secret store via
  `secretRef`.
- **Remove** `call-forwarding.ts` / `call-forwarding-lookup.ts` from core-api.
  They're plain `Hono` (undocumented), so removal doesn't touch the public
  contract — but confirm no internal caller depends on them before deleting.
- Web app manages IVR setup/settings through the connector-config primitive (one
  uniform "Integrations" surface), not bespoke endpoints.
- **Decision:** `apps/ivr` is almost certainly **private-only** (telephony is
  closed-tier per the docs) — do **not** add it to the `vox-pop-core` mirror sync.
- **Accept:** voicemail → reply works end-to-end through `apps/ivr` + the
  ingestion plane; core-api has no `call-forwarding*` routes; IVR settings are
  read/written via the connector-config primitive.

### B4 — Disposition the composition / app-coupled routes *(riskiest; can stage post-launch)*
- These are plain `Hono` in core-api today: `people` (CRM), `organizations`,
  `screening`, `notifications` (push tokens). Decide each:
  - `people`, `screening`, `notifications` — **composition / app-coupled** →
    candidates to move to the web BFF (`apps/web`).
  - `organizations` — judgment call: orgs are arguably a **core domain primitive**
    (users belong to orgs; ownership scoping needs them). Recommend: **keep in
    core**, and if kept, decide whether to promote to the documented contract.
- **Caution:** moving live endpoints is the highest-risk work here. Sequence one
  at a time, behind the existing tests, and defer any that aren't launch-blocking.
- **Accept:** each route has a recorded disposition (move / keep-internal /
  promote); anything moved is removed from core-api with callers updated.

### B5 — Make the ingestion plane explicit *(docs/codify; low effort)*
- Codify that `system/*` + system-auth is **the inbound connector contract** —
  not "internal plumbing to hide" but a deliberate, *connector-author-facing*
  surface. A short private note (not the public OpenAPI) describing how a
  connector authenticates (system-auth) and writes (`system/replies`, …).
- **Accept:** the ingestion contract is written down for connector authors.

## Sequencing

```
B1 (early, light) → B2 (spec) → B3 (carve IVR + implement B2) → B4 (stage, post-launch ok)
B5 anytime.
```
B3 is gated on B2 (need the config shape) and on Plan A (need the ingestion plane
+ tag rules settled).

## Out of scope

- The actual **repo split** (Plan D) — `apps/ivr` is a workspace in the monorepo
  here, not its own repo yet.
- The **docs/explanation** of this model (the connector topology page) — that's
  **Plan C**, executed on the docs site.

## Repo notes

- B1–B5 are **private-repo** work. `apps/ivr` is new and private (not mirrored).
- The connector-config primitive (B2/B3), being a documented primitive, will flow
  to the public Scalar reference via the synced `openapi.json` — and must be added
  to Plan A's surface snapshot when it lands.
