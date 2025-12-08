'use client';

import { motion } from 'framer-motion';

interface AssetCardProps {
    fileName: string;
    fileType: string;
    children?: React.ReactNode;
    onDownload?: () => void;
    index?: number;
}

const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('text/')) return '📝';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📁';
};

const getFileTypeName = (fileType: string): string => {
    if (fileType.startsWith('image/')) return 'Image';
    if (fileType.startsWith('video/')) return 'Video';
    if (fileType.startsWith('audio/')) return 'Audio';
    if (fileType.startsWith('text/')) return 'Text';
    if (fileType.includes('pdf')) return 'PDF Document';
    return 'File';
};

export default function AssetCard({
    fileName,
    fileType,
    children,
    onDownload,
    index = 0,
}: AssetCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: index * 0.15,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="group relative overflow-hidden rounded-2xl"
        >
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-dark-700/80 to-dark-800/90 backdrop-blur-xl border border-dark-500/50 rounded-2xl" />

            {/* Glow Effect on Hover */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-secondary-500/0 rounded-2xl"
                whileHover={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                }}
            />

            {/* Content */}
            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="text-3xl"
                            animate={{
                                rotate: [0, -10, 10, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                delay: index * 0.15 + 0.5,
                                duration: 0.5,
                            }}
                        >
                            {getFileIcon(fileType)}
                        </motion.div>
                        <div>
                            <h3 className="font-semibold text-white truncate max-w-[200px]">
                                {fileName}
                            </h3>
                            <p className="text-xs text-dark-400 uppercase tracking-wider">
                                {getFileTypeName(fileType)}
                            </p>
                        </div>
                    </div>

                    {/* Download Button */}
                    {onDownload && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onDownload}
                            className="p-2 rounded-lg bg-dark-600/50 hover:bg-primary-500/20 text-dark-300 hover:text-primary-400 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </motion.button>
                    )}
                </div>

                {/* Preview Content */}
                {children && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.15 + 0.3 }}
                        className="bg-dark-900/50 rounded-xl overflow-hidden border border-dark-600/50"
                    >
                        {children}
                    </motion.div>
                )}
            </div>

            {/* Corner Decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/20 to-transparent rotate-45 translate-x-8 -translate-y-8" />
            </div>
        </motion.div>
    );
}
