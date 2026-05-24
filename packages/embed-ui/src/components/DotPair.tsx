'use client';

import React from 'react';
import { cn } from '../utils/cn';

interface DotPairProps {
    /** Top dot — the listen surface. */
    listen: React.ReactNode;
    /** Bottom dot — the reply surface. */
    reply: React.ReactNode;
    /**
     * Optional content rendered between the dots. Sits on the vertical
     * connector with a small hairline above and below.
     */
    between?: React.ReactNode;
    /**
     * Layout orientation.
     * - `vertical` (default): stacked column at every breakpoint. Right for
     *   narrow surfaces like the embed iframe.
     * - `responsive`: stacked on mobile, side-by-side on md+. Used on the
     *   full editorial prompt page where horizontal frees vertical space
     *   for larger dots on short desktop windows.
     */
    orientation?: 'vertical' | 'responsive';
    className?: string;
}

/**
 * DotPair — the spatial arrangement primitive for Vox Pop's listen/reply
 * metaphor. Listen-on-top, reply-on-bottom with optional connector content
 * in the middle (vertical); or listen-left, reply-right with connector
 * content in between (horizontal, md+ only, opt-in via `orientation`).
 *
 * Used by `PublicPrompt` to compose `DotMark` + prompt copy into the
 * signature two-dots hero. State logic (auth, merge, recording) lives in
 * the consumer, not here — this component is pure layout.
 *
 * (Historical note: an `orbit` variant — diagonal arrangement with a curved
 * arc — was built alongside `stacked` in PR #301 and removed in the
 * orbit-cleanup PR. If a future marketing surface wants an asymmetric
 * composition, bring it back at that point with the context to tune it.)
 */
export function DotPair({
    listen,
    reply,
    between,
    orientation = 'vertical',
    className,
}: DotPairProps) {
    const isResponsive = orientation === 'responsive';
    return (
        <div
            className={cn(
                'flex flex-col items-center w-full',
                isResponsive && 'md:flex-row md:justify-center md:gap-2',
                className
            )}
        >
            <div className="shrink-0">{listen}</div>
            {between && (
                <div
                    className={cn(
                        'flex flex-col items-center py-3 w-full',
                        isResponsive && 'md:flex-row md:py-0 md:w-auto md:flex-1 md:max-w-md'
                    )}
                >
                    <div
                        className={cn(
                            'w-px h-4 bg-rule/60 shrink-0',
                            isResponsive && 'md:h-px md:w-4'
                        )}
                    />
                    <div
                        className={cn(
                            'text-center py-2 px-2 max-w-prose',
                            isResponsive && 'md:py-0 md:px-4 md:flex-1'
                        )}
                    >
                        {between}
                    </div>
                    <div
                        className={cn(
                            'w-px h-4 bg-rule/60 shrink-0',
                            isResponsive && 'md:h-px md:w-4'
                        )}
                    />
                </div>
            )}
            <div className="shrink-0">{reply}</div>
        </div>
    );
}
