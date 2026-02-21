"use client";

import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, MessageSquare, User, LogOut, Settings, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/utils/constants';
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
    const [showMenu, setShowMenu] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true); // Toggle search view
        try {
            const baseUrl = getApiBaseUrl();
            console.log('[Sidebar] Search Attempt:', { baseUrl, query });
            const response = await axios.get(`${baseUrl}/api/users/search?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[Sidebar] Search Results:', response.data);
            setSearchResults(response.data);
        } catch (err: any) {
            console.error('[Sidebar] Search Error:', err.response?.data || err.message);
        }
    };

    const handleResetData = async () => {
        if (!window.confirm('WARNING: This will permanently delete all your chats and messages to save storage. This action cannot be undone. Are you sure?')) {
            return;
        }

        setIsResetting(true);
        try {
            const baseUrl = getApiBaseUrl();
            await axios.post(`${baseUrl}/api/users/reset-data`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[Sidebar] Account data reset successful');
            window.location.reload(); // Refresh to clear all states and fetch empty lists
        } catch (err: any) {
            console.error('[Sidebar] Reset Error:', err.response?.data || err.message);
            alert('Failed to reset account data. Please try again.');
        } finally {
            setIsResetting(false);
            setShowMenu(false);
        }
    };

    const createChat = async (userId: string) => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await axios.post(`${baseUrl}/api/chats`,
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
                <div className="flex space-x-2 text-[#54656f] dark:text-[#aebac1]">
                    <MessageSquare size={24} className="cursor-pointer" />
                    <div className="relative">
                        <MoreVertical
                            size={24}
                            className="cursor-pointer hover:bg-[#d1d7db] dark:hover:bg-[#3b4a54] rounded-full p-0.5"
                            onClick={() => setShowMenu(!showMenu)}
                        />

                        {showMenu && (
                            <div className="absolute right-0 top-10 z-50 w-48 rounded-md bg-white py-2 shadow-xl dark:bg-[#233138]">
                                <button
                                    onClick={handleResetData}
                                    disabled={isResetting}
                                    className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm text-[#3b4a54] hover:bg-[#f5f6f6] disabled:opacity-50 dark:text-[#d1d7db] dark:hover:bg-[#182229]"
                                >
                                    <RotateCcw size={18} />
                                    <span>{isResetting ? 'Resetting...' : 'Reset Account'}</span>
                                </button>
                                <button
                                    onClick={logout}
                                    className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-[#f5f6f6] dark:hover:bg-[#182229]"
                                >
                                    <LogOut size={18} />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}
                    </div>
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
