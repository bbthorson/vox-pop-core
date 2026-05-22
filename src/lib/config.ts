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
 * Origin of apps/web — where the embed redirects the top frame after
 * an anonymous upload, so OTP + reply submission complete on a
 * same-origin handler. See `ReplyDot`'s `submitPendingEmbed`.
 */
export const HOST_APP_BASE_URL: string = stripTrailingSlash(
    env.VITE_HOST_APP_BASE_URL ?? 'http://localhost:9002',
);
