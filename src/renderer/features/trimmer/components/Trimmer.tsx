import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { isMediaFileName, mediaUrl } from "@shared/media";
import { formatTime, parseTime } from "../lib/time";

const NUDGE_DECREASE_STEPS = [-1, -0.1];
const NUDGE_INCREASE_STEPS = [0.1, 1];

function getMediaPath(files: FileList): string | null {
    const file = files[0];
    return isMediaFileName(file.name) ? window.electronAPI.getPathForFile(file) : null;
}

export function Trimmer() {
    const { t } = useTranslation();
    const { show: showToast } = useToast();

    const [filePath, setFilePath] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [duration, setDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTrimming, setIsTrimming] = useState(false);
    const [replaceOriginal, setReplaceOriginal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);
    const [playbackUnavailable, setPlaybackUnavailable] = useState(false);
    const [startDraft, setStartDraft] = useState<string | null>(null);
    const [endDraft, setEndDraft] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionRef = useRef<Region | null>(null);
    const updatingFromRegionRef = useRef(false);

    // Initialize wavesurfer once the container div is in the DOM (after filePath state triggers re-render)
    useEffect(() => {
        if (!filePath || !waveContainerRef.current || !videoRef.current) return;

        const container = waveContainerRef.current;
        const video = videoRef.current;
        wavesurferRef.current?.destroy();
        regionRef.current = null;
        setIsLoaded(false);
        setLoadFailed(false);
        setHasVideo(false);
        setPlaybackUnavailable(false);
        setIsPlaying(false);

        const root = document.documentElement;
        const cssVar = (name: string) =>
            `hsl(${getComputedStyle(root).getPropertyValue(name).trim()})`;
        const cssVarAlpha = (name: string, alpha: number) =>
            `hsl(${getComputedStyle(root).getPropertyValue(name).trim()} / ${alpha})`;

        let cancelled = false;
        let ws: WaveSurfer | null = null;

        window.electronAPI
            .getMediaPeaks(filePath)
            .then(({ peaks, duration: peaksDuration }) => {
                if (cancelled) return;

                const regionsPlugin = RegionsPlugin.create();

                ws = WaveSurfer.create({
                    container,
                    waveColor: cssVar("--primary"),
                    progressColor: cssVarAlpha("--primary", 0.5),
                    cursorColor: cssVar("--foreground"),
                    height: 96,
                    normalize: true,
                    media: video,
                    url: mediaUrl(filePath),
                    peaks: [peaks.length > 0 ? peaks : new Float32Array(1)],
                    duration: peaksDuration > 0 ? peaksDuration : undefined,
                    plugins: [regionsPlugin],
                });

                wavesurferRef.current = ws;

                ws.on("ready", (dur) => {
                    setDuration(dur);
                    setTrimStart(0);
                    setTrimEnd(dur);
                    setIsLoaded(true);

                    const region = regionsPlugin.addRegion({
                        start: 0,
                        end: dur,
                        color: cssVarAlpha("--primary", 0.2),
                        drag: true,
                        resize: true,
                    });
                    regionRef.current = region;

                    region.on("update-end", () => {
                        updatingFromRegionRef.current = true;
                        setTrimStart(region.start);
                        setTrimEnd(region.end);
                        updatingFromRegionRef.current = false;
                    });
                });

                ws.on("play", () => setIsPlaying(true));
                ws.on("pause", () => setIsPlaying(false));
                ws.on("finish", () => setIsPlaying(false));
            })
            .catch(() => {
                if (!cancelled) setLoadFailed(true);
            });

        return () => {
            cancelled = true;
            ws?.destroy();
            video.pause();
            video.removeAttribute("src");
            video.load();
        };
    }, [filePath]);

    // Sync number inputs → region handles
    useEffect(() => {
        const region = regionRef.current;
        if (!region || updatingFromRegionRef.current) return;
        if (Math.abs(region.start - trimStart) > 0.01 || Math.abs(region.end - trimEnd) > 0.01) {
            region.setOptions({ start: trimStart, end: trimEnd });
        }
    }, [trimStart, trimEnd]);

    async function handleSelectFile() {
        const selected = await window.electronAPI.selectMediaFile();
        if (!selected) return;
        setFilePath(selected);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const path = getMediaPath(e.dataTransfer.files);
        if (path) setFilePath(path);
    }

    function handleReset() {
        regionRef.current = null;
        setFilePath(null);
        setIsLoaded(false);
        setIsPlaying(false);
        setDuration(0);
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

    function commitDraft(draft: string | null, apply: (n: number) => void) {
        if (draft === null) return;
        const n = parseTime(draft);
        if (n !== null) apply(n);
    }

    function handleTimeKeyDown(e: React.KeyboardEvent<HTMLInputElement>, revert: () => void) {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") revert();
    }

    function renderNudgeButtons(steps: number[], value: number, apply: (n: number) => void) {
        return steps.map((step) => (
            <Button
                key={step}
                variant="outline"
                size="sm"
                className="px-2 tabular-nums"
                onClick={() => apply(Math.round((value + step) * 1000) / 1000)}
                disabled={!isLoaded || isTrimming}
            >
                {step > 0 ? "+" : "−"}
                {Math.abs(step)}s
            </Button>
        ));
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

    const selectedDuration = trimEnd - trimStart;

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {!filePath ? (
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

                    {/* Video preview */}
                    <video
                        ref={videoRef}
                        className={cn(
                            "w-full max-h-[40vh] rounded-md bg-black object-contain",
                            (!hasVideo || playbackUnavailable) && "hidden",
                        )}
                        onLoadedMetadata={(e) => setHasVideo(e.currentTarget.videoWidth > 0)}
                        onError={() => setPlaybackUnavailable(true)}
                    />

                    {/* Waveform */}
                    <div
                        className={cn(
                            "rounded-md border border-border bg-muted/30 px-3 py-3 transition-opacity",
                            !isLoaded && "opacity-40 pointer-events-none",
                        )}
                        ref={waveContainerRef}
                    />

                    {/* Playback */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => wavesurferRef.current?.playPause()}
                            disabled={!isLoaded || isTrimming || playbackUnavailable}
                        >
                            {isPlaying ? t("trimmer.pause") : t("trimmer.play")}
                        </Button>
                        {isLoaded && (
                            <span className="text-xs text-muted-foreground">
                                {t("trimmer.totalDuration")}: {formatTime(duration)}
                            </span>
                        )}
                        {!isLoaded && !loadFailed && (
                            <span className="text-xs text-muted-foreground">
                                {t("trimmer.loading")}
                            </span>
                        )}
                        {loadFailed && (
                            <span className="text-xs text-destructive">
                                {t("trimmer.loadError")}
                            </span>
                        )}
                        {playbackUnavailable && (
                            <span className="text-xs text-muted-foreground">
                                {t("trimmer.playbackUnavailable")}
                            </span>
                        )}
                    </div>

                    {/* Trim inputs */}
                    <div className="flex items-end gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label htmlFor="trim-start">{t("trimmer.startSeconds")}</Label>
                            <div className="flex items-center gap-1">
                                {renderNudgeButtons(
                                    NUDGE_DECREASE_STEPS,
                                    trimStart,
                                    handleStartChange,
                                )}
                                <Input
                                    id="trim-start"
                                    type="text"
                                    spellCheck={false}
                                    className="min-w-0 tabular-nums"
                                    value={startDraft ?? formatTime(trimStart)}
                                    onChange={(e) => setStartDraft(e.target.value)}
                                    onBlur={() => {
                                        commitDraft(startDraft, handleStartChange);
                                        setStartDraft(null);
                                    }}
                                    onKeyDown={(e) =>
                                        handleTimeKeyDown(e, () => setStartDraft(null))
                                    }
                                    disabled={!isLoaded || isTrimming}
                                />
                                {renderNudgeButtons(
                                    NUDGE_INCREASE_STEPS,
                                    trimStart,
                                    handleStartChange,
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label htmlFor="trim-end">{t("trimmer.endSeconds")}</Label>
                            <div className="flex items-center gap-1">
                                {renderNudgeButtons(NUDGE_DECREASE_STEPS, trimEnd, handleEndChange)}
                                <Input
                                    id="trim-end"
                                    type="text"
                                    spellCheck={false}
                                    className="min-w-0 tabular-nums"
                                    value={endDraft ?? formatTime(trimEnd)}
                                    onChange={(e) => setEndDraft(e.target.value)}
                                    onBlur={() => {
                                        commitDraft(endDraft, handleEndChange);
                                        setEndDraft(null);
                                    }}
                                    onKeyDown={(e) => handleTimeKeyDown(e, () => setEndDraft(null))}
                                    disabled={!isLoaded || isTrimming}
                                />
                                {renderNudgeButtons(NUDGE_INCREASE_STEPS, trimEnd, handleEndChange)}
                            </div>
                        </div>
                        <div className="pb-2.5 text-sm text-muted-foreground whitespace-nowrap">
                            {t("trimmer.selectionDuration")}: {formatTime(selectedDuration)}
                        </div>
                    </div>

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
