import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";

interface PanOffset {
    x: number;
    y: number;
}

export function CoverArt() {
    const { t } = useTranslation();
    const { show: showToast } = useToast();

    const [audioFile, setAudioFile] = useState<string | null>(null);
    const [currentThumb, setCurrentThumb] = useState<string | null>(null);
    const [newImagePath, setNewImagePath] = useState<string | null>(null);
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
    const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
    const [busy, setBusy] = useState(false);
    const [loadingThumb, setLoadingThumb] = useState(false);

    const dragging = useRef(false);
    const dragOrigin = useRef({ x: 0, y: 0 });
    const prevObjectUrl = useRef<string | null>(null);

    useEffect(() => {
        function handleMouseMove(e: MouseEvent) {
            if (!dragging.current) return;
            setPanOffset({
                x: e.clientX - dragOrigin.current.x,
                y: e.clientY - dragOrigin.current.y,
            });
        }
        function handleMouseUp() {
            dragging.current = false;
        }
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
        };
    }, []);

    async function handleSelectAudioFile() {
        const selected = await window.electronAPI.selectMediaFile();
        if (!selected) return;

        setAudioFile(selected);
        setCurrentThumb(null);
        setNewImagePath(null);
        if (prevObjectUrl.current) {
            URL.revokeObjectURL(prevObjectUrl.current);
            prevObjectUrl.current = null;
        }
        setNewImagePreview(null);
        setPanOffset({ x: 0, y: 0 });

        setLoadingThumb(true);
        try {
            const thumb = await window.electronAPI.getThumbnail(selected);
            setCurrentThumb(thumb);
        } catch {
            setCurrentThumb(null);
        } finally {
            setLoadingThumb(false);
        }
    }

    async function handleSelectImage() {
        const selected = await window.electronAPI.selectImageFile();
        if (!selected) return;

        setNewImagePath(selected);
        setPanOffset({ x: 0, y: 0 });

        if (prevObjectUrl.current) {
            URL.revokeObjectURL(prevObjectUrl.current);
            prevObjectUrl.current = null;
        }

        const ext = selected.split(".").pop()?.toLowerCase() ?? "";
        const mimeMap: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            bmp: "image/bmp",
        };
        const mime = mimeMap[ext] ?? "image/jpeg";

        const buf = await window.electronAPI.readFile(selected);
        const blob = new Blob([buf], { type: mime });
        const url = URL.createObjectURL(blob);
        prevObjectUrl.current = url;
        setNewImagePreview(url);
    }

    function handlePreviewMouseDown(e: React.MouseEvent) {
        e.preventDefault();
        dragging.current = true;
        dragOrigin.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }

    async function handleUpdate() {
        if (!audioFile || !newImagePath) return;
        setBusy(true);
        try {
            await window.electronAPI.setThumbnail(audioFile, newImagePath);
            const thumb = await window.electronAPI.getThumbnail(audioFile);
            setCurrentThumb(thumb);
            setNewImagePath(null);
            if (prevObjectUrl.current) {
                URL.revokeObjectURL(prevObjectUrl.current);
                prevObjectUrl.current = null;
            }
            setNewImagePreview(null);
            setPanOffset({ x: 0, y: 0 });
            showToast(t("coverArt.updateSuccess"));
        } catch {
            showToast(t("coverArt.error"));
        } finally {
            setBusy(false);
        }
    }

    async function handleRemove() {
        if (!audioFile) return;
        setBusy(true);
        try {
            await window.electronAPI.removeThumbnail(audioFile);
            setCurrentThumb(null);
            showToast(t("coverArt.removeSuccess"));
        } catch {
            showToast(t("coverArt.error"));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            <div className="flex items-center gap-3">
                <Button onClick={handleSelectAudioFile} disabled={busy}>
                    {t("coverArt.selectFile")}
                </Button>
                {audioFile && (
                    <span className="text-sm text-muted-foreground truncate max-w-sm">
                        {audioFile.split(/[\\/]/).pop()}
                    </span>
                )}
            </div>

            {audioFile && (
                <>
                    <div className="flex gap-6 flex-1">
                        <div className="flex flex-col gap-2 flex-1">
                            <span className="text-sm font-medium">
                                {t("coverArt.currentThumbnail")}
                            </span>
                            <div className="w-48 h-48 border border-border rounded flex items-center justify-center bg-muted overflow-hidden">
                                {loadingThumb ? (
                                    <span className="text-sm text-muted-foreground">…</span>
                                ) : currentThumb ? (
                                    <img
                                        src={currentThumb}
                                        alt="current thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        {t("coverArt.noThumbnail")}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <span className="text-sm font-medium">{t("coverArt.newImage")}</span>
                            <Button
                                variant="outline"
                                onClick={handleSelectImage}
                                disabled={busy}
                                className="w-fit"
                            >
                                {t("coverArt.selectImage")}
                            </Button>
                            {newImagePreview && (
                                <div
                                    className="w-48 h-48 border border-border rounded overflow-hidden relative cursor-grab select-none"
                                    onMouseDown={handlePreviewMouseDown}
                                >
                                    <img
                                        src={newImagePreview}
                                        alt="new thumbnail preview"
                                        className="absolute max-w-none"
                                        style={{
                                            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                                            width: "192px",
                                            height: "192px",
                                            objectFit: "cover",
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleUpdate} disabled={busy || !newImagePath}>
                            {busy ? t("coverArt.updating") : t("coverArt.update")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={busy || !currentThumb}
                        >
                            {busy ? t("coverArt.removing") : t("coverArt.remove")}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
