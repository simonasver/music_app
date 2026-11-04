import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface DropPanelProps {
    title: string;
    onDropFile: (file: File) => void;
    disabled?: boolean;
    children: React.ReactNode;
}

export function DropPanel({ title, onDropFile, disabled, children }: DropPanelProps) {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && !disabled) onDropFile(file);
    }

    return (
        <section
            className={cn(
                "relative flex flex-col gap-3 min-h-0 rounded-lg border-2 border-dashed border-border p-4 transition-colors",
                isDragOver && "border-primary bg-primary/5",
            )}
            onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setIsDragOver(true);
            }}
            onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
            }}
            onDrop={handleDrop}
        >
            <h2 className="text-sm font-medium">{title}</h2>
            {children}
            {isDragOver && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 pointer-events-none">
                    <p className="text-sm font-medium text-primary">{t("common.dropFile")}</p>
                </div>
            )}
        </section>
    );
}
