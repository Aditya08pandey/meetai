"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const HomeView = () => {
  const router = useRouter();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 px-4">
      <div className="flex flex-col items-center gap-6 max-w-xl text-center">
        <Image src="/logo.svg" alt="MeetAI Logo" width={80} height={80} className="mb-2 drop-shadow-lg" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
          Welcome to <span className="text-primary">MeetAI</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mt-2 mb-4">
          Your intelligent meeting assistant. Effortlessly organize, join, and review meetings with AI-powered insights and seamless collaboration.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push("/agents")}>Create Your Agent</Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/meetings")}>Explore Meetings</Button>
        </div>
      </div>
    </div>
  );
}
