"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketUrl } from '@/utils/constants';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (user && token) {
            const SOCKET_URL = getSocketUrl();
            const newSocket = io(SOCKET_URL, {
                auth: { token }
            });

            newSocket.on('connect', () => {
                setConnected(true);
                newSocket.emit('setup', user);
            });

            newSocket.on('disconnect', () => setConnected(false));
            newSocket.on('connected', () => console.log('Socket setup complete'));

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                setConnected(false);
            };
        } else {
            setSocket(null);
            setConnected(false);
        }
    }, [user?.id, token]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within a SocketProvider');
    return context;
};
