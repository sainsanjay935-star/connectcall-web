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
        console.log("Resetting WebRTC state and stopping tracks");
        setReceivingCall(false);
        setCallAccepted(false);
        setCallEnded(false);
        setCaller("");
        setCallerSignal(null);

        if (connectionRef.current) {
            try {
                connectionRef.current.destroy();
            } catch (e) {
                console.error("Error destroying peer:", e);
            }
            connectionRef.current = null;
        }

        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped track: ${track.kind} (${track.label})`);
            });
            setStream(null);
        }

        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;
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

        // Unified signaling listener (Answers and ICE Candidates)
        socket.on("call-signal", (data) => {
            if (!data.signal) return;

            // Defensive: Check if candidate signals are malformed
            if (!data.signal.type && !data.signal.candidate && data.signal.candidate !== "") {
                console.log("[RTC] Received potentially malformed signal, skipping:", data.signal);
                return;
            }

            console.log(`[RTC] Received call-signal: ${data.signal.type || "candidate"} from ${data.from}`);

            // Critical: If initiator receives 'answer', transition to callAccepted
            if (data.signal.type === 'answer') {
                console.log("[RTC] Setting callAccepted to true for initiator");
                setCallAccepted(true);
            }

            if (connectionRef.current && !connectionRef.current.destroyed) {
                try {
                    connectionRef.current.signal(data.signal);
                } catch (e) {
                    console.error("[RTC] Error applying signal to peer:", e);
                }
            } else {
                console.log("[RTC] Peer not ready or destroyed, ignoring signal");
            }
        });

        socket.on("call-ended", () => {
            console.log("Call ended notice from server/remote");
            resetState();
        });

        return () => {
            socket.off("incoming-call");
            socket.off("call-signal");
            socket.off("call-ended");
        };
    }, [socket, resetState]);

    const peerOptions = {
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                // Note: In production, you should add YOUR TURN server here
                // {
                //     urls: 'turn:your-turn-server.com',
                //     username: 'username',
                //     credential: 'password'
                // }
            ]
        },
        trickle: true,
    };

    const callUser = (id: string) => {
        console.log("[RTC] Initiating call to:", id);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;

                const peer = new Peer({
                    initiator: true,
                    stream: currentStream,
                    ...peerOptions
                });

                // Debug ICE Connection State
                const pc = (peer as any)._pc as RTCPeerConnection;
                if (pc) {
                    pc.oniceconnectionstatechange = () => {
                        console.log(`[RTC] ICE State (Initiator): ${pc.iceConnectionState}`);
                    };
                }

                peer.on("signal", (data: any) => {
                    console.log("[RTC] Signaling (Initiator):", data.type || "candidate");

                    // Defensive: Clean candidate signals
                    if (data.candidate) {
                        if (!data.candidate.candidate && data.candidate.candidate !== "") {
                            console.warn("[RTC] Suppressing empty initiator candidate");
                            return;
                        }
                    }

                    if (data.type === 'offer') {
                        socket?.emit("call-user", {
                            to: id,
                            offer: data,
                            from: user?.id,
                            name: user?.username,
                        });
                    } else {
                        socket?.emit("call-signal", { to: id, signal: data });
                    }
                });

                peer.on("stream", (remoteStream) => {
                    console.log("[RTC] Received remote stream:", remoteStream.id);
                    remoteStream.getTracks().forEach(track => {
                        console.log(`[RTC] Track: ${track.kind}, ID: ${track.id}, Enabled: ${track.enabled}, ReadyState: ${track.readyState}`);
                    });
                    if (userVideo.current) {
                        userVideo.current.srcObject = remoteStream;
                        userVideo.current.play().catch(e => console.error("[RTC] Error playing remote video:", e));
                    }
                    setCallAccepted(true); // Ensure state transition on stream reception
                });

                peer.on("error", (err: any) => {
                    console.error("[RTC] Peer error (Initiator):", err);
                    if (err.code === 'ERR_DATA_CHANNEL') return;
                    resetState();
                });

                peer.on("close", () => {
                    console.log("[RTC] Peer connection closed (Initiator)");
                    resetState();
                });

                connectionRef.current = peer;
            })
            .catch(err => {
                console.error("[RTC] Failed to get local stream", err);
                alert("Could not access camera/microphone. Please check permissions.");
                resetState();
            });
    };

    const answerCall = () => {
        console.log("[RTC] Answering call from:", caller);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;

                const peer = new Peer({
                    initiator: false,
                    stream: currentStream,
                    ...peerOptions
                });

                const pc = (peer as any)._pc as RTCPeerConnection;
                if (pc) {
                    pc.oniceconnectionstatechange = () => {
                        console.log(`[RTC] ICE State (Receiver): ${pc.iceConnectionState}`);
                    };
                }

                peer.on("signal", (data: any) => {
                    console.log("[RTC] Signaling (Receiver):", data.type || "candidate");

                    if (data.candidate && !data.candidate.candidate && data.candidate.candidate !== "") {
                        return;
                    }

                    socket?.emit("call-signal", { to: caller, signal: data });
                });

                peer.on("stream", (remoteStream) => {
                    console.log("[RTC] Received remote stream:", remoteStream.id);
                    console.log("[RTC] Tracks visibility:", remoteStream.getTracks().map(t => `${t.kind}: ${t.enabled ? 'enabled' : 'disabled'}`));
                    if (userVideo.current) {
                        userVideo.current.srcObject = remoteStream;
                        userVideo.current.play().catch(e => console.error("[RTC] Error playing remote video:", e));
                    }
                    setCallAccepted(true);
                });

                peer.on("error", (err: any) => {
                    console.error("[RTC] Peer error (Receiver):", err);
                    resetState();
                });

                peer.on("close", () => {
                    console.log("[RTC] Peer connection closed (Receiver)");
                    resetState();
                });

                if (callerSignal) {
                    console.log("[RTC] Applying initial offer to receiver peer...");
                    try {
                        peer.signal(callerSignal);
                    } catch (e) {
                        console.error("[RTC] Error applying initial offer:", e);
                    }
                }
                connectionRef.current = peer;
            })
            .catch(err => {
                console.error("[RTC] Failed to get local stream on answer", err);
                alert("Could not access camera/microphone to answer call.");
                resetState();
            });
    };

    const leaveCall = () => {
        console.log("Leaving call...");
        const target = otherUserId || caller;
        if (target) {
            socket?.emit("end-call", { to: target });
        }
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
