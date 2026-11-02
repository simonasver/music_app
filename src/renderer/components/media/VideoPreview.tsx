import type { Ref } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
    ref: Ref<HTMLVideoElement>;
    isHidden: boolean;
    isLoading: boolean;
    className?: string;
    videoClassName?: string;
}

export function VideoPreview({
    ref,
    isHidden,
    isLoading,
    className,
    videoClassName,
}: VideoPreviewProps) {
    return (
        <div className={cn("relative", isHidden && "hidden", className)}>
            <video
                ref={ref}
                className={cn(
                    "w-full max-h-[40vh] rounded-md bg-black object-contain",
                    videoClassName,
                )}
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <LoaderCircle className="size-8 animate-spin text-white/70" />
                </div>
            )}
        </div>
    );
}
