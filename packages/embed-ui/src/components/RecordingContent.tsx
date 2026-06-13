'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mic, Square, Play, Pause, Send, X } from 'lucide-react';
import { useAudioRecorder } from '../hooks/use-audio-recorder';
import { useContainerSize } from '../hooks/use-container-size';
import { HairlineRipple } from './HairlineRipple';
import {
    phaseTransition,
    micBreathing,
    buttonScalePrimary,
    buttonScaleSecondary,
} from '../motion';

export type RecordPhase = 'idle' | 'recording' | 'review';

interface RecordingContentProps {
    /** Called with the recorded blob when recording completes */
    onRecordingComplete: (blob: Blob) => void;
    /** Called when the user discards the recording */
    onDiscard: () => void;
    /** Whether a recording already exists (shows review state) */
    hasRecording: boolean;
    /** Audio blob for playback preview */
    audioBlob?: Blob | null;
    /** Called when recording starts/stops */
    onRecordingStatusChange?: (isRecording: boolean) => void;
    /** Called with permission error message */
    onPermissionError?: (error: string) => void;
    /** Called when the phase changes */
    onPhaseChange?: (phase: RecordPhase) => void;
    /** Called with elapsed recording seconds */
    onRecordingSecondsChange?: (seconds: number) => void;
    /**
     * When provided, adds a primary Accept/Send button in review phase between
     * Play and Discard — matching the ReplyDot three-button review layout.
     * The caller already holds the blob (from onRecordingComplete), so the
     * callback takes no arguments.
     */
    onAccept?: () => void;
    /** Aria-label for the accept button. */
    acceptLabel?: string;
}

/**
 * RecordingContent — Recording UI designed to fill a Dot container.
 *
 * Renders idle/recording/review phases with HairlineRipple visualization.
 * Does NOT render its own circle — expects to be placed inside a `<DotMark>`.
 *
 * Review phase:
 *   - With `onAccept`: [Play] [Send/Accept — primary] [Discard] — matches ReplyDot.
 *   - Without `onAccept`: [Play] [Discard] — used when the accept action lives
 *     outside the dot (e.g. a form Publish button).
 */
