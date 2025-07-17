import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const userVideoCallSchema = z.object({
  name: z.string().min(1, "Name is required"),
  scheduledAt: z.string().optional(),
});

interface UserVideoCallFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}

export const UserVideoCallForm = ({ onSuccess, onCancel }: UserVideoCallFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createCall = useMutation(trpc.userVideoCalls.create.mutationOptions({
    onSuccess: async (data) => {
      await queryClient.invalidateQueries(trpc.userVideoCalls.list.queryOptions());
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const form = useForm<z.infer<typeof userVideoCallSchema>>({
    resolver: zodResolver(userVideoCallSchema),
    defaultValues: {
      name: "",
      scheduledAt: "",
    },
  });

  const isPending = createCall.isPending;

  const onSubmit = (values: z.infer<typeof userVideoCallSchema>) => {
    createCall.mutate({
      name: values.name,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt) : undefined,
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Project Sync" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="scheduledAt"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
}; 