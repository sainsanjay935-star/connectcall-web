"use client";

import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, MessageSquare, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import ChatList from './ChatList';

interface SidebarProps {
    onChatSelect: (chat: any) => void;
    selectedChatId?: string;
}

export default function Sidebar({ onChatSelect, selectedChatId }: SidebarProps) {
    const { user, token, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const createChat = async (userId: string) => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`,
                { userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onChatSelect(response.data);
            setSearchQuery('');
            setSearchResults([]);
            setIsSearching(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-full flex-col bg-white dark:bg-[#111b21]">
            <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 dark:bg-[#202c33]">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-[#dfe5e7]">
                    {user?.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                            <User size={24} />
                        </div>
                    )}
                </div>
                <div className="flex space-x-4 text-[#54656f] dark:text-[#aebac1]">
                    <MessageSquare size={24} className="cursor-pointer" />
                    <MoreVertical size={24} className="cursor-pointer" />
                    <button onClick={logout} title="Logout" className="hover:text-red-500 transition">
                        <LogOut size={24} className="cursor-pointer" />
                    </button>
                </div>
            </header>

            <div className="p-2">
                <div className="relative flex items-center rounded-lg bg-[#f0f2f5] px-3 dark:bg-[#202c33]">
                    <Search size={18} className="text-[#54656f] dark:text-[#8696a0]" />
                    <input
                        type="text"
                        placeholder="Search users by ID or Name"
                        className="w-full bg-transparent p-2 text-sm text-[#3b4a54] outline-none dark:text-[#d1d7db]"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isSearching ? (
                    <div>
                        {searchResults.length > 0 ? (
                            searchResults.map((u) => (
                                <div
                                    key={u._id}
                                    className="flex cursor-pointer items-center space-x-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]"
                                    onClick={() => createChat(u._id)}
                                >
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#dfe5e7]">
                                        {u.profilePhoto ? (
                                            <img src={u.profilePhoto} alt={u.username} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden border-b border-[#f0f2f5] pb-3 dark:border-[#2a3942]">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[#111b21] dark:text-[#e9edef]">{u.username}</h3>
                                            <span className="text-xs text-whatsapp-green">{u.uniqueId}</span>
                                        </div>
                                        <p className="truncate text-sm text-[#667781] dark:text-[#8696a0]">{u.statusMessage}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-[#667781] dark:text-[#8696a0]">No users found</p>
                        )}
                    </div>
                ) : (
                    <ChatList onChatSelect={onChatSelect} selectedChatId={selectedChatId} />
                )}
            </div>
        </div>
    );
}
