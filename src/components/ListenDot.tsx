'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { HairlineRipple } from './HairlineRipple';
import { useContainerSize } from '../hooks/use-container-size';
import { buttonScalePrimary, iconSwap } from '../motion';

/**
 * Lockscreen / hardware-media-key metadata. Optional — pass it (e.g. from the
 * dashboard reply detail) to claim the browser's MediaSession on play. Public
 * pages omit it and ListenDot touches MediaSession not at all.
 */
export interface ListenDotMediaSession {
  title: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
}

interface ListenDotProps {
  audioUrl: string;
  peaks?: number[];
  mediaSession?: ListenDotMediaSession;
}

// Module-scope owner: identity of the ListenDot currently driving the browser's
// MediaSession. Each instance compares its own token to decide whether to keep
// mirroring playback state (only one owner at a time).
let currentMediaSessionOwner: object | null = null;

const MEDIA_SESSION_ACTIONS: MediaSessionAction[] = ['play', 'pause', 'seekto'];

function clearGlobalMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = 'none';
  navigator.mediaSession.metadata = null;
  for (const action of MEDIA_SESSION_ACTIONS) {
    try {
      navigator.mediaSession.setActionHandler(action, null);
    } catch {
      /* unsupported action — ignore */
    }
  }
}

/**
 * ListenDot — Audio playback UI designed for the circular dot container.
 *
 * The listen dot should feel "full" — content exists here. Uses:
 * - HairlineRipple extending beyond the dot edge (from pre-computed peaks)
 * - A progress sweep that illuminates as audio plays
 * - A centered play/pause icon
 *
 * The ripple visualization replaces the old horizontal waveform bars,
 * creating concentric hairline rings that emanate from the circle.
 */
export function ListenDot({ audioUrl, peaks, mediaSession }: ListenDotProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const { containerRef, size: dotSize } = useContainerSize();
  const reducedMotion = useReducedMotion() ?? false;

  // Stable identity for MediaSession ownership; latest metadata kept in a ref
  // so the long-lived `ended` handler always reads the current prop.
  const mediaSessionTokenRef = useRef<object>({});
  const mediaSessionRef = useRef(mediaSession);
  mediaSessionRef.current = mediaSession;

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      if (currentMediaSessionOwner === mediaSessionTokenRef.current && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  // Relinquish MediaSession ownership on unmount so a stale lockscreen card
  // doesn't outlive the dot.
  useEffect(() => {
    const token = mediaSessionTokenRef.current;
    return () => {
      if (currentMediaSessionOwner === token) {
        clearGlobalMediaSession();
        currentMediaSessionOwner = null;
      }
    };
  }, []);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress(audio.currentTime / audio.duration);
      // Feed the lockscreen scrubber while we own MediaSession.
      if (
        currentMediaSessionOwner === mediaSessionTokenRef.current &&
        'mediaSession' in navigator &&
        navigator.mediaSession.setPositionState
      ) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            position: audio.currentTime,
            playbackRate: audio.playbackRate,
          });
        } catch {
          /* setPositionState throws on invalid duration/position — ignore */
        }
      }
    }
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, updateProgress]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (currentMediaSessionOwner === mediaSessionTokenRef.current && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } else {
      await audio.play();
      setIsPlaying(true);

      // Claim the browser's MediaSession (lockscreen / media keys) when the
      // caller supplied metadata. Previous owners stop mirroring once their
      // token no longer matches.
      const meta = mediaSessionRef.current;
      if (meta && 'mediaSession' in navigator) {
        currentMediaSessionOwner = mediaSessionTokenRef.current;
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: meta.title,
            artist: meta.artist ?? '',
            album: meta.album ?? '',
            artwork: meta.artwork ?? [],
          });
        } catch {
          /* MediaMetadata can throw on invalid artwork URLs — ignore */
        }
        // Handlers read `audioRef.current` rather than closing over the local
        // `audio` — if `audioUrl` changes, a new Audio replaces the ref and the
        // lockscreen/media keys must drive the live instance, not the old one.
        navigator.mediaSession.setActionHandler('play', () => {
          const current = audioRef.current;
          if (!current) return;
          void current.play();
          setIsPlaying(true);
          navigator.mediaSession.playbackState = 'playing';
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          const current = audioRef.current;
          if (!current) return;
          current.pause();
          setIsPlaying(false);
          navigator.mediaSession.playbackState = 'paused';
        });
        try {
          navigator.mediaSession.setActionHandler('seekto', (d) => {
            const current = audioRef.current;
            if (current && typeof d.seekTime === 'number') current.currentTime = d.seekTime;
          });
        } catch {
          /* 'seekto' unsupported on some platforms — ignore */
        }
        navigator.mediaSession.playbackState = 'playing';
      }
    }
  };

  const hasPeaks = peaks && peaks.length > 0;

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full">
      {/* HairlineRipple — only shown during active playback */}
      {hasPeaks && dotSize > 0 && isPlaying && (
        <HairlineRipple
          peaks={peaks}
          progress={progress}
          dotSize={dotSize}
          reach={20}
          active
          reducedMotion={reducedMotion}
        />
      )}

      {/* Progress fill — sweeps clockwise as a conic gradient (inside the dot) */}
      <div
        className="absolute inset-2 rounded-full transition-all duration-100 pointer-events-none"
        style={{
          background: progress > 0
            ? `conic-gradient(hsl(var(--primary) / 0.10) ${progress * 360}deg, transparent ${progress * 360}deg)`
            : undefined,
        }}
      />


      {/* Play/Pause button — centered */}
      <button
        onClick={togglePlayback}
        className="relative z-10 flex items-center justify-center cursor-pointer group"
        aria-label={isPlaying ? 'Pause' : 'Play prompt audio'}
      >
        <motion.div {...buttonScalePrimary}>
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.div key="pause" {...iconSwap}>
                {/* Bumped from h-12 w-12 → h-16 w-16 (48 → 64px) per
                    Bug 4 — the icon is the entire touch target inside
                    the listen dot, and felt undersized against the
                    cap-18rem desktop dot. */}
                <Pause className="h-16 w-16 text-primary fill-primary drop-shadow-md" />
              </motion.div>
            ) : (
              <motion.div key="play" {...iconSwap}>
                {/* `ml-2` (was `ml-1`) — Lucide's Play triangle has its
                    visual centroid offset right of its bounding-box center
                    by roughly icon/6. At 64px that's ~10.7px; `ml-2` (8px)
                    is the closest Tailwind tier. The icon scaled up in
                    Bug 4; the margin didn't, so the triangle drifted left
                    of optical center. */}
                <Play className="h-16 w-16 drop-shadow-md ml-2 text-primary fill-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </button>
    </div>
  );
}
