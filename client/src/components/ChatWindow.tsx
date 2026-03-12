"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, Video, MoreVertical, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useCall } from '@/context/CallContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageSkeleton from './MessageSkeleton';
import { ChevronDown } from 'lucide-react';

interface ChatWindowProps {
    chat: any;
    onBack?: () => void;
}

export default function ChatWindow({ chat, onBack }: ChatWindowProps) {
    const { user, token } = useAuth();
    const { socket } = useSocket();
    const { callUser } = useCall();
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Scroll ref for jumping to latest message
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Initial participant extraction (only for 1-on-1)
    const initialOtherUser = chat.isGroupChat ? null : chat.participants.find((p: any) => p._id !== user?.id);
    const [otherParticipant, setOtherParticipant] = useState(initialOtherUser);

    useEffect(() => {
        if (!chat.isGroupChat) {
            const found = chat.participants.find((p: any) => p._id !== user?.id);
            setOtherParticipant(found);
        } else {
            setOtherParticipant(null);
        }
    }, [chat, user]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const baseUrl = getApiBaseUrl();
                const response = await axios.get(`${baseUrl}/api/chats/message/${chat._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                setIsLoading(false);
            }
        };

        if (token && chat._id) {
            fetchMessages();
            socket?.emit('join chat', chat._id);
        }
    }, [chat._id, token, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage: any) => {
            if (newMessage.chat._id === chat._id) {
                setMessages((prev) => {
                    const messageExists = prev.some(m => m._id === newMessage._id);
                    if (messageExists) return prev;
                    return [...prev, newMessage];
                });
                // Acknowledge delivery and seen status
                if (user?.id) {
                    socket.emit('message-delivered', { messageId: newMessage._id, userId: user.id, chatId: chat._id });
                    socket.emit('mark-as-read', { messageIds: [newMessage._id], userId: user.id, chatId: chat._id });
                }
            }
        };

        const handleTyping = () => setIsTyping(true);
        const handleStopTyping = () => setIsTyping(false);

        const handleStatusChange = ({ userId, isOnline, lastSeen }: any) => {
            if (!chat.isGroupChat && otherParticipant?._id === userId) {
                setOtherParticipant((prev: any) => ({ ...prev, isOnline, lastSeen }));
            }
        };

        socket.on('message received', handleNewMessage);

        // Mark existing unread messages as seen
        if (user?.id && messages.length > 0) {
            const unreadIds = messages
                .filter(m => {
                    const senderId = m.sender?._id || m.sender;
                    return senderId !== user.id && !m.readBy?.includes(user?.id);
                })
                .map(m => m._id);
            if (unreadIds.length > 0) {
                socket.emit('mark-as-read', { messageIds: unreadIds, userId: user.id, chatId: chat._id });
            }
        }
        socket.on('typing', handleTyping);
        socket.on('stop typing', handleStopTyping);
        socket.on('user-status-change', handleStatusChange);

        return () => {
            socket.off('message received', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('stop typing', handleStopTyping);
            socket.off('user-status-change', handleStatusChange);
        };
    }, [socket, chat._id, otherParticipant?._id, chat.isGroupChat]);

    const formatLastSeen = (date: any) => {
        if (!date) return 'recently';
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getChatHeaderInfo = () => {
        if (chat.isGroupChat) {
            return {
                name: chat.groupName,
                status: `${chat.participants.length} members`,
                photo: null,
                isGroup: true
            };
        }
        return {
            name: otherParticipant?.username,
            status: isTyping ? 'typing...' : (otherParticipant?.isOnline ? 'online' : `last seen at ${formatLastSeen(otherParticipant?.lastSeen)}`),
            photo: otherParticipant?.profilePhoto,
            isGroup: false
        };
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // If we are scrolled up by more than 200px, show the button
        if (scrollHeight - scrollTop - clientHeight > 200) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const header = getChatHeaderInfo();

    return (
        <div className="flex h-full flex-col bg-[#efeae2] dark:bg-[#0b141a]">
            {/* Global Calling UI is now handled in CallProvider */}

            <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-3 md:px-4 py-2 dark:bg-[#202c33] border-b border-[#d1d7db] dark:border-[#2a3942] z-10 shadow-sm md:shadow-none">
                <div className="flex items-center space-x-2 md:space-x-3 overflow-hidden">
                    {/* Back Button for mobile */}
                    <div
                        className="flex md:hidden cursor-pointer items-center justify-center p-2 -ml-1 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                        onClick={onBack}
                    >
                        <ArrowLeft size={20} />
                    </div>

                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#dfe5e7] dark:bg-[#2a3942] flex items-center justify-center">
                        {header.photo ? (
                            <img src={header.photo} alt={header.name} className="h-full w-full object-cover" />
                        ) : (
                            header.isGroup ? <Users size={24} className="text-[#54656f] dark:text-[#aebac1]" /> : <User size={24} className="text-[#54656f] dark:text-[#aebac1]" />
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <h3 className="font-semibold text-[15px] md:text-base text-[#111b21] dark:text-[#e9edef] truncate">{header.name}</h3>
                        <p className={`text-[11px] md:text-xs truncate ${isTyping || header.status === 'online' ? 'text-[#25d366] font-medium' : 'text-[#667781] dark:text-[#8696a0]'}`}>
                            {header.status}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-4 md:space-x-6 text-[#54656f] dark:text-[#aebac1]">
                    {!header.isGroup && (
                        <>
                            <Video
                                size={18}
                                className="cursor-pointer hover:text-[#128c7e] dark:hover:text-white transition-colors"
                                onClick={() => callUser(otherParticipant?._id, false)}
                            />
                            <Phone
                                size={18}
                                className="cursor-pointer hover:text-[#128c7e] dark:hover:text-white transition-colors"
                                onClick={() => callUser(otherParticipant?._id, true)}
                            />
                        </>
                    )}
                    <MoreVertical size={18} className="cursor-pointer hover:text-[#128c7e] dark:hover:text-white transition-colors" />
                </div>
            </header>

            <div 
                className="flex-1 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat relative"
                onScroll={handleScroll}
                ref={scrollContainerRef}
            >
                {isLoading ? (
                    <MessageSkeleton />
                ) : (
                    <MessageList messages={messages} userId={user?.id} chatId={chat._id} onReply={setReplyingTo} />
                )}

                {showScrollButton && !isLoading && (
                    <button
                        onClick={scrollToBottom}
                        className="fixed bottom-20 right-4 p-3 bg-white dark:bg-[#202c33] rounded-full shadow-lg border border-black/5 dark:border-white/5 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 transition z-50 animate-in fade-in zoom-in"
                    >
                        <ChevronDown size={20} />
                    </button>
                )}
            </div>

            <MessageInput chatId={chat._id} onMessageSent={(m) => setMessages((prev) => [...prev, m])} replyingTo={replyingTo} clearReply={() => setReplyingTo(null)} />
        </div >
    );
}
