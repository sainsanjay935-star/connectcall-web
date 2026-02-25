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
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0b141a] flex flex-col overflow-hidden">
            <div className="flex-1 relative bg-black">
                {/* Remote Video (Full Screen) */}
                <video
                    playsInline
                    ref={userVideoRef}
                    autoPlay
                    className="h-full w-full object-cover"
                />

                {/* Local Video (Floating Overlay) */}
                <div className="absolute top-4 right-4 md:top-8 md:right-8 w-28 h-40 md:w-48 md:h-64 rounded-xl overflow-hidden border-2 border-[#2a3942] shadow-2xl bg-black">
                    <video
                        playsInline
                        muted
                        ref={myVideoRef}
                        autoPlay
                        className="h-full w-full object-cover mirror"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                </div>

                {/* Call Info Overlay (Top Center) */}
                <div className="absolute top-10 left-0 right-0 flex flex-col items-center pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <span className="text-white text-sm font-medium animate-pulse">On Call</span>
                    </div>
                </div>

                {/* Controls Overlay */}
                <div className="absolute bottom-8 md:bottom-12 left-0 right-0 flex justify-center items-center space-x-4 md:space-x-8">
                    <button
                        onClick={toggleMute}
                        className={`p-4 md:p-5 rounded-full ${isMuted ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'} backdrop-blur-md text-white transition-all transform active:scale-95`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        onClick={onEndCall}
                        className="p-5 md:p-7 rounded-full bg-red-600 text-white shadow-2xl transition-all transform hover:bg-red-700 active:scale-90"
                    >
                        <PhoneOff size={32} />
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-4 md:p-5 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'} backdrop-blur-md text-white transition-all transform active:scale-95`}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
