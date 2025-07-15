

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";


import "@stream-io/video-react-sdk/dist/css/styles.css";


export const CallEnded = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
            <div className="flex flex-1 items-center justify-center w-full">
                <div className="flex flex-col items-center justify-center gap-y-6 bg-white/10 rounded-2xl p-10 shadow-2xl w-full max-w-md">
                    <CheckCircle2 className="w-16 h-16 text-green-400 mb-2" />
                    <h2 className="text-2xl font-bold text-white mb-1">Call Ended</h2>
                    <p className="text-white/80 text-center mb-4">Thank you for using Free Video Call.<br/>A summary will appear soon.</p>
                    <Button asChild className="w-full max-w-xs text-base py-2">
                        <Link href="/video-calls">Return to Video Calls</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};