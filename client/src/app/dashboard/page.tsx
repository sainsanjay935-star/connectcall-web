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
        <div className="flex h-screen w-full bg-[#f0f2f5] dark:bg-[#0b141a] overflow-hidden">
            {/* DEBUG INDICATOR - REMOVE AFTER VERIFICATION */}
            <div className="fixed top-2 left-2 z-[9999] bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-lg pointer-events-none opacity-80">
                FIX-V3 LIVE
            </div>

            <div className="flex h-full w-full overflow-hidden">
                {/* Sidebar - hidden on mobile when a chat is selected */}
                <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[35%] lg:w-[30%] md:min-w-[350px] border-r border-[#d1d7db] dark:border-[#2a3942] transition-all duration-300 ease-in-out`}>
                    <Sidebar onChatSelect={handleChatSelect} selectedChatId={selectedChat?._id} />
                </div>

                {/* Chat Window - Dynamic display based on selection and screen size */}
                <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col relative transition-all duration-300 ease-in-out`}>
                    {selectedChat ? (
                        <ChatWindow chat={selectedChat} onBack={handleBackToList} />
                    ) : (
                        <div className="hidden h-full flex-col items-center justify-center bg-[#f0f2f5] md:flex dark:bg-[#222e35]">
                            <div className="mb-8 w-64 h-64 rounded-full bg-[#f0f2f5] dark:bg-[#111b21] flex items-center justify-center opacity-60">
                                <img src="https://abs.twimg.com/emoji/v2/72x72/1f4ac.png" alt="Welcome" className="w-32 h-32 grayscale opacity-40" />
                            </div>
                            <h1 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef]">ConnectCall Web</h1>
                            <p className="mt-4 text-sm text-[#667781] dark:text-[#8696a0] max-w-sm text-center px-4">
                                Send and receive messages without keeping your phone online.
                                Use ConnectCall on up to 4 linked devices and 1 phone at the same time.
                            </p>
                            <div className="mt-auto mb-10 flex items-center text-[#8696a0] text-xs">
                                <span className="mr-2 italic text-[10px]">End-to-end encrypted</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
