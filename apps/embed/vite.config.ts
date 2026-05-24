import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for apps/embed.
 *
 * Build emits a static SPA to `dist/` which Firebase Hosting serves
 * (see `firebase.json` hosting target `embed`). No SSR — the browser
 * fetches prompt data from core-api at runtime over CORS.
 *
 * Note on `shared/*` paths: the only consumer in this app is a
 * type-only import (`import type { ProfileView, PromptView } from
 * 'shared/types'`) which TypeScript resolves via tsconfig's `paths`
 * mapping and then erases at compile time, so no runtime alias is
 * needed. If a value import ever appears, add a `resolve.alias`
 * entry mirroring the tsconfig path.
 */
export default defineConfig({
    plugins: [react()],
    server: {
        // Default Vite port — also the origin we add to core-api's
        // ALLOWED_ORIGINS for local dev. Bump here = bump there.
        port: 5173,
    },
    build: {
        // Output to `dist/` — referenced by `firebase.json` hosting
        // target `embed`'s `public` field.
        outDir: 'dist',
        // Modest bundle target: the embed is intentionally small.
        // Modern evergreen browsers only; we don't ship the embed
        // to IE11 / pre-2022 Safari.
        target: 'es2022',
    },
});
