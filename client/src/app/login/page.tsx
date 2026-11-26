"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email.trim(), password);
        } catch (err: any) {
            if (!err.response) {
                setError('Cannot reach backend server. If Render is waking up, wait 30 seconds and try again.');
            } else {
                setError(err.response?.data?.message || 'Failed to login');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a]">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-[#202c33]">
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp-green text-white">
                        <MessageSquare size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#41525d] dark:text-[#e9edef]">ConnectCall Web</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#667781] dark:text-[#8696a0]">Email Address</label>
                        <input
                            type="email"
                            required
                            className="mt-1 w-full rounded border-b-2 border-transparent bg-[#f0f2f5] p-2 text-[#3b4a54] outline-none transition focus:border-whatsapp-green dark:bg-[#2a3942] dark:text-[#d1d7db]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#667781] dark:text-[#8696a0]">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 w-full rounded border-b-2 border-transparent bg-[#f0f2f5] p-2 text-[#3b4a54] outline-none transition focus:border-whatsapp-green dark:bg-[#2a3942] dark:text-[#d1d7db]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded bg-whatsapp-green py-2 font-medium text-white transition hover:bg-whatsapp-green-dark disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#667781] dark:text-[#8696a0]">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-whatsapp-green hover:underline">
                        Sign up now
                    </Link>
                </p>
            </div>
        </div>
    );
}
