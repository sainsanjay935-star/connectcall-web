"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';
import { Plus, User } from 'lucide-react';

interface StatusListProps {
    onStatusSelect: (statusGroup: any) => void;
}

export default function StatusList({ onStatusSelect }: StatusListProps) {
    const { token, user } = useAuth();
    const [statusGroups, setStatusGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const baseUrl = getApiBaseUrl();
                const response = await axios.get(`${baseUrl}/api/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatusGroups(response.data);
            } catch (err) {
                console.error('Fetch status error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchStatuses();
    }, [token]);

    const handleUploadClick = () => {
        // This will be handled by a file input in the parent or a modal
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const baseUrl = getApiBaseUrl();
                const uploadRes = await axios.post(`${baseUrl}/api/media/upload`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                await axios.post(`${baseUrl}/api/status`, {
                    mediaUrl: uploadRes.data.url,
                    type: file.type.startsWith('video') ? 'video' : 'image'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Refresh statuses
                window.location.reload(); 
            } catch (err) {
                console.error('Upload status error:', err);
            }
        };
        input.click();
    };

    if (loading) return <div className="p-4 text-center dark:text-[#8696a0]">Loading status...</div>;

    const myStatusGroup = statusGroups.find(g => g.user._id === user?.id);
    const otherStatusGroups = statusGroups.filter(g => g.user._id !== user?.id);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#111b21] overflow-y-auto custom-scrollbar">
            {/* My Status */}
            <div className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-premium" onClick={handleUploadClick}>
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-whatsapp-green p-0.5">
                        <div className="h-full w-full rounded-full overflow-hidden bg-[#dfe5e7]">
                            {user?.profilePhoto ? <img src={user.profilePhoto} className="h-full w-full object-cover" /> : <User size={24} className="m-auto mt-2 text-[#54656f]" />}
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-whatsapp-green rounded-full p-0.5 border-2 border-white dark:border-[#111b21]">
                        <Plus size={14} className="text-white" />
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-[15px] dark:text-[#e9edef]">My Status</h3>
                    <p className="text-xs text-[#667781] dark:text-[#8696a0]">Tap to add status update</p>
                </div>
            </div>

            <div className="bg-[#f0f2f5] dark:bg-[#111b21] px-4 py-3">
                <p className="text-[13px] text-whatsapp-green font-semibold uppercase tracking-wider">Recent Updates</p>
            </div>

            {otherStatusGroups.length > 0 ? (
                <div className="divide-y divide-[#f0f2f5] dark:divide-[#2a3942]">
                    {otherStatusGroups.map((group) => (
                        <div 
                            key={group.user._id} 
                            className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-premium"
                            onClick={() => onStatusSelect(group)}
                        >
                            <div className="h-12 w-12 rounded-full border-2 border-whatsapp-green p-0.5">
                                <div className="h-full w-full rounded-full overflow-hidden bg-[#dfe5e7]">
                                    {group.user.profilePhoto ? <img src={group.user.profilePhoto} className="h-full w-full object-cover" /> : <User size={24} className="m-auto mt-2 text-[#54656f]" />}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[15px] dark:text-[#e9edef]">{group.user.username}</h3>
                                <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                                    {new Date(group.items[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center">
                    <p className="text-sm text-[#667781] dark:text-[#8696a0]">No status updates yet</p>
                </div>
            )}
        </div>
    );
}
