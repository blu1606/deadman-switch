'use client';

import { FC, useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
    maxDuration?: number; // seconds
}

const VoiceRecorder: FC<VoiceRecorderProps> = ({
    onRecordingComplete,
    maxDuration = 120 // 2 minutes default
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        setError(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
                onRecordingComplete(blob, duration);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                setDuration(0);
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev >= maxDuration) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err: any) {
            console.error('Failed to start recording:', err);
            setError('Microphone access denied. Please allow microphone access.');
        }
    };

    const stopRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3">
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-300 hover:bg-red-500/30 hover:border-red-500 transition-colors"
                >
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    Record Audio
                </button>
            ) : (
                <div className="flex items-center gap-3 bg-dark-800 border border-red-500 rounded-lg px-4 py-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-mono text-red-400">{formatTime(duration)}</span>
                    <button
                        onClick={stopRecording}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                        Stop
                    </button>
                </div>
            )}

            {error && (
                <span className="text-xs text-red-400">{error}</span>
            )}
        </div>
    );
};

export default VoiceRecorder;
