import React from 'react';
import { X, Play } from 'lucide-react';
import { APP_CONFIG } from '../utils/appConfig';

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0A0A0A] animate-scale-in">

                {/* Header/Close Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white/10 transition-all group"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Video Player */}
                <div className="w-full h-full relative">
                    <iframe
                        src={APP_CONFIG.DEMO_VIDEO_URL}
                        title="Demo Video"
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Footer Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                            <Play className="w-4 h-4 text-amber-500" fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-white font-serif font-medium text-sm md:text-base">System Walkthrough</h4>
                            <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-[0.2em]">Learning the Neural Interface</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoModal;
