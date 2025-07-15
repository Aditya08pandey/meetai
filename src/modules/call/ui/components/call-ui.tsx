import { useState, useEffect, useRef } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

interface Props {
    meetingName: string;
    onJoined?: () => void;
    onEnded?: () => void;
    onLeave?: () => void;
    onEndCall?: () => void;
    isHost?: boolean;
}

export const CallUI = ({meetingName, onJoined, onEnded, onLeave, onEndCall, isHost}: Props) => {
    const call = useCall();
    const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
    const [isJoining, setIsJoining] = useState(false);
    const hasCalledOnEnded = useRef(false);

    useEffect(() => {
      if (show === "ended" && onEnded && !hasCalledOnEnded.current) {
        hasCalledOnEnded.current = true;
        onEnded();
      }
    }, [show, onEnded]);

    const handleJoin = async() => {
        if(!call || isJoining || call.state.callingState === "joined") return;
        setIsJoining(true);
        try {
            await call.join();
            setShow("call");
            if (onJoined) onJoined();
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeave = () => {
        if (onLeave) {
            onLeave();
        } else if (call) {
            call.leave();
            setShow("ended");
        }
    };

    const handleEndCall = () => {
        if (onEndCall) {
            onEndCall();
        } else if (call) {
            call.endCall();
            setShow("ended");
        }
    };

    return (
        <StreamTheme className="h-full">
            {show === "lobby" && <CallLobby onJoin={handleJoin} isJoining={isJoining}/>} 
            {show === "call" && <CallActive onLeave={handleLeave} onEndCall={isHost ? handleEndCall : undefined} isHost={isHost} meetingName={meetingName}/>} 
            {show === "ended" && !onEnded && <CallEnded/>}
        </StreamTheme>
    );
};