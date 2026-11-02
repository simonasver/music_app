import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isMediaFileName } from "@shared/media";

function getMediaPath(files: FileList): string | null {
    const file = files[0];
    return isMediaFileName(file.name) ? window.electronAPI.getPathForFile(file) : null;
}

interface FileDropZoneProps {
    onFile: (path: string) => void;
}

export function FileDropZone({ onFile }: FileDropZoneProps) {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);

    async function handleSelectFile() {
        const selected = await window.electronAPI.selectMediaFile();
        if (!selected) return;
        onFile(selected);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const path = getMediaPath(e.dataTransfer.files);
        if (path) onFile(path);
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center flex-1 gap-3 rounded-lg border-2 border-dashed border-transparent transition-colors",
                isDragOver && "border-primary bg-primary/5",
            )}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            <Button size="lg" onClick={handleSelectFile}>
                {t("trimmer.selectFile")}
            </Button>
            <p className="text-sm text-muted-foreground">{t("trimmer.supportedFormats")}</p>
            {isDragOver && (
                <p className="text-sm font-medium text-primary">{t("common.dropFile")}</p>
            )}
        </div>
    );
}
