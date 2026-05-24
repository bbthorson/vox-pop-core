/**
 * Port interfaces for the public/embed components.
 *
 * These interfaces let `ReplyDot` and `MergedDotSuccess` work without
 * directly importing `useAuth()`, the storage-client, `useTwoDotsAuth()`,
 * or Next.js `Link`. Callers provide adapters that fulfill the
 * interfaces — apps/web wires up its Firebase + Next.js implementations,
 * embed contexts pass `null` (or no-op adapters) because they don't
 * need auth.
 *
 * This is preparation for the `packages/embed-ui/` extraction (PR 3
 * of the embed carve-out plan). When the components move to that
 * package, this file moves with them — apps/web becomes a consumer
 * that provides the adapters.
 *
 * Why ports + adapters here:
 *
 * The same `<ReplyDot>` will eventually render inside both apps/web's
 * public pages (with Firebase Auth + Firebase Storage as the
 * implementations) AND the standalone `apps/embed/` Vite app (with no
 * auth and a raw fetch as the implementation). Decoupling component
 * code from framework/SDK choices is the only way to avoid duplicating
 * the UX.
 */

import type React from 'react';

/**
 * Surface the component needs from the auth layer. Apps/web fulfills
 * this with a wrapper around `useAuth()`; the standalone embed passes
 * `null` (it never auths in the iframe — auth happens on the host
 * domain after the top-frame redirect).
 *
 * The surface is intentionally narrow — only the three fields ReplyDot
 * actually touches (out of the eight `useAuth()` returns). Adding to
 * this interface forces an explicit decision about whether embed-ui
 * components really need that field.
 */
export interface AuthProvider {
    user: { uid: string; phoneNumber?: string } | null;
    authService: { currentUser: { uid: string } | null } | null;
    authenticatedApi: {
        getToken(forceRefresh?: boolean): Promise<string | null>;
        postData<T>(path: string, body: unknown): Promise<T>;
    };
}

/**
 * How components upload audio. Apps/web wraps the Firebase Storage
 * client + storage-path helper. The standalone embed never uses this —
 * its only upload path is anonymous `fetch` to
 * `/api/v1/audio/upload-pending`, which ReplyDot handles inline (no
 * port needed for that path).
 */
export interface AudioUploader {
    uploadAudio(blob: Blob, path: string): Promise<{ url: string; path: string }>;
    getReplyStoragePath(promptId: string, uid: string): string;
}

/**
 * The auth-gate orchestration layer. Apps/web's `TwoDotsAuthContext`
 * holds the OTP sheet + the merge-animation state machine; ReplyDot
 * needs to signal "user needs to auth" / "auth done — go" / "merge
 * animation, please" via this gate. The standalone embed never opens
 * the gate (auth happens on the host domain).
 */
export interface DotsAuthGate {
    /** Show the auth sheet. Calls `onAuthenticated` after a successful auth, `onCancel` if the user dismisses. */
    requestAuth(onAuthenticated: () => void, onCancel: () => void): void;
    /** Close the auth sheet without proceeding. */
    dismissAuth(): void;
    /** Trigger the merge-animation phase after a successful reply submission. */
    setMergeState(state: { phase: 'merging' | 'merged'; isNewUser: boolean } | null): void;
}

/**
 * A component that renders a link. Apps/web passes Next.js `Link` so
 * client-side navigation works; the standalone embed passes a plain
 * `<a>` (or undefined — `MergedDotSuccess` falls back to a default
 * anchor when no LinkComponent is provided).
 *
 * Shape mirrors `next/link` + plain anchor's intersection: `href`,
 * `children`, optional `className`. Internal navigation niceties (the
 * `prefetch` prop, `replace`, etc.) aren't needed here.
 */
export type LinkComponent = (props: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) => React.ReactNode;
