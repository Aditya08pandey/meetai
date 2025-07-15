import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

const videoCallSchema = z.object({
  name: z.string().optional(),
});

interface NewVideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewVideoCallDialog = ({ open, onOpenChange }: NewVideoCallDialogProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const form = useForm<z.infer<typeof videoCallSchema>>({
    resolver: zodResolver(videoCallSchema),
    defaultValues: { name: "" },
  });

  const createCall = useMutation(
    trpc.videoCalls.createCall.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(trpc.videoCalls.getCalls.queryOptions());
        onOpenChange(false);
        router.push(`/video-calls/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const onSubmit = (values: z.infer<typeof videoCallSchema>) => {
    createCall.mutate(values);
  };

  return (
    <ResponsiveDialog
      title="Start New Video Call"
      description="Create a new free video call."
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Call Name (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Project Sync" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-x-2">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCall.isPending}>
              Start Call
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}; 