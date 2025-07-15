"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";
import { CallConnect } from "@/modules/call/ui/components/call-connect";
import Image from "next/image";
import { useCall } from "@stream-io/video-react-sdk";
import { CheckCircle2 } from "lucide-react";

const FreeCallLobby = ({ onStart, inviteUrl, isHost, onEndCall, ending }: { onStart: () => void; inviteUrl: string; isHost?: boolean; onEndCall?: () => void; ending?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [inviteUrl]);
  const handleCancel = () => {
    window.location.href = '/video-calls';
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="flex flex-col items-center mb-8">
        <img src="/logo.svg" alt="Logo" className="w-14 h-14 mb-2" />
        <span className="text-2xl font-bold text-white tracking-wide">MeetAI</span>
      </div>
      <div className="bg-white/10 rounded-2xl p-10 flex flex-col items-center gap-8 shadow-xl w-full max-w-md">
        <div className="text-white text-2xl font-semibold mb-2 text-center">Ready to start your call?</div>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-4 justify-center">
            <button
              onClick={onStart}
              className="px-6 py-2 rounded bg-primary text-white text-base font-medium hover:bg-primary/80 transition-colors"
            >
              Start Meeting
            </button>
            <button
              onClick={handleCopy}
              className="px-6 py-2 rounded bg-white/20 text-white text-base font-medium hover:bg-white/30 transition-colors"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 rounded bg-white/20 text-white text-base font-medium hover:bg-red-600 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {isHost && (
              <button
                onClick={onEndCall}
                disabled={ending}
                className="px-6 py-2 rounded bg-rose-600 text-white text-base font-medium hover:bg-rose-700 transition-colors"
              >
                {ending ? "Ending..." : "End Call"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FreeCallEnded = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-white/10 rounded-2xl p-10 shadow-2xl w-full max-w-md">
        <CheckCircle2 className="w-16 h-16 text-green-400 mb-2" />
        <h2 className="text-2xl font-bold text-white mb-1">Call Ended</h2>
        <p className="text-white/80 text-center mb-4">Thank you for using Free Video Call.<br/>A summary will appear soon.</p>
        <button onClick={() => window.location.href = '/video-calls'} className="w-full max-w-xs text-base py-2 rounded bg-primary text-white font-semibold hover:bg-primary/80 transition-colors">Return to Video Calls</button>
      </div>
    </div>
  </div>
);

const VideoCallRoomPage = () => {
  const params = useParams();
  const router = useRouter();
  const callId = typeof params.callId === "string" ? params.callId : Array.isArray(params.callId) ? params.callId[0] : "";
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const [inLobby, setInLobby] = useState(true);
  const [showEnded, setShowEnded] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const hasAttemptedJoin = useRef(false);
  const call = useCall();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      const redirectUrl = `/sign-in?redirect=/video-calls/${callId}`;
      router.replace(redirectUrl);
    }
  }, [isSessionLoading, session, callId, router]);

  const { data: calls, isLoading, error } = useQuery(
    trpc.videoCalls.getCalls.queryOptions(),
  );

  // Always fetch the call by ID for display
  const { data: callById, refetch: refetchCallById } = useQuery({
    queryKey: ["videoCalls.getCallById", callId],
    queryFn: () => trpc.videoCalls.getCallById.query({ callId }),
    enabled: !!callId,
  });

  // Find the current call from the user's calls or by ID
  const safeCalls = Array.isArray(calls) ? calls : [];
  let currentCall = safeCalls.find((c) => c.id === callId);
  if (!currentCall && callById) {
    currentCall = callById;
  }

  // After login, always attempt to join the call (unless completed)
  useEffect(() => {
    if (callId && currentCall && !hasJoined && !hasAttemptedJoin.current && currentCall.status !== "completed") {
      hasAttemptedJoin.current = true;
      joinCall.mutate({ callId }, {
        onSuccess: () => {
          setHasJoined(true);
          refetchCallById();
        },
        onError: () => {
          setHasJoined(false);
        },
      });
    }
  }, [callId, currentCall, hasJoined]);

  const joinCall = useMutation(trpc.videoCalls.joinCall.mutationOptions());
  const completeCall = useMutation(trpc.videoCalls.completeCall.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.videoCalls.getCalls.queryOptions());
      setShowEnded(true);
    },
  }));

  useEffect(() => {
    if (callId) {
      joinCall.mutate({ callId });
    }
  }, [callId]);

  // Listen for call end event from Stream Video and trigger backend + end screen
  useEffect(() => {
    if (!call) return;
    const handleCallEnded = async () => {
      // Mark as completed in backend if not already
      if (currentCall && currentCall.status !== "completed") {
        await completeCall.mutateAsync({ callId });
      }
      setShowEnded(true);
    };
    call.on("call.ended", handleCallEnded);
    return () => {
      call.off("call.ended", handleCallEnded);
    };
  }, [call, callId, completeCall, currentCall]);

  // Poll for call status every 2 seconds
  useEffect(() => {
    if (!callId) return;
    const interval = setInterval(async () => {
      const { data: updated } = await refetchCallById();
      if (updated?.status === "completed") {
        setShowEnded(true);
        if (call) call.leave();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [callId, call, refetchCallById]);

  // Add a handler to update status and show end screen when the UI state changes to ended
  const handleCallEndedUI = async () => {
    if (currentCall && currentCall.status !== "completed") {
      await completeCall.mutateAsync({ callId });
    }
    setShowEnded(true);
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderIcon className="size-6 animate-spin" />
        <span className="ml-2">Loading call...</span>
      </div>
    );
  }

  if (error || !calls || !session?.user) {
    return <div className="p-8 text-center text-red-500">Call not found.</div>;
  }

  // Show ended message if call is completed
  if (currentCall && (currentCall.status === "completed" || showEnded)) {
    return <FreeCallEnded />;
  }

  const inviteUrl = typeof window !== "undefined" ? window.location.href : "";

  // Show lobby until user clicks Start Meeting
  if (inLobby) {
    const isHost = session.user.id === currentCall.hostId;
    // Debug logs for host check
    console.log("session.user.id", session?.user?.id);
    console.log("currentCall.hostId", currentCall?.hostId);
    console.log("isHost", isHost);
    return (
      <FreeCallLobby
        onStart={() => setInLobby(false)}
        inviteUrl={inviteUrl}
        isHost={isHost}
        onEndCall={() => completeCall.mutate({ callId })}
        ending={completeCall.isPending}
      />
    );
  }
  // After Start Meeting, show immersive call UI with custom end logic
  if (showEnded) {
    return <FreeCallEnded />;
  }
  // Remove custom End Call button from CallConnect, only use default Stream button
  const isHost = session?.user?.id === currentCall?.hostId;
  const handleLeave = () => {
    if (call) call.leave();
    setShowEnded(false); // participant can rejoin if call not completed
    router.push("/video-calls");
  };
  const handleEndCall = async () => {
    if (!isHost) return;
    await completeCall.mutateAsync({ callId });
    if (call) call.leave();
    setShowEnded(true);
  };
  return (
    <div className="h-screen bg-black">
      <CallConnect
        meetingId={currentCall.id}
        meetingName={currentCall.name || "Untitled Video Call"}
        userId={session.user.id}
        userName={session.user.name} // Pass display name, not user ID
        userImage={session.user.image || ""}
        onEnded={handleCallEndedUI}
        isHost={isHost}
        onLeave={handleLeave}
        onEndCall={handleEndCall}
      />
    </div>
  );
};

export default VideoCallRoomPage; 