"use client";

import React, { useState, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, MicOff, Check } from 'lucide-react';
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

    const startRecording = async () => {
        try {
            await recorder.start();
            setIsRecording(true);
            console.log('[Voice] Recording started');
        } catch (err) {
            console.error('[Voice] Failed to start recording', err);
        }
    };

    const stopAndSendRecording = async () => {
        if (!isRecording) return;

        setIsRecording(false);
        console.log('[Voice] Stopping and sending recording');

        try {
            const audioBlob = await recorder.stop();
            if (audioBlob.size < 100) {
                console.warn('[Voice] Recording too short, skipping');
                return;
            }

            const file = new File([audioBlob], "voice-note.webm", { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', file);

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
    };

    const cancelRecording = async () => {
        if (!isRecording) return;
        setIsRecording(false);
        console.log('[Voice] Recording cancelled');
        await recorder.stop();
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

    const [recordTime, setRecordTime] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatRecordTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative flex min-h-[62px] items-center bg-[#f0f2f5] px-2 md:px-4 py-2 dark:bg-[#202c33] shrink-0 border-t border-[#d1d7db] dark:border-[#2a3942]">
            {isRecording ? (
                <div className="flex-1 flex items-center justify-between bg-white dark:bg-[#2a3942] rounded-xl px-4 py-2 mx-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium dark:text-white">{formatRecordTime(recordTime)}</span>
                    </div>
                    <span className="text-xs text-[#667781] dark:text-[#8696a0] animate-pulse">Recording voice message...</span>
                    <button
                        onClick={cancelRecording}
                        className="text-red-500 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"
                    >
                        CANCEL
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex items-center space-x-1 md:space-x-3 text-[#54656f] dark:text-[#aebac1]">
                        <button
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={24} />
                        </button>
                        <button
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip size={24} />
                        </button>
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                    </div>

                    {showEmojiPicker && (
                        <div className="absolute bottom-16 left-2 md:left-4 z-[100] shadow-2xl">
                            <EmojiPicker
                                onEmojiClick={(emojiData) => setContent(prev => prev + emojiData.emoji)}
                                width={300}
                                height={400}
                                skinTonesDisabled
                                searchDisabled={window.innerWidth < 640}
                            />
                        </div>
                    )}

                    <div className="flex-1 mx-1 md:mx-3 relative">
                        <input
                            type="text"
                            placeholder="Type a message"
                            className="w-full rounded-xl bg-white px-4 py-2.5 text-[15px] outline-none dark:bg-[#2a3942] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0] shadow-sm"
                            value={content}
                            onChange={typingHandler}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                    </div>
                </>
            )}

            <div className="flex items-center justify-center w-12 h-12 shrink-0">
                {content.trim() && !isRecording ? (
                    <button
                        onClick={sendMessage}
                        className="p-2.5 bg-[#00a884] text-white rounded-full shadow-lg hover:bg-[#008f6f] transition-all transform active:scale-90"
                    >
                        <Send size={20} />
                    </button>
                ) : (
                    <button
                        onPointerDown={startRecording}
                        onPointerUp={stopAndSendRecording}
                        onPointerLeave={cancelRecording}
                        className={`p-2.5 rounded-full transition-all transform active:scale-95 shadow-sm touch-none ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                    >
                        {isRecording ? <Check size={22} /> : <Mic size={22} />}
                    </button>
                )}
            </div>
        </div>
    );
}
