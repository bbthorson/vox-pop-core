'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, UserPlus } from 'lucide-react';
import { DotMark } from './DotMark';
import { EditorialTitle, EditorialLede } from './typography';
import type { LinkComponent } from '../ports';

interface MergedDotSuccessProps {
    /** Size of the merged dot in pixels. */
    dotSize: number;
    /** Whether the user authenticated during this session. */
    isNewUser: boolean;
    /** Creator handle for the "See more" link. */
    creatorHandle?: string;
    /** Creator display name for the "See more" link. */
    creatorDisplayName?: string;
    /** Called when "Send another" is clicked. */
    onSendAnother: () => void;
    /**
     * Link component for client-side navigation. Apps/web passes Next.js
     * `Link`; the standalone embed can omit this and the component falls
     * back to a plain `<a>` (full-page reload, which is fine because
     * embed-side links navigate the top frame anyway).
     *
     * Preparing this prop for the `packages/embed-ui/` extraction —
     * see `./ports.ts` for the rationale.
     */
    LinkComponent?: LinkComponent;
}

/**
 * Default link renderer when no LinkComponent prop is provided —
 * plain anchor with no client-side routing.
 */
const DefaultLink: LinkComponent = ({ href, children, className }) => (
    <a href={href} className={className}>
        {children}
    </a>
);

/**
 * MergedDotSuccess — the merged-dot confirmation shown after a reply is sent.
 *
 * Editorial layout: a single large DotMark (with a checkmark interior)
 * stacked above a serif confirmation line, with secondary actions below.
 * Replaces the previous pattern that stuffed both the dot and the CTA
 * inside one circle.
 */
export function MergedDotSuccess({
    dotSize,
    isNewUser,
    creatorHandle,
    creatorDisplayName,
    onSendAnother,
    LinkComponent = DefaultLink,
}: MergedDotSuccessProps) {
    const creatorName = creatorDisplayName || (creatorHandle ? `@${creatorHandle}` : null);

    return (
        <motion.div
            className="flex flex-col items-center gap-6 text-center max-w-prose mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
            {/* Merged dot — ghost-toned with a confident checkmark */}
            <DotMark
                variant="ghost"
                tone="muted"
                size={dotSize}
                layoutId="merged-dot"
            >
                <motion.div
                    className="flex items-center justify-center"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.2 }}
                >
                    <div
                        className="rounded-full bg-primary/10 flex items-center justify-center"
                        style={{ width: dotSize * 0.34, height: dotSize * 0.34 }}
                    >
                        <Check
                            className="text-primary"
                            style={{ width: dotSize * 0.18, height: dotSize * 0.18 }}
                        />
                    </div>
                </motion.div>
            </DotMark>

            {/* Confirmation copy */}
            <div className="flex flex-col items-center gap-2">
                <EditorialTitle>Thanks — we got it.</EditorialTitle>
                {creatorName && (
                    <EditorialLede className="text-ink-muted">
                        {creatorName} will hear it next.
                    </EditorialLede>
                )}
            </div>

            {/* Secondary actions */}
            <div className="flex flex-col items-center gap-3">
                {isNewUser ? (
                    <LinkComponent
                        href="/settings"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-md hover:bg-primary/90 transition-colors"
                    >
                        <UserPlus className="h-4 w-4" />
                        Create your profile
                    </LinkComponent>
                ) : null}

                <div className="flex items-center gap-5 text-sm">
                    <button
                        onClick={onSendAnother}
                        className="text-ink-muted hover:text-ink-strong transition-colors"
                    >
                        Send another reply
                    </button>
                    {creatorHandle && (
                        <>
                            <span className="text-ink-subtle" aria-hidden="true">·</span>
                            <LinkComponent
                                href={`/@${creatorHandle}`}
                                className="text-ink-muted hover:text-ink-strong transition-colors"
                            >
                                See more from {creatorName}
                            </LinkComponent>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
