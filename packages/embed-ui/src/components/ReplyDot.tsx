'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X, Loader2, Play, Pause } from 'lucide-react';
import { useAudioRecorder } from '../hooks/use-audio-recorder';
import { useContainerSize } from '../hooks/use-container-size';
import { RadialBlob } from './RadialBlob';
import type { AuthProvider, AudioUploader, DotsAuthGate } from '../ports';

type ReplyPhase = 'idle' | 'recording' | 'review' | 'authenticating' | 'sending' | 'success';

interface ReplyDotProps {
    promptId: string;
    hostName?: string;
    /** Whether this is running inside an off-site embed */
    isEmbed?: boolean;
    /**
     * Creator handle — required in embed mode so we can redirect the
     * top frame to the prompt page after the pending upload lands.
     */
    creatorHandle?: string;
    /**
     * Auth layer. Required for the on-domain path (`isEmbed === false`);
     * pass `null` (or omit) in embed contexts — the embed path uploads
     * anonymously and never touches auth state.
     *
     * Preparing this prop for the `packages/embed-ui/` extraction —
     * see `./ports.ts` for the rationale.
     */
    auth?: AuthProvider | null;
    /**
     * Storage uploader. Required for the on-domain path; pass `null`
     * (or omit) in embed contexts — the embed path uses plain `fetch`
     * to `/api/v1/audio/upload-pending`, never the storage helper.
     */
    uploader?: AudioUploader | null;
    /**
     * Orchestration for the OTP sheet + merge animation. Required for
     * the on-domain path; pass `null` (or omit) in embed contexts.
     */
    authGate?: DotsAuthGate | null;
    /**
     * When the merge state on the auth gate transitions back to `null`
     * (user clicked "Send another"), reset this component back to the
     * idle phase. Optional — embed contexts don't have a merge state
     * machine and can skip this. The on-domain caller reads
     * `authGate.mergeState` and passes it here.
     */
    mergeStateSignal?: { phase: 'merging' | 'merged'; isNewUser: boolean } | null;
    /**
     * Origin where `POST /api/v1/audio/upload-pending` lives. The
     * embed-mode flow does an anonymous fetch to this endpoint with the
     * recorded audio. Apps/web passes its own origin (Next.js rewrites
     * forward the path); the standalone apps/embed Vite app passes its
     * core-api origin directly.
     *
     * Required for the embed path; ignored on the on-domain path
     * (which uses the `uploader` adapter instead).
     *
     * No trailing slash — appended path is `/api/v1/audio/upload-pending`.
     */
    coreApiBaseUrl?: string;
    /**
     * Origin of the apps/web host that completes the embed handoff —
     * the top-frame redirect target after a pending upload. The URL is
     * constructed as `${hostAppBaseUrl}/@${creatorHandle}/${promptId}?pending=...`
     * and `window.top.location.href` is set to it.
     *
     * Required for the embed path. The standalone apps/embed app
     * passes the apps/web origin (e.g., `https://voxpop.phonicfactory.com`);
     * apps/web embedding its own page passes its own origin.
     */
    hostAppBaseUrl?: string;
}

/**
 * ReplyDot — Recording interface designed for the circular dot container.
 *
 * Simplified flow:
 * - idle: Mic icon centered
 * - recording: RadialBlob pulses around dot, single stop button centered
 * - review: Three buttons — play preview, discard (X), accept (✓)
 * - authenticating: Auth gate shown in connection area (via context)
 * - sending: Loading spinner
 * - success: Check mark with "send another" link
 *
 * The RadialBlob visualizer extends beyond the dot edge during recording,
 * creating an organic, pulsating aura effect.
 */
