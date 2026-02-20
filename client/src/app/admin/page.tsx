"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { User, ShieldAlert, Trash2, Ban, CheckCircle, Users, Activity } from 'lucide-react';

export default function AdminPage() {
    const { token, user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ totalUsers: 0, activeUsers: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, statsRes] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setUsers(usersRes.data);
                setStats(statsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchData();
    }, [token]);

    const toggleBlock = async (userId: string, isBlocked: boolean) => {
        try {
            const endpoint = isBlocked ? 'unblock' : 'block';
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/${endpoint}/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: !isBlocked } : u));
        } catch (err) {
            console.error(err);
        }
    };

    const removeUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center dark:text-white">Loading Admin Panel...</div>;

    if (user?.role !== 'admin') {
        return (
            <div className="flex h-screen flex-col items-center justify-center text-center p-4">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-3xl font-bold dark:text-white">Unauthorized Access</h1>
                <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5] p-8 dark:bg-[#0b141a]">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-[#111b21] dark:text-[#e9edef]">ConnectCall Admin Panel</h1>
                    <div className="flex space-x-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm dark:bg-[#202c33] flex items-center space-x-4">
                            <Users className="text-whatsapp-green" />
                            <div>
                                <p className="text-xs text-gray-500">Total Users</p>
                                <p className="text-xl font-bold dark:text-white">{stats.totalUsers}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm dark:bg-[#202c33] flex items-center space-x-4">
                            <Activity className="text-whatsapp-green" />
                            <div>
                                <p className="text-xs text-gray-500">Online Now</p>
                                <p className="text-xl font-bold dark:text-white">{stats.activeUsers}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden dark:bg-[#202c33]">
                    <table className="w-full text-left">
                        <thead className="bg-[#f0f2f5] dark:bg-[#2a3942] text-[#54656f] dark:text-[#aebac1] text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#2a3942]">
                            {users.map((u) => (
                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-[#2a3942] transition">
                                    <td className="px-6 py-4 flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                                            {u.profilePhoto ? <img src={u.profilePhoto} alt="" className="h-full w-full object-cover" /> : <User className="p-2" />}
                                        </div>
                                        <span className="font-medium dark:text-white">{u.username}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-whatsapp-green font-mono">{u.uniqueId}</td>
                                    <td className="px-6 py-4 text-sm text-[#54656f] dark:text-[#aebac1]">{u.email}</td>
                                    <td className="px-6 py-4">
                                        {u.isBlocked ? (
                                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">Blocked</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => toggleBlock(u._id, u.isBlocked)}
                                                className={`p-2 rounded-lg ${u.isBlocked ? 'text-green-500 border border-green-500' : 'text-orange-500 border border-orange-500'} hover:bg-opacity-10`}
                                                title={u.isBlocked ? 'Unblock' : 'Block'}
                                            >
                                                {u.isBlocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                                            </button>
                                            <button
                                                onClick={() => removeUser(u._id)}
                                                className="p-2 rounded-lg text-red-500 border border-red-500 hover:bg-red-50" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
