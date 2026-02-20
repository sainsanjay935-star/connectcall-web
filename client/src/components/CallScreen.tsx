"use client";

import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize, Minimize } from 'lucide-react';

interface CallScreenProps {
    myVideoRef: React.RefObject<HTMLVideoElement>;
    userVideoRef: React.RefObject<HTMLVideoElement>;
    onEndCall: () => void;
    stream: MediaStream | null;
}

export default function CallScreen({ myVideoRef, userVideoRef, onEndCall, stream }: CallScreenProps) {
    const [isMuted, setIsMuted] = React.useState(false);
    const [isVideoOff, setIsVideoOff] = React.useState(false);

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] bg-[#0b141a] flex flex-col">
            <div className="flex-1 relative">
                {/* Remote Video (Full Screen) */}
                <video
                    playsInline
                    ref={userVideoRef}
                    autoPlay
                    className="h-full w-full object-cover"
                />

                {/* Local Video (Small Overlay) */}
                <div className="absolute top-8 right-8 w-48 h-64 rounded-xl overflow-hidden border-2 border-[#2a3942] shadow-xl bg-black">
                    <video
                        playsInline
                        muted
                        ref={myVideoRef}
                        autoPlay
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Controls Overlay */}
                <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center space-x-6">
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-[#2a3942]'} text-white transition hover:opacity-80`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        onClick={onEndCall}
                        className="p-5 rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 scale-110"
                    >
                        <PhoneOff size={32} />
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-[#2a3942]'} text-white transition hover:opacity-80`}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
