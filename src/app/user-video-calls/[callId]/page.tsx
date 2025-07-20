"use client";
import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StreamVideo, StreamCall, StreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { UserCallUI } from "@/modules/user-video-call/ui/components/call-ui";
import { authClient } from "@/lib/auth-client";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { UserVideoCallViewHeader } from "@/modules/user-video-call/ui/components/user-video-call-view-header";
import { useRouter } from "next/navigation";
import { UserVideoCallUpcomingState } from "@/modules/user-video-call/ui/components/upcoming-state";

export default function UserVideoCallRoom() {
  const { callId } = useParams();
  const trpc = useTRPC();
  const router = useRouter();
  const { data: call } = useQuery(trpc.userVideoCalls.get.queryOptions({ id: callId as string }));
  const { mutateAsync: generateToken } = useMutation(trpc.userVideoCalls.generateToken.mutationOptions());
  // Removed unused removeCall and confirmRemove
  const [client, setClient] = useState<StreamVideoClient>();
  const [callObj, setCallObj] = useState<Call>();
  const [forceShowLobby, setForceShowLobby] = useState(false);
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
  const { mutateAsync: updateCallStatus } = useMutation(trpc.userVideoCalls.update.mutationOptions());

  // Use authenticated user from session
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  useEffect(() => {
    if (!user) return;
    const _client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      user: { id: user.id, name: user.name, image: user.image ?? undefined },
      tokenProvider: async () => {
        const result = await generateToken();
        return result.token;
      },
    });
    setClient(_client);
    return () => {
      _client.disconnectUser();
      setClient(undefined);
    };
  }, [user, generateToken]);

  // Recreate callObj whenever client, callId, or show === 'lobby' changes
  useEffect(() => {
    if (!client || !callId) return;
    if (show === "lobby") {
      const _call = client.call("default", callId as string);
      setCallObj(_call);
    }
  }, [client, callId, show]);

  if (call === undefined) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-black">
        <LoadingState title="Loading Call" description="This may take a few seconds" />
      </div>
    );
  }
  if (call === null) {
    return <div className="flex flex-col items-center justify-center h-[60vh]"><div className="text-lg">Call not found.</div></div>;
  }
  if (call.status === "processing") {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-black">
        <EmptyState
          image="/processing.svg"
          title="Call completed"
          description="This call was completed, a summary will appear soon."
        />
      </div>
    );
  }
  if (call.status === "completed") {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 via-black to-black">
        <EmptyState
          image="/completed.svg"
          title="Call Summary"
          description={call.summary || "Summary will appear soon."}
        />
        {call.transcriptUrl && (
          <div className="mt-4 bg-white rounded-lg p-4 max-w-2xl w-full">
            <h3 className="font-semibold mb-2">Transcript</h3>
            <a href={call.transcriptUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">View Transcript</a>
          </div>
        )}
      </div>
    );
  }
  const handleStartCall = async () => {
    await updateCallStatus({ id: callId as string, status: "active" });
    setForceShowLobby(true);
    setShow("lobby");
  };
  if (call.status === "upcoming" && !forceShowLobby) {
    return <UserVideoCallUpcomingState onStart={handleStartCall} onCancel={() => router.push('/user-video-calls')} />;
  }
  if (isPending || !user || !client || !callObj) return <div className="flex flex-col items-center justify-center h-[60vh]"><div className="text-lg">Connecting...</div></div>;

  return (
    <>
      {/* Removed RemoveConfirmation */}
      <UserVideoCallViewHeader />
      <div className="w-screen h-screen bg-black">
        <StreamVideo client={client}>
          <StreamCall call={callObj}>
            <UserCallUI 
              callName={call.name} 
              show={show} 
              setShow={setShow}
            />
          </StreamCall>
        </StreamVideo>
      </div>
    </>
  );
} 