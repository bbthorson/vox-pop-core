'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { RadialBlob } from './RadialBlob';
import { useContainerSize } from '../hooks/use-container-size';

interface ListenDotProps {
  audioUrl: string;
  peaks?: number[];
}

/**
 * ListenDot — Audio playback UI designed for the circular dot container.
 *
 * The listen dot should feel "full" — content exists here. Uses:
 * - RadialBlob extending beyond the dot edge (from pre-computed peaks)
 * - A progress sweep via the blob that illuminates as audio plays
 * - A centered play/pause icon
 *
 * The blob visualization replaces the old horizontal waveform bars,
 * creating an organic aura that emanates from the circle.
 */
export function ListenDot({ audioUrl, peaks }: ListenDotProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const { containerRef, size: dotSize } = useContainerSize();

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress(audio.currentTime / audio.duration);
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
    } else {
      await audio.play();
      setIsPlaying(true);
    }
  };

  const hasPeaks = peaks && peaks.length > 0;

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full">
      {/* RadialBlob — only shown during active playback */}
      {hasPeaks && dotSize > 0 && isPlaying && (
        <RadialBlob
          peaks={peaks}
          progress={progress}
          dotSize={dotSize}
          reach={20}
          active
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
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.div
                key="pause"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Bumped from h-12 w-12 → h-16 w-16 (48 → 64px) per
                    Bug 4 — the icon is the entire touch target inside
                    the listen dot, and felt undersized against the
                    cap-18rem desktop dot. */}
                <Pause className="h-16 w-16 text-primary fill-primary drop-shadow-md" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
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
