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
        console.log("Resetting WebRTC state");
        setReceivingCall(false);
        setCallAccepted(false);
        setCallEnded(false);
        setCaller("");
        setCallerSignal(null);
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped track: ${track.kind}`);
            });
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
            console.log("Incoming call from:", data.from, data.name);
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name);
            setCallerSignal(data.offer);
        });

        socket.on("call-answered", (data) => {
            console.log("Call answered, signaling peer...");
            setCallAccepted(true);
            if (connectionRef.current) {
                connectionRef.current.signal(data.answer);
            }
        });

        socket.on("ice-candidate", (data) => {
            console.log("Received ICE candidate, signaling peer...");
            if (connectionRef.current) {
                connectionRef.current.signal(data.candidate);
            }
        });

        socket.on("call-ended", () => {
            console.log("Call ended by remote user");
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
        console.log("Initiating call to:", id);
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
                    console.log("Peer signaling (Initiator):", data.type || "candidate");
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
                    console.log("Received remote stream (Initiator)");
                    if (userVideo.current) userVideo.current.srcObject = remoteStream;
                });

                peer.on("error", (err) => console.error("Peer error (Initiator):", err));
                peer.on("close", () => console.log("Peer connection closed (Initiator)"));

                connectionRef.current = peer;
            })
            .catch(err => {
                console.error("Failed to get local stream", err);
                alert("Could not access camera/microphone. Please check permissions.");
            });
    };

    const answerCall = () => {
        console.log("Answering call from:", caller);
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
                    console.log("Peer signaling (Receiver):", data.type || "candidate");
                    if (data.type === 'answer') {
                        socket?.emit("answer-call", { answer: data, to: caller });
                    } else if ((data as any).candidate) {
                        socket?.emit("ice-candidate", { to: caller, candidate: (data as any).candidate });
                    }
                });

                peer.on("stream", (remoteStream) => {
                    console.log("Received remote stream (Receiver)");
                    if (userVideo.current) userVideo.current.srcObject = remoteStream;
                });

                peer.on("error", (err) => console.error("Peer error (Receiver):", err));
                peer.on("close", () => console.log("Peer connection closed (Receiver)"));

                if (callerSignal) {
                    console.log("Signaling caller's offer to peer...");
                    peer.signal(callerSignal);
                }
                connectionRef.current = peer;
            })
            .catch(err => {
                console.error("Failed to get local stream", err);
                alert("Could not access camera/microphone. Please check permissions.");
            });
    };

    const leaveCall = () => {
        console.log("Leaving call...");
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
