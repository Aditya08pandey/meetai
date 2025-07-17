import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useRouter } from "next/navigation";
import { UserVideoCallForm } from "./user-video-call-form";

interface NewVideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewVideoCallDialog = ({ open, onOpenChange }: NewVideoCallDialogProps) => {
  const router = useRouter();
  return (
    <ResponsiveDialog
      title="New Video Call"
      description="Create a new video call"
      open={open}
      onOpenChange={onOpenChange}
    >
      <UserVideoCallForm
        onSuccess={(id) => {
          onOpenChange(false);
          router.push(`/user-video-calls/${id}`);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
}; 