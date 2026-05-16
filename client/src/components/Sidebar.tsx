"use client";

import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, MessageSquare, User, LogOut, Settings, RotateCcw, CircleDashed } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';
import ChatList from './ChatList';
import StatusList from './StatusList';
import StatusViewer from './StatusViewer';
import ProfileModal from './ProfileModal';
import { CircleDashed } from 'lucide-react';

interface SidebarProps {
    onChatSelect: (chat: any) => void;
    selectedChatId?: string;
}

export default function Sidebar({ onChatSelect, selectedChatId }: SidebarProps) {
    const { user, token, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'chats' | 'status'>('chats');
    const [selectedStatusGroup, setSelectedStatusGroup] = useState<any>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        const fetchSuggested = async () => {
            if (!token) return;
            try {
                const baseUrl = getApiBaseUrl();
                const response = await axios.get(`${baseUrl}/api/users/suggested`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuggestedUsers(response.data);
            } catch (err) {
                console.error('[Sidebar] Suggested Error:', err);
            }
        };
        fetchSuggested();
    }, [token]);

    // Debounced search logic
    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setSearchResults([]);
            setIsSearching(false);
            setIsLoading(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            setIsLoading(true);
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
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, token]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
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
        <div className="flex h-full flex-col bg-white dark:bg-[#111b21] overflow-hidden">
            <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 dark:bg-[#202c33] border-b border-[#d1d7db] dark:border-[#2a3942] shrink-0">
                <div 
                    className="h-10 w-10 overflow-hidden rounded-full bg-[#dfe5e7] border border-black/5 cursor-pointer hover:opacity-80 transition-premium"
                    onClick={() => setShowProfileModal(true)}
                >
                    {user?.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                            <User size={24} />
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-3 text-[#54656f] dark:text-[#aebac1]">
                    <CircleDashed 
                        size={22} 
                        className={`cursor-pointer transition-premium ${activeTab === 'status' ? 'text-whatsapp-green' : 'hover:text-[#128c7e] dark:hover:text-white'}`} 
                        onClick={() => setActiveTab(activeTab === 'status' ? 'chats' : 'status')}
                    />
                    <MessageSquare 
                        size={22} 
                        className={`cursor-pointer transition-premium ${activeTab === 'chats' ? 'text-whatsapp-green' : 'hover:text-[#128c7e] dark:hover:text-white'}`} 
                        onClick={() => setActiveTab('chats')}
                    />
                    <div className="relative">
                        <MoreVertical
                            size={20}
                            className="cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-1 transition-premium"
                            onClick={() => setShowMenu(!showMenu)}
                        />

                        {showMenu && (
                            <div className="absolute right-0 top-10 z-[60] w-52 rounded-md bg-white py-2 shadow-2xl dark:bg-[#233138] border border-black/5 dark:border-white/5">
                                 <button
                                    onClick={() => { setShowProfileModal(true); setShowMenu(false); }}
                                    className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm text-[#3b4a54] hover:bg-[#f5f6f6] dark:text-[#d1d7db] dark:hover:bg-[#182229] transition-colors"
                                >
                                    <User size={18} />
                                    <span>Profile</span>
                                </button>
                                <button
                                    onClick={handleResetData}
                                    disabled={isResetting}
                                    className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm text-[#3b4a54] hover:bg-[#f5f6f6] disabled:opacity-50 dark:text-[#d1d7db] dark:hover:bg-[#182229] transition-colors"
                                >
                                    <RotateCcw size={18} />
                                    <span>{isResetting ? 'Resetting...' : 'Reset Account'}</span>
                                </button>
                                <button
                                    onClick={logout}
                                    className="flex w-full items-center space-x-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-[#f5f6f6] dark:hover:bg-[#182229] transition-colors"
                                >
                                    <LogOut size={18} />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="p-2 shrink-0 border-b border-[#f0f2f5] dark:border-[#2a3942]">
                <div className="relative flex items-center rounded-lg bg-[#f0f2f5] px-3 dark:bg-[#202c33] transition-premium focus-within:bg-white dark:focus-within:bg-[#2a3942] focus-within:shadow-sm group">
                    <Search size={18} className="text-[#54656f] dark:text-[#8696a0] shrink-0 group-focus-within:text-whatsapp-green transition-premium" />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        className="w-full bg-transparent p-2 text-[14px] text-[#3b4a54] outline-none dark:text-[#d1d7db] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {isSearching ? (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#2a3942]">
                        {/* ... search results mapping ... */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-whatsapp-green border-t-transparent mb-2"></div>
                                <p className="text-sm text-[#667781] dark:text-[#8696a0]">Searching...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((u) => (
                                <div
                                    key={u._id}
                                    className="flex cursor-pointer items-center space-x-3 px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] active:bg-[#ebebeb] dark:active:bg-[#182229] transition-colors"
                                    onClick={() => createChat(u._id)}
                                >
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#dfe5e7] border border-black/5">
                                        {u.profilePhoto ? (
                                            <img src={u.profilePhoto} alt={u.username} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[15px] text-[#111b21] dark:text-[#e9edef] truncate">{u.username}</h3>
                                            <span className="text-[10px] bg-whatsapp-light dark:bg-whatsapp-dark text-whatsapp-green px-1.5 py-0.5 rounded ml-2 shrink-0">{u.uniqueId}</span>
                                        </div>
                                        <p className="truncate text-[13px] text-[#667781] dark:text-[#8696a0] mt-0.5">{u.statusMessage || 'Hey there! I am using ConnectCall.'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <p className="text-sm text-[#667781] dark:text-[#8696a0]">No users found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'status' ? (
                    <StatusList onStatusSelect={(group) => setSelectedStatusGroup(group)} />
                ) : (
                    <ChatList
                        onChatSelect={onChatSelect}
                        selectedChatId={selectedChatId}
                        emptyState={
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <p className="text-sm font-semibold text-[#111b21] dark:text-[#e9edef] mb-4">Start a conversation</p>

                                {suggestedUsers.length > 0 && (
                                    <div className="w-full space-y-2 mt-4">
                                        <p className="text-[11px] uppercase tracking-widest text-[#667781] dark:text-[#8696a0] font-bold text-left px-2 mb-2">Suggested Users</p>
                                        <div className="space-y-1">
                                            {suggestedUsers.map(u => (
                                                <div
                                                    key={u._id}
                                                    onClick={() => createChat(u._id)}
                                                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer transition-colors"
                                                >
                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#dfe5e7]">
                                                        {u.profilePhoto ? <img src={u.profilePhoto} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[#54656f]"><User size={20} /></div>}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-medium dark:text-[#e9edef]">{u.username}</p>
                                                        <p className="text-[10px] text-whatsapp-green font-bold">{u.uniqueId}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-[#f0f2f5] dark:border-[#2a3942] w-full">
                                    <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                                        Use the search bar above to look for users by their <span className="font-bold text-whatsapp-green">WhatsApp ID</span> or name.
                                    </p>
                                </div>
                            </div>
                        }
                    />
                )}
            </div>

            {selectedStatusGroup && (
                <StatusViewer 
                    statusGroup={selectedStatusGroup} 
                    onClose={() => setSelectedStatusGroup(null)} 
                />
            )}
            {showProfileModal && (
                <ProfileModal onClose={() => setShowProfileModal(false)} />
            )}
        </div>
    );
}
