import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { UserCallLobby } from "./call-lobby";
import { UserCallActive } from "./call-active";
import { UserCallEnded } from "./call-ended";
import { UserVideoCallChatUI } from "./chat-ui";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useParams } from "next/navigation";

interface Props {
  callName: string;
  show: "lobby" | "call" | "ended";
  setShow: (show: "lobby" | "call" | "ended") => void;
}

export const UserCallUI = ({ callName, show, setShow }: Props) => {
  const call = useCall();
  const [chatOpen, setChatOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { callId } = useParams();

  const handleJoin = async () => {
    if (!call) return;
    await call.camera.disable(); // Ensure video is off by default
    await call.microphone.disable(); // Ensure audio is off by default
    await call.join();
    setShow("call");
  };

  const handleLeave = () => {
    if (!call) return;
    call.endCall();
    setShow("ended");
  };

  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <UserCallLobby onJoin={handleJoin} />}
      {show === "call" && (
        <>
          <UserCallActive onLeave={handleLeave} callName={callName} chatOpen={chatOpen} setChatOpen={setChatOpen} />
          {chatOpen && user && callId && (
            <UserVideoCallChatUI
              callId={callId as string}
              userId={user.id}
              userName={user.name}
              userImage={user.image ?? undefined}
              onClose={() => setChatOpen(false)}
            />
          )}
        </>
      )}
      {show === "ended" && <UserCallEnded />}
    </StreamTheme>
  );
} 