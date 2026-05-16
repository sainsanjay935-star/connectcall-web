"use client";

import React, { useState, useRef } from 'react';
import { X, Camera, Check, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';

interface ProfileModalProps {
    onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
    const { user, token, setUser } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
    const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsLoading(true);
            const baseUrl = getApiBaseUrl();
            const uploadRes = await axios.post(`${baseUrl}/api/media/upload`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfilePhoto(uploadRes.data.url);
        } catch (err) {
            console.error('Photo upload failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const baseUrl = getApiBaseUrl();
            const response = await axios.put(`${baseUrl}/api/users/update-profile`, {
                username,
                statusMessage,
                profilePhoto
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update user context with new data
            if (setUser) {
                setUser({ ...user, ...response.data });
            }
            onClose();
        } catch (err) {
            console.error('Update failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5] dark:border-[#2a3942]">
                    <h2 className="text-lg font-semibold dark:text-[#e9edef]">Profile Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[#54656f] dark:text-[#aebac1]">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-full overflow-hidden bg-[#dfe5e7] border-4 border-whatsapp-green/20 shadow-lg">
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                                        <User size={60} />
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 p-2.5 bg-whatsapp-green text-white rounded-full shadow-lg hover:bg-whatsapp-teal transition-all transform active:scale-90"
                            >
                                <Camera size={20} />
                            </button>
                            <input type="file" hidden ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                        </div>
                        <p className="mt-3 text-xs text-[#667781] dark:text-[#8696a0]">Tap camera to change photo</p>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-whatsapp-green uppercase tracking-wider">Your Name</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-3 rounded-xl outline-none dark:text-[#e9edef] border-b-2 border-transparent focus:border-whatsapp-green transition-premium"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-whatsapp-green uppercase tracking-wider">About</label>
                            <input 
                                type="text" 
                                value={statusMessage} 
                                onChange={(e) => setStatusMessage(e.target.value)}
                                className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-3 rounded-xl outline-none dark:text-[#e9edef] border-b-2 border-transparent focus:border-whatsapp-green transition-premium"
                                placeholder="Hey there! I am using ConnectCall."
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-whatsapp-green text-white font-bold rounded-xl shadow-lg hover:bg-whatsapp-teal transition-premium disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check size={20} />}
                        <span>Save Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
