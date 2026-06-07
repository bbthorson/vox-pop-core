/**
 * Shared Framer Motion presets for the dot family (ListenDot, ReplyDot, and
 * apps/web's RecordingContent) and other phase-based UIs.
 *
 * Canonical home: these prop bundles were previously inlined in each dot
 * component (and duplicated in apps/web/src/lib/motion-presets.ts). Centralised
 * here so the motion vocabulary stays consistent across apps/web + apps/embed
 * and updates propagate everywhere. apps/web re-exports these from
 * `@/lib/motion-presets` so its own consumers keep a stable local path.
 *
 * Each export is a bundle of motion props meant to be spread onto a
 * `motion.*` element (e.g. `<motion.div {...phaseTransition} />`), not a
 * Variants map.
 */

/** Standard phase swap — fade + slight scale, used inside AnimatePresence. */
export const phaseTransition = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
} as const;

/** Mic icon idle breathing — gentle vertical bob. */
export const micBreathing = {
    animate: { y: [0, -3, 0] as number[] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
};

/** Primary action button (large, prominent) — e.g. idle mic, main play. */
export const buttonScalePrimary = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 },
} as const;

/** Secondary action button (smaller, supporting) — e.g. stop, discard, re-record. */
export const buttonScaleSecondary = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
} as const;

/**
 * Icon cross-swap inside AnimatePresence — quick scale + fade for trading one
 * glyph for another in place (e.g. ListenDot's play ↔ pause). Shorter and
 * tighter than `phaseTransition` since it's a same-spot glyph swap, not a
 * whole-phase change.
 */
export const iconSwap = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.15 },
} as const;
