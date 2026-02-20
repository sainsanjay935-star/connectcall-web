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
    const connectionRef = useRef<Peer.Instance>();

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
            connectionRef.current?.signal(data.answer);
        });

        socket.on("ice-candidate", (data) => {
            connectionRef.current?.signal(data.candidate);
        });

        socket.on("call-ended", () => {
            setCallEnded(true);
            connectionRef.current?.destroy();
        });

        return () => {
            socket.off("incoming-call");
            socket.off("call-answered");
            socket.off("ice-candidate");
            socket.off("call-ended");
        };
    }, [socket]);

    const callUser = (id: string) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: currentStream,
            });

            peer.on("signal", (data) => {
                socket?.emit("call-user", {
                    to: id,
                    offer: data,
                    from: user?.id,
                    name: user?.username,
                });
            });

            peer.on("stream", (currentStream) => {
                if (userVideo.current) userVideo.current.srcObject = currentStream;
            });

            connectionRef.current = peer;
        });
    };

    const answerCall = () => {
        setCallAccepted(true);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: currentStream,
            });

            peer.on("signal", (data) => {
                socket?.emit("answer-call", { answer: data, to: caller });
            });

            peer.on("stream", (currentStream) => {
                if (userVideo.current) userVideo.current.srcObject = currentStream;
            });

            peer.signal(callerSignal);
            connectionRef.current = peer;
        });
    };

    const leaveCall = () => {
        setCallEnded(true);
        connectionRef.current?.destroy();
        socket?.emit("end-call", { to: otherUserId });
        window.location.reload();
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
