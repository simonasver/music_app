import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { ImageCropper } from "./ImageCropper";
import { MediaFileCard } from "./MediaFileCard";

export function Thumbnail() {
    const { t } = useTranslation();
    const { show: showToast } = useToast();

    const [mediaPath, setMediaPath] = useState<string | null>(null);
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [cropArea, setCropArea] = useState<Area | null>(null);
    const [replaceOriginal, setReplaceOriginal] = useState(false);
    const [isEmbedding, setIsEmbedding] = useState(false);
    const [coverVersion, setCoverVersion] = useState(0);

    const rootRef = useRef<HTMLDivElement>(null);

    function handleImage(path: string) {
        setCropArea(null);
        setImagePath(path);
    }

    useEffect(() => {
        async function handlePaste() {
            // Every tab stays mounted; only react while this one is visible
            if (!rootRef.current?.offsetParent || isEmbedding) return;
            const path = await window.electronAPI.pasteThumbnailImage();
            if (path) {
                setCropArea(null);
                setImagePath(path);
            } else {
                showToast(t("thumbnail.clipboardEmpty"));
            }
        }
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [isEmbedding, showToast, t]);

    function handleReset() {
        setMediaPath(null);
        setImagePath(null);
        setCropArea(null);
        setReplaceOriginal(false);
    }

    async function handleEmbed() {
        if (!mediaPath || !imagePath || !cropArea) return;
        setIsEmbedding(true);
        try {
            const result = await window.electronAPI.embedThumbnail({
                mediaPath,
                imagePath,
                crop: cropArea,
                replaceOriginal,
            });
            showToast(t("thumbnail.embedComplete", { path: result.outputPath }));
            setMediaPath(result.outputPath);
            setCoverVersion((v) => v + 1);
        } catch {
            showToast(t("thumbnail.embedError"));
        } finally {
            setIsEmbedding(false);
        }
    }

    return (
        <div ref={rootRef} className="flex flex-col h-full p-6 gap-6">
            <div className="grid flex-1 min-h-0 gap-6 grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <MediaFileCard
                    mediaPath={mediaPath}
                    coverVersion={coverVersion}
                    onFile={setMediaPath}
                    disabled={isEmbedding}
                />
                <ImageCropper
                    imagePath={imagePath}
                    onImage={handleImage}
                    onCropComplete={setCropArea}
                    disabled={isEmbedding}
                />
            </div>

            {/* Save row */}
            <div className="flex items-center justify-between shrink-0">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={replaceOriginal}
                        onChange={(e) => setReplaceOriginal(e.target.checked)}
                        disabled={isEmbedding}
                        className="rounded border-input accent-primary"
                    />
                    {t("thumbnail.replaceOriginal")}
                </label>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleReset}
                        disabled={isEmbedding || (!mediaPath && !imagePath)}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleEmbed}
                        disabled={!mediaPath || !cropArea || isEmbedding}
                    >
                        {isEmbedding ? t("thumbnail.embedding") : t("thumbnail.embed")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
