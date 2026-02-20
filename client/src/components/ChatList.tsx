"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';
import { User } from 'lucide-react';

interface ChatListProps {
    onChatSelect: (chat: any) => void;
    selectedChatId?: string;
}

export default function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {
    const { token, user } = useAuth();
    const { socket } = useSocket();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChats = async () => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await axios.get(`${baseUrl}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChats(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchChats();
    }, [token]);

    useEffect(() => {
        if (!socket) return;

        const handleStatusChange = ({ userId, isOnline, lastSeen }: any) => {
            setChats(prevChats => prevChats.map(chat => {
                const updatedParticipants = chat.participants.map((p: any) => {
                    if (p._id === userId) {
                        return { ...p, isOnline, lastSeen };
                    }
                    return p;
                });
                return { ...chat, participants: updatedParticipants };
            }));
        };

        socket.on('user-status-change', handleStatusChange);

        return () => {
            socket.off('user-status-change', handleStatusChange);
        };
    }, [socket]);

    if (loading) return <div className="p-4 text-center dark:text-[#8696a0]">Loading chats...</div>;

    return (
        <div className="flex flex-col">
            {chats.map((chat) => {
                const otherUser = chat.participants.find((p: any) => p._id !== user?.id);
                const isActive = selectedChatId === chat._id;
                const isOnline = otherUser?.isOnline;

                return (
                    <div
                        key={chat._id}
                        className={`flex cursor-pointer items-center space-x-3 px-4 py-3 transition ${isActive ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]'
                            }`}
                        onClick={() => onChatSelect(chat)}
                    >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#dfe5e7]">
                            {otherUser?.profilePhoto ? (
                                <img src={otherUser.profilePhoto} alt={otherUser.username} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                                    <User size={24} />
                                </div>
                            )}
                            {isOnline && (
                                <div className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#25d366] dark:border-[#111b21]"></div>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden border-b border-[#f0f2f5] pb-3 dark:border-[#2a3942]">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-[#111b21] dark:text-[#e9edef]">{otherUser?.username}</h3>
                                <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                                    {chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                            <p className="truncate text-sm text-[#667781] dark:text-[#8696a0]">
                                {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
