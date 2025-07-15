import { LoaderIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTRPC } from "@/trpc/client";

import {
    Call,
    CallingState,
    StreamCall,
    StreamVideo,
    StreamVideoClient,
    getOrCreateInstance as getOrCreateStreamVideoClient,

} from "@stream-io/video-react-sdk";
import { useMutation } from "@tanstack/react-query";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { CallUI } from "./call-ui";


interface Props {
    meetingId: string;
    meetingName: string;
    userId: string; // This should be the unique user ID
    userName: string; // This should be the user's display name, not their ID
    userImage: string;
    onJoined?: () => void;
    endCallButton?: React.ReactNode;
    onEnded?: () => void;
    onLeave?: () => void;
    onEndCall?: () => void;
    isHost?: boolean;
}

export const CallConnect = ({
      meetingId,
    meetingName,
    userId,
    userName,
    userImage,
    onJoined,
    endCallButton,
    onEnded,
    onLeave,
    onEndCall,
    isHost
}: Props) => {
    const trpc = useTRPC();
    const {mutateAsync: generateToken} = useMutation(
        trpc.videoCalls.generateToken.mutationOptions(),
    );

    const [client, setClient] = useState<StreamVideoClient>();
    useEffect(() => {
      let isMounted = true;
      const createClient = async () => {
        const token = await generateToken({ callId: meetingId });
        if (!isMounted) return;
        const client = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
          user: { id: userId, name: userName, image: userImage },
          token,
        });
        setClient(client);
      };
      createClient();
      return () => {
        isMounted = false;
        if (client) client.disconnectUser();
        setClient(undefined);
      };
    }, [userId, userName, userImage, generateToken, meetingId]);

    const [call, setCall] = useState<Call>();
    useEffect(() => {
        if(!client) return;

        const _call = client.call("default", meetingId);
        _call.camera.disable();
        _call.microphone.disable();
        setCall(_call);

        return () => {
            if(_call.state.callingState !== CallingState.LEFT){
                _call.leave();
                _call.endCall();
                setCall(undefined);
            }
        }
    }, [client, meetingId]);

    if(!client || !call){
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white"/>
            </div>
        )
    }

    return (
       <StreamVideo client={client}>
        <StreamCall call={call}>
            {endCallButton}
            <CallUI meetingName={meetingName} onJoined={onJoined} onEnded={onEnded} onLeave={onLeave} onEndCall={onEndCall} isHost={isHost}/>
        </StreamCall>
       </StreamVideo>
    )
}