export function ReplyDot({
    promptId,
    hostName = 'the creator',
    isEmbed = false,
    creatorHandle,
    auth = null,
    uploader = null,
    authGate = null,
    mergeStateSignal = null,
    coreApiBaseUrl,
    hostAppBaseUrl,
}: ReplyDotProps) {
    const [phase, setPhase] = useState<ReplyPhase>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPlayingBack, setIsPlayingBack] = useState(false);
    const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
    const { containerRef, size: dotSize } = useContainerSize();

    // On-domain path needs all three injected adapters. Embed path needs
    // none — the embed POSTs anonymously to /audio/upload-pending and
    // hands off to the host domain via a top-frame redirect.
    const didAuthThisSession = useRef(false);

    // Cleanup audio URL and playback on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            if (audioPlaybackRef.current) {
                audioPlaybackRef.current.pause();
                audioPlaybackRef.current = null;
            }
        };
    }, [audioUrl]);

    const handleRecordingComplete = (blob: Blob) => {
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setPhase('review');
    };

    const { startRecording, stopRecording, isRecording, analyserNode } = useAudioRecorder({
        onRecordingComplete: handleRecordingComplete,
    });

    const needsAuth = useCallback((): boolean => {
        // Embed never auths in the iframe — it uploads anonymously and
        // hands off to the prompt page on voxpop.com where OTP happens.
        if (isEmbed) return false;
        const user = auth?.user;
        return !user || !user.phoneNumber;
    }, [auth, isEmbed]);

    const handleTapToRecord = () => {
        startRecording();
        setPhase('recording');
    };

    const handleStop = () => {
        stopRecording();
    };

    const handleDiscard = () => {
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setPhase('idle');
        setError(null);
        setIsPlayingBack(false);
        if (audioPlaybackRef.current) {
            audioPlaybackRef.current.pause();
            audioPlaybackRef.current = null;
        }
        // Embed contexts don't have an auth gate; the on-domain path
        // does. Either way, only dismiss if the gate is provided.
        authGate?.dismissAuth();
    };

    const handlePlayback = () => {
        if (!audioUrl) return;

        if (isPlayingBack && audioPlaybackRef.current) {
            audioPlaybackRef.current.pause();
            setIsPlayingBack(false);
            return;
        }

        if (!audioPlaybackRef.current) {
            audioPlaybackRef.current = new Audio(audioUrl);
            audioPlaybackRef.current.onended = () => setIsPlayingBack(false);
        }

        audioPlaybackRef.current.play().catch(console.error);
        setIsPlayingBack(true);
    };

    // ─── Embed path: anonymous upload + top-frame redirect ──────────────────
    //
    // Record → accept → POST to /audio/upload-pending (anonymous, rate-limited)
    // → top frame navigates to voxpop.com/@handle/promptId?pending=xxx, where
    // OTP + reply submission happen on our origin. No popup, no postMessage,
    // no cross-origin auth state.
    const submitPendingEmbed = useCallback(async () => {
        if (!audioBlob) return;
        if (!creatorHandle) {
            setError('Cannot continue from this embed — missing creator handle.');
            setPhase('review');
            return;
        }
        if (!coreApiBaseUrl || !hostAppBaseUrl) {
            // Programming error — embed mode was triggered but the caller
            // forgot to pass the URLs. Surface explicitly rather than
            // letting `fetch(undefined)` crash with a confusing TypeError.
            setError('Embed flow requires coreApiBaseUrl + hostAppBaseUrl props.');
            setPhase('review');
            return;
        }

        setPhase('sending');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'reply.webm');
            formData.append('promptId', promptId);

            const res = await fetch(`${coreApiBaseUrl}/api/v1/audio/upload-pending`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Upload failed');
            }

            // POST /audio/upload-pending returns `{ success: true, data: { pendingId } }`
            // post envelope-Phase-2. Manual unwrap since this uses raw fetch
            // (anonymous + FormData; can't use authenticatedApi).
            const body = (await res.json()) as { success?: boolean; data?: { pendingId?: string } };
            const pendingId = body?.data?.pendingId;
            if (!pendingId) throw new Error('Upload response missing pendingId');
            // URL-encode every interpolated path segment defensively. Handles
            // are validated to `[a-z0-9_]+` and Firestore doc IDs are URL-safe
            // by convention, so this is belt-and-suspenders — but a future
            // change to either validation set wouldn't silently break the
            // redirect.
            const target = `${hostAppBaseUrl}/@${encodeURIComponent(creatorHandle)}/${encodeURIComponent(promptId)}?pending=${encodeURIComponent(pendingId)}`;

            // Navigate the top frame. In cross-origin iframes we need a user
            // gesture (which we have — the accept tap). `_top` is honoured by
            // every browser we care about; `allow-top-navigation-by-user-activation`
            // covers sandboxed iframes.
            try {
                window.top!.location.href = target;
            } catch {
                window.open(target, '_top');
            }
        } catch (err: unknown) {
            console.error('Error uploading pending reply:', err);
            setError((err as Error).message || 'Failed to send reply.');
            setPhase('review');
        }
    }, [audioBlob, creatorHandle, promptId, coreApiBaseUrl, hostAppBaseUrl]);

    // ─── On-site path: existing direct-upload + authenticated reply ─────────
    //
    // Bug 2 from `specs/drafts/post-roadmap-followups.md` was "authenticated
    // reply on public pages — button just doesn't respond." Root cause:
    // every early-return below pre-fix either silently returned OR awaited
    // `getToken(true)` BEFORE flipping to the `sending` phase, leaving the
    // user staring at the same `review` UI with no feedback for 1–3 seconds
    // (or forever, on the silent paths). This rewrite flips `sending`
    // IMMEDIATELY so the user gets the spinner the instant they tap Send,
    // and converts every silent-return path into a visible error string.
    const submitReply = useCallback(async () => {
        if (!audioBlob) {
            // Audio was somehow cleared between record and submit — rare,
            // but if it happens, surface the state instead of doing
            // nothing. Pre-fix this was a silent `return` and the user
            // saw no response to their tap (Bug 2 root cause #1).
            setError('Recording lost. Please record again.');
            setPhase('review');
            return;
        }
        if (!auth || !uploader || !authGate) {
            // Programming error — on-domain submit was triggered without
            // the required adapters. Embed mode never reaches here
            // (handleAccept short-circuits via submitPendingEmbed).
            setError('On-domain submit requires auth + uploader adapters.');
            setPhase('review');
            return;
        }

        // Flip to `sending` BEFORE the token round-trip so the user sees
        // the spinner immediately, not after 1–3s of perceived dead air.
        // If anything below fails we revert to `review` with the error.
        setPhase('sending');
        setError(null);
        authGate.dismissAuth();

        // Token retrieval — `forceRefresh: false` (the default). Firebase
        // Auth auto-refreshes the cached ID token ~5 minutes before expiry,
        // so for any user on the page less than ~55 minutes the cached
        // token is valid. The 401-retry path in `authenticatedApi` is the
        // only legitimate force-refresh case; paying it on every submit
        // adds 200ms–3s of perceived latency for no benefit (see
        // `specs/drafts/auth-hardening.md` § Step 4). Originally written
        // as `getToken(true)` on the assumption that "a write is worth
        // the round-trip" — Gemini correctly pushed back on #515.
        //
        // The `.catch()` is still here because `getIdToken()` can throw
        // on a transient refresh failure (rare for cached tokens, but
        // possible during refresh-window contention). Converting the
        // throw to `null` keeps the error path in the value position
        // (consistent with the rest of the flow).
        const token = await auth.authenticatedApi.getToken(false).catch((err) => {
            console.error('Token retrieval failed:', err);
            return null;
        });
        if (!token) {
            // "Refresh the page" rather than "sign in again" — `auth.user`
            // is likely still populated in React state, so `needsAuth()`
            // would return false on the next tap and we'd loop right back
            // here. A page refresh forces a re-hydration that re-evaluates
            // sign-in state. Step 5 of the auth-hardening migration will
            // make this surface a proper "sign out then sign in" recovery;
            // for now, the explicit refresh instruction unblocks the user.
            setError('Session expired. Please refresh the page and sign in again.');
            setPhase('review');
            return;
        }

        try {
            const currentUser = auth.authService?.currentUser;
            if (!currentUser) throw new Error('Session lost during submit. Please sign in again.');
            const storagePath = uploader.getReplyStoragePath(promptId, currentUser.uid);
            const result = await uploader.uploadAudio(audioBlob, storagePath);

            await auth.authenticatedApi.postData('/replies', {
                promptId,
                audioUrl: result.url,
                isNew: true,
            });

            setPhase('success');
            authGate.setMergeState({ phase: 'merging', isNewUser: didAuthThisSession.current });
        } catch (err: unknown) {
            console.error('Error sending reply:', err);
            setError((err as Error).message || 'Failed to send reply.');
            setPhase('review');
        }
    }, [audioBlob, auth, uploader, authGate, promptId]);

    // Keep a ref to the latest submitReply so the requestAuth callback
    // always invokes the current version (avoids stale closure).
    const submitReplyRef = useRef(submitReply);
    submitReplyRef.current = submitReply;

    const handleAccept = useCallback(async () => {
        if (!audioBlob) {
            // See submitReply for why this used to be a silent `return`.
            setError('Recording lost. Please record again.');
            setPhase('review');
            return;
        }

        // Embed: hand off to voxpop.com via the pending-upload flow.
        if (isEmbed) {
            await submitPendingEmbed();
            return;
        }

        if (needsAuth()) {
            if (!authGate) {
                // Programming error — on-domain mode requires the auth
                // gate. Without it, we can't open the OTP sheet.
                setError('Auth gate is required for the on-domain path.');
                return;
            }
            setPhase('authenticating');
            didAuthThisSession.current = true;
            authGate.requestAuth(
                () => submitReplyRef.current(),
                () => {
                    setPhase('review');
                    authGate.dismissAuth();
                },
            );
            return;
        }

        await submitReply();
    }, [audioBlob, isEmbed, submitPendingEmbed, needsAuth, authGate, submitReply]);

    // When merge is reset (user clicked "Send another"), go back to idle.
    // `mergeStateSignal` is the caller's mirror of `authGate.mergeState` —
    // owned by apps/web's TwoDotsAuthContext.
    // `handleDiscard` is intentionally excluded from the deps — including
    // it (without `useCallback`-stabilizing it) would re-fire this effect
    // on every render. embed-ui's ESLint config doesn't enforce
    // `react-hooks/exhaustive-deps`, so no disable comment is needed.
    useEffect(() => {
        if (mergeStateSignal === null && phase === 'success') {
            handleDiscard();
        }
    }, [mergeStateSignal, phase]);

    // Show blob during recording
    const showBlob = phase === 'recording' && isRecording;

    return (
        <div ref={containerRef} className="relative flex items-center justify-center w-full h-full">
            {/* RadialBlob — renders behind content, extends beyond dot */}
            {showBlob && dotSize > 0 && (
                <RadialBlob
                    analyser={analyserNode}
                    dotSize={dotSize}
                    reach={28}
                    active
                />
            )}

            <AnimatePresence mode="wait">

                {/* IDLE — Mic button.
                    Bug 4 — primary actions across all three phases
                    (idle/recording/review-send) sized to w-20 h-20 (80px)
                    so the central control doesn't jump as the phase
                    changes. Was w-16 h-16 (64px); felt undersized
                    against the cap-18rem desktop dot. */}
                {phase === 'idle' && (
                    <motion.button
                        key="idle"
                        onClick={handleTapToRecord}
                        className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Start recording your reply"
                    >
                        <motion.span
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Mic className="h-9 w-9" />
                        </motion.span>
                    </motion.button>
                )}

                {/* RECORDING — Stop button only (blob handles visualization) */}
                {phase === 'recording' && (
                    <motion.button
                        key="recording"
                        onClick={handleStop}
                        className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Stop recording"
                    >
                        <Square className="h-7 w-7 fill-current" />
                    </motion.button>
                )}

                {/* REVIEW — Play, Submit (primary), Discard */}
                {phase === 'review' && (
                    <motion.div
                        key="review"
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Play/pause preview — secondary, w-12 h-12 (was w-10 h-10) */}
                            <motion.button
                                onClick={handlePlayback}
                                className="w-12 h-12 rounded-full border-2 border-border bg-card flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label={isPlayingBack ? 'Pause preview' : 'Play preview'}
                            >
                                {isPlayingBack ? (
                                    <Pause className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <Play className="h-5 w-5 text-muted-foreground ml-0.5" />
                                )}
                            </motion.button>

                            {/* Accept — primary action, centered, matches idle/recording size */}
                            <motion.button
                                onClick={handleAccept}
                                className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label={`Send reply to ${hostName}`}
                            >
                                <Send className="h-8 w-8" />
                            </motion.button>

                            {/* Discard (X) — secondary, matches play preview size */}
                            <motion.button
                                onClick={handleDiscard}
                                className="w-12 h-12 rounded-full border-2 border-border bg-card flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Discard recording"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </motion.button>
                        </div>

                        {error && (
                            <p className="text-xs text-destructive text-center max-w-[180px]">
                                {error}
                            </p>
                        )}
                    </motion.div>
                )}

                {/* AUTHENTICATING — Compact indicator */}
                {phase === 'authenticating' && (
                    <motion.div
                        key="authenticating"
                        className="flex flex-col items-center gap-2"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center">
                            <Mic className="h-5 w-5 text-primary/60" />
                        </div>
                        <span className="text-xs text-muted-foreground">Recording saved</span>
                    </motion.div>
                )}

                {/* SENDING — Spinner */}
                {phase === 'sending' && (
                    <motion.div
                        key="sending"
                        className="flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </motion.div>
                )}

                {/* SUCCESS — Empty placeholder (PublicPrompt shows merged dot animation) */}
                {phase === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0 }}
                    />
                )}

            </AnimatePresence>
        </div>
    );
}
