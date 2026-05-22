'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Fallback when `getComputedStyle(document.documentElement)` can't
 * resolve `--primary` (rare — a Canvas painted before the
 * cascade settles, or an embed render where the design-tokens CSS
 * hasn't loaded yet). Hex matches the brand `primary` in apps/web's
 * `config/brand.ts`; keep aligned if the brand color shifts.
 *
 * Inlined here rather than importing from `@vox-pop/design-tokens`
 * because the package's TS export stores HSL fragments (`12 92% 58%`),
 * not hex — and an emergency fallback doesn't warrant the conversion
 * round trip.
 */
const FALLBACK_PRIMARY = '#F65831';

// Animation tuning constants
const NUM_POINTS = 72;           // Vertices around the circumference (more = smoother)
const BREATH_SPEED = 0.015;     // Breathing oscillation rate
const BREATH_AMPLITUDE = 1.5;   // Breathing oscillation magnitude (px)
const SMOOTHING_ACTIVE = 0.25;  // Amplitude smoothing factor when active
const SMOOTHING_PASSIVE = 0.06; // Amplitude smoothing factor when idle/static
const SMOOTHING_AMBIENT = 0.04; // Ambient pulse smoothing factor
const SPLINE_TENSION = 5;       // Catmull-Rom tension (lower = smoother curves)
const GRADIENT_INNER_ALPHA = 0.3;
const GRADIENT_OUTER_ALPHA = 0;
const STROKE_ALPHA = 0.2;       // Subtle edge — not the focus
const STROKE_WIDTH = 1;
const PEAK_SMOOTH_PASSES = 2;   // How many blur passes to apply to peak data

interface RadialBlobProps {
    /** Live frequency data source (recording mode) */
    analyser?: AnalyserNode | null;
    /** Pre-computed peaks for static/playback display (0–1 normalized) */
    peaks?: number[];
    /** Current playback progress 0–1 (used with peaks to animate sweep) */
    progress?: number;
    /** Diameter of the parent dot circle in pixels */
    dotSize: number;
    /** How far the blob extends beyond the dot edge (px) */
    reach?: number;
    /** Whether the blob is actively animating (e.g., during recording or playback) */
    active?: boolean;
    /** Optional color override (resolved CSS color string) */
    color?: string;
}

/**
 * Pre-smooth an array of peak values to remove harsh transitions.
 * Applies a simple 3-tap averaging kernel multiple times.
 */
function smoothPeaks(raw: number[], passes: number): number[] {
    let data = [...raw];
    for (let p = 0; p < passes; p++) {
        const next = new Array(data.length);
        for (let i = 0; i < data.length; i++) {
            const prev = data[(i - 1 + data.length) % data.length];
            const curr = data[i];
            const nextVal = data[(i + 1) % data.length];
            next[i] = prev * 0.25 + curr * 0.5 + nextVal * 0.25;
        }
        data = next;
    }
    return data;
}

/**
 * Build a robust HSL/A color string for canvas.
 * Handles both `hsl(H S% L%)` and hex fallback formats.
 */
function withAlpha(resolvedColor: string, alpha: number): string {
    if (alpha === 0) return 'transparent';
    // If it's an hsl() string, inject alpha
    if (resolvedColor.startsWith('hsl(')) {
        const inner = resolvedColor.slice(4, -1); // strip hsl( and )
        return `hsl(${inner} / ${alpha})`;
    }
    // Hex fallback — convert to rgba
    if (resolvedColor.startsWith('#')) {
        const hex = resolvedColor.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return resolvedColor;
}

/**
 * RadialBlob — Smooth organic audio visualization that emanates from a circle.
 *
 * Draws a bezier-interpolated closed path around the circumference of the parent
 * dot. Amplitude data (from AnalyserNode or peaks) modulates how far each point
 * extends outward, creating a soft, amoeba-like blob.
 *
 * Two modes:
 * - **Live (recording):** Reads frequency data each frame from AnalyserNode
 * - **Static (playback):** Renders pre-computed peaks, optionally sweeping with progress
 *
 * The canvas is sized larger than the dot to accommodate the outward extensions,
 * and must be positioned absolutely over the dot via the parent.
 */
export function RadialBlob({
    analyser,
    peaks,
    progress = 0,
    dotSize,
    reach = 24,
    active = false,
    color,
}: RadialBlobProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const smoothedRef = useRef<Float32Array | null>(null);
    const breathRef = useRef(0);

    // Resolve primary color from CSS variable
    const resolveColor = useCallback(() => {
        if (color) return color;
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary').trim();
        return raw ? `hsl(${raw})` : FALLBACK_PRIMARY;
    }, [color]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasSize = dotSize + reach * 2;
        canvas.width = canvasSize * dpr;
        canvas.height = canvasSize * dpr;
        canvas.style.width = `${canvasSize}px`;
        canvas.style.height = `${canvasSize}px`;
        ctx.scale(dpr, dpr);

        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const baseRadius = dotSize / 2;
        const resolvedColor = resolveColor();

        // Pre-smooth peak data so the blob shape is organic, not jagged
        const smoothedPeaks = peaks && peaks.length > 0
            ? smoothPeaks(peaks, PEAK_SMOOTH_PASSES)
            : null;

        // Initialize smoothed amplitude data
        if (!smoothedRef.current || smoothedRef.current.length !== NUM_POINTS) {
            smoothedRef.current = new Float32Array(NUM_POINTS);
        }

        // For live recording: frequency data buffer
        const frequencyData = analyser
            ? new Uint8Array(analyser.frequencyBinCount)
            : null;

        const draw = () => {
            ctx.clearRect(0, 0, canvasSize, canvasSize);

            // Breathing effect — slow sine wave on the base radius
            breathRef.current += BREATH_SPEED;
            const breathOffset = active ? Math.sin(breathRef.current) * BREATH_AMPLITUDE : 0;
            const radius = baseRadius + breathOffset;

            // Get amplitude data for each point
            const amplitudes = smoothedRef.current!;
            const smoothing = active ? SMOOTHING_ACTIVE : SMOOTHING_PASSIVE;

            if (analyser && frequencyData && active) {
                // Live mode: read frequency data
                analyser.getByteFrequencyData(frequencyData);
                const binStep = Math.max(1, Math.floor(frequencyData.length / NUM_POINTS));
                for (let i = 0; i < NUM_POINTS; i++) {
                    const binIndex = Math.min((i * binStep) % frequencyData.length, frequencyData.length - 1);
                    const target = (frequencyData[binIndex] / 255) * reach;
                    amplitudes[i] += (target - amplitudes[i]) * smoothing;
                }
            } else if (smoothedPeaks && smoothedPeaks.length > 0) {
                // Static/playback mode: map pre-smoothed peaks around the circle
                for (let i = 0; i < NUM_POINTS; i++) {
                    const t = i / NUM_POINTS;
                    // Interpolate between peak values for extra smoothness
                    const exactIndex = t * smoothedPeaks.length;
                    const idx0 = Math.floor(exactIndex) % smoothedPeaks.length;
                    const idx1 = (idx0 + 1) % smoothedPeaks.length;
                    const frac = exactIndex - Math.floor(exactIndex);
                    const peakVal = smoothedPeaks[idx0] * (1 - frac) + smoothedPeaks[idx1] * frac;

                    // During playback, only illuminate up to progress
                    const isIlluminated = progress > 0 ? t <= progress : true;
                    const target = peakVal * reach * (isIlluminated ? 1 : 0.25);

                    amplitudes[i] += (target - amplitudes[i]) * smoothing;
                }
            } else {
                // Idle: gentle ambient pulse
                for (let i = 0; i < NUM_POINTS; i++) {
                    const ambient = active
                        ? Math.sin(breathRef.current * 2 + (i / NUM_POINTS) * Math.PI * 4) * 3 + 3
                        : 0;
                    amplitudes[i] += (ambient - amplitudes[i]) * SMOOTHING_AMBIENT;
                }
            }

            // Draw the smooth blob path
            ctx.beginPath();

            const points: Array<{ x: number; y: number }> = [];
            for (let i = 0; i < NUM_POINTS; i++) {
                const angle = (i / NUM_POINTS) * Math.PI * 2 - Math.PI / 2;
                const r = radius + amplitudes[i];
                points.push({
                    x: centerX + Math.cos(angle) * r,
                    y: centerY + Math.sin(angle) * r,
                });
            }

            // Catmull-Rom to Bezier: smooth closed curve through all points
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < NUM_POINTS; i++) {
                const p0 = points[(i - 1 + NUM_POINTS) % NUM_POINTS];
                const p1 = points[i];
                const p2 = points[(i + 1) % NUM_POINTS];
                const p3 = points[(i + 2) % NUM_POINTS];

                const cp1x = p1.x + (p2.x - p0.x) / SPLINE_TENSION;
                const cp1y = p1.y + (p2.y - p0.y) / SPLINE_TENSION;
                const cp2x = p2.x - (p3.x - p1.x) / SPLINE_TENSION;
                const cp2y = p2.y - (p3.y - p1.y) / SPLINE_TENSION;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }

            ctx.closePath();

            // Fill with gradient — solid at center, fading outward
            const gradient = ctx.createRadialGradient(
                centerX, centerY, radius * 0.8,
                centerX, centerY, radius + reach,
            );
            gradient.addColorStop(0, withAlpha(resolvedColor, GRADIENT_INNER_ALPHA));
            gradient.addColorStop(1, withAlpha(resolvedColor, GRADIENT_OUTER_ALPHA));

            ctx.fillStyle = gradient;
            ctx.fill();

            // Subtle stroke on the outer edge
            ctx.strokeStyle = withAlpha(resolvedColor, STROKE_ALPHA);
            ctx.lineWidth = STROKE_WIDTH;
            ctx.stroke();

            animFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animFrameRef.current);
        };
    }, [analyser, peaks, progress, dotSize, reach, active, resolveColor]);

    const canvasSize = dotSize + reach * 2;

    return (
        <canvas
            ref={canvasRef}
            className="absolute pointer-events-none"
            style={{
                width: canvasSize,
                height: canvasSize,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%)`,
            }}
        />
    );
}
