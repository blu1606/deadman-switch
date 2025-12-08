'use client';

import { FC, useState, useCallback, useRef } from 'react';
import { VaultFormData } from '@/app/create/page';
import {
    createPasswordProtectedVaultPackage
} from '@/utils/crypto';

interface Props {
    formData: VaultFormData;
    updateFormData: (updates: Partial<VaultFormData>) => void;
    onNext: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

type ContentType = 'file' | 'text' | 'voice' | 'video';

const StepUploadSecret: FC<Props> = ({ formData, updateFormData, onNext }) => {
    const [activeTab, setActiveTab] = useState<ContentType>('file');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [encryptionMode, setEncryptionMode] = useState<'wallet' | 'password'>(formData.encryptionMode || 'wallet');

    const [isDragging, setIsDragging] = useState(false);
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contentReady, setContentReady] = useState(false);

    // Text content
    const [textContent, setTextContent] = useState('');

    // Voice recording
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Video recording
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoRecorderRef = useRef<MediaRecorder | null>(null);
    const videoChunksRef = useRef<Blob[]>([]);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);

    const prepareAndEncrypt = useCallback(async () => {
        let fileToProcess: File | null = null;

        if (activeTab === 'file') {
            fileToProcess = formData.file;
        } else if (activeTab === 'text') {
            if (!textContent.trim()) { setError('Please enter some text.'); return; }
            const blob = new Blob([textContent], { type: 'text/plain' });
            fileToProcess = new File([blob], 'secret-message.txt', { type: 'text/plain' });
        } else if (activeTab === 'voice') {
            if (!audioBlob) { setError('Please record a message.'); return; }
            fileToProcess = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        } else if (activeTab === 'video') {
            if (!videoBlob) { setError('Please record a video.'); return; }
            fileToProcess = new File([videoBlob], 'video-message.webm', { type: 'video/webm' });
        }

        if (!fileToProcess) {
            setError('Please select/create content first.');
            return;
        }

        setError(null);

        if (encryptionMode === 'wallet') {
            // Wallet mode: store file for later encryption (after recipient is set)
            updateFormData({
                file: fileToProcess,
                encryptionMode: 'wallet',
                encryptedBlob: null, // Will be encrypted in StepConfirm
                aesKeyBase64: 'wallet-protected',
            });
            setContentReady(true);
        } else {
            // Password mode: encrypt now
            if (!password) {
                setError('Please enter a password.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }

            setIsEncrypting(true);
            try {
                const { blob } = await createPasswordProtectedVaultPackage(fileToProcess, password);
                updateFormData({
                    file: fileToProcess,
                    encryptedBlob: blob,
                    encryptionMode: 'password',
                    password: password,
                    aesKeyBase64: 'password-protected',
                });
                setContentReady(true);
            } catch (err) {
                console.error('Encryption failed:', err);
                setError('Failed to encrypt content.');
            } finally {
                setIsEncrypting(false);
            }
        }
    }, [activeTab, formData.file, textContent, audioBlob, videoBlob, encryptionMode, password, confirmPassword, updateFormData]);

    // File handling
    const handleFile = useCallback(async (file: File) => {
        setError(null);
        if (file.size > MAX_FILE_SIZE) {
            setError('File too large. Maximum size is 50MB.');
            return;
        }
        updateFormData({ file });
    }, [updateFormData]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // Voice recording
    const startVoiceRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch { setError('Could not access microphone.'); }
    }, []);

    const stopVoiceRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // Video recording
    const startVideoRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
            const mediaRecorder = new MediaRecorder(stream);
            videoRecorderRef.current = mediaRecorder;
            videoChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => videoChunksRef.current.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
                setVideoBlob(blob);
                setVideoUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
                if (videoRef.current) videoRef.current.srcObject = null;
            };
            mediaRecorder.start();
            setIsVideoRecording(true);
        } catch { setError('Could not access camera.'); }
    }, []);

    const stopVideoRecording = useCallback(() => {
        if (videoRecorderRef.current && isVideoRecording) {
            videoRecorderRef.current.stop();
            setIsVideoRecording(false);
        }
    }, [isVideoRecording]);

    const tabs = [
        { id: 'file' as ContentType, label: '📁 File' },
        { id: 'text' as ContentType, label: '📝 Text' },
        { id: 'voice' as ContentType, label: '🎤 Voice' },
        { id: 'video' as ContentType, label: '🎥 Video' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Upload & Protect Secret</h2>
                <p className="text-dark-400 text-sm">
                    Your secret is encrypted locally. We never see your data.
                </p>
            </div>

            {/* Encryption Mode Toggle */}
            {!contentReady && (
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700">
                    <h3 className="font-medium text-white mb-3">🔒 Encryption Mode</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setEncryptionMode('wallet')}
                            className={`p-3 rounded-lg border text-left transition-all ${encryptionMode === 'wallet'
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-dark-600 hover:border-dark-500'
                                }`}
                        >
                            <div className="font-medium">🔑 Wallet Mode</div>
                            <div className="text-xs text-dark-400 mt-1">
                                No password needed. Only recipient wallet can decrypt.
                            </div>
                        </button>
                        <button
                            onClick={() => setEncryptionMode('password')}
                            className={`p-3 rounded-lg border text-left transition-all ${encryptionMode === 'password'
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-dark-600 hover:border-dark-500'
                                }`}
                        >
                            <div className="font-medium">🔐 Password Mode</div>
                            <div className="text-xs text-dark-400 mt-1">
                                Set a password. Share with recipient separately.
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Content Type Tabs */}
            {!contentReady && (
                <div className="flex gap-2 p-1 bg-dark-800 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setError(null);
                            }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Areas */}
            {!contentReady && (
                <div className="min-h-[200px]">
                    {activeTab === 'file' && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 hover:border-dark-500'}`}
                        >
                            {formData.file ? (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 mx-auto bg-primary-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">📄</span>
                                    </div>
                                    <p className="text-white">{formData.file.name}</p>
                                    <button onClick={() => updateFormData({ file: null })} className="text-sm text-red-400 hover:underline">Remove</button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-dark-300 mb-2">Drag & drop content</p>
                                    <label htmlFor="file-upload" className="btn-secondary inline-block cursor-pointer">Choose File</label>
                                    <input type="file" onChange={handleFileInput} className="hidden" id="file-upload" />
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="Enter secret message..."
                            className="w-full h-40 bg-dark-900 border border-dark-600 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    )}

                    {activeTab === 'voice' && (
                        <div className="bg-dark-800 rounded-xl p-6 text-center">
                            {audioUrl ? (
                                <div className="space-y-4">
                                    <div className="text-4xl mb-2">🎤</div>
                                    <audio src={audioUrl} controls className="mx-auto w-full max-w-sm" />
                                    <p className="text-xs text-dark-400">Your voice message is ready</p>
                                    <button onClick={() => { setAudioBlob(null); setAudioUrl(null); }} className="btn-secondary">
                                        🔄 Re-record
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Animated Recording Button */}
                                    <button
                                        onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                                        className={`relative w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${isRecording
                                                ? 'bg-red-500 shadow-lg shadow-red-500/50'
                                                : 'bg-gradient-to-br from-primary-500 to-secondary-500 hover:shadow-lg hover:shadow-primary-500/30'
                                            }`}
                                    >
                                        {isRecording ? (
                                            <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
                                        ) : (
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                            </svg>
                                        )}
                                        {/* Pulse rings when recording */}
                                        {isRecording && (
                                            <>
                                                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                                                <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-20" style={{ animationDelay: '0.5s' }} />
                                            </>
                                        )}
                                    </button>

                                    {/* Visualizer bars */}
                                    <div className="h-8 flex items-center justify-center gap-0.5 mx-auto max-w-xs">
                                        {[...Array(32)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-1 rounded-full transition-all duration-150 ${isRecording
                                                        ? 'bg-red-400/80 animate-pulse'
                                                        : 'bg-dark-600 h-1'
                                                    }`}
                                                style={isRecording ? {
                                                    height: `${12 + Math.random() * 20}px`,
                                                    animationDelay: `${i * 0.03}s`,
                                                } : { height: '4px' }}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-sm text-dark-400">
                                        {isRecording ? (
                                            <span className="text-red-400 font-medium">● Recording... Click to stop</span>
                                        ) : (
                                            'Click to record your voice message'
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'video' && (
                        <div className="bg-dark-800 rounded-xl p-4 text-center">
                            <video ref={videoRef} className={`w-full rounded-lg bg-black ${videoUrl || isVideoRecording ? '' : 'hidden'}`} src={videoUrl || undefined} controls={!!videoUrl} muted={isVideoRecording} />
                            {!videoUrl && !isVideoRecording && <div className="aspect-video bg-dark-900 rounded-lg flex items-center justify-center text-dark-500">Preview</div>}
                            <div className="mt-4">
                                {videoUrl ? (
                                    <button onClick={() => { setVideoBlob(null); setVideoUrl(null); }} className="btn-secondary">Re-record</button>
                                ) : (
                                    <button onClick={isVideoRecording ? stopVideoRecording : startVideoRecording} className={`w-full py-2 rounded-lg ${isVideoRecording ? 'bg-red-500' : 'btn-primary'}`}>
                                        {isVideoRecording ? 'Stop' : 'Start Camera'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Password Input (only for password mode) */}
            {!contentReady && encryptionMode === 'password' && (
                <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 space-y-4">
                    <h3 className="font-medium text-white">🔐 Set Vault Password</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs text-dark-400 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-white"
                                placeholder="********"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-dark-400 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-white"
                                placeholder="********"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-yellow-500">
                        ⚠️ You must share this password with your recipient separately.
                    </p>
                </div>
            )}

            {/* Action Button */}
            {!contentReady ? (
                <button
                    onClick={prepareAndEncrypt}
                    disabled={isEncrypting}
                    className="btn-primary w-full py-3 text-lg font-bold shadow-lg shadow-primary-500/20"
                >
                    {isEncrypting ? 'Encrypting...' : encryptionMode === 'wallet' ? '✓ Continue' : '🔒 Encrypt & Continue'}
                </button>
            ) : (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                    </div>
                    <h3 className="text-green-400 font-bold text-lg mb-2">Content Ready!</h3>
                    <p className="text-dark-300 text-sm mb-2">
                        {encryptionMode === 'wallet'
                            ? 'File will be encrypted with recipient wallet in next step.'
                            : 'Your vault is encrypted with your password.'}
                    </p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={onNext}
                    disabled={!contentReady}
                    className={`btn-primary ${!contentReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Next: Set Recipient →
                </button>
            </div>
        </div>
    );
};

export default StepUploadSecret;
