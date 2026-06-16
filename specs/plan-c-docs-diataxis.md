# Plan C — Self-serve docs (Diátaxis: reference / how-to / explanation)

> **Status:** ready (parts gated on Plan A's A3) · **Authored & executed in:**
> `vox-pop-core` (the Starlight docs site lives here and is maintained directly —
> it is **not** part of the private→public sync).
>
> Reads on top of `plan-a-core-api-contract.md` and `plan-b-connector-boundaries.md`.

## Goal / done-bar

A dev tester goes **zero → building on the core without asking us**. The docs
cover all three Diátaxis modes that matter here:

- **Reference** (the Scalar/OpenAPI page) — contract only.
- **How-to guides** ("cookbooks") — task-oriented, orchestrate multiple endpoints.
- **Explanation** — the mental model (hub + connectors, the three planes).

**Done when:** the sidebar reflects these layers; the first cookbook exists; the
topology explanation exists; and no reference prose carries workflow narrative.

## Context

- Site: `vox-pop-core/docs/` (Astro Starlight). Build: `npm run build` (runs
  `copy-openapi.mjs --strict` then `astro build`); deploy: `npm run deploy`
  (`firebase deploy --only hosting:docs` → `vox-pop-docs.web.app`).
- Existing content: `introduction/*`, `self-hosting/*`, `api/overview` + the
  Scalar `api/reference`, and **`build-your-own/{overview,embed-example}`**. The
  embed walkthrough is already a how-to in spirit — it orchestrates the public
  fetch + render.
- Reference is generated; Plan A's **A3** strips workflow prose from endpoint
  *descriptions* in core-api. C2 gives that prose a new home.

## Work items

### C1 — Restructure the sidebar for Diátaxis
- In `docs/astro.config.mjs`, add a **"How-to guides"** section. Keep
  **"Build your own"** as the conceptual hub; move/duplicate the embed
  walkthrough under How-to (or cross-link it as the first recipe).
- Order: Introduction → Self-hosting → Build your own → **How-to guides** →
  Explanation → API reference.
- **Accept:** sidebar shows distinct conceptual / how-to / reference layers;
  `npm run build` is green.

### C2 — Cookbook: "Build a reply inbox on the core" *(the canonical first recipe)*
- New page under How-to. It **relocates the workflow prose** that Plan A's A3
  removes from the `replies/feed` description.
- Orchestrates the replies primitives: `GET /replies/feed` (+ filters/cursor) →
  `POST /replies/{id}/read` → `GET /replies/{id}/notes` → `PATCH
  /replies/{id}/status` → `GET /replies/search`. Show the loop, the pagination
  contract, and the unread/read flow.
- Frame explicitly: *"inbox" is a UX surface you compose from primitives, not an
  endpoint* — the worked proof of the design rule.
- **Accept:** a reader can build a working inbox against only documented public
  endpoints. (If they can't, that's an API gap → feed back to Plan A.)

### C3 — Explanation: "Architecture & connectors" *(the mental model)*
- New Explanation page: the **hub + directional connector** model, the **three
  planes** (consumer / ingestion / control), and the connector taxonomy
  (ingress / egress / bidirectional × modality × config). Show where a reader's
  own app fits, and that `apps/embed` is a worked connector.
- Public-appropriate framing — describe the *shape*, not internal roadmap.
- **Accept:** a reader understands why the API is scoped the way it is and where
  their surface plugs in.

### C4 — Keep reference prose contract-only
- Audit `api/overview.md` (and any reference-adjacent prose) for workflow/UX
  language; keep it to auth, envelope, pagination, source-of-truth.
- Once Plan A's A1 lands, the audio primitives appear in the Scalar reference —
  verify the embed walkthrough's endpoint links now resolve there.
- **Accept:** no reference prose describes a multi-step task; embed-cookbook
  links resolve in the live reference.

### C5 — (Optional) Contributor page: "API design principles"
- The public face of the design rule: primitives / queries / projections;
  compositions → BFF; descriptions are contracts. Reinforces the open-core story.
- **Decision:** publish or not. Recommend: yes, kept short.

## Sequencing

- **C3** (explanation) and **C1** (sidebar) can go anytime — independent of A.
- **C2/C4** are best **after Plan A's A3** lands (so the prose has actually been
  removed from the endpoint and needs its new home, and the audio links resolve).
  They can be *drafted* in parallel.

## Repo notes

- All of Plan C is in `vox-pop-core/docs/` and can be **executed directly here** —
  no private-repo dependency except the *timing* of A1/A3 landing in the synced
  `openapi.json`.
- Verify every change with `npm run build`; deploy with `npm run deploy` (Firebase
  auth required). Icons must come from Starlight's set — verify a card renders an
  `<svg>` rather than grepping the icon name (the name isn't emitted in HTML).
