"use client";
import { useState, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  SearchIcon,
  ClockArrowUpIcon,
  LoaderIcon,
  CircleCheckIcon,
  CircleXIcon,
  CornerDownRightIcon,
  CopyIcon,
} from "lucide-react";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { NewVideoCallDialog } from "@/modules/user-video-call/ui/components/new-video-call-dialog";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import type { ColumnDef, CellContext } from "@tanstack/react-table";

interface UserVideoCall {
  id: string;
  name: string;
  createdByName?: string | null;
  scheduledAt?: string | null;
  status: "upcoming" | "active" | "completed" | "processing" | "cancelled";
  summary?: string | null;
  transcriptUrl?: string | null;
  joinToken: string;
  meetingUrl: string;
}

export default function UserVideoCallsPage() {
  const trpc = useTRPC();
  const { data: calls } = useQuery(trpc.userVideoCalls.list.queryOptions());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const router = useRouter();
  const { mutateAsync: verifyToken, isPending: isVerifying } = useMutation(
    trpc.userVideoCalls.verifyToken.mutationOptions()
  );
  const { data: session, isPending: isAuthPending } = authClient.useSession();

  useEffect(() => {
    if (!isAuthPending && !session) {
      router.replace("/sign-in");
    }
  }, [isAuthPending, session, router]);

  const handleJoinByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    try {
      const call = await verifyToken({ token: joinToken });
      setJoinDialogOpen(false);
      setJoinToken("");
      router.push(`/user-video-calls/${call.id}`);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        setJoinError((err as { message: string }).message);
      } else {
        setJoinError("Invalid or expired token");
      }
    }
  };

  // Filter calls by name (client-side for now)
  const filteredCalls =
    calls?.filter((call) =>
      call.name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  const statusIconMap = {
    upcoming: ClockArrowUpIcon,
    active: LoaderIcon,
    completed: CircleCheckIcon,
    processing: LoaderIcon,
    cancelled: CircleXIcon,
  };
  const statusColorMap = {
    upcoming: "bg-yellow-500/20 text-yellow-800 border-yellow-800/5",
    active: "bg-blue-500/20 text-blue-800 border-blue-800/5",
    completed: "bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
    processing: "bg-gray-300/20 text-gray-800 border-gray-800/5",
    cancelled: "bg-rose-500/20 text-rose-800 border-rose-800/5",
  };

  const columns: ColumnDef<UserVideoCall>[] = [
    {
      accessorKey: "name",
      header: "Call name",
      cell: (info: CellContext<UserVideoCall, unknown>) => {
        const call = info.row.original;
        return (
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold capitalize">{call.name}</span>
            <div className="flex items-center gap-x-2">
              <CornerDownRightIcon className="size-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
                {call.createdByName || "You"}
              </span>
              <GeneratedAvatar
                varient="botttsNeutral"
                seed={call.createdByName || "You"}
                className="size-4"
              />
              {call.scheduledAt && (
                <span className="text-sm text-muted-foreground">
                  {format(new Date(call.scheduledAt), "MMM d")}
                </span>
              )}
              {call.status === "completed" && call.summary && (
                <span className="text-xs text-green-700 ml-2">Summary ready</span>
              )}
              {call.status === "completed" && call.transcriptUrl && (
                <a
                  href={call.transcriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 underline ml-2"
                >
                  Transcript
                </a>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: CellContext<UserVideoCall, unknown>) => {
        const call = info.row.original;
        const Icon =
          statusIconMap[call.status as keyof typeof statusIconMap] || LoaderIcon;
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`capitalize [&>svg]:size-4 text-muted-foreground ${
                statusColorMap[call.status as keyof typeof statusColorMap]
              }`}
            >
              <Icon
                className={call.status === "processing" ? "animate-spin" : ""}
              />
              {call.status}
            </Badge>
          </div>
        );
      },
      meta: { align: "center" },
    },
    {
      id: "actions",
      header: "",
      cell: (info: CellContext<UserVideoCall, unknown>) => {
        const call = info.row.original;
        return (
          <div className="flex gap-2 items-center justify-end">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(call.joinToken);
                toast.success("Token copied!");
              }}
              title="Copy Token"
            >
              <CopyIcon className="w-4 h-4 mr-1" />
              Copy Token
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(call.meetingUrl);
                toast.success("URL copied!");
              }}
              title="Copy URL"
            >
              <CopyIcon className="w-4 h-4 mr-1" />
              Copy URL
            </Button>
          </div>
        );
      },
      meta: { align: "right" },
    },
  ];

  return (
    <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-xl">Video Calls</h5>
        <div className="flex gap-2">
          <Button
            onClick={() => setJoinDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Join Call
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon />
            New Call
          </Button>
        </div>
        <NewVideoCallDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        <ResponsiveDialog
          title="Join a Video Call"
          description="Paste your token here"
          open={joinDialogOpen}
          onOpenChange={setJoinDialogOpen}
        >
          <form className="space-y-4" onSubmit={handleJoinByToken}>
            <Input
              placeholder="Enter your join token"
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value)}
              disabled={isVerifying}
              required
            />
            {joinError && <div className="text-red-500 text-sm">{joinError}</div>}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setJoinDialogOpen(false)}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isVerifying || !joinToken}>
                Join
              </Button>
            </div>
          </form>
        </ResponsiveDialog>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Input
            placeholder="Filter by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-white w-[200px] pl-7"
          />
          <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow border p-0 min-h-[250px] flex flex-col justify-center">
        {calls === undefined ? (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <EmptyState
              image="/empty.svg"
              title="Loading your video calls..."
              description="Please wait while we load your video calls."
            />
          </div>
        ) : filteredCalls?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <div className="w-full flex justify-center">
              <div className="max-w-md w-full">
                <EmptyState
                  image="/empty.svg"
                  title="Create your first video call"
                  description="Create a video call to meet with others. Share the token or URL to invite participants."
                />
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            data={filteredCalls}
            columns={columns}
            onRowClick={(row) => {
              if (row.id) {
                window.location.assign(`/user-video-calls/${row.id}`);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
