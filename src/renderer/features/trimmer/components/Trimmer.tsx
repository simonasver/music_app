import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { useTrimmerPlayer } from "../hooks/useTrimmerPlayer";
import { FileDropZone } from "./FileDropZone";
import { PlaybackControls } from "./PlaybackControls";
import { TrimControls } from "./TrimControls";
import { VideoPreview } from "./VideoPreview";
import { Waveform } from "./Waveform";

export function Trimmer() {
    const { t } = useTranslation();
    const { show: showToast } = useToast();

    const [filePath, setFilePath] = useState<string | null>(null);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [isTrimming, setIsTrimming] = useState(false);
    const [replaceOriginal, setReplaceOriginal] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const waveContainerRef = useRef<HTMLDivElement>(null);

    const {
        isLoaded,
        loadFailed,
        duration,
        isPlaying,
        currentTime,
        hasVideo,
        playbackUnavailable,
        playPause,
        skip,
    } = useTrimmerPlayer({
        filePath,
        videoRef,
        containerRef: waveContainerRef,
        trimStart,
        trimEnd,
        onReady: (dur) => {
            setTrimStart(0);
            setTrimEnd(dur);
        },
        onRegionChange: (start, end) => {
            setTrimStart(start);
            setTrimEnd(end);
        },
    });

    function handleReset() {
        setFilePath(null);
        setTrimStart(0);
        setTrimEnd(0);
        setReplaceOriginal(false);
    }

    function handleStartChange(n: number) {
        setTrimStart(Math.max(0, Math.min(n, trimEnd - 0.1)));
    }

    function handleEndChange(n: number) {
        setTrimEnd(Math.max(trimStart + 0.1, Math.min(n, duration)));
    }

    async function handleSave() {
        if (!filePath || !isLoaded) return;
        setIsTrimming(true);
        try {
            const result = await window.electronAPI.executeTrim({
                inputPath: filePath,
                start: trimStart,
                end: trimEnd,
                replaceOriginal,
            });
            showToast(t("trimmer.trimComplete", { path: result.outputPath }));
            handleReset();
        } catch {
            showToast(t("trimmer.trimError"));
        } finally {
            setIsTrimming(false);
        }
    }

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {!filePath ? (
                <FileDropZone onFile={setFilePath} />
            ) : (
                <>
                    {/* File info bar */}
                    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-2">
                        <span className="text-sm truncate flex-1 min-w-0 text-muted-foreground font-mono">
                            {filePath}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            disabled={isTrimming}
                        >
                            {t("trimmer.changeFile")}
                        </Button>
                    </div>

                    <VideoPreview ref={videoRef} isHidden={!hasVideo || playbackUnavailable} />

                    <Waveform ref={waveContainerRef} isLoaded={isLoaded} />

                    <PlaybackControls
                        isPlaying={isPlaying}
                        disabled={!isLoaded || isTrimming || playbackUnavailable}
                        onPlayPause={playPause}
                        onSkip={skip}
                        currentTime={currentTime}
                        trimEnd={trimEnd}
                        duration={duration}
                        isLoaded={isLoaded}
                        loadFailed={loadFailed}
                        playbackUnavailable={playbackUnavailable}
                    />

                    <TrimControls
                        trimStart={trimStart}
                        trimEnd={trimEnd}
                        onStartChange={handleStartChange}
                        onEndChange={handleEndChange}
                        disabled={!isLoaded || isTrimming}
                    />

                    {/* Save row */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={replaceOriginal}
                                onChange={(e) => setReplaceOriginal(e.target.checked)}
                                disabled={isTrimming}
                                className="rounded border-input accent-primary"
                            />
                            {t("trimmer.replaceOriginal")}
                        </label>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleReset}
                                disabled={isTrimming}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleSave}
                                disabled={!isLoaded || isTrimming}
                            >
                                {isTrimming ? t("trimmer.trimming") : t("trimmer.save")}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
