import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * ESLint config for `@vox-pop/embed-ui`.
 *
 * The package is FRAMEWORK-PORTABLE — it's consumed by both apps/web
 * (Next.js) and the future apps/embed (Vite). This config enforces the
 * portability invariants at lint time:
 *
 *   - No Next.js imports (`next`, `next/*`). Apps/web passes Next.js
 *     primitives like `Link` as PROPS via the `LinkComponent` port
 *     instead of having the component import them directly.
 *   - No Firebase imports (`firebase`, `firebase/*`, `firebase-admin*`).
 *     Auth state + storage upload arrive via the `AuthProvider` and
 *     `AudioUploader` ports.
 *   - No apps/* or `@/*` path imports — embed-ui is upstream of every
 *     app and can't reach back.
 *
 * Anything the package legitimately needs goes in `package.json` as a
 * real dep (`framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`,
 * `@vox-pop/design-tokens`) or arrives as a prop.
 */
export default [
    {
        ignores: ["dist/", "node_modules/"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            // Component-only package — no Node globals. Browser only.
            globals: {
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                HTMLElement: "readonly",
                HTMLAudioElement: "readonly",
                HTMLCanvasElement: "readonly",
                HTMLInputElement: "readonly",
                HTMLButtonElement: "readonly",
                HTMLDivElement: "readonly",
                MediaRecorder: "readonly",
                MediaStream: "readonly",
                AudioContext: "readonly",
                AnalyserNode: "readonly",
                Blob: "readonly",
                File: "readonly",
                FormData: "readonly",
                URL: "readonly",
                ResizeObserver: "readonly",
                fetch: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                Audio: "readonly",
                Image: "readonly",
                Event: "readonly",
                getComputedStyle: "readonly",
                AbortController: "readonly",
                AbortSignal: "readonly",
            },
        },
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "next",
                                "next/*",
                                "firebase",
                                "firebase/*",
                                "firebase-admin",
                                "firebase-admin/*",
                                "@/*",
                                "apps/*",
                                "../../apps/**",
                                "../../../apps/**",
                            ],
                            message:
                                "embed-ui must be framework-portable. Next.js, Firebase, and apps/* paths are forbidden. Use the ports (AuthProvider / AudioUploader / DotsAuthGate / LinkComponent) to inject app-specific concerns as props.",
                        },
                    ],
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
        },
    },
];
