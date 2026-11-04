import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { isThumbnailSupported } from "@shared/media";
import { DropPanel } from "./DropPanel";

interface MediaFileCardProps {
    mediaPath: string | null;
    onFile: (path: string) => void;
    disabled: boolean;
}

function useCurrentCover(mediaPath: string | null) {
    const [cover, setCover] = useState<{ path: string; url: string | null } | null>(null);

    useEffect(() => {
        if (!mediaPath) return;
        let cancelled = false;
        window.electronAPI
            .getThumbnail(mediaPath)
            .catch(() => null)
            .then((url) => {
                if (!cancelled) setCover({ path: mediaPath, url });
            });
        return () => {
            cancelled = true;
        };
    }, [mediaPath]);

    // undefined while loading, null when the file has no cover
    return cover?.path === mediaPath ? cover.url : undefined;
}

export function MediaFileCard({ mediaPath, onFile, disabled }: MediaFileCardProps) {
    const { t } = useTranslation();
    const [isRejected, setIsRejected] = useState(false);
    const coverUrl = useCurrentCover(mediaPath);

    function accept(path: string) {
        setIsRejected(false);
        onFile(path);
    }

    async function handleSelectFile() {
        const selected = await window.electronAPI.selectThumbnailMediaFile();
        if (selected) accept(selected);
    }

    function handleDropFile(file: File) {
        if (isThumbnailSupported(file.name)) {
            accept(window.electronAPI.getPathForFile(file));
        } else {
            setIsRejected(true);
        }
    }

    return (
        <DropPanel title={t("thumbnail.mediaFile")} onDropFile={handleDropFile} disabled={disabled}>
            {mediaPath ? (
                <>
                    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-2">
                        <span className="text-sm truncate flex-1 min-w-0 text-muted-foreground font-mono">
                            {mediaPath}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectFile}
                            disabled={disabled}
                        >
                            {t("thumbnail.changeFile")}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("thumbnail.currentCover")}</p>
                    <div className="flex items-center justify-center aspect-square w-full max-w-64 overflow-hidden rounded-md border border-border bg-muted/30">
                        {coverUrl === undefined ? (
                            <span className="text-sm text-muted-foreground">
                                {t("thumbnail.loadingCover")}
                            </span>
                        ) : coverUrl ? (
                            <img src={coverUrl} alt="" className="size-full object-cover" />
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {t("thumbnail.noCover")}
                            </span>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
                    <Button size="lg" onClick={handleSelectFile} disabled={disabled}>
                        {t("thumbnail.selectFile")}
                    </Button>
                    <p className="text-sm text-muted-foreground">{t("thumbnail.mp3Only")}</p>
                </div>
            )}
            {isRejected && (
                <p className="text-sm text-destructive">{t("thumbnail.unsupportedFormat")}</p>
            )}
        </DropPanel>
    );
}
