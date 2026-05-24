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
                <Pause className="h-12 w-12 text-primary fill-primary drop-shadow-md" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Play className="h-12 w-12 drop-shadow-md ml-1 text-primary fill-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </button>
    </div>
  );
}
