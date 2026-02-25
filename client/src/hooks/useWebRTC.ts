"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

export const useWebRTC = (otherUserId: string | null) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState<any>();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);

    const resetState = useCallback(() => {
        setReceivingCall(false);
        setCallAccepted(false);
        setCallEnded(false);
        setCaller("");
        setCallerSignal(null);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (connectionRef.current) {
            connectionRef.current.destroy();
            connectionRef.current = null;
        }
    }, [stream]);

    useEffect(() => {
        if (!socket) return;

        socket.on("incoming-call", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name);
            setCallerSignal(data.offer);
        });

        socket.on("call-answered", (data) => {
            setCallAccepted(true);
            if (connectionRef.current) {
                connectionRef.current.signal(data.answer);
            }
        });

        socket.on("ice-candidate", (data) => {
            if (connectionRef.current) {
                connectionRef.current.signal(data.candidate);
            }
        });

        socket.on("call-ended", () => {
            resetState();
        });

        return () => {
            socket.off("incoming-call");
            socket.off("call-answered");
            socket.off("ice-candidate");
            socket.off("call-ended");
        };
    }, [socket, resetState]);

    const peerOptions = {
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
            ]
        },
        trickle: true,
    };

    const callUser = (id: string) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;

                const peer = new Peer({
                    initiator: true,
                    stream: currentStream,
                    ...peerOptions
                });

                peer.on("signal", (data) => {
                    if (data.type === 'offer') {
                        socket?.emit("call-user", {
                            to: id,
                            offer: data,
                            from: user?.id,
                            name: user?.username,
                        });
                    } else if ((data as any).candidate) {
                        socket?.emit("ice-candidate", { to: id, candidate: (data as any).candidate });
                    }
                });

                peer.on("stream", (remoteStream) => {
                    if (userVideo.current) userVideo.current.srcObject = remoteStream;
                });

                connectionRef.current = peer;
            })
            .catch(err => console.error("Failed to get local stream", err));
    };

    const answerCall = () => {
        setCallAccepted(true);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;

                const peer = new Peer({
                    initiator: false,
                    stream: currentStream,
                    ...peerOptions
                });

                peer.on("signal", (data) => {
                    if (data.type === 'answer') {
                        socket?.emit("answer-call", { answer: data, to: caller });
                    } else if ((data as any).candidate) {
                        socket?.emit("ice-candidate", { to: caller, candidate: (data as any).candidate });
                    }
                });

                peer.on("stream", (remoteStream) => {
                    if (userVideo.current) userVideo.current.srcObject = remoteStream;
                });

                if (callerSignal) {
                    peer.signal(callerSignal);
                }
                connectionRef.current = peer;
            })
            .catch(err => console.error("Failed to get local stream", err));
    };

    const leaveCall = () => {
        socket?.emit("end-call", { to: otherUserId || caller });
        resetState();
    };

    return {
        stream,
        myVideo,
        userVideo,
        receivingCall,
        caller,
        callerSignal,
        callAccepted,
        callEnded,
        callUser,
        answerCall,
        leaveCall,
        setName,
        name
    };
};
