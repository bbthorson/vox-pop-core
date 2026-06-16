'use client';

import React, { useState } from 'react';
import { DotMark } from './DotMark';
import { DotPair } from './DotPair';
import { ListenDot } from './ListenDot';
import { ReplyDot } from './ReplyDot';
import { EditorialDisplay, EditorialLede, EditorialMeta } from './typography';

/**
 * Canonical embed dot size. Height-driven (`24dvh`) so the dots fill the
 * vertical space on a phone rather than flooring to a small width-bound size.
 * Single-sourced here so the standalone embed and apps/web's `?mode=embed`
 * can never drift apart — they render this same component.
 */
const EMBED_DOT_SIZE = 'size-[clamp(10rem,24dvh,15rem)]';

export interface EmbedPromptProps {
    promptId: string;
    title: string;
    description?: string | null;
    /**
     * Playable audio URL, already resolved to whatever proxy the host app
     * uses (apps/web and apps/embed proxy through different origins, so the
     * resolution is a host concern). Omit / null for a text-only prompt.
     */
    audioUrl?: string | null;
    /** Pre-computed waveform peaks for the listen-dot ripple. */
    waveformPeaks?: number[];
    /** Creator handle (shown as `@handle`, and used for the reply handoff). */
    handle?: string;
    /** Creator display name (falls back to handle for the reply host label). */
    displayName?: string;
    /**
     * Origin where `POST /api/v1/audio/upload-pending` lives. apps/embed passes
     * its core-api origin; apps/web passes its own origin (rewrites forward
     * the path). See ReplyDot's `coreApiBaseUrl`.
     */
    coreApiBaseUrl: string;
    /**
     * Origin of the apps/web host that completes the embed handoff (the
     * top-frame redirect target). See ReplyDot's `hostAppBaseUrl`.
     */
    hostAppBaseUrl: string;
}

/**
 * EmbedPrompt — the chrome-less, anonymous-only prompt composition rendered
 * inside a narrow iframe (typically 340–480px wide).
 *
 * This is the SINGLE source of the embed layout. Both consumers render it:
 *   - `apps/embed` — the standalone cross-origin Vite bundle
 *     (`embed.voxpop…`), which has no Next.js / Firebase.
 *   - `apps/web` — the `?mode=embed` branch of `PublicPrompt`, served from
 *     the main origin.
 *
 * The full public prompt page (`EditorialPublicPrompt`) is intentionally NOT
 * this component — it's a superset (in-page auth, share, the merged-dot
 * success animation, responsive side-by-side layout) — but it composes the
 * same `@vox-pop/embed-ui` primitives, so the dot design stays consistent.
 *
 * Differences between the two embed surfaces are exactly the props below
 * (audio-proxy origin, core-api / host origins); everything visual lives here.
 */
export function EmbedPrompt({
    promptId,
    title,
    description,
    audioUrl,
    waveformPeaks,
    handle,
    displayName,
    coreApiBaseUrl,
    hostAppBaseUrl,
}: EmbedPromptProps) {
    // Recording / upload errors surface here, below the dots — the ReplyDot
    // lives inside a round `overflow-hidden` DotMark that clips wide captions,
    // so the status text can't live inside the circle.
    const [replyError, setReplyError] = useState<string | null>(null);

    return (
        <div className="theme-editorial relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-3 text-foreground">
            <div className="w-full max-w-md">
                {/* No LISTEN / REPLY labels — DotMark positions them inside the
                    dot at ~18% from the edge, which collides with the centered
                    mic / play content when dots are under ~170px. Filled-coral
                    vs ring-accent-warm already carries the meaning at narrow
                    iframe widths. */}
                <DotPair
                    listen={
                        <DotMark variant="filled" tone="primary" className={EMBED_DOT_SIZE}>
                            {audioUrl ? (
                                <ListenDot audioUrl={audioUrl} peaks={waveformPeaks} />
                            ) : (
                                <div className="px-3 text-center text-xs text-ink-muted">
                                    Text-only prompt
                                </div>
                            )}
                        </DotMark>
                    }
                    reply={
                        <ReplyDot
                            promptId={promptId}
                            hostName={displayName || handle || undefined}
                            creatorHandle={handle || undefined}
                            isEmbed
                            coreApiBaseUrl={coreApiBaseUrl}
                            hostAppBaseUrl={hostAppBaseUrl}
                            onError={setReplyError}
                            dotClassName={EMBED_DOT_SIZE}
                        />
                    }
                    between={
                        <div className="flex flex-col items-center gap-1 py-0.5">
                            {handle && <EditorialMeta>@{handle}</EditorialMeta>}
                            {/* Smaller scale than the full-page hero — the embed
                                competes with two dots inside a 340–480px iframe,
                                so 16–24px keeps the title readable without
                                eating vertical space. */}
                            <EditorialDisplay
                                as="h1"
                                className="text-[clamp(1rem,3.5vw+0.5rem,1.5rem)] leading-tight"
                            >
                                {title}
                            </EditorialDisplay>
                            {description && (
                                <EditorialLede className="line-clamp-2 text-xs leading-snug md:text-sm">
                                    {description}
                                </EditorialLede>
                            )}
                        </div>
                    }
                />
                {replyError && (
                    <p role="alert" className="mt-3 text-center text-sm text-destructive">
                        {replyError}
                    </p>
                )}
            </div>
        </div>
    );
}
