import Link from "next/link";
import Image from "next/image";
import { CallControls, SpeakerLayout } from "@stream-io/video-react-sdk";
import { MessageCircleIcon } from "lucide-react";

interface Props {
  onLeave: () => void;
  callName: string;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}

export const UserCallActive = ({ onLeave, callName, chatOpen, setChatOpen }: Props) => {
  // Remove invite-related state and logic

  return (
    <div className="flex flex-col justify-between p-4 h-full text-white">
      <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4">
        <Link href="/user-video-calls" className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit">
          <Image src="/logo.svg" width={22} height={22} alt="Logo" />
        </Link>
        <h4 className="text-base">{callName}</h4>
      </div>
      <SpeakerLayout />
      <div className="bg-[#101213] rounded-full px-4 flex items-center justify-center gap-2 mt-4">
        {/* Remove participants list */}
        <CallControls onLeave={onLeave} />
        <button
          className={`flex items-center justify-center rounded-full w-10 h-10 transition-all duration-200 focus:outline-none
            ${chatOpen
              ? 'bg-red-400 text-white'
              : 'bg-gray-300 text-black hover:bg-gray-400'}
          `}
          onClick={() => setChatOpen(!chatOpen)}
          aria-label={chatOpen ? "Close chat" : "Open chat"}
        >
          <MessageCircleIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}; 