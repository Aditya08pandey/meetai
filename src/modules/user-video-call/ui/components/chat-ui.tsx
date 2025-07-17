import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Channel as StreamChannel } from "stream-chat";
import {
  useCreateChatClient,
  Chat,
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { useTRPC } from "@/trpc/client";
import { LoadingState } from "@/components/loading-state";
import "stream-chat-react/dist/css/v2/index.css";

interface ChatUIProps {
  callId: string;
  userId: string;
  userName: string;
  userImage?: string;
  onClose?: () => void; // Add onClose prop
}

export const UserVideoCallChatUI = ({ callId, userId, userName, userImage, onClose }: ChatUIProps) => {
  const trpc = useTRPC();
  const { mutateAsync: generateChatToken } = useMutation(trpc.userVideoCalls.generateChatToken.mutationOptions());
  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: generateChatToken,
    userData: {
      id: userId,
      name: userName,
      image: userImage,
    },
  });

  useEffect(() => {
    if (!client) return;
    const channel = client.channel("messaging", callId, {
      members: [userId],
    });
    setChannel(channel);
  }, [client, callId, userId]);

  if (!client) {
    return <LoadingState title="Loading Chat" description="This may take a few seconds" />;
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 z-50 bg-white rounded-l-lg border-l border-t border-b overflow-hidden max-w-md w-full shadow-lg flex flex-col" style={{ height: '100vh' }}>
      {/* Close button */}
      {onClose && (
        <button
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
          onClick={onClose}
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      )}
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <div className="flex-1 overflow-y-auto border-b" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <MessageList />
            </div>
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}; 