import type { Ref } from "react";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
    ref: Ref<HTMLVideoElement>;
    isHidden: boolean;
}

export function VideoPreview({ ref, isHidden }: VideoPreviewProps) {
    return (
        <video
            ref={ref}
            className={cn(
                "w-full max-h-[40vh] rounded-md bg-black object-contain",
                isHidden && "hidden",
            )}
        />
    );
}
