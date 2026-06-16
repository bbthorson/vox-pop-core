# Plan D — Repo split (post-launch, trigger-gated)

> **Status:** parked — gated on Plan A and on a real trigger · **Scope:** private
> `vox-pop` monorepo + the package-publishing setup.
>
> This plan exists so the split is a *known, sequenced move* rather than a
> scramble when the first trigger fires. **Do not execute speculatively.**

## Goal / done-bar

Be able to split a connector into its own repo **cheaply and safely** when it
earns one — without destabilizing the shared API contract.

**Done (per split):** the connector lives in its own repo, depends on a
**published, versioned** `@vox-pop/shared`, and has independent CI/deploy — with
no version-skew chaos for the rest.

## The current shape (why not now)

- Monorepo: plain **npm workspaces** (`apps/*`, `packages/*`), no Turbo/Nx.
  Dependency direction already flows inward (`apps → packages`), enforced by Plan
  A's A6 lint.
- `vox-pop-core` (this mirror) **already presents "core as root" externally** via
  the one-way sync — so the polyrepo "core is independently consumable" benefit is
  already realized without a split.
- The blocker is `@vox-pop/shared`: in the monorepo, contract changes are
  **atomic** (one PR, type-checker catches every consumer). Split repos turn
  `shared` into a **published, versioned** dependency — every consumer pins a
  version and a schema change becomes an N-repo coordinated release. Pre-launch,
  with the contract still moving, that's the wrong trade.

## Gate (both must hold)

1. **Contract stable** — Plan A done; the public surface + `@vox-pop/shared` are
   no longer churning, so versioning `shared` is tolerable. *This is the hard gate.*
2. **A real trigger** — a specific connector hits one of:
   - independent deploy cadence not achievable via monorepo CI path-filtering;
   - a distinct **security boundary** (e.g. `apps/ivr` and telephony secrets);
   - **external contributors** scoped to just that connector.

No trigger → no split. The monorepo wins on velocity until one fires.

## The seam (order of operations when triggered)

1. **Core platform repo** = what `vox-pop-core` already is: `apps/core-api`,
   `packages/core`, `packages/shared`, `lexicons`. This becomes the canonical
   root, not a mirror-of-a-monorepo.
2. **First connector to split = `apps/ivr`** (private; telephony security
   boundary makes it the natural first mover — see Plan B).
3. **Web app / BFF stays in the product monorepo longest** — it's the most
   tightly coupled composition surface; least to gain from isolation.

## Work items (per split, when triggered)

### D1 — Publish the contract package
- Publish `@vox-pop/shared` (and `@vox-pop/core` if a connector needs it) to a
  registry (GitHub Packages or private npm). Adopt **semver** discipline.
- **Decision:** registry choice; whether to adopt **changesets** for release
  automation (recommended once >1 external consumer).
- **Accept:** a connector repo can `npm install @vox-pop/shared@x.y.z`.

### D2 — Stand up the connector repo
- New repo for the connector; depends on the pinned `@vox-pop/shared`. Its own
  CI/deploy. Move the connector's `apps/<name>` tree out of the monorepo.
- **Accept:** connector builds/tests/deploys from its own repo against the
  published contract.

### D3 — Rework the sync story
- Today the sync curates a subset of the private monorepo into `vox-pop-core`.
  Once core is its own published-package root, reconsider whether the mirror is
  still a *copy* or becomes the *source* for `@vox-pop/shared`.
- **Accept:** one clear, documented flow for where the contract package is
  published from.

## Anti-goals / cautions

- **Don't** split `@vox-pop/shared` or any contract package out from under a
  moving contract (that's the whole gate).
- **Don't** re-split `apps/embed` — it's fine as a mirrored app.
- **Don't** build a connector SDK / generic framework to "prepare" for the split.
- Expect costs: version skew, coordinated releases, CI fan-out. Mitigate by
  keeping post-launch `shared` changes rare and semver-clean.

## Sequencing

Parked behind Plan A + a trigger. **Revisit post-launch**, IVR first, only once
B3 has made `apps/ivr` a clean standalone app inside the monorepo (so the split
is a lift-out, not a refactor).
