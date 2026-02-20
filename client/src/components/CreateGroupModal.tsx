"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Check, User, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreated: (group: any) => void;
}

export default function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
    const { token } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (!search.trim()) {
                setResults([]);
                return;
            }
            try {
                const baseUrl = getApiBaseUrl();
                const response = await axios.get(`${baseUrl}/api/users?search=${search}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResults(response.data);
            } catch (err) {
                console.error(err);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            searchUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, token]);

    const handleSelect = (user: any) => {
        if (selectedUsers.some(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length < 2) {
            alert("Group name and at least 2 other members are required");
            return;
        }

        setLoading(true);
        try {
            const baseUrl = getApiBaseUrl();
            const response = await axios.post(`${baseUrl}/api/chats/group`, {
                name: groupName,
                users: JSON.stringify(selectedUsers.map(u => u._id))
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onCreated(response.data);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-[#202c33]">
                <div className="flex items-center justify-between border-b p-4 dark:border-[#2a3942]">
                    <h2 className="text-lg font-semibold text-[#111b21] dark:text-[#e9edef]">New Group</h2>
                    <button onClick={onClose} className="text-[#54656f] hover:text-red-500 dark:text-[#aebac1]">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Group Subject"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full border-b bg-transparent px-2 py-1 text-base text-[#111b21] focus:border-[#25d366] focus:outline-none dark:border-[#2a3942] dark:text-[#e9edef]"
                        />
                    </div>

                    <div className="relative">
                        <div className="flex items-center space-x-2 rounded-lg bg-[#f0f2f5] px-3 py-2 dark:bg-[#111b21]">
                            <Search size={18} className="text-[#667781] dark:text-[#8696a0]" />
                            <input
                                type="text"
                                placeholder="Add members"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-transparent text-sm focus:outline-none dark:text-[#e9edef]"
                            />
                        </div>
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 py-2">
                            {selectedUsers.map(u => (
                                <div key={u._id} className="flex items-center space-x-1 rounded-full bg-[#f0f2f5] px-2 py-1 dark:bg-[#111b21]">
                                    <span className="text-xs text-[#111b21] dark:text-[#e9edef]">{u.username}</span>
                                    <X size={12} className="cursor-pointer text-red-500" onClick={() => handleSelect(u)} />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="max-h-[200px] overflow-y-auto border rounded dark:border-[#2a3942]">
                        {results.map(u => (
                            <div
                                key={u._id}
                                onClick={() => handleSelect(u)}
                                className="flex cursor-pointer items-center justify-between p-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 overflow-hidden rounded-full bg-[#dfe5e7]">
                                        {u.profilePhoto ? (
                                            <img src={u.profilePhoto} alt={u.username} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[#54656f]"><User size={20} /></div>
                                        )}
                                    </div>
                                    <span className="text-[#111b21] dark:text-[#e9edef]">{u.username}</span>
                                </div>
                                {selectedUsers.some(sel => sel._id === u._id) && <Check size={20} className="text-[#25d366]" />}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading || !groupName.trim() || selectedUsers.length < 2}
                        className="w-full rounded-md bg-[#25d366] py-3 font-semibold text-white shadow-md hover:bg-[#20bd5c] disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Group"}
                    </button>
                </div>
            </div>
        </div>
    );
}
