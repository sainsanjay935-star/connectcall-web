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

        const handleNewMessage = (newMessage: any) => {
            // Play notification sound
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'); // WhatsApp-like ping
            audio.play().catch(e => console.log('Audio play failed:', e));

            setChats(prevChats => {
                const existingChatIndex = prevChats.findIndex(c => c._id === newMessage.chat._id);
                if (existingChatIndex !== -1) {
                    const updatedChats = [...prevChats];
                    const chat = updatedChats[existingChatIndex];
                    updatedChats[existingChatIndex] = {
                        ...chat,
                        lastMessage: newMessage,
                        unreadCount: (chat.unreadCount || 0) + 1
                    };
                    return updatedChats;
                }
                return prevChats;
            });
        };

        socket.on('user-status-change', handleStatusChange);
        socket.on('message received', handleNewMessage);

        return () => {
            socket.off('user-status-change', handleStatusChange);
            socket.off('message received', handleNewMessage);
        };
    }, [socket]);

    if (loading) return <div className="p-4 text-center dark:text-[#8696a0]">Loading chats...</div>;

    return (
        <div className="flex flex-col divide-y divide-[#f0f2f5] dark:divide-[#2a3942]">
            {chats.map((chat) => {
                const otherUser = chat.participants.find((p: any) => p._id !== user?.id);
                const isActive = selectedChatId === chat._id;
                const isOnline = otherUser?.isOnline;

                return (
                    <div
                        key={chat._id}
                        className={`flex cursor-pointer items-center space-x-3 px-4 py-3 transition-colors active:bg-[#ebebeb] dark:active:bg-[#182229] ${isActive ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
                            }`}
                        onClick={() => onChatSelect(chat)}
                    >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#dfe5e7] border border-black/5">
                            {otherUser?.profilePhoto ? (
                                <img src={otherUser.profilePhoto} alt={otherUser.username} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                                    <User size={24} />
                                </div>
                            )}
                            {isOnline && (
                                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#25d366] dark:border-[#111b21]"></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-[15px] text-[#111b21] dark:text-[#e9edef] truncate mr-2">
                                    {otherUser?.username || 'Unknown User'}
                                </h3>
                                <span className="text-[11px] text-[#667781] dark:text-[#8696a0] shrink-0">
                                    {chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                                <p className="truncate text-[13px] text-[#667781] dark:text-[#8696a0] flex-1">
                                    {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                                </p>
                                {chat.unreadCount > 0 && (
                                    <span className="mr-4 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-[#25d366] text-[11px] font-bold text-white shrink-0 shadow-sm">
                                        {chat.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
