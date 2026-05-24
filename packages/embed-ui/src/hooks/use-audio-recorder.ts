import { useState, useRef, useEffect, useCallback } from 'react';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export interface UseAudioRecorderProps {
    onRecordingComplete?: (audioBlob: Blob) => void;
    onRecordingStateChange?: (isRecording: boolean) => void;
    onError?: (error: string) => void;
}

export interface AudioRecorderState {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    cancelRecording: () => void;
    analyserNode: AnalyserNode | null;
}

export function useAudioRecorder({
    onRecordingComplete,
    onRecordingStateChange,
    onError,
}: UseAudioRecorderProps = {}): AudioRecorderState {
    const [isRecording, setIsRecording] = useState(false);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handleStartRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 1. Setup MediaRecorder for capturing audio
            // Prefer audio/webm as it's our standard format
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
                ? 'audio/webm' 
                : 'audio/mp4'; // Safari fallback for older versions
            
            console.log(`[AudioRecorder] Using mimeType: ${mimeType}`);
            
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                onRecordingComplete?.(blob);
                chunksRef.current = [];

                // Cleanup AudioContext on stop
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                    setAnalyserNode(null);
                }
            };

            // 2. Setup AudioContext for visualization
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; // Adjust for resolution vs performance
            setAnalyserNode(analyser);

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            // Note: Do NOT connect to destination (speakers) to avoid feedback loop

            recorder.start();
            setIsRecording(true);
            onRecordingStateChange?.(true);
        } catch (err) {
            console.error('[AudioRecorder] Error starting recording:', err);
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                onError?.('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
            } else if (err instanceof DOMException && err.name === 'NotFoundError') {
                onError?.('No microphone found. Please connect a microphone and try again.');
            } else {
                onError?.('Could not start recording. Please check your microphone and try again.');
            }
        }
    }, [onRecordingComplete, onRecordingStateChange, onError]);

    const handleStopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            onRecordingStateChange?.(false);

            // Stop all tracks to release microphone
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    }, [onRecordingStateChange]);

    const handleCancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = null; // Prevent onRecordingComplete from being called
            mediaRecorderRef.current.stop();

            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            // Cleanup AudioContext
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
                setAnalyserNode(null);
            }

            chunksRef.current = [];
            setIsRecording(false);
            onRecordingStateChange?.(false);
        }
    }, [onRecordingStateChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        isRecording,
        startRecording: handleStartRecording,
        stopRecording: handleStopRecording,
        cancelRecording: handleCancelRecording,
        analyserNode,
    };
}
