import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppSettings } from "../../env";

interface Props {
    settings: AppSettings;
}

export function YoutubeDownloader({ settings }: Props) {
    const [url, setUrl] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [outputLines, setOutputLines] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubOutput = window.electronAPI.onDownloadOutput((line) => {
            setOutputLines((prev) => [...prev, line]);
        });

        const unsubComplete = window.electronAPI.onDownloadComplete(() => {
            setIsDownloading(false);
        });

        return () => {
            unsubOutput();
            unsubComplete();
        };
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [outputLines]);

    function handleDownload(flags: string) {
        if (!url.trim()) {
            return;
        }

        setUrl("");
        setOutputLines([]);
        setIsDownloading(true);
        window.electronAPI.startDownload(
            url.trim(),
            flags,
            settings.youtubeDownloaderSettings.downloadFileLocation,
        );
    }

    function handleCancel() {
        window.electronAPI.cancelDownload();
        setIsDownloading(false);
    }

    return (
        <div className="flex flex-col h-full p-6 gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="url-input">YouTube URL</Label>
                <Input
                    id="url-input"
                    type="url"
                    placeholder="Enter youtube url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isDownloading}
                />
            </div>

            <div className="flex items-center justify-center gap-3">
                <Button
                    size="lg"
                    disabled={isDownloading || !url.trim()}
                    onClick={() => handleDownload(settings.youtubeDownloaderSettings.mp3Config)}
                >
                    Download MP3
                </Button>
                <Button
                    size="lg"
                    variant="secondary"
                    disabled={isDownloading || !url.trim()}
                    onClick={() => handleDownload(settings.youtubeDownloaderSettings.mp4Config)}
                >
                    Download MP4
                </Button>
                {isDownloading && (
                    <Button variant="destructive" onClick={handleCancel}>
                        Cancel
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 rounded-md border border-border bg-muted/30">
                <pre className="font-mono text-sm p-4 whitespace-pre-wrap break-words">
                    {outputLines.join("\n")}
                    <div ref={bottomRef} />
                </pre>
            </ScrollArea>
        </div>
    );
}
