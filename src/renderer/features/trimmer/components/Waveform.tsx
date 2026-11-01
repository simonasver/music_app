import type { Ref } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
    ref: Ref<HTMLDivElement>;
    isLoaded: boolean;
}

export function Waveform({ ref, isLoaded }: WaveformProps) {
    return (
        <div
            className={cn(
                "rounded-md border border-border bg-muted/30 px-3 py-3 transition-opacity",
                !isLoaded && "opacity-40 pointer-events-none",
            )}
            ref={ref}
        />
    );
}
