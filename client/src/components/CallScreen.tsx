"use client";

import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, ChevronDown, Lock, UserPlus, User } from 'lucide-react';

interface CallScreenProps {
    name: string;
    myVideoRef: React.RefObject<HTMLVideoElement>;
    userVideoRef: React.RefObject<HTMLVideoElement>;
    onEndCall: () => void;
    stream: MediaStream | null;
    remoteStream: MediaStream | null; // Added
}

export default function CallScreen({ name, myVideoRef, userVideoRef, onEndCall, stream, remoteStream }: CallScreenProps) {
    const [isMuted, setIsMuted] = React.useState(false);
    const [isVideoOff, setIsVideoOff] = React.useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = React.useState(true);
    const [callDuration, setCallDuration] = React.useState(0);
    const [isConnecting, setIsConnecting] = React.useState(true);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Reactive: Stop connecting spinner as soon as remoteStream is received
    React.useEffect(() => {
        if (remoteStream) {
            console.log("[CallScreen] Remote stream received, stopping connecting state");
            setIsConnecting(false);
        }
    }, [remoteStream]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

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
        <div className="fixed inset-0 z-[10000] bg-[#0b141a] flex flex-col overflow-hidden animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${isVideoOff ? 'h-32 bg-[#075e54]/90' : 'h-24 bg-gradient-to-b from-black/60 to-transparent'}`}>
                <div className="flex items-center justify-between px-4 pt-4 text-white">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronDown size={24} />
                    </button>
                    <div className="flex items-center space-x-1 text-[10px] uppercase tracking-widest font-bold opacity-80">
                        <Lock size={10} />
                        <span>End-to-end encrypted</span>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <UserPlus size={22} />
                    </button>
                </div>
                <div className="flex flex-col items-center mt-1 text-white">
                    <h2 className="text-xl font-bold tracking-tight">{name}</h2>
                    <span className="text-sm font-medium opacity-80">
                        {isConnecting ? (
                            <span className="animate-pulse">Connecting...</span>
                        ) : (
                            formatDuration(callDuration)
                        )}
                    </span>
                </div>
            </div>

            {/* Video / Background Area */}
            <div className="flex-1 relative overflow-hidden bg-black">
                {/* Remote Content */}
                {isVideoOff ? (
                    <div className="h-full w-full flex items-center justify-center p-4">
                        <div className="absolute inset-0 opacity-40 blur-3xl scale-125">
                            <div className="h-full w-full bg-[#128c7e] rounded-full" />
                        </div>
                        <div className="relative z-10">
                            <div className="h-64 w-64 md:h-80 md:w-80 overflow-hidden rounded-full border-4 border-white/10 shadow-2xl bg-[#dfe5e7] dark:bg-[#2a3942]">
                                <User size={200} className="h-full w-full p-8 text-[#54656f] dark:text-[#aebac1]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full">
                        {isConnecting && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-[#25d366]/30 border-t-[#25d366] rounded-full animate-spin" />
                                    <p className="text-white text-sm font-medium tracking-widest uppercase">Establishing Connection</p>
                                </div>
                            </div>
                        )}
                        <video
                            playsInline
                            ref={userVideoRef}
                            autoPlay
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                {/* Local Video Overlay */}
                {!isVideoOff && (
                    <div className="absolute bottom-28 right-4 w-24 h-36 md:w-32 md:h-48 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black z-20">
                        <video
                            playsInline
                            muted
                            ref={myVideoRef}
                            autoPlay
                            className="h-full w-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#075e54]/95 backdrop-blur-md px-6 flex items-center justify-between z-30">
                <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-3.5 rounded-full transition-all active:scale-90 ${isSpeakerOn ? 'bg-white/20 text-white' : 'text-white/60'}`}
                >
                    <Volume2 size={24} />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-3.5 rounded-full transition-all active:scale-90 ${!isVideoOff ? 'bg-white/20 text-white' : 'text-white/60'}`}
                >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                    onClick={toggleMute}
                    className={`p-3.5 rounded-full transition-all active:scale-90 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={onEndCall}
                    className="p-4 rounded-full bg-red-600 text-white shadow-lg transition-all hover:bg-red-700 active:scale-90 transform"
                >
                    <PhoneOff size={28} />
                </button>
            </div>
        </div>
    );
}
