"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

export default function DashboardPage() {
    const [selectedChat, setSelectedChat] = useState<any>(null);

    return (
        <div className="flex h-screen w-full bg-[#f0f2f5] p-4 dark:bg-[#0b141a]">
            <div className="flex h-full w-full overflow-hidden rounded shadow-xl dark:bg-[#111b21] dark:shadow-none">
                <div className="w-[30%] min-w-[300px] border-r border-[#d1d7db] dark:border-[#2a3942]">
                    <Sidebar onChatSelect={setSelectedChat} selectedChatId={selectedChat?._id} />
                </div>
                <div className="flex-1">
                    {selectedChat ? (
                        <ChatWindow chat={selectedChat} />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#222e35]">
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
