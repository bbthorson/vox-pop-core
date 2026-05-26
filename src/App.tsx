import { useEffect, useState } from 'react';
import {
    DotMark,
    DotPair,
    EditorialDisplay,
    EditorialLede,
    EditorialMeta,
    ListenDot,
    ReplyDot,
} from '@vox-pop/embed-ui';
import type { ProfileView, PromptView } from 'shared/types';

import { CORE_API_BASE_URL, HOST_APP_BASE_URL, getAudioProxyUrl } from './lib/config';

/**
 * Parse `{handle, promptId}` from the URL.
 *
 * Path-based, mirroring apps/web's `/@handle/promptId` URL — drop-in
 * replacement for existing iframe srcs (`s/voxpop.com/embed.voxpop.com/`).
 * The leading `@` on the handle segment is optional; trimmed if present
 * so the URL normalization matches the legacy core-api endpoint.
 */
function parseRoute(pathname: string): { handle: string; promptId: string } | null {
    // Strip leading slash, decode each segment. `decodeURIComponent`
    // throws `URIError` on malformed escape sequences (e.g. a trailing
    // `%`); treat that as an unparseable route rather than a crash.
    try {
        const segments = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
        if (segments.length < 2) return null;
        const handle = decodeURIComponent(segments[0]).replace(/^@/, '').toLowerCase();
        const promptId = decodeURIComponent(segments[1]);
        if (!handle || !promptId) return null;
        return { handle, promptId };
    } catch {
        return null;
    }
}

interface FetchSuccess {
    success: true;
    data: { user: ProfileView; prompt: PromptView };
}
interface FetchError {
    success: false;
    error?: { message?: string };
}
type FetchResult = FetchSuccess | FetchError;

type State =
    | { phase: 'loading' }
    | { phase: 'error'; message: string }
    | { phase: 'ready'; user: ProfileView; prompt: PromptView };

export function App() {
    const [state, setState] = useState<State>({ phase: 'loading' });

    useEffect(() => {
        const route = parseRoute(window.location.pathname);
        if (!route) {
            setState({
                phase: 'error',
                message:
                    'Missing handle or prompt ID. Embed URLs look like /@handle/promptId.',
            });
            return;
        }

        const controller = new AbortController();

        (async () => {
            try {
                const url = `${CORE_API_BASE_URL}/api/v1/prompts/public/${encodeURIComponent(
                    route.handle,
                )}/${encodeURIComponent(route.promptId)}`;
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) {
                    if (res.status === 404) {
                        setState({ phase: 'error', message: 'Prompt not found.' });
                        return;
                    }
                    setState({
                        phase: 'error',
                        message: `Failed to load prompt (${res.status}).`,
                    });
                    return;
                }
                const body = (await res.json()) as FetchResult;
                if (!body.success) {
                    setState({
                        phase: 'error',
                        message: body.error?.message ?? 'Failed to load prompt.',
                    });
                    return;
                }
                setState({
                    phase: 'ready',
                    user: body.data.user,
                    prompt: body.data.prompt,
                });
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') return;
                setState({
                    phase: 'error',
                    message: err instanceof Error ? err.message : 'Network error.',
                });
            }
        })();

        return () => controller.abort();
    }, []);

    if (state.phase === 'loading') {
        // Intentionally minimal — a flash of skeleton text would be
        // more distracting than empty space in a small iframe. The
        // fetch typically completes in <200ms against a warm core-api.
        return (
            <div className="theme-editorial flex h-full w-full items-center justify-center bg-background" />
        );
    }

    if (state.phase === 'error') {
        return (
            <div className="theme-editorial flex h-full w-full items-center justify-center bg-background px-4 text-center">
                <p className="text-sm text-ink-muted">{state.message}</p>
            </div>
        );
    }

    return <EmbedView user={state.user} prompt={state.prompt} />;
}

/**
 * Embed composition — mirrors `EmbedPublicPrompt` in
 * `apps/web/src/components/public/PublicPrompt.tsx` so the chrome-less
 * iframe renders identically across origins. Both apps consume the
 * same composed components from `@vox-pop/embed-ui`.
 *
 * Differences vs apps/web's embed:
 *   - Anonymous flow only: `ReplyDot` is in `isEmbed` mode; `auth`,
 *     `uploader`, and `authGate` props are not supplied (and not
 *     needed — see `submitPendingEmbed`).
 *   - URLs come from build-time env (`CORE_API_BASE_URL`,
 *     `HOST_APP_BASE_URL`) rather than `APP_CONFIG.BASE_URL` because
 *     apps/embed is cross-origin from both.
 *   - No `TwoDotsAuthProvider` wrapper — `ReplyDot` in embed mode
 *     short-circuits before `useTwoDotsAuth()` is called.
 */
function EmbedView({ user, prompt }: { user: ProfileView; prompt: PromptView }) {
    return (
        <div className="theme-editorial relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-3 text-foreground">
            <div className="w-full max-w-md">
                <DotPair
                    listen={
                        <DotMark
                            variant="filled"
                            tone="primary"
                            className="size-[clamp(7rem,25vmin,11rem)]"
                        >
                            {prompt.record.audioUrl ? (
                                <ListenDot
                                    audioUrl={getAudioProxyUrl(prompt.record.audioUrl)}
                                    peaks={prompt.record.waveformPeaks}
                                />
                            ) : (
                                <div className="px-3 text-center text-xs text-ink-muted">
                                    Text-only prompt
                                </div>
                            )}
                        </DotMark>
                    }
                    reply={
                        <DotMark
                            variant="ring"
                            tone="accent-warm"
                            className="size-[clamp(7rem,25vmin,11rem)]"
                        >
                            <ReplyDot
                                promptId={prompt.record.id}
                                hostName={user.displayName || user.handle || undefined}
                                creatorHandle={user.handle || undefined}
                                isEmbed
                                coreApiBaseUrl={CORE_API_BASE_URL}
                                hostAppBaseUrl={HOST_APP_BASE_URL}
                            />
                        </DotMark>
                    }
                    between={
                        <div className="flex flex-col items-center gap-1 py-0.5">
                            <EditorialMeta>@{user.handle}</EditorialMeta>
                            <EditorialDisplay
                                as="h1"
                                className="text-[clamp(1rem,3.5vw+0.5rem,1.5rem)] leading-tight"
                            >
                                {prompt.record.title}
                            </EditorialDisplay>
                            {prompt.record.description && (
                                <EditorialLede className="line-clamp-2 text-xs leading-snug md:text-sm">
                                    {prompt.record.description}
                                </EditorialLede>
                            )}
                        </div>
                    }
                />
            </div>
        </div>
    );
}
