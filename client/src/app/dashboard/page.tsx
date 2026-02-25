"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

export default function DashboardPage() {
    const [selectedChat, setSelectedChat] = useState<any>(null);

    const handleChatSelect = (chat: any) => {
        setSelectedChat(chat);
    };

    const handleBackToList = () => {
        setSelectedChat(null);
    };

    return (
        <div className="flex h-screen w-full bg-[#f0f2f5] p-0 md:p-4 dark:bg-[#0b141a]">
            {/* DEBUG INDICATOR - REMOVE AFTER VERIFICATION */}
            <div className="fixed top-2 left-2 z-[9999] bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-lg pointer-events-none opacity-80">
                FIX-V3 LIVE
            </div>

            <div className="flex h-full w-full overflow-hidden rounded shadow-xl dark:bg-[#111b21] dark:shadow-none">
                {/* Sidebar - hidden on mobile when a chat is selected */}
                <div className={`${selectedChat ? 'hidden' : 'flex'} w-full md:flex md:w-[30%] md:min-w-[300px] border-r border-[#d1d7db] dark:border-[#2a3942]`}>
                    <Sidebar onChatSelect={handleChatSelect} selectedChatId={selectedChat?._id} />
                </div>

                {/* Chat Window - hidden on mobile when NO chat is selected */}
                <div className={`${!selectedChat ? 'hidden' : 'flex'} flex-1 md:flex`}>
                    {selectedChat ? (
                        <ChatWindow chat={selectedChat} onBack={handleBackToList} />
                    ) : (
                        <div className="hidden h-full flex-col items-center justify-center bg-[#f0f2f5] md:flex dark:bg-[#222e35]">
                            <div className="mb-4 h-64 w-64 rounded-full bg-whatsapp-white opacity-20"></div>
                            <h1 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef]">ConnectCall Web</h1>
                            <p className="mt-4 text-[#667781] dark:text-[#8696a0]">
                                Send and receive messages without keeping your phone online.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
