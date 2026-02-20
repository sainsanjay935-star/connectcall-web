"use client";

import React from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';

interface IncomingCallModalProps {
    name: string;
    onAccept: () => void;
    onReject: () => void;
}

export default function IncomingCallModal({ name, onAccept, onReject }: IncomingCallModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-[#202c33]">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#dfe5e7] dark:bg-[#2a3942]">
                    <User size={48} className="text-[#54656f] dark:text-[#aebac1]" />
                </div>
                <h2 className="mb-2 text-xl font-bold dark:text-[#e9edef]">{name}</h2>
                <p className="mb-8 text-[#667781] dark:text-[#8696a0]">Incoming Call...</p>

                <div className="flex justify-center space-x-8">
                    <button
                        onClick={onReject}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                    >
                        <PhoneOff size={28} />
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp-green text-white shadow-lg transition hover:bg-whatsapp-green-dark animate-pulse"
                    >
                        <Phone size={28} />
                    </button>
                </div>
            </div>
        </div>
    );
}
