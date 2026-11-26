"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/utils/constants';

interface User {
    id: string;
    uniqueId: string;
    username: string;
    email: string;
    role: string;
    profilePhoto?: string;
    statusMessage?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);

                // Sync latest profile, role, and block status from server
                axios.get(`${getApiBaseUrl()}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${storedToken}` }
                }).then((res) => {
                    const freshUser: User = {
                        ...res.data,
                        id: res.data._id || res.data.id
                    };
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    setUser(freshUser);
                }).catch((err) => {
                    const status = err.response?.status;
                    if (status === 401 || status === 403) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setToken(null);
                        setUser(null);
                    }
                });
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const baseUrl = getApiBaseUrl();
        const response = await axios.post(`${baseUrl}/api/auth/login`, { email, password });
        const { token: newToken, user: newUser } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        router.push('/dashboard');
    };

    const signup = async (username: string, email: string, password: string) => {
        const baseUrl = getApiBaseUrl();
        console.log('--- Sign Up Attempt ---');
        console.log('Using Base URL:', baseUrl);

        try {
            const response = await axios.post(`${baseUrl}/api/auth/signup`, { username, email, password });
            const { token: newToken, user: newUser } = response.data;
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));
            setToken(newToken);
            setUser(newUser);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Sign Up Axios Error:', err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
