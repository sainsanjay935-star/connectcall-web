"use client";

import React, { useState, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, MicOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { getApiBaseUrl } from '@/utils/constants';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { VoiceRecorder } from '@/utils/VoiceRecorder';
import { encryptMessage } from '@/utils/encryption';

interface MessageInputProps {
    chatId: string;
    onMessageSent: (message: any) => void;
}

export default function MessageInput({ chatId, onMessageSent }: MessageInputProps) {
    const { token } = useAuth();
    const { socket } = useSocket();
    const [content, setContent] = useState('');
    const [typing, setTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recorder] = useState(new VoiceRecorder());
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleVoiceMessage = async () => {
        if (!isRecording) {
            await recorder.start();
            setIsRecording(true);
        } else {
            const audioBlob = await recorder.stop();
            setIsRecording(false);

            const file = new File([audioBlob], "voice-note.webm", { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', file);

            try {
                const baseUrl = getApiBaseUrl();
                const uploadRes = await axios.post(`${baseUrl}/api/media/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });

                const response = await axios.post(
                    `${baseUrl}/api/chats/message`,
                    { chatId, content: 'Voice Message', messageType: 'voice', fileUrl: uploadRes.data.url },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                socket?.emit('new message', response.data);
                onMessageSent(response.data);
            } catch (err) {
                console.error('Voice message upload failed', err);
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const baseUrl = getApiBaseUrl();
            const uploadRes = await axios.post(`${baseUrl}/api/media/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            const messageType = file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'voice' : 'document';

            const response = await axios.post(
                `${baseUrl}/api/chats/message`,
                { chatId, content: file.name, messageType, fileUrl: uploadRes.data.url },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            socket?.emit('new message', response.data);
            onMessageSent(response.data);
        } catch (err) {
            console.error('File upload failed', err);
        }
    };

    const sendMessage = async () => {
        if (!content.trim()) return;

        socket?.emit('stop typing', chatId);
        const encryptedContent = encryptMessage(content);
        setContent('');

        try {
            const baseUrl = getApiBaseUrl();
            const response = await axios.post(
                `${baseUrl}/api/chats/message`,
                { chatId, content: encryptedContent, messageType: 'text' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            socket?.emit('new message', response.data);
            onMessageSent(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const typingHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);

        if (!socket) return;

        if (!typing) {
            setTyping(true);
            socket.emit('typing', chatId);
        }

        let lastTypingTime = new Date().getTime();
        const timerLength = 3000;
        setTimeout(() => {
            const timeNow = new Date().getTime();
            const timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit('stop typing', chatId);
                setTyping(false);
            }
        }, timerLength);
    };

    return (
        <div className="relative flex min-h-[62px] items-center bg-[#f0f2f5] px-4 py-2 dark:bg-[#2a3942]">
            <div className="flex space-x-3 text-[#54656f] dark:text-[#aebac1]">
                <Smile
                    size={24}
                    className="cursor-pointer"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                />
                <Paperclip size={24} className="cursor-pointer" onClick={() => fileInputRef.current?.click()} />
                <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
            </div>

            {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 z-50">
                    <EmojiPicker
                        onEmojiClick={(emojiData) => setContent(prev => prev + emojiData.emoji)}
                        width={300}
                        height={400}
                    />
                </div>
            )}

            <input
                type="text"
                placeholder="Type a message"
                className="mx-3 flex-1 rounded-lg bg-white p-2.5 text-sm outline-none dark:bg-[#33404b] dark:text-[#d1d7db]"
                value={content}
                onChange={typingHandler}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />

            <div className="text-[#54656f] dark:text-[#aebac1]">
                {content.trim() ? (
                    <Send size={24} className="cursor-pointer text-whatsapp-green" onClick={sendMessage} />
                ) : (
                    isRecording ? (
                        <MicOff size={24} className="cursor-pointer text-red-500 animate-pulse" onClick={handleVoiceMessage} />
                    ) : (
                        <Mic size={24} className="cursor-pointer" onClick={handleVoiceMessage} />
                    )
                )}
            </div>
        </div>
    );
}
