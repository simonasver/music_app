import { type RefObject, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { GenericPlugin } from "wavesurfer.js/dist/base-plugin.js";
import { mediaUrl } from "@shared/media";

interface WaveformPlayerOptions {
    filePath: string | null;
    videoRef: RefObject<HTMLVideoElement | null>;
    containerRef: RefObject<HTMLDivElement | null>;
    /** Waveform height in pixels */
    height: number;
    /** Creates the plugins for each new WaveSurfer instance */
    createPlugins?: () => GenericPlugin[];
    /** Called with each new WaveSurfer instance, after the core handlers are registered */
    onCreate?: (ws: WaveSurfer) => void;
}

export function cssVar(name: string): string {
    return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;
}

export function cssVarAlpha(name: string, alpha: number): string {
    return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()} / ${alpha})`;
}

/** Streams a media file into a <video> element and draws its ffmpeg-computed peaks with WaveSurfer */
export function useWaveformPlayer({
    filePath,
    videoRef,
    containerRef,
    height,
    createPlugins,
    onCreate,
}: WaveformPlayerOptions) {
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
    const callbacksRef = useRef({ createPlugins, onCreate });

    // The WaveSurfer effect runs once per file, so it reads the latest callbacks through a ref
    useEffect(() => {
        callbacksRef.current = { createPlugins, onCreate };
    });

    // Initialize wavesurfer once the container div is in the DOM (after filePath state triggers re-render)
    useEffect(() => {
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

        let cancelled = false;
        let ws: WaveSurfer | null = null;

        window.electronAPI
            .getMediaPeaks(filePath)
            .then(({ peaks, duration: peaksDuration }) => {
                if (cancelled) return;

                const instance = WaveSurfer.create({
                    container,
                    waveColor: cssVar("--primary"),
                    progressColor: cssVarAlpha("--primary", 0.5),
                    cursorColor: cssVar("--foreground"),
                    height,
                    normalize: true,
                    media: video,
                    peaks: [peaks.length > 0 ? peaks : new Float32Array(1)],
                    duration: peaksDuration > 0 ? peaksDuration : undefined,
                    plugins: callbacksRef.current.createPlugins?.() ?? [],
                });

                ws = instance;
                wavesurferRef.current = ws;

                ws.on("ready", (dur) => {
                    setDuration(dur);
                    setIsLoaded(true);
                });

                ws.on("play", () => setIsPlaying(true));
                ws.on("pause", () => setIsPlaying(false));
                ws.on("finish", () => setIsPlaying(false));
                ws.on("timeupdate", (time) => setCurrentTime(time));

                callbacksRef.current.onCreate?.(instance);
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
    }, [filePath, containerRef, videoRef, height]);

    return {
        wavesurferRef,
        isLoaded,
        loadFailed,
        duration,
        isPlaying,
        currentTime,
        hasVideo,
        playbackUnavailable,
        isVideoReady,
    };
}
