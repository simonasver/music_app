import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { isImageFileName } from "@shared/media";
import { DropPanel } from "./DropPanel";

const MAX_ZOOM = 3;

interface ImageCropperProps {
    imagePath: string | null;
    onImage: (path: string) => void;
    onCropComplete: (area: Area) => void;
    disabled: boolean;
}

function useFileObjectUrl(filePath: string | null) {
    const [state, setState] = useState<{ path: string; url: string | null } | null>(null);

    useEffect(() => {
        if (!filePath) return;
        let cancelled = false;
        let url: string | null = null;
        window.electronAPI
            .readFile(filePath)
            .then((buffer) => {
                url = URL.createObjectURL(new Blob([new Uint8Array(buffer)]));
                return url;
            })
            .catch(() => null)
            .then((result) => {
                if (!cancelled) setState({ path: filePath, url: result });
            });
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [filePath]);

    // undefined while loading, null when the file could not be read
    return state?.path === filePath ? state.url : undefined;
}

interface CropAreaProps {
    imageUrl: string;
    onCropComplete: (area: Area) => void;
    disabled: boolean;
}

function CropArea({ imageUrl, onCropComplete, disabled }: CropAreaProps) {
    const { t } = useTranslation();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    return (
        <>
            <div className="relative flex-1 min-h-64 overflow-hidden rounded-md bg-muted">
                <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    maxZoom={MAX_ZOOM}
                    aspect={1}
                    onCropChange={disabled ? () => {} : setCrop}
                    onZoomChange={disabled ? () => {} : setZoom}
                    onCropComplete={(_, areaPixels) => onCropComplete(areaPixels)}
                />
            </div>
            <label className="flex items-center gap-3 text-sm">
                {t("thumbnail.zoom")}
                <input
                    type="range"
                    min={1}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    disabled={disabled}
                    className="flex-1 accent-primary"
                />
            </label>
        </>
    );
}

export function ImageCropper({ imagePath, onImage, onCropComplete, disabled }: ImageCropperProps) {
    const { t } = useTranslation();
    const [isRejected, setIsRejected] = useState(false);
    const imageUrl = useFileObjectUrl(imagePath);

    function accept(path: string) {
        setIsRejected(false);
        onImage(path);
    }

    async function handleSelectImage() {
        const selected = await window.electronAPI.selectImageFile();
        if (selected) accept(selected);
    }

    function handleDropFile(file: File) {
        if (isImageFileName(file.name)) {
            accept(window.electronAPI.getPathForFile(file));
        } else {
            setIsRejected(true);
        }
    }

    return (
        <DropPanel title={t("thumbnail.image")} onDropFile={handleDropFile} disabled={disabled}>
            {imagePath ? (
                <>
                    {imageUrl ? (
                        <CropArea
                            key={imageUrl}
                            imageUrl={imageUrl}
                            onCropComplete={onCropComplete}
                            disabled={disabled}
                        />
                    ) : (
                        <p className="flex-1 text-sm text-muted-foreground">
                            {imageUrl === undefined
                                ? t("thumbnail.loadingImage")
                                : t("thumbnail.imageLoadError")}
                        </p>
                    )}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                            {t("thumbnail.cropHint")}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectImage}
                            disabled={disabled}
                        >
                            {t("thumbnail.changeImage")}
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
                    <Button size="lg" onClick={handleSelectImage} disabled={disabled}>
                        {t("thumbnail.selectImage")}
                    </Button>
                    <p className="text-sm text-muted-foreground">{t("thumbnail.imageHint")}</p>
                </div>
            )}
            {isRejected && (
                <p className="text-sm text-destructive">{t("thumbnail.unsupportedImage")}</p>
            )}
        </DropPanel>
    );
}