export function RecordingContent({
    onRecordingComplete,
    onDiscard,
    hasRecording,
    audioBlob,
    onRecordingStatusChange,
    onPermissionError,
    onPhaseChange,
    onRecordingSecondsChange,
    onAccept,
    acceptLabel = 'Accept recording',
}: RecordingContentProps) {
    const [phase, setPhase] = useState<RecordPhase>(hasRecording ? 'review' : 'idle');
    const [isPlayingBack, setIsPlayingBack] = useState(false);
    const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const { containerRef, size: dotSize } = useContainerSize();
    const reducedMotion = useReducedMotion() ?? false;

    const recordingStartRef = useRef<number>(0);

    // Emit the initial phase once on mount so a restored draft (hasRecording=true)
    // seeds the parent's recordPhase without waiting for the next phase change.
    useEffect(() => {
        onPhaseChange?.(phase);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (hasRecording && phase === 'idle') updatePhase('review');
        if (!hasRecording && phase === 'review') updatePhase('idle');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasRecording]);

    function updatePhase(next: RecordPhase) {
        setPhase(next);
        onPhaseChange?.(next);
    }

    const { startRecording, stopRecording, isRecording, analyserNode } = useAudioRecorder({
        onRecordingComplete: (blob) => {
            onRecordingComplete(blob);
            updatePhase('review');
        },
        onError: (err) => onPermissionError?.(err),
    });

    useEffect(() => {
        if (!onRecordingSecondsChange) return;
        if (!isRecording) {
            onRecordingSecondsChange(0);
            return;
        }
        recordingStartRef.current = Date.now();
        const interval = setInterval(() => {
            const secs = Math.floor((Date.now() - recordingStartRef.current) / 1000);
            onRecordingSecondsChange(secs);
        }, 200);
        return () => clearInterval(interval);
    }, [isRecording, onRecordingSecondsChange]);

    useEffect(() => {
        onRecordingStatusChange?.(isRecording);
    }, [isRecording, onRecordingStatusChange]);

    useEffect(() => {
        return () => {
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
            if (audioPlaybackRef.current) {
                audioPlaybackRef.current.pause();
                audioPlaybackRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        if (audioBlob) {
            audioUrlRef.current = URL.createObjectURL(audioBlob);
        } else {
            audioUrlRef.current = null;
        }
        if (audioPlaybackRef.current) {
            audioPlaybackRef.current.pause();
            audioPlaybackRef.current = null;
        }
        setIsPlayingBack(false);
    }, [audioBlob]);

    const handleTapToRecord = () => {
        startRecording();
        updatePhase('recording');
    };

    const handleStop = () => {
        stopRecording();
    };

    const handleDiscard = () => {
        setIsPlayingBack(false);
        if (audioPlaybackRef.current) {
            audioPlaybackRef.current.pause();
            audioPlaybackRef.current = null;
        }
        updatePhase('idle');
        onDiscard();
    };

    const handlePlayback = () => {
        if (!audioUrlRef.current) return;

        if (isPlayingBack && audioPlaybackRef.current) {
            audioPlaybackRef.current.pause();
            setIsPlayingBack(false);
            return;
        }

        if (!audioPlaybackRef.current) {
            audioPlaybackRef.current = new Audio(audioUrlRef.current);
            audioPlaybackRef.current.onended = () => setIsPlayingBack(false);
        }

        audioPlaybackRef.current.play().catch(console.error);
        setIsPlayingBack(true);
    };

    const showBlob = phase === 'recording' && isRecording;

    return (
        <div ref={containerRef} className="relative flex items-center justify-center w-full h-full">
            {showBlob && dotSize > 0 && (
                <HairlineRipple
                    analyser={analyserNode}
                    dotSize={dotSize}
                    reach={28}
                    active
                    reducedMotion={reducedMotion}
                />
            )}

            <AnimatePresence mode="wait">
                {phase === 'idle' && (
                    <motion.button
                        key="idle"
                        type="button"
                        onClick={handleTapToRecord}
                        className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                        {...phaseTransition}
                        {...buttonScalePrimary}
                        aria-label="Start recording"
                        data-testid="record-audio-button"
                    >
                        <motion.span {...micBreathing}>
                            <Mic className="h-9 w-9" />
                        </motion.span>
                    </motion.button>
                )}

                {phase === 'recording' && (
                    <motion.div
                        key="recording"
                        className="flex flex-col items-center gap-2"
                        {...phaseTransition}
                    >
                        <motion.button
                            type="button"
                            onClick={handleStop}
                            className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                            {...buttonScaleSecondary}
                            aria-label="Stop recording"
                        >
                            <Square className="h-7 w-7 fill-current" />
                        </motion.button>
                    </motion.div>
                )}

                {/* REVIEW — matches ReplyDot layout when onAccept is provided:
                    [Play secondary] [Accept primary] [Discard secondary].
                    Without onAccept: [Play secondary] [Discard secondary]. */}
                {phase === 'review' && (
                    <motion.div
                        key="review"
                        className="flex items-center gap-3"
                        {...phaseTransition}
                    >
                        <motion.button
                            type="button"
                            onClick={handlePlayback}
                            className="w-12 h-12 rounded-full border-2 border-border bg-card flex items-center justify-center"
                            {...buttonScaleSecondary}
                            aria-label={isPlayingBack ? 'Pause preview' : 'Play preview'}
                        >
                            {isPlayingBack ? (
                                <Pause className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <Play className="h-5 w-5 text-muted-foreground ml-0.5" />
                            )}
                        </motion.button>

                        {onAccept && (
                            <motion.button
                                type="button"
                                onClick={onAccept}
                                className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                                {...buttonScaleSecondary}
                                aria-label={acceptLabel}
                            >
                                <Send className="h-8 w-8" />
                            </motion.button>
                        )}

                        <motion.button
                            type="button"
                            onClick={handleDiscard}
                            className="w-12 h-12 rounded-full border-2 border-border bg-card flex items-center justify-center"
                            {...buttonScaleSecondary}
                            aria-label="Discard recording"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
