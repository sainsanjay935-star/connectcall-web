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
        <div className="fixed inset-0 z-[10000] flex flex-col bg-[#0b141a] animate-in fade-in zoom-in duration-300">
            {/* Background Profile Blur */}
            <div className="absolute inset-0 opacity-20 blur-3xl scale-150">
                <div className="h-full w-full bg-[#128c7e] rounded-full" />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-between py-24 px-6 text-center">
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                        <div className="h-32 w-32 md:h-40 md:w-40 overflow-hidden rounded-full bg-[#dfe5e7] dark:bg-[#2a3942] border-4 border-white/10 shadow-2xl animate-pulse">
                            <User size={80} className="h-full w-full p-6 text-[#54656f] dark:text-[#aebac1]" />
                        </div>
                        {/* Status ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-[#25d366] animate-ping opacity-75" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">{name}</h2>
                        <span className="flex items-center justify-center space-x-2 text-[#25d366] font-medium animate-pulse">
                            <Phone size={16} fill="currentColor" />
                            <span className="uppercase text-xs tracking-[0.2em]">WhatsApp Video Call...</span>
                        </span>
                    </div>
                </div>

                <div className="w-full max-w-xs flex justify-around items-center">
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={onReject}
                            className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition-all hover:bg-red-700 active:scale-90"
                        >
                            <PhoneOff size={32} />
                        </button>
                        <span className="text-white text-xs font-semibold opacity-70">Decline</span>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={onAccept}
                            className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-[#25d366] text-white shadow-2xl transition-all hover:bg-[#1fb356] active:scale-90 animate-bounce"
                        >
                            <Phone size={32} fill="currentColor" />
                        </button>
                        <span className="text-white text-xs font-semibold opacity-70">Accept</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
