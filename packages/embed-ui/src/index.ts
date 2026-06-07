/**
 * `@vox-pop/embed-ui` — public surface.
 *
 * Composed components used by BOTH apps/web's public pages AND the
 * standalone apps/embed Vite app. Framework-portable: no Next.js,
 * Firebase, or apps/web-specific imports.
 *
 * App-specific concerns (auth, audio storage, navigation, host URL)
 * arrive via the ports defined in `./ports`.
 */

// Components
export { ReplyDot } from './components/ReplyDot';
export { ListenDot } from './components/ListenDot';
export type { ListenDotMediaSession } from './components/ListenDot';
export { DotMark } from './components/DotMark';
export { DotPair } from './components/DotPair';
export { HairlineRipple } from './components/HairlineRipple';
export { MergedDotSuccess } from './components/MergedDotSuccess';
export { PromptCard } from './components/PromptCard';
export {
    EditorialDisplay,
    EditorialTitle,
    EditorialLede,
    EditorialMeta,
} from './components/typography';

// Hooks (exposed because apps may render auxiliary surfaces that
// need them — e.g., apps/web's TwoDotsAuthProvider uses
// `useContainerSize` for its own measurements).
export { useAudioRecorder } from './hooks/use-audio-recorder';
export type {
    UseAudioRecorderProps,
    AudioRecorderState,
} from './hooks/use-audio-recorder';
export { useContainerSize } from './hooks/use-container-size';

// Motion presets (shared dot-family animation vocabulary)
export {
    phaseTransition,
    micBreathing,
    buttonScalePrimary,
    buttonScaleSecondary,
    iconSwap,
} from './motion';

// Ports (interfaces apps fulfill with adapters)
export type {
    AuthProvider,
    AudioUploader,
    DotsAuthGate,
    LinkComponent,
} from './ports';
