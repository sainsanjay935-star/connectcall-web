"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Paperclip, Edit2, Trash2, X, Check } from 'lucide-react';
import { decryptMessage, encryptMessage } from '@/utils/encryption';
import { useSocket } from '@/context/SocketContext';

interface MessageListProps {
    messages: any[];
    userId?: string;
    chatId: string;
}

export default function MessageList({ messages: initialMessages, userId, chatId }: MessageListProps) {
    const [messages, setMessages] = useState(initialMessages);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleReaction = ({ messageId, reactions }: any) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
        };

        const handleEdited = ({ messageId, content, isEdited }: any) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, content, isEdited } : m));
        };

        const handleDeleted = ({ messageId }: any) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
        };

        socket.on('reaction-added', handleReaction);
        socket.on('message-edited', handleEdited);
        socket.on('message-deleted', handleDeleted);

        return () => {
            socket.off('reaction-added', handleReaction);
            socket.off('message-edited', handleEdited);
            socket.off('message-deleted', handleDeleted);
        };
    }, [socket]);

    const addReaction = (messageId: string, emoji: string) => {
        socket?.emit('add-reaction', { messageId, emoji, userId, chatId });
    };

    const deleteMessage = (messageId: string) => {
        if (window.confirm('Delete this message for everyone?')) {
            socket?.emit('delete-message', { messageId, chatId });
        }
    };

    const startEdit = (msg: any) => {
        setEditingMessageId(msg._id);
        setEditContent(decryptMessage(msg.content));
    };

    const submitEdit = (messageId: string) => {
        if (!editContent.trim()) return;
        socket?.emit('edit-message', { messageId, content: encryptMessage(editContent), chatId });
        setEditingMessageId(null);
    };

    return (
        <div className="flex flex-col space-y-2 p-6">
            {messages.map((msg, idx) => {
                const isMine = msg.sender?._id === userId || msg.sender === userId;
                const isDeleted = msg.isDeleted;
                return (
                    <div
                        key={msg._id || idx}
                        className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`group relative max-w-[70%] px-3 py-1 shadow-sm ${isMine
                                ? 'chat-bubble-mine bg-[#dcf8c6] dark:bg-[#005c4b]'
                                : 'chat-bubble-others bg-white dark:bg-[#202c33]'
                                } ${isDeleted ? 'opacity-70 italic' : ''}`}
                        >
                            {!isMine && !isDeleted && (
                                <div className="absolute -right-12 top-0 hidden group-hover:block">
                                    <div className="flex space-x-1 rounded-full bg-white p-1 shadow-md dark:bg-[#2a3942]">
                                        {['❤️', '👍', '😂'].map(emoji => (
                                            <span
                                                key={emoji}
                                                className="cursor-pointer hover:scale-125 transition"
                                                onClick={() => addReaction(msg._id, emoji)}
                                            >
                                                {emoji}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isMine && !isDeleted && (
                                <div className="absolute -left-16 top-0 hidden group-hover:flex space-x-1">
                                    <div className="flex space-x-1 rounded-full bg-white p-1 shadow-md dark:bg-[#2a3942]">
                                        <button onClick={() => startEdit(msg)} className="text-gray-500 hover:text-blue-500 transition"><Edit2 size={14} /></button>
                                        <button onClick={() => deleteMessage(msg._id)} className="text-gray-500 hover:text-red-500 transition"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )}

                            {editingMessageId === msg._id ? (
                                <div className="flex items-center space-x-2 py-1 min-w-[200px]">
                                    <input
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="bg-transparent border-b border-[#25d366] focus:outline-none w-full text-sm"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && submitEdit(msg._id)}
                                    />
                                    <button onClick={() => submitEdit(msg._id)} className="text-[#25d366]"><Check size={16} /></button>
                                    <button onClick={() => setEditingMessageId(null)} className="text-red-500"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    {msg.messageType === 'image' ? (
                                        <div className="mb-1 overflow-hidden rounded">
                                            <img src={msg.fileUrl} alt="sent image" className="max-h-[300px] w-full object-cover" />
                                        </div>
                                    ) : msg.messageType === 'video' ? (
                                        <video controls className="mb-1 max-h-[300px] w-full rounded">
                                            <source src={msg.fileUrl} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <p className={`text-sm dark:text-[#e9edef] whitespace-pre-wrap ${isDeleted ? 'text-gray-500' : ''}`}>
                                            {isDeleted ? '🚫 This message was deleted' : (msg.messageType === 'text' ? decryptMessage(msg.content) : msg.content)}
                                            {msg.isEdited && !isDeleted && <span className="ml-1 text-[10px] opacity-70">(edited)</span>}
                                        </p>
                                    )}

                                    {msg.reactions?.length > 0 && !isDeleted && (
                                        <div className="absolute -bottom-2 right-2 flex -space-x-1">
                                            {msg.reactions.map((r: any, i: number) => (
                                                <span key={i} className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow-sm dark:bg-[#2a3942]">
                                                    {r.emoji}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="mt-1 flex items-center justify-end space-x-1">
                                <span className="text-[10px] text-[#667781] dark:text-[#8696a0]">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={scrollRef}></div>
        </div>
    );
}
