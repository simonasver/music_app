import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pause, Play } from "lucide-react";
import { StepButtons } from "@/components/media/StepButtons";
import { VideoPreview } from "@/components/media/VideoPreview";
import { Waveform } from "@/components/media/Waveform";
import { Button } from "@/components/ui/button";
import { useWaveformPlayer } from "@/hooks/useWaveformPlayer";
import { SKIP_STEPS } from "@/lib/steps";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

interface MergeTrackProps {
    id: string;
    path: string;
    disabled: boolean;
    onRemove: (id: string) => void;
}

export function MergeTrack({ id, path, disabled, onRemove }: MergeTrackProps) {
    const { t } = useTranslation();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const waveContainerRef = useRef<HTMLDivElement>(null);

    const {
        wavesurferRef,
        isLoaded,
        loadFailed,
        duration,
        isPlaying,
        currentTime,
        hasVideo,
        playbackUnavailable,
        isVideoReady,
    } = useWaveformPlayer({
        filePath: path,
        videoRef,
        containerRef: waveContainerRef,
        height: 64,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    function skip(delta: number) {
        const ws = wavesurferRef.current;
        if (!ws) return;
        ws.setTime(Math.min(Math.max(ws.getCurrentTime() + delta, 0), duration));
    }

    const fileName = path.split(/[\\/]/).pop() ?? path;
    const controlsDisabled = !isLoaded || playbackUnavailable || disabled;
    const playLabel = isPlaying ? t("merger.pause") : t("merger.play");

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

            <VideoPreview
                ref={videoRef}
                isHidden={!hasVideo || playbackUnavailable}
                isLoading={!isVideoReady}
                className="w-40 shrink-0"
                videoClassName="aspect-video max-h-24"
            />

            {/* File content */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <span className="text-sm font-mono truncate text-muted-foreground">{fileName}</span>

                <Waveform
                    ref={waveContainerRef}
                    isLoaded={isLoaded}
                    isLoading={!isLoaded && !loadFailed}
                    className="min-h-[88px]"
                />

                <div className="flex flex-wrap items-center gap-2">
                    <StepButtons
                        steps={SKIP_STEPS}
                        direction="decrease"
                        onStep={skip}
                        disabled={controlsDisabled}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-12"
                        onClick={() => wavesurferRef.current?.playPause()}
                        disabled={controlsDisabled}
                        aria-label={playLabel}
                        title={playLabel}
                    >
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <StepButtons
                        steps={SKIP_STEPS}
                        direction="increase"
                        onStep={skip}
                        disabled={controlsDisabled}
                    />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 ml-2 text-xs text-muted-foreground">
                        {isLoaded && (
                            <span className="tabular-nums text-foreground">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        )}
                        {!isLoaded && !loadFailed && <span>{t("merger.loading")}</span>}
                        {loadFailed && (
                            <span className="text-destructive">{t("merger.loadError")}</span>
                        )}
                        {playbackUnavailable && <span>{t("merger.playbackUnavailable")}</span>}
                    </div>
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
