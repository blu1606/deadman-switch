'use client';

import { FC, useState, useRef } from 'react';
import { VaultItem, VaultItemType, BUNDLE_LIMITS } from '@/types/vaultBundle';
import { fileToVaultItem, textToVaultItem, getItemIcon, formatFileSize } from '@/utils/vaultBundle';
import VoiceRecorder from './VoiceRecorder';

interface VaultContentEditorProps {
    items: VaultItem[];
    onItemsChange: (items: VaultItem[]) => void;
    maxItems?: number;
    readOnly?: boolean;
}

const VaultContentEditor: FC<VaultContentEditorProps> = ({
    items,
    onItemsChange,
    maxItems = BUNDLE_LIMITS.maxItems,
    readOnly = false
}) => {
    const [isAddingText, setIsAddingText] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [textName, setTextName] = useState('');
    const [textContent, setTextContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalSize = items.reduce((sum, i) => sum + i.size, 0);
    const canAddMore = !readOnly && items.length < maxItems && totalSize < BUNDLE_LIMITS.maxTotalSize;

    const handleAddText = () => {
        if (!textContent.trim()) return;

        const name = textName.trim() || 'Note';
        const item = textToVaultItem(name, textContent);
        onItemsChange([...items, item]);

        setTextName('');
        setTextContent('');
        setIsAddingText(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setError(null);

        for (const file of Array.from(files)) {
            if (items.length >= maxItems) {
                setError(`Maximum ${maxItems} items allowed`);
                break;
            }

            try {
                const item = await fileToVaultItem(file);
                onItemsChange([...items, item]);
            } catch (err: any) {
                setError(err.message);
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRecordingComplete = async (blob: Blob, durationSeconds: number) => {
        setIsRecording(false);
        setError(null);

        try {
            const file = new File([blob], `Recording_${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
            const item = await fileToVaultItem(file);
            onItemsChange([...items, item]);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRemove = (id: string) => {
        onItemsChange(items.filter(i => i.id !== id));
    };

    const handleDownload = (item: VaultItem) => {
        if (!item.data) return;

        let content: Blob;
        if (item.type === 'text') {
            // Text is base64 encoded by our utils
            try {
                const text = decodeURIComponent(escape(atob(item.data)));
                content = new Blob([text], { type: 'text/plain' });
            } catch {
                content = new Blob([item.data], { type: 'text/plain' });
            }
        } else {
            // Binary base64
            const byteCharacters = atob(item.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            content = new Blob([byteArray], { type: item.mimeType });
        }

        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-dark-300 uppercase tracking-wider">
                    Vault Contents
                </h3>
                <span className="text-xs text-dark-500">
                    {items.length}/{maxItems} items • {formatFileSize(totalSize)}
                </span>
            </div>

            {/* Items List */}
            {items.length > 0 && (
                <div className="space-y-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 bg-dark-800 rounded-lg p-3 border border-dark-700"
                        >
                            <span className="text-xl">{getItemIcon(item.type)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                                <p className="text-xs text-dark-500">
                                    {item.type} • {formatFileSize(item.size)}
                                </p>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="text-dark-500 hover:text-red-400 transition-colors p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            {readOnly && (
                                <button
                                    onClick={() => handleDownload(item)}
                                    className="text-primary-400 hover:text-primary-300 transition-colors p-1"
                                    title="Download"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {items.length === 0 && !isAddingText && !isRecording && (
                <div className="text-center py-8 border-2 border-dashed border-dark-700 rounded-lg">
                    <p className="text-dark-500 text-sm">No content added yet</p>
                    {!readOnly && <p className="text-dark-600 text-xs mt-1">Add text, files, or recordings below</p>}
                </div>
            )}

            {/* Text Editor */}
            {isAddingText && (
                <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-3">
                    <input
                        type="text"
                        placeholder="Note title"
                        value={textName}
                        onChange={(e) => setTextName(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm"
                        maxLength={50}
                    />
                    <textarea
                        placeholder="Write your message..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
                        rows={4}
                        maxLength={BUNDLE_LIMITS.maxTextLength}
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setIsAddingText(false)}
                            className="px-3 py-1.5 text-sm text-dark-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddText}
                            disabled={!textContent.trim()}
                            className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Add Note
                        </button>
                    </div>
                </div>
            )}

            {/* Voice Recorder */}
            {isRecording && (
                <div className="bg-dark-800 rounded-lg p-4 border border-red-500/50 space-y-3">
                    <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
                    <button
                        onClick={() => setIsRecording(false)}
                        className="text-xs text-dark-500 hover:text-dark-300"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {error}
                </div>
            )}

            {/* Add Buttons */}
            {canAddMore && !isAddingText && !isRecording && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setIsAddingText(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-300 hover:border-primary-500/50 hover:text-white transition-colors"
                    >
                        <span>📝</span> Add Text
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-300 hover:border-primary-500/50 hover:text-white transition-colors"
                    >
                        <span>📁</span> Add File
                    </button>
                    <button
                        onClick={() => setIsRecording(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-300 hover:border-red-500/50 hover:text-white transition-colors"
                    >
                        <span>🎤</span> Record Audio
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="*/*"
                    />
                </div>
            )}

            {/* Limit Warning */}
            {!canAddMore && (
                <p className="text-xs text-dark-500 text-center">
                    Maximum capacity reached
                </p>
            )}
        </div>
    );
};

export default VaultContentEditor;
