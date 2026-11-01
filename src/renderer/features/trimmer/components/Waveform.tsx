import type { Ref } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaveformProps {
    ref: Ref<HTMLDivElement>;
    isLoaded: boolean;
    isLoading: boolean;
}

export function Waveform({ ref, isLoaded, isLoading }: WaveformProps) {
    return (
        <div className="relative">
            <div
                className={cn(
                    "min-h-[120px] rounded-md border border-border bg-muted/30 px-3 py-3 transition-opacity",
                    !isLoaded && "opacity-40 pointer-events-none",
                )}
                ref={ref}
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
