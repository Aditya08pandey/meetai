"use client";

import { useIsMobile } from "@/hooks/use-mobile"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription

} from "@/components/ui/dialog"

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription

} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
    title: string;
    description: string;
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ResponsiveDialog = ({
    title,
    description,
    children,
    open,
    onOpenChange,
}: ResponsiveDialogProps) => {
    const isMobile = useIsMobile();

    if(isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                            <DrawerDescription>{description}</DrawerDescription>
                    </DialogHeader>
                    <div className="p-4">
                        {children}
                    </div>
                </DialogContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {children}
        </DialogContent>
    </Dialog>
    )
}