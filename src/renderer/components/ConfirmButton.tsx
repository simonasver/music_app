import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
    /** Dialog title (default: translated "Are you sure?") */
    confirmTitle?: string;
    /** Label for the confirm action button (default: translated "Confirm") */
    confirmLabel?: string;
    /** Label for the cancel button (default: translated "Cancel") */
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
    confirmTitle,
    confirmLabel,
    cancelLabel,
    onConfirm,
    variant,
    size,
    className,
}: ConfirmButtonProps) {
    const { t } = useTranslation();
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
                    <DialogTitle>{confirmTitle ?? t("common.areYouSure")}</DialogTitle>
                    <DialogDescription>{confirmText}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        {cancelLabel ?? t("common.cancel")}
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm}>
                        {confirmLabel ?? t("common.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
