import { type RefObject, useEffect, useRef } from "react";
import type WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js";
import { cssVarAlpha, useWaveformPlayer } from "@/hooks/useWaveformPlayer";

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
    const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
    const regionRef = useRef<Region | null>(null);
    const updatingFromRegionRef = useRef(false);
    const trimRangeRef = useRef({ start: 0, end: 0 });
    const callbacksRef = useRef({ onReady, onRegionChange });

    // The WaveSurfer handlers are registered once per file, so they read the latest callbacks through a ref
    useEffect(() => {
        callbacksRef.current = { onReady, onRegionChange };
    });

    const { wavesurferRef, ...player } = useWaveformPlayer({
        filePath,
        videoRef,
        containerRef,
        height: 96,
        createPlugins: () => {
            regionsPluginRef.current = RegionsPlugin.create();
            return [regionsPluginRef.current];
        },
        onCreate: (instance: WaveSurfer) => {
            const regionsPlugin = regionsPluginRef.current;
            if (!regionsPlugin) return;

            instance.on("ready", (dur) => {
                callbacksRef.current.onReady(dur);

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

            instance.on("timeupdate", (time) => {
                const { end } = trimRangeRef.current;
                if (instance.isPlaying() && time >= end) {
                    instance.pause();
                    instance.setTime(end);
                }
            });

            instance.on("interaction", (time) => {
                const { start, end } = trimRangeRef.current;
                const clamped = clamp(time, start, end);
                if (clamped !== time) instance.setTime(clamped);
            });
        },
    });

    // The old region is destroyed with its WaveSurfer instance
    useEffect(() => {
        regionRef.current = null;
    }, [filePath]);

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
    }, [trimStart, trimEnd, wavesurferRef]);

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

    return { ...player, playPause, skip };
}
