import { useTranslation } from "react-i18next";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SKIP_STEPS } from "../lib/steps";
import { formatTime } from "../lib/time";
import { StepButtons } from "./StepButtons";

interface PlaybackControlsProps {
    isPlaying: boolean;
    disabled: boolean;
    onPlayPause: () => void;
    onSkip: (delta: number) => void;
    currentTime: number;
    trimEnd: number;
    duration: number;
    isLoaded: boolean;
    loadFailed: boolean;
    playbackUnavailable: boolean;
}

export function PlaybackControls({
    isPlaying,
    disabled,
    onPlayPause,
    onSkip,
    currentTime,
    trimEnd,
    duration,
    isLoaded,
    loadFailed,
    playbackUnavailable,
}: PlaybackControlsProps) {
    const { t } = useTranslation();
    const playLabel = isPlaying ? t("trimmer.pause") : t("trimmer.play");

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2">
                <StepButtons
                    steps={SKIP_STEPS}
                    direction="decrease"
                    onStep={onSkip}
                    disabled={disabled}
                />
                <Button
                    variant="outline"
                    size="sm"
                    className="w-12"
                    onClick={onPlayPause}
                    disabled={disabled}
                    aria-label={playLabel}
                    title={playLabel}
                >
                    {isPlaying ? <Pause /> : <Play />}
                </Button>
                <StepButtons
                    steps={SKIP_STEPS}
                    direction="increase"
                    onStep={onSkip}
                    disabled={disabled}
                />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {isLoaded && (
                    <span className="tabular-nums text-foreground">
                        {formatTime(currentTime)} / {formatTime(trimEnd)}
                    </span>
                )}
                {isLoaded && (
                    <span className="tabular-nums">
                        {t("trimmer.totalDuration")}: {formatTime(duration)}
                    </span>
                )}
                {!isLoaded && !loadFailed && <span>{t("trimmer.loading")}</span>}
                {loadFailed && <span className="text-destructive">{t("trimmer.loadError")}</span>}
                {playbackUnavailable && <span>{t("trimmer.playbackUnavailable")}</span>}
            </div>
        </div>
    );
}
