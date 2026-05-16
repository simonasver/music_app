import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MEDIA_EXTENSIONS, IMAGE_EXTENSIONS } from "@/config/config";

const PREVIEW_SIZE = 280;
const CORNER_HIT = 12;
const MIN_CROP_PX = 32;

interface CropBox {
    x: number;
    y: number;
    size: number;
}

type Corner = "tl" | "tr" | "bl" | "br";

type CropOp =
    | { type: "move"; startMouseX: number; startMouseY: number; startCrop: CropBox }
    | { type: "resize"; corner: Corner; startMouseX: number; startMouseY: number; startCrop: CropBox };

function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
}

export function CoverArt() {
    const { t } = useTranslation();
    const { show: showToast } = useToast();

    const [audioFile, setAudioFile] = useState<string | null>(null);
    const [currentThumb, setCurrentThumb] = useState<string | null>(null);
    const [loadingThumb, setLoadingThumb] = useState(false);

    const [newImageSrc, setNewImageSrc] = useState<string | null>(null);
    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
    const [cropBox, setCropBox] = useState<CropBox | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDragOverAudio, setIsDragOverAudio] = useState(false);
    const [isDragOverImage, setIsDragOverImage] = useState(false);
    const [busy, setBusy] = useState(false);

    const cropOpRef = useRef<CropOp | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const previewContainerRef = useRef<HTMLDivElement | null>(null);
    const prevObjectUrl = useRef<string | null>(null);
    // Refs kept in sync with state/computed values for use in event handlers
    const displayScaleRef = useRef(1);
    const naturalSizeRef = useRef<{ w: number; h: number } | null>(null);

    // Update refs synchronously during render so event handlers always see current values
    naturalSizeRef.current = naturalSize;
    if (naturalSize) {
        displayScaleRef.current = Math.min(PREVIEW_SIZE / naturalSize.w, PREVIEW_SIZE / naturalSize.h);
    }

    // Single persistent mouse move/up handler — uses refs, no stale closure
    useEffect(() => {
        function onMouseMove(e: MouseEvent) {
            const op = cropOpRef.current;
            const ns = naturalSizeRef.current;
            if (!op || !ns) return;
            const ds = displayScaleRef.current;
            const dx = (e.clientX - op.startMouseX) / ds;
            const dy = (e.clientY - op.startMouseY) / ds;
            const sc = op.startCrop;
            let newBox: CropBox;

            if (op.type === "move") {
                newBox = {
                    x: clamp(sc.x + dx, 0, ns.w - sc.size),
                    y: clamp(sc.y + dy, 0, ns.h - sc.size),
                    size: sc.size,
                };
            } else {
                const { corner } = op;
                const delta = corner === "tr" || corner === "br" ? dx : -dx;

                if (corner === "tl") {
                    const anchorX = sc.x + sc.size;
                    const anchorY = sc.y + sc.size;
                    const newSize = clamp(sc.size + delta, MIN_CROP_PX, Math.min(anchorX, anchorY));
                    newBox = { x: anchorX - newSize, y: anchorY - newSize, size: newSize };
                } else if (corner === "tr") {
                    const anchorX = sc.x;
                    const anchorY = sc.y + sc.size;
                    const newSize = clamp(sc.size + delta, MIN_CROP_PX, Math.min(ns.w - anchorX, anchorY));
                    newBox = { x: anchorX, y: anchorY - newSize, size: newSize };
                } else if (corner === "bl") {
                    const anchorX = sc.x + sc.size;
                    const anchorY = sc.y;
                    const newSize = clamp(sc.size + delta, MIN_CROP_PX, Math.min(anchorX, ns.h - anchorY));
                    newBox = { x: anchorX - newSize, y: anchorY, size: newSize };
                } else {
                    const anchorX = sc.x;
                    const anchorY = sc.y;
                    const newSize = clamp(sc.size + delta, MIN_CROP_PX, Math.min(ns.w - anchorX, ns.h - anchorY));
                    newBox = { x: anchorX, y: anchorY, size: newSize };
                }
            }

            setCropBox(newBox);
        }

        function onMouseUp() {
            cropOpRef.current = null;
            setIsDragging(false);
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    // Clipboard paste
    useEffect(() => {
        async function onPaste(e: ClipboardEvent) {
            if (!audioFile) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
                if (!item.type.startsWith("image/")) continue;
                const blob = item.getAsFile();
                if (blob) { applyImageBlob(blob); break; }
            }
        }
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [audioFile]);

    // Revoke object URL on unmount
    useEffect(() => {
        return () => { if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current); };
    }, []);

    function applyImageBlob(blob: Blob) {
        if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
        prevObjectUrl.current = URL.createObjectURL(blob);
        setNewImageSrc(prevObjectUrl.current);
        setNaturalSize(null);
        setCropBox(null);
    }

    function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
        setNaturalSize({ w, h });
        const size = Math.min(w, h);
        setCropBox({ x: (w - size) / 2, y: (h - size) / 2, size });
    }

    async function loadAudioFile(path: string) {
        setAudioFile(path);
        setCurrentThumb(null);
        clearNewImage();
        setLoadingThumb(true);
        try {
            setCurrentThumb(await window.electronAPI.getThumbnail(path));
        } catch {
            setCurrentThumb(null);
        } finally {
            setLoadingThumb(false);
        }
    }

    function clearNewImage() {
        if (prevObjectUrl.current) { URL.revokeObjectURL(prevObjectUrl.current); prevObjectUrl.current = null; }
        setNewImageSrc(null);
        setNaturalSize(null);
        setCropBox(null);
    }

    function handleReset() {
        setAudioFile(null);
        setCurrentThumb(null);
        clearNewImage();
    }

    async function loadImageFromPath(filePath: string) {
        const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
        const mimeMap: Record<string, string> = {
            jpg: "image/jpeg", jpeg: "image/jpeg",
            png: "image/png", webp: "image/webp", bmp: "image/bmp",
        };
        const buf = await window.electronAPI.readFile(filePath);
        applyImageBlob(new Blob([buf], { type: mimeMap[ext] ?? "image/jpeg" }));
    }

    function handleAudioDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOverAudio(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (MEDIA_EXTENSIONS.has(ext)) void loadAudioFile(window.electronAPI.getPathForFile(file));
    }

    async function handleImageDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOverImage(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (IMAGE_EXTENSIONS.has(ext)) await loadImageFromPath(window.electronAPI.getPathForFile(file));
    }

    function startMove(e: React.MouseEvent) {
        if (e.button !== 0 || !cropBox) return;
        e.preventDefault();
        e.stopPropagation();
        cropOpRef.current = { type: "move", startMouseX: e.clientX, startMouseY: e.clientY, startCrop: { ...cropBox } };
        setIsDragging(true);
    }

    function startResize(e: React.MouseEvent, corner: Corner) {
        if (e.button !== 0 || !cropBox) return;
        e.preventDefault();
        e.stopPropagation();
        cropOpRef.current = { type: "resize", corner, startMouseX: e.clientX, startMouseY: e.clientY, startCrop: { ...cropBox } };
        setIsDragging(true);
    }

    async function getCroppedBlob(): Promise<Blob> {
        const img = imgRef.current;
        if (!img || !cropBox) throw new Error("No image or crop box");
        const canvas = document.createElement("canvas");
        canvas.width = cropBox.size;
        canvas.height = cropBox.size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2d context unavailable");
        ctx.drawImage(img, cropBox.x, cropBox.y, cropBox.size, cropBox.size, 0, 0, cropBox.size, cropBox.size);
        return new Promise((resolve, reject) =>
            canvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.95),
        );
    }

    async function handleUpdate() {
        if (!audioFile || !cropBox || !newImageSrc) return;
        setBusy(true);
        try {
            const blob = await getCroppedBlob();
            const tempPath = await window.electronAPI.writeTempImage(await blob.arrayBuffer(), "jpg");
            await window.electronAPI.setThumbnail(audioFile, tempPath);
            setCurrentThumb(await window.electronAPI.getThumbnail(audioFile));
            clearNewImage();
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

    // Computed display geometry
    const ds = naturalSize
        ? Math.min(PREVIEW_SIZE / naturalSize.w, PREVIEW_SIZE / naturalSize.h)
        : 1;
    const imgDisplayW = naturalSize ? naturalSize.w * ds : 0;
    const imgDisplayH = naturalSize ? naturalSize.h * ds : 0;
    const imgOffsetX = (PREVIEW_SIZE - imgDisplayW) / 2;
    const imgOffsetY = (PREVIEW_SIZE - imgDisplayH) / 2;
    const cropDisplayX = cropBox ? imgOffsetX + cropBox.x * ds : 0;
    const cropDisplayY = cropBox ? imgOffsetY + cropBox.y * ds : 0;
    const cropDisplaySize = cropBox ? cropBox.size * ds : 0;
    const X1 = cropDisplayX, Y1 = cropDisplayY;
    const X2 = cropDisplayX + cropDisplaySize, Y2 = cropDisplayY + cropDisplaySize;
    const PS = PREVIEW_SIZE;

    const cornerCursors: Record<Corner, string> = { tl: "nw-resize", tr: "ne-resize", bl: "sw-resize", br: "se-resize" };
    const cornerPositions: Record<Corner, React.CSSProperties> = {
        tl: { top: -CORNER_HIT / 2, left: -CORNER_HIT / 2 },
        tr: { top: -CORNER_HIT / 2, right: -CORNER_HIT / 2 },
        bl: { bottom: -CORNER_HIT / 2, left: -CORNER_HIT / 2 },
        br: { bottom: -CORNER_HIT / 2, right: -CORNER_HIT / 2 },
    };

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {!audioFile ? (
                <div
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 gap-3 rounded-lg border-2 border-dashed border-transparent transition-colors",
                        isDragOverAudio && "border-primary bg-primary/5",
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOverAudio(true); }}
                    onDragLeave={() => setIsDragOverAudio(false)}
                    onDrop={handleAudioDrop}
                >
                    <Button size="lg" onClick={() => void window.electronAPI.selectMediaFile().then(p => p && loadAudioFile(p))}>
                        {t("coverArt.selectFile")}
                    </Button>
                    <p className="text-sm text-muted-foreground">{t("trimmer.supportedFormats")}</p>
                    {isDragOverAudio && (
                        <p className="text-sm font-medium text-primary">{t("coverArt.dropAudioFile")}</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-2">
                        <span className="text-sm truncate flex-1 min-w-0 text-muted-foreground font-mono">
                            {audioFile}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleReset} disabled={busy}>
                            {t("coverArt.changeFile")}
                        </Button>
                    </div>

                    <div className="flex gap-6 flex-1">
                        {/* Current thumbnail */}
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">{t("coverArt.currentThumbnail")}</span>
                            <div className="w-48 h-48 border border-border rounded flex items-center justify-center bg-muted overflow-hidden">
                                {loadingThumb ? (
                                    <span className="text-sm text-muted-foreground">…</span>
                                ) : currentThumb ? (
                                    <img src={currentThumb} alt="current thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm text-muted-foreground">{t("coverArt.noThumbnail")}</span>
                                )}
                            </div>
                        </div>

                        {/* New image + crop */}
                        <div
                            className={cn(
                                "flex flex-col gap-2 flex-1 rounded-lg border-2 border-dashed border-transparent p-2 transition-colors",
                                isDragOverImage && "border-primary bg-primary/5",
                            )}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOverImage(true); }}
                            onDragLeave={() => setIsDragOverImage(false)}
                            onDrop={handleImageDrop}
                        >
                            <span className="text-sm font-medium">{t("coverArt.newImage")}</span>
                            <Button
                                variant="outline"
                                onClick={() => void window.electronAPI.selectImageFile().then(p => p && loadImageFromPath(p))}
                                disabled={busy}
                                className="w-fit"
                            >
                                {t("coverArt.selectImage")}
                            </Button>

                            {newImageSrc ? (
                                <div className="flex flex-col gap-2">
                                    {/* Crop preview */}
                                    <div
                                        ref={previewContainerRef}
                                        className="relative overflow-hidden rounded border border-border bg-muted select-none"
                                        style={{
                                            width: PREVIEW_SIZE,
                                            height: PREVIEW_SIZE,
                                            cursor: isDragging ? "grabbing" : "default",
                                        }}
                                    >
                                        <img
                                            ref={imgRef}
                                            src={newImageSrc}
                                            alt="crop preview"
                                            style={
                                                naturalSize
                                                    ? { position: "absolute", left: imgOffsetX, top: imgOffsetY, width: imgDisplayW, height: imgDisplayH }
                                                    : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }
                                            }
                                            onLoad={handleImageLoad}
                                            draggable={false}
                                        />

                                        {/* Dark overlay outside crop box */}
                                        {cropBox && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background: "rgba(0,0,0,0.5)",
                                                    clipPath: `polygon(0px 0px, 0px ${PS}px, ${X1}px ${PS}px, ${X1}px ${Y1}px, ${X2}px ${Y1}px, ${X2}px ${Y2}px, ${X1}px ${Y2}px, ${X1}px ${PS}px, ${PS}px ${PS}px, ${PS}px 0px)`,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}

                                        {/* Crop box */}
                                        {cropBox && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    left: cropDisplayX,
                                                    top: cropDisplayY,
                                                    width: cropDisplaySize,
                                                    height: cropDisplaySize,
                                                    border: "2px dashed white",
                                                    boxSizing: "border-box",
                                                    cursor: "move",
                                                }}
                                                onMouseDown={startMove}
                                            >
                                                {(["tl", "tr", "bl", "br"] as Corner[]).map(corner => (
                                                    <div
                                                        key={corner}
                                                        style={{
                                                            position: "absolute",
                                                            width: CORNER_HIT,
                                                            height: CORNER_HIT,
                                                            background: "white",
                                                            cursor: cornerCursors[corner],
                                                            ...cornerPositions[corner],
                                                        }}
                                                        onMouseDown={e => startResize(e, corner)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ) : (
                                <div
                                    className="border border-dashed border-border rounded flex flex-col items-center justify-center gap-2 text-muted-foreground text-center px-4"
                                    style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                                >
                                    <span className="text-sm">{t("coverArt.dropImageHere")}</span>
                                    <span className="text-xs">{t("coverArt.pasteHint")}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                            <Button onClick={handleUpdate} disabled={busy || !newImageSrc || !cropBox}>
                                {busy ? t("coverArt.updating") : t("coverArt.update")}
                            </Button>
                            <Button variant="destructive" onClick={handleRemove} disabled={busy || !currentThumb}>
                                {busy ? t("coverArt.removing") : t("coverArt.remove")}
                            </Button>
                        </div>
                        <Button variant="outline" onClick={handleReset} disabled={busy}>
                            {t("common.cancel")}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
