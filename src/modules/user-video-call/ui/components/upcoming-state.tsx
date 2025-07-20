import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { VideoIcon } from "lucide-react"

export const UserVideoCallUpcomingState = ({ onStart, onCancel }: { onStart: () => void; onCancel: () => void }) => (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-black">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-y-8 items-center justify-center min-w-[340px] max-w-md w-full">
            <EmptyState
                image="/upcoming.svg"
                title="Not started yet"
                description="Once you start this call, summary will appear here"
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
                <Button
                    className="w-full lg:w-auto"
                    onClick={onStart}
                >
                    <VideoIcon />
                    Start call
                </Button>
                <Button
                    className="w-full lg:w-auto"
                    variant="ghost"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </div>
    </div>
); 