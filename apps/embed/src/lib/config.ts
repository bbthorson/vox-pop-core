/**
 * Runtime config sourced from Vite build-time env vars.
 *
 * Set in `apps/embed/.env.*` for local dev and via Firebase Hosting's
 * build environment (or a pre-build step) for prod. All `VITE_*`
 * variables are inlined into the bundle at build time.
 */

const env = import.meta.env;

/**
 * Strip a single trailing slash so concatenation with paths that
 * start with `/` doesn't produce `//`. Operators sometimes set env
 * vars with trailing slashes; cheaper to normalize once than to
 * thread the convention through every callsite.
 */
function stripTrailingSlash(url: string): string {
    return url.replace(/\/$/, '');
}

/**
 * Origin of the core API (e.g. `https://api.phonicfactory.com`).
 * Anonymous calls — public prompt fetch + pending audio upload.
 */
export const CORE_API_BASE_URL: string = stripTrailingSlash(
    env.VITE_CORE_API_BASE_URL ?? 'http://localhost:8080',
);

/**
 * Origin of apps/public (the public capture app) — where the embed
 * redirects the top frame after an anonymous upload, so OTP + reply
 * submission complete on the prompt page (`/@handle/promptId`). See
 * `ReplyDot`'s `submitPendingEmbed`.
 */
export const HOST_APP_BASE_URL: string = stripTrailingSlash(
    env.VITE_HOST_APP_BASE_URL ?? 'http://localhost:9002',
);

/**
 * Wraps a raw Firebase Storage URL through the core-api audio proxy
 * (`GET /api/v1/audio?url=...`), which 302s to a short-lived signed
 * URL. Pairs with apps/web's `getAudioProxyUrl` in
 * `apps/web/src/config/dashboard.ts`.
 *
 * Idempotent — passing an already-proxied URL returns it unchanged.
 * Defends against future call-site bugs where a proxy URL gets passed
 * back through (we hit one such double-wrapping bug during the Phase 2
 * rollout — the helper guards against the next one).
 *
 * Phase 2 of `specs/signed-url-migration.md` — every audio playback
 * site routes through this so the eventual `storage.rules` lockdown
 * doesn't break `<audio>` tags. The embed runs anonymous; the proxy
 * doesn't require auth, so the redirect works for unauthenticated
 * playback.
 */
export function getAudioProxyUrl(audioUrl: string): string {
    if (audioUrl.includes('/api/v1/audio?url=')) return audioUrl;
    return `${CORE_API_BASE_URL}/api/v1/audio?url=${encodeURIComponent(audioUrl)}`;
}
