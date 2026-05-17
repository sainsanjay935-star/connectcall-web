"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Paperclip, Edit2, Trash2, X, Check, CheckCheck, Reply } from 'lucide-react';
import { decryptMessage, encryptMessage } from '@/utils/encryption';
import { useSocket } from '@/context/SocketContext';
import VoicePlayer from './VoicePlayer';

interface MessageListProps {
    messages: any[];
    userId?: string;
    chatId: string;
    onReply?: (message: any) => void;
}

export default function MessageList({ messages: initialMessages, userId, chatId, onReply }: MessageListProps) {
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

        const handleSeen = ({ messageIds, userId: seenUserId }: any) => {
            setMessages(prev => prev.map(m => {
                if (messageIds.includes(m._id)) {
                    const currentReadBy = m.readBy || [];
                    if (!currentReadBy.includes(seenUserId)) {
                        return { ...m, readBy: [...currentReadBy, seenUserId] };
                    }
                }
                return m;
            }));
        };

        const handleDelivered = ({ messageId, userId: delUserId }: any) => {
            setMessages(prev => prev.map(m => {
                if (m._id === messageId) {
                    const currentDeliveredTo = m.deliveredTo || [];
                    if (!currentDeliveredTo.includes(delUserId)) {
                        return { ...m, deliveredTo: [...currentDeliveredTo, delUserId] };
                    }
                }
                return m;
            }));
        };

        socket.on('reaction-added', handleReaction);
        socket.on('message-edited', handleEdited);
        socket.on('message-deleted', handleDeleted);
        socket.on('messages-seen', handleSeen);
        socket.on('message-delivered-update', handleDelivered);

        return () => {
            socket.off('reaction-added', handleReaction);
            socket.off('message-edited', handleEdited);
            socket.off('message-deleted', handleDeleted);
            socket.off('messages-seen', handleSeen);
            socket.off('message-delivered-update', handleDelivered);
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

    const handleScrollToMessage = (msgId: string) => {
        const element = document.getElementById(`message-${msgId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-[#25d366]', 'ring-offset-2', 'dark:ring-offset-[#0b141a]', 'scale-[1.02]');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-[#25d366]', 'ring-offset-2', 'dark:ring-offset-[#0b141a]', 'scale-[1.02]');
            }, 1500);
        }
    };

    const renderReplyBox = (msg: any) => {
        if (!msg.replyTo) return null;
        let snippet = msg.replyTo.content;
        if (msg.replyTo.messageType === 'text') snippet = decryptMessage(msg.replyTo.content);
        if (msg.replyTo.messageType === 'image') snippet = '📷 Photo';
        if (msg.replyTo.messageType === 'video') snippet = '🎥 Video';
        if (msg.replyTo.messageType === 'voice') snippet = '🎤 Voice message';
        if (msg.replyTo.isDeleted) snippet = '🚫 This message was deleted';
        
        const senderName = msg.replyTo.sender?._id === userId ? 'You' : (msg.replyTo.sender?.username || 'User');

        return (
            <div 
                className="mb-2 rounded-lg border-l-4 border-[#25d366] bg-black/5 p-2 dark:bg-white/5 text-sm cursor-pointer hover:bg-black/10 transition-premium flex flex-col opacity-90"
                onClick={(e) => {
                    e.stopPropagation();
                    handleScrollToMessage(msg.replyTo._id);
                }}
            >
                <span className="font-semibold text-[#25d366] text-[12px]">{senderName}</span>
                <span className="text-[#54656f] dark:text-[#aebac1] line-clamp-1 text-xs mt-0.5">{snippet}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-2 p-6">
            {messages.map((msg, idx) => {
                const isMine = msg.sender?._id === userId || msg.sender === userId;
                const isDeleted = msg.isDeleted;
                return (
                    <div
                        key={msg._id || idx}
                        className={`flex w-full mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            id={`message-${msg._id}`}
                            className={`group relative max-w-[85%] md:max-w-[70%] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] transition-premium ${isMine
                                ? 'bg-[#dcf8c6] dark:bg-[#005c4b] rounded-tr-none rounded-xl'
                                : 'bg-white dark:bg-[#202c33] rounded-tl-none rounded-xl'
                                } ${isDeleted ? 'opacity-70 italic' : ''} hover:shadow-md`}
                        >
                            {!isMine && !isDeleted && (
                                <div className="absolute -right-20 top-0 hidden group-hover:block z-10">
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
                                        {onReply && (
                                            <button onClick={() => onReply(msg)} className="text-gray-500 hover:text-blue-500 transition px-1"><Reply size={14} /></button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isMine && !isDeleted && (
                                <div className="absolute -left-20 top-0 hidden group-hover:flex space-x-1 z-10">
                                    <div className="flex space-x-1 rounded-full bg-white p-1 shadow-md dark:bg-[#2a3942]">
                                        {onReply && (
                                            <button onClick={() => onReply(msg)} className="text-gray-500 hover:text-blue-500 transition"><Reply size={14} /></button>
                                        )}
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
                                    {renderReplyBox(msg)}
                                    {msg.messageType === 'image' ? (
                                        <div className="mb-1 overflow-hidden rounded-lg border border-black/5 dark:border-white/5">
                                            <img src={msg.fileUrl} alt="sent image" className="max-h-[300px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity" />
                                        </div>
                                    ) : msg.messageType === 'video' ? (
                                        <div className="mb-1 overflow-hidden rounded-lg border border-black/5 dark:border-white/5 bg-black/10">
                                            <video controls className="max-h-[300px] w-full">
                                                <source src={msg.fileUrl} type="video/mp4" />
                                            </video>
                                        </div>
                                    ) : msg.messageType === 'voice' ? (
                                        <VoicePlayer url={msg.fileUrl} isMine={isMine} />
                                    ) : (
                                        <p className={`text-[14.5px] leading-relaxed dark:text-[#e9edef] whitespace-pre-wrap ${isDeleted ? 'text-gray-500 italic' : ''}`}>
                                            {isDeleted ? '🚫 This message was deleted' : (msg.messageType === 'text' ? decryptMessage(msg.content) : msg.content)}
                                            {msg.isEdited && !isDeleted && <span className="ml-1 text-[10px] opacity-70">(edited)</span>}
                                        </p>
                                    )}

                                    {msg.reactions?.length > 0 && !isDeleted && (
                                        <div className="absolute -bottom-2 right-2 flex -space-x-1">
                                            {msg.reactions.map((r: any, i: number) => (
                                                <span key={i} className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow-sm dark:bg-[#2a3942] border border-black/5 dark:border-white/5">
                                                    {r.emoji}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="mt-1 flex items-center justify-end space-x-1 select-none">
                                <span className="text-[10px] text-[#667781] dark:text-[#8696a0] font-medium">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                                </span>
                                {isMine && !isDeleted && (
                                    <div className="flex ml-1">
                                        {msg.readBy?.some((id: string) => id !== userId) ? (
                                            <CheckCheck size={14} className="text-[#53bdeb]" strokeWidth={2.5} />
                                        ) : msg.deliveredTo?.some((id: string) => id !== userId) ? (
                                            <CheckCheck size={14} className="text-[#8696a0]" strokeWidth={2} />
                                        ) : (
                                            <Check size={14} className="text-[#8696a0]" strokeWidth={2} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={scrollRef}></div>
        </div>
    );
}
