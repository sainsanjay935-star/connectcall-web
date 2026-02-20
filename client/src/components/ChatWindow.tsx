"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, Video, MoreVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import IncomingCallModal from './IncomingCallModal';
import CallScreen from './CallScreen';

interface ChatWindowProps {
    chat: any;
}

export default function ChatWindow({ chat }: ChatWindowProps) {
    const { user, token } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Initial participant extraction
    const initialOtherUser = chat.participants.find((p: any) => p._id !== user?.id);
    const [otherParticipant, setOtherParticipant] = useState(initialOtherUser);

    const {
        myVideo,
        userVideo,
        receivingCall,
        callAccepted,
        callUser,
        answerCall,
        leaveCall,
        name,
        stream
    } = useWebRTC(otherParticipant?._id);

    useEffect(() => {
        const found = chat.participants.find((p: any) => p._id !== user?.id);
        setOtherParticipant(found);
    }, [chat, user]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/message/${chat._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(response.data);
            } catch (err) {
                console.error(err);
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
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const handleTyping = () => setIsTyping(true);
        const handleStopTyping = () => setIsTyping(false);

        const handleStatusChange = ({ userId, isOnline, lastSeen }: any) => {
            if (otherParticipant?._id === userId) {
                setOtherParticipant((prev: any) => ({ ...prev, isOnline, lastSeen }));
            }
        };

        socket.on('message received', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('stop typing', handleStopTyping);
        socket.on('user-status-change', handleStatusChange);

        return () => {
            socket.off('message received', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('stop typing', handleStopTyping);
            socket.off('user-status-change', handleStatusChange);
        };
    }, [socket, chat._id, otherParticipant?._id]);

    const formatLastSeen = (date: any) => {
        if (!date) return 'recently';
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-full flex-col bg-[#efeae2] dark:bg-[#0b141a]">
            {receivingCall && !callAccepted && (
                <IncomingCallModal
                    name={name || "Unknown User"}
                    onAccept={answerCall}
                    onReject={leaveCall}
                />
            )}

            {callAccepted && (
                <CallScreen
                    myVideoRef={myVideo}
                    userVideoRef={userVideo}
                    onEndCall={leaveCall}
                    stream={stream}
                />
            )}

            <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 py-2 dark:bg-[#202c33]">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-[#dfe5e7]">
                        {otherParticipant?.profilePhoto ? (
                            <img src={otherParticipant.profilePhoto} alt={otherParticipant.username} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#54656f]">
                                <User size={24} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#111b21] dark:text-[#e9edef]">{otherParticipant?.username}</h3>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                            {isTyping ? (
                                <span className="text-[#25d366] animate-pulse font-medium">typing...</span>
                            ) : (
                                otherParticipant?.isOnline ? (
                                    <span className="text-[#25d366] font-medium">online</span>
                                ) : (
                                    `last seen at ${formatLastSeen(otherParticipant?.lastSeen)}`
                                )
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-6 text-[#54656f] dark:text-[#aebac1]">
                    <Video size={20} className="cursor-pointer" onClick={() => callUser(otherParticipant?._id)} />
                    <Phone size={20} className="cursor-pointer" onClick={() => callUser(otherParticipant?._id)} />
                    <div className="h-6 w-[1px] bg-[#d1d7db] dark:bg-[#2a3942]"></div>
                    <MoreVertical size={20} className="cursor-pointer" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                <MessageList messages={messages} userId={user?.id} chatId={chat._id} />
            </div>

            <MessageInput chatId={chat._id} onMessageSent={(m) => setMessages((prev) => [...prev, m])} />
        </div>
    );
}
