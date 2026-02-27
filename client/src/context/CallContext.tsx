"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PhoneOff, Phone } from 'lucide-react';
import { useWebRTC } from '@/hooks/useWebRTC';
import CallScreen from '@/components/CallScreen';
import IncomingCallModal from '@/components/IncomingCallModal';

interface CallContextType {
    callUser: (id: string) => void;
    answerCall: () => void;
    leaveCall: () => void;
    receivingCall: boolean;
    callAccepted: boolean;
    name: string;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [ringingAudio, setRingingAudio] = useState<HTMLAudioElement | null>(null);

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
    } = useWebRTC(targetUserId);

    // Reset isCalling when call is accepted or ended
    useEffect(() => {
        if (callAccepted) {
            console.log("[CallContext] Call accepted, stopping ringing");
            setIsCalling(false);
        }
    }, [callAccepted]);

    useEffect(() => {
        // Handle ringing sound for incoming call
        if (receivingCall && !callAccepted) {
            if (!ringingAudio) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
                audio.loop = true;
                audio.play().catch(e => console.log('[CallContext] Audio play failed:', e));
                setRingingAudio(audio);
            }
        } else {
            if (ringingAudio) {
                ringingAudio.pause();
                ringingAudio.currentTime = 0;
                setRingingAudio(null);
            }
        }
        return () => {
            if (ringingAudio) {
                ringingAudio.pause();
                setRingingAudio(null);
            }
        };
    }, [receivingCall, callAccepted, ringingAudio]);

    const handleCallUser = (id: string) => {
        setTargetUserId(id);
        setIsCalling(true);
        callUser(id);
    };

    const handleLeaveCall = () => {
        setIsCalling(false);
        setTargetUserId(null); // Clear target user on leave
        leaveCall();
    };

    return (
        <CallContext.Provider value={{
            callUser: handleCallUser,
            answerCall,
            leaveCall: handleLeaveCall,
            receivingCall,
            callAccepted,
            name
        }}>
            {children}

            {/* Incoming Call UI */}
            {receivingCall && !callAccepted && (
                <IncomingCallModal
                    name={name || "Incoming Call"}
                    onAccept={answerCall}
                    onReject={handleLeaveCall}
                />
            )}

            {/* Outgoing Call UI */}
            {isCalling && !callAccepted && (
                <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0b141a] text-center p-6 animate-in fade-in duration-500">
                    <div className="absolute inset-0 opacity-10 blur-3xl scale-150 overflow-hidden">
                        <div className="h-full w-full bg-[#128c7e] rounded-full" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center space-y-8">
                        <div className="relative">
                            <div className="h-40 w-40 overflow-hidden rounded-full bg-[#dfe5e7] dark:bg-[#2a3942] border-4 border-white/10 shadow-2xl">
                                <User size={128} className="h-full w-full p-4 text-[#54656f] dark:text-[#aebac1]" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-4 border-[#25d366] animate-ping opacity-20" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">{name || "Caller"}</h2>
                            <p className="text-[#25d366] animate-pulse uppercase tracking-[0.3em] text-[10px] font-bold">Ringing...</p>
                        </div>
                    </div>

                    <div className="relative z-10 mt-32">
                        <button
                            onClick={handleLeaveCall}
                            className="h-20 w-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl hover:bg-red-700 transition-all active:scale-95 group"
                        >
                            <PhoneOff size={32} className="group-hover:rotate-12 transition-transform" />
                        </button>
                        <p className="text-white/50 text-xs mt-4 font-medium uppercase tracking-widest">End Call</p>
                    </div>
                </div>
            )}

            {callAccepted && (
                <CallScreen
                    name={name || "Caller"}
                    myVideoRef={myVideo}
                    userVideoRef={userVideo}
                    onEndCall={handleLeaveCall}
                    stream={stream}
                />
            )}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within a CallProvider');
    return context;
};
