import type { Ref } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
    ref: Ref<HTMLVideoElement>;
    isHidden: boolean;
    isLoading: boolean;
}

export function VideoPreview({ ref, isHidden, isLoading }: VideoPreviewProps) {
    return (
        <div className={cn("relative", isHidden && "hidden")}>
            <video ref={ref} className="w-full max-h-[40vh] rounded-md bg-black object-contain" />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <LoaderCircle className="size-8 animate-spin text-white/70" />
                </div>
            )}
        </div>
    );
}
