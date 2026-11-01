import { type RefObject, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions";
import { mediaUrl } from "@shared/media";

/** Playhead within this distance of the region end counts as "at the end" */
const END_TOLERANCE = 0.05;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface TrimmerPlayerOptions {
    filePath: string | null;
    videoRef: RefObject<HTMLVideoElement | null>;
    containerRef: RefObject<HTMLDivElement | null>;
    trimStart: number;
    trimEnd: number;
    /** Called once the media is ready, with its duration in seconds */
    onReady: (duration: number) => void;
    /** Called when the user finishes dragging or resizing the region */
    onRegionChange: (start: number, end: number) => void;
}

export function useTrimmerPlayer({
    filePath,
    videoRef,
    containerRef,
    trimStart,
    trimEnd,
    onReady,
    onRegionChange,
}: TrimmerPlayerOptions) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [hasVideo, setHasVideo] = useState(false);
    const [playbackUnavailable, setPlaybackUnavailable] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);

    // Reset per-file state when the file changes (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
    const [prevFilePath, setPrevFilePath] = useState(filePath);
    if (filePath !== prevFilePath) {
        setPrevFilePath(filePath);
        setIsLoaded(false);
        setLoadFailed(false);
        setDuration(0);
        setIsPlaying(false);
        setCurrentTime(0);
        setHasVideo(false);
        setPlaybackUnavailable(false);
        setIsVideoReady(false);
    }

    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionRef = useRef<Region | null>(null);
    const updatingFromRegionRef = useRef(false);
    const trimRangeRef = useRef({ start: 0, end: 0 });
    const callbacksRef = useRef({ onReady, onRegionChange });

    // The WaveSurfer effect runs once per file, so it reads the latest callbacks through a ref
    useEffect(() => {
        callbacksRef.current = { onReady, onRegionChange };
    });

    // Initialize wavesurfer once the container div is in the DOM (after filePath state triggers re-render)
    useEffect(() => {
        regionRef.current = null;
        if (!filePath || !containerRef.current || !videoRef.current) return;

        const container = containerRef.current;
        const video = videoRef.current;
        wavesurferRef.current?.destroy();

        const handleLoadedMetadata = () => setHasVideo(video.videoWidth > 0);
        const handleLoadedData = () => setIsVideoReady(true);
        const handleVideoError = () => setPlaybackUnavailable(true);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("loadeddata", handleLoadedData);
        video.addEventListener("error", handleVideoError);

        // Start loading the media now, in parallel with the peaks. WaveSurfer later adopts this src
        video.src = mediaUrl(filePath);

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

                const instance = WaveSurfer.create({
                    container,
                    waveColor: cssVar("--primary"),
                    progressColor: cssVarAlpha("--primary", 0.5),
                    cursorColor: cssVar("--foreground"),
                    height: 96,
                    normalize: true,
                    media: video,
                    peaks: [peaks.length > 0 ? peaks : new Float32Array(1)],
                    duration: peaksDuration > 0 ? peaksDuration : undefined,
                    plugins: [regionsPlugin],
                });

                ws = instance;
                wavesurferRef.current = ws;

                ws.on("ready", (dur) => {
                    setDuration(dur);
                    callbacksRef.current.onReady(dur);
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
                        callbacksRef.current.onRegionChange(region.start, region.end);
                        updatingFromRegionRef.current = false;
                    });
                });

                ws.on("play", () => setIsPlaying(true));
                ws.on("pause", () => setIsPlaying(false));
                ws.on("finish", () => setIsPlaying(false));

                ws.on("timeupdate", (time) => {
                    setCurrentTime(time);
                    const { end } = trimRangeRef.current;
                    if (instance.isPlaying() && time >= end) {
                        instance.pause();
                        instance.setTime(end);
                    }
                });

                ws.on("interaction", (time) => {
                    const { start, end } = trimRangeRef.current;
                    const clamped = clamp(time, start, end);
                    if (clamped !== time) instance.setTime(clamped);
                });
            })
            .catch(() => {
                if (!cancelled) setLoadFailed(true);
            });

        return () => {
            cancelled = true;
            ws?.destroy();
            if (wavesurferRef.current === ws) wavesurferRef.current = null;
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("loadeddata", handleLoadedData);
            video.removeEventListener("error", handleVideoError);
            video.pause();
            video.removeAttribute("src");
            video.load();
        };
    }, [filePath, containerRef, videoRef]);

    // Sync number inputs → region handles
    useEffect(() => {
        const region = regionRef.current;
        if (!region || updatingFromRegionRef.current) return;
        if (Math.abs(region.start - trimStart) > 0.01 || Math.abs(region.end - trimEnd) > 0.01) {
            region.setOptions({ start: trimStart, end: trimEnd });
        }
    }, [trimStart, trimEnd]);

    // Keep the playhead inside the selected region
    useEffect(() => {
        trimRangeRef.current = { start: trimStart, end: trimEnd };
        const ws = wavesurferRef.current;
        if (!ws) return;
        const time = ws.getCurrentTime();
        const clamped = clamp(time, trimStart, trimEnd);
        if (clamped !== time) ws.setTime(clamped);
    }, [trimStart, trimEnd]);

    function playPause() {
        const ws = wavesurferRef.current;
        if (!ws) return;
        if (ws.isPlaying()) {
            ws.pause();
            return;
        }
        const time = ws.getCurrentTime();
        if (time < trimStart || time >= trimEnd - END_TOLERANCE) ws.setTime(trimStart);
        ws.play();
    }

    function skip(delta: number) {
        const ws = wavesurferRef.current;
        if (!ws) return;
        ws.setTime(clamp(ws.getCurrentTime() + delta, trimStart, trimEnd));
    }

    return {
        isLoaded,
        loadFailed,
        duration,
        isPlaying,
        currentTime,
        hasVideo,
        playbackUnavailable,
        isVideoReady,
        playPause,
        skip,
    };
}
