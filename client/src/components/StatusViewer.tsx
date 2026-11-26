"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';

interface StatusViewerProps {
    statusGroup: any;
    onClose: () => void;
    onDeleted?: (statusId: string) => void;
}

export default function StatusViewer({ statusGroup, onClose, onDeleted }: StatusViewerProps) {
    const { user, token } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const items = statusGroup.items || [];
    const currentItem = items[currentIndex];
    const isOwnStatus = statusGroup.user?._id === user?.id;

    useEffect(() => {
        if (!currentItem?._id || !token || isOwnStatus) return;

        axios.post(
            `${getApiBaseUrl()}/api/status/view/${currentItem._id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => console.error('Status view tracking failed:', err));
    }, [currentItem?._id, token, isOwnStatus]);

    useEffect(() => {
        const duration = 5000; // 5 seconds per status
        const interval = 50; // update every 50ms
        const increment = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + increment;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex]);

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!currentItem?._id || !token) return;
        if (!window.confirm('Delete this status update?')) return;
        try {
            await axios.delete(`${getApiBaseUrl()}/api/status/${currentItem._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onDeleted?.(currentItem._id);
            onClose();
        } catch (err) {
            console.error('Delete status failed:', err);
        }
    };

    if (!currentItem) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
                {items.map((_: any, idx: number) => (
                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-50" 
                            style={{ 
                                width: idx === currentIndex ? `${progress}%` : (idx < currentIndex ? '100%' : '0%') 
                            }} 
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-white/20">
                        <img src={statusGroup.user.profilePhoto || '/default-avatar.png'} className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">{statusGroup.user.username}</h4>
                        <p className="text-[10px] opacity-70">{new Date(currentItem.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {isOwnStatus && (
                        <>
                            <span className="flex items-center space-x-1 text-xs bg-white/10 px-2.5 py-1 rounded-full">
                                <Eye size={14} />
                                <span>{currentItem.seenBy?.length || 0}</span>
                            </span>
                            <button onClick={handleDelete} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-premium" title="Delete status">
                                <Trash2 size={20} />
                            </button>
                        </>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-premium">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center relative">
                <button 
                    className="absolute left-4 p-4 z-20 opacity-0 hover:opacity-100 transition-opacity" 
                    onClick={handlePrev}
                >
                    <ChevronLeft size={40} />
                </button>

                {currentItem.type === 'video' ? (
                    <video 
                        src={currentItem.mediaUrl} 
                        autoPlay 
                        className="max-h-full max-w-full object-contain"
                        onEnded={handleNext}
                    />
                ) : (
                    <img src={currentItem.mediaUrl} className="max-h-full max-w-full object-contain" />
                )}

                {currentItem.caption && (
                    <div className="absolute bottom-10 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-lg">{currentItem.caption}</p>
                    </div>
                )}

                <button 
                    className="absolute right-4 p-4 z-20 opacity-0 hover:opacity-100 transition-opacity" 
                    onClick={handleNext}
                >
                    <ChevronRight size={40} />
                </button>
            </div>
        </div>
    );
}
