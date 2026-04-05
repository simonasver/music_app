import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/lib/toast";
import type { AppSettings, HistoryEntry } from "../../env";
import { DownloadHistory } from "./DownloadHistory";

interface Props {
    settings: AppSettings;
}

export function YoutubeDownloader({ settings }: Props) {
    const toast = useToast();
    const [url, setUrl] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [outputLines, setOutputLines] = useState<string[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pendingUrlRef = useRef<string>("");

    function loadHistory() {
        window.electronAPI.getAllHistory().then(setHistory);
    }

    useEffect(() => {
        loadHistory();

        const unsubOutput = window.electronAPI.onDownloadOutput((line) => {
            setOutputLines((prev) => [...prev, line]);
        });

        const unsubComplete = window.electronAPI.onDownloadComplete((code) => {
            setIsDownloading(false);
            if (code === 0) {
                window.electronAPI
                    .appendHistory({
                        id: crypto.randomUUID(),
                        url: pendingUrlRef.current,
                        date: new Date().toISOString(),
                    })
                    .then(loadHistory);
                toast.show("Download complete");
            }
        });

        return () => {
            unsubOutput();
            unsubComplete();
        };
    }, [toast]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [outputLines]);

    function handleDownload(flags: string) {
        if (!url.trim()) {
            return;
        }

        pendingUrlRef.current = url.trim();
        setUrl("");
        setOutputLines([]);
        setIsDownloading(true);
        window.electronAPI.startDownload(
            pendingUrlRef.current,
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

            <Tabs defaultValue="output" className="flex flex-col flex-1 min-h-0">
                <TabsList className="self-start h-8">
                    <TabsTrigger value="output" className="text-xs px-3 py-1">
                        Output
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs px-3 py-1">
                        History
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="output" className="flex-1 mt-1 min-h-0">
                    <ScrollArea className="h-full rounded-md border border-border bg-muted/30">
                        <pre className="font-mono text-sm p-4 whitespace-pre-wrap wrap-break-word">
                            {outputLines.join("\n")}
                            <div ref={bottomRef} />
                        </pre>
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="history" className="flex flex-col flex-1 mt-1 min-h-0">
                    <DownloadHistory entries={history} onRefresh={loadHistory} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
