import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MergeTrackProps {
    id: string;
    path: string;
    onRemove: (id: string) => void;
}

export function MergeTrack({ id, path, onRemove }: MergeTrackProps) {
    const { t } = useTranslation();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const [duration, setDuration] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const waveContainerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    useEffect(() => {
        if (!waveContainerRef.current) return;

        wavesurferRef.current?.destroy();
        setIsLoaded(false);
        setIsPlaying(false);

        const root = document.documentElement;
        const cssVar = (name: string) =>
            `hsl(${getComputedStyle(root).getPropertyValue(name).trim()})`;
        const cssVarAlpha = (name: string, alpha: number) =>
            `hsl(${getComputedStyle(root).getPropertyValue(name).trim()} / ${alpha})`;

        const ws = WaveSurfer.create({
            container: waveContainerRef.current,
            waveColor: cssVar("--primary"),
            progressColor: cssVarAlpha("--primary", 0.5),
            cursorColor: cssVar("--foreground"),
            height: 64,
            normalize: true,
        });

        wavesurferRef.current = ws;

        ws.on("ready", (dur) => {
            setIsLoaded(true);
            setDuration(dur);
        });

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));

        window.electronAPI.readFile(path).then((buffer) => {
            const blob = new Blob([new Uint8Array(buffer)]);
            ws.loadBlob(blob);
        });

        return () => {
            ws.destroy();
        };
    }, [path]);

    const fileName = path.split(/[\\/]/).pop() ?? path;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "rounded-md border border-border bg-muted/30 px-3 py-3 flex items-center gap-3",
                isDragging && "opacity-50 shadow-lg",
            )}
        >
            {/* Drag handle */}
            <button
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                </svg>
            </button>

            {/* File content */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <span className="text-sm font-mono truncate text-muted-foreground">{fileName}</span>
                <div
                    ref={waveContainerRef}
                    className={cn(
                        "transition-opacity",
                        !isLoaded && "opacity-40 pointer-events-none",
                    )}
                />

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => wavesurferRef.current?.playPause()}
                        disabled={!isLoaded}
                    >
                        {isPlaying ? t("merger.pause") : t("merger.play")}
                    </Button>
                    {isLoaded && (
                        <span className="text-xs text-muted-foreground">
                            {t("merger.totalDuration")}: {duration.toFixed(2)}s
                        </span>
                    )}
                </div>
            </div>

            {/* Remove button */}
            <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(id)}
                aria-label="Remove track"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </Button>
        </div>
    );
}
