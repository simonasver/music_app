import React, { useState } from "react";
import { Button, type ButtonProps } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog";

interface ConfirmButtonProps {
    children: React.ReactNode;
    /** Message shown in the dialog */
    confirmText: string;
    /** Dialog title (default: "Are you sure?") */
    confirmTitle?: string;
    /** Label for the confirm action button (default: "Confirm") */
    confirmLabel?: string;
    /** Label for the cancel button (default: "Cancel") */
    cancelLabel?: string;
    /** Called when the user confirms */
    onConfirm: () => void | Promise<void>;
    /** Variant for the trigger button */
    variant?: ButtonProps["variant"];
    size?: ButtonProps["size"];
    className?: string;
}

export function ConfirmButton({
    children,
    confirmText,
    confirmTitle = "Are you sure?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    variant,
    size,
    className,
}: ConfirmButtonProps) {
    const [open, setOpen] = useState(false);

    async function handleConfirm() {
        await onConfirm();
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={() => setOpen(true)}
            >
                {children}
            </Button>
            <DialogContent className="w-80">
                <DialogHeader>
                    <DialogTitle>{confirmTitle}</DialogTitle>
                    <DialogDescription>{confirmText}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        {cancelLabel}
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
