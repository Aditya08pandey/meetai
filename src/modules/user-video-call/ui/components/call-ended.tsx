import Link from "next/link";
import { Button } from "@/components/ui/button";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export const UserCallEnded = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-radial from-green-900 to-green-950">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-white rounded-xl p-10 shadow-sm min-w-[350px]">
        <div className="flex flex-col gap-y-2 text-center">
          <h6 className="text-base font-normal">You have ended the call</h6>
          <p className="text-xl font-medium">Summary will appear in a few minutes</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700 text-white text-base font-semibold px-8 py-2 rounded-md">
          <Link href="/user-video-calls">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}; 