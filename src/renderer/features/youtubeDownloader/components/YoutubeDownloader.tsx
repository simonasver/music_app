import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/lib/toast";
import type { AppSettings, HistoryEntry } from "../../../env";
import { DownloadHistory } from "./DownloadHistory";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    defaultProgress,
    parseYtDlpLine,
    type DownloadProgress,
    type DownloadStage,
} from "../utils/parseYtDlpLine";

const stageBadgeClass: Record<DownloadStage, string> = {
    idle: "bg-muted text-muted-foreground",
    fetching: "bg-blue-500/15 text-blue-500",
    downloading: "bg-green-500/15 text-green-600",
    processing: "bg-yellow-500/15 text-yellow-600",
    done: "bg-green-500/15 text-green-600",
    error: "bg-destructive/15 text-destructive",
};

enum DownloadInfoTab {
    History = "History",
    Output = "Output",
}

interface Props {
    settings: AppSettings;
}

export function YoutubeDownloader({ settings }: Props) {
    const { t } = useTranslation();
    const toast = useToast();
    const [url, setUrl] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [outputLines, setOutputLines] = useState<string[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [progress, setProgress] = useState<DownloadProgress>(defaultProgress);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_errorLine, setErrorLine] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pendingUrlRef = useRef<string>("");
    const progressRef = useRef<DownloadProgress>(defaultProgress);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    function loadHistory() {
        window.electronAPI.getAllHistory().then(setHistory);
    }

    useEffect(() => {
        loadHistory();

        const unsubOutput = window.electronAPI.onDownloadOutput((line) => {
            setOutputLines((prev) => [...prev, line]);

            if (/^ERROR:/.test(line)) {
                setErrorLine(line);
            }

            setProgress((prev) => parseYtDlpLine(line, prev));
        });

        const unsubComplete = window.electronAPI.onDownloadComplete((code) => {
            setIsDownloading(false);
            if (code === 0) {
                setProgress((prev) => ({
                    ...prev,
                    stage: "done",
                    pct: "100.0%",
                    speed: "",
                    eta: "",
                }));

                window.electronAPI
                    .appendHistory({
                        id: crypto.randomUUID(),
                        url: pendingUrlRef.current,
                        date: new Date().toISOString(),
                        name: progressRef.current.filename ?? undefined,
                    })
                    .then(loadHistory);

                toast.show(t("downloader.downloadComplete"));
            } else {
                setProgress((prev) => ({ ...prev, stage: "error" }));
            }
        });

        return () => {
            unsubOutput();
            unsubComplete();
        };
    }, [toast, t]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [outputLines]);

    function handleDownload(flags: string) {
        if (!url.trim()) {
            return;
        }

        pendingUrlRef.current = url.trim();
        progressRef.current = defaultProgress;
        setUrl("");
        setOutputLines([]);
        setProgress(defaultProgress);
        setErrorLine(null);
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

    function stageText(p: DownloadProgress): string {
        return t(`downloader.stage.${p.stage}`, { processor: p.processor || "…" });
    }

    return (
        <div className="flex flex-col h-full p-6 gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="url-input">{t("downloader.urlLabel")}</Label>
                <Input
                    id="url-input"
                    type="url"
                    placeholder={t("downloader.urlPlaceholder")}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isDownloading}
                />
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
                <Button
                    disabled={isDownloading || !url.trim()}
                    onClick={() => handleDownload(settings.youtubeDownloaderSettings.mp3Config)}
                >
                    {t("downloader.downloadMp3")}
                </Button>
                <Button
                    variant="secondary"
                    disabled={isDownloading || !url.trim()}
                    onClick={() => handleDownload(settings.youtubeDownloaderSettings.mp4Config)}
                >
                    {t("downloader.downloadMp4")}
                </Button>
                {isDownloading && (
                    <Button variant="destructive" onClick={handleCancel}>
                        {t("downloader.cancel")}
                    </Button>
                )}
            </div>

            {(isDownloading || progress.stage !== "idle") &&
                (() => {
                    const pctNum = parseFloat(progress.pct) || 0;
                    return (
                        <div className="rounded-md border border-border bg-muted/30 p-3 shrink-0 flex flex-col gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shrink-0",
                                        stageBadgeClass[progress.stage],
                                    )}
                                >
                                    {stageText(progress)}
                                </span>
                                {progress.filename && (
                                    <span className="text-sm text-muted-foreground truncate min-w-0">
                                        {progress.filename}
                                    </span>
                                )}
                            </div>
                            {progress.stage === "downloading" && (
                                <Progress value={pctNum} indicatorClassName="bg-green-500" />
                            )}
                            {(progress.pct || progress.speed || progress.eta) && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    {progress.pct && (
                                        <span className="text-lg font-bold text-foreground">
                                            {progress.pct}
                                        </span>
                                    )}
                                    {progress.speed && <span>{progress.speed}</span>}
                                    {progress.eta && (
                                        <span>
                                            {t("downloader.eta")} {progress.eta}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}

            <Tabs defaultValue={DownloadInfoTab.History} className="flex flex-col flex-1 min-h-0">
                <TabsList className="self-start h-8">
                    <TabsTrigger value={DownloadInfoTab.History} className="text-xs px-3 py-1">
                        {t("downloader.historyTab")}
                    </TabsTrigger>
                    <TabsTrigger value={DownloadInfoTab.Output} className="text-xs px-3 py-1">
                        {t("downloader.outputTab")}
                    </TabsTrigger>
                </TabsList>
                <TabsContent
                    value={DownloadInfoTab.History}
                    className="flex flex-col flex-1 mt-1 min-h-0"
                >
                    <DownloadHistory entries={history} onRefresh={loadHistory} />
                </TabsContent>
                <TabsContent value={DownloadInfoTab.Output} className="flex-1 mt-1 min-h-0">
                    <ScrollArea className="h-full rounded-md border border-border bg-muted/30">
                        <pre className="font-mono text-lg p-4 whitespace-pre-wrap wrap-break-word">
                            {outputLines.join("\n")}
                            <div ref={bottomRef} />
                        </pre>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
