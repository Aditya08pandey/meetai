"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { LoadingState } from "@/components/loading-state";
import { authClient } from "@/lib/auth-client";

export default function JoinByTokenPage() {
  const { token } = useParams();
  const router = useRouter();
  const trpc = useTRPC();
  const { mutateAsync: verifyToken } = useMutation(trpc.userVideoCalls.verifyToken.mutationOptions());
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending: isAuthPending } = authClient.useSession();

  useEffect(() => {
    if (!isAuthPending && !session) {
      router.replace(`/sign-in?returnTo=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthPending, session, router]);

  useEffect(() => {
    if (!token || !session) return;
    verifyToken({ token: token as string })
      .then(call => {
        router.replace(`/user-video-calls/${call.id}`);
      })
      .catch(err => {
        setError(err.message || "Invalid or expired token");
      });
  }, [token, verifyToken, router, session]);

  if (isAuthPending || !session) {
    return <LoadingState title="Checking authentication" description="Please wait..." />;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center text-red-600 text-lg">{error}</div>;
  }

  return <LoadingState title="Joining Call" description="Please wait..." />;
} 