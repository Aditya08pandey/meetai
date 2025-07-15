"use client";

import { Button } from "@/components/ui/button";
import { VideoIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { NewVideoCallDialog } from "@/modules/call/ui/components/new-video-call-dialog";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { DataPagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { LoaderIcon, CircleCheckIcon, CircleXIcon, ClockFadingIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const statusIconMap = {
  active: LoaderIcon,
  processing: ClockFadingIcon,
  completed: CircleCheckIcon,
};
const statusColorMap = {
  active: "bg-blue-500/20 text-blue-800 border-blue-800/5",
  processing: "bg-gray-300/20 text-gray-800 border-gray-800/5",
  completed: "bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
};

const columns = [
  {
    accessorKey: "name",
    header: "Call Name",
    cell: ({ row }) => (
      <span className="font-semibold capitalize">
        {row.original.name || <span className="italic text-muted-foreground">Untitled</span>}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const Icon = statusIconMap[row.original.status] || CircleXIcon;
      return (
        <Badge
          variant="outline"
          className={
            "capitalize [&>svg]:size-4 text-muted-foreground " +
            (statusColorMap[row.original.status] || "bg-gray-200 text-gray-800")
          }
        >
          <Icon className={row.original.status === "active" ? "animate-spin" : ""} />
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.createdAt ? format(new Date(row.original.createdAt), "PPpp") : "-"}
      </span>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const session = authClient.useSession().data;
      const queryClient = useQueryClient();
      const trpc = useTRPC();
      const completeCall = useMutation(trpc.videoCalls.completeCall.mutationOptions({
        onSuccess: async () => {
          await queryClient.invalidateQueries(trpc.videoCalls.getCalls.queryOptions());
        },
      }));
      const removeCall = useMutation(trpc.videoCalls.removeCall.mutationOptions({
        onSuccess: async () => {
          await queryClient.invalidateQueries(trpc.videoCalls.getCalls.queryOptions());
        },
      }));
      const isHost = session?.user?.id === row.original.hostId;
      const isActive = row.original.status === "active";
      return (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" disabled={row.original.status === "completed"}>
            <Link href={`/video-calls/${row.original.id}`}>
              {row.original.status === "completed" ? "Ended" : <>Join <ArrowRightIcon className="ml-1 w-4 h-4 inline" /></>}
            </Link>
          </Button>
          {isHost && isActive && (
            <Button
              size="sm"
              variant="destructive"
              disabled={completeCall.isPending}
              onClick={() => completeCall.mutate({ callId: row.original.id })}
              data-end-call
            >
              {completeCall.isPending ? "Ending..." : "End Call"}
            </Button>
          )}
          {isHost && row.original.status === "completed" && (
            <Button
              size="sm"
              variant="destructive"
              disabled={removeCall.isPending}
              onClick={() => removeCall.mutate({ callId: row.original.id })}
              data-delete-call
            >
              {removeCall.isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      );
    },
  },
];

// Stub search filter for now
const VideoCallsSearchFilter = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="relative">
    <input
      placeholder="Filter by name"
      className="h-9 bg-white w-[200px] pl-7 rounded border border-gray-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {/* Add search icon if desired */}
  </div>
);

const PAGE_SIZE = 10;

const VideoCallsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const trpc = useTRPC();
  const { data: calls = [], isLoading } = useQuery(trpc.videoCalls.getCalls.queryOptions());

  // Filter calls by name
  const filteredCalls = calls.filter((call) =>
    call.name?.toLowerCase().includes(search.toLowerCase()) || (!call.name && "untitled".includes(search.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));
  const paginatedCalls = filteredCalls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <div className="py-4 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">My Free Video Calls</h5>
          <Button onClick={() => setIsDialogOpen(true)}>Start New Call</Button>
        </div>
        <div className="flex items-center gap-x-2 p-1">
          <VideoCallsSearchFilter value={search} onChange={setSearch} />
        </div>
      </div>
      <NewVideoCallDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading calls...</div>
      ) : filteredCalls.length === 0 ? (
        <EmptyState
          title="Create your first free video call"
          description="Start a free video call to connect with others. Each call lets you collaborate, share ideas, and interact in real time."
        />
      ) : (
        <>
          <DataTable
            data={paginatedCalls}
            columns={columns}
            onRowClick={(row, event) => {
              // Prevent redirect if End Call or Delete button was clicked
              if (event?.target && (
                (event.target as HTMLElement).closest('button[data-end-call]') ||
                (event.target as HTMLElement).closest('button[data-delete-call]')
              )) {
                return;
              }
              window.location.href = `/video-calls/${row.id}`;
            }}
          />
          <DataPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default VideoCallsPage; 