"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
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

    // We pass the targetUserId to useWebRTC. 
    // If we are receiving a call, useWebRTC handles the caller ID internally via socket.
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

    const handleCallUser = (id: string) => {
        setTargetUserId(id);
        callUser(id);
    };

    return (
        <CallContext.Provider value={{
            callUser: handleCallUser,
            answerCall,
            leaveCall,
            receivingCall,
            callAccepted,
            name
        }}>
            {children}

            {/* Global Calling UI */}
            {receivingCall && !callAccepted && (
                <IncomingCallModal
                    name={name || "Incoming Call"}
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
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within a CallProvider');
    return context;
};
