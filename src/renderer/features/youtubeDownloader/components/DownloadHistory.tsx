import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ConfirmButton";
import { useToast } from "@/lib/toast";
import type { HistoryEntry } from "../../../env";

interface Props {
    entries: HistoryEntry[];
    hasMore: boolean;
    onLoadMore: () => void;
    onRefresh: () => void;
}

export function DownloadHistory({ entries, hasMore, onLoadMore, onRefresh }: Props) {
    const { t } = useTranslation();
    const toast = useToast();
    const { ref: sentinelRef, inView } = useInView({ scrollMargin: "200px" });

    useEffect(() => {
        if (inView && hasMore) {
            onLoadMore();
        }
    }, [inView, hasMore, onLoadMore]);

    async function handleFileAction(action: (id: string) => Promise<boolean>, id: string) {
        if (!(await action(id))) {
            toast.show(t("history.fileNotFound"));
        }
    }

    async function handleDelete(id: string) {
        await window.electronAPI.deleteHistoryEntry(id);
        onRefresh();
        toast.show(t("history.entryDeleted"));
    }

    if (entries.length === 0 && !hasMore) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                {t("history.empty")}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto rounded-md border border-border bg-muted/30 min-h-0">
            <div className="p-2 flex flex-col gap-1">
                {entries.map((entry, index) => (
                    <div
                        key={entry.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 min-w-0 w-full ${
                            index % 2 === 0 ? "bg-background" : ""
                        }`}
                    >
                        <span className="text-xs text-muted-foreground font-mono w-6 shrink-0 select-none text-right">
                            {index + 1}.
                        </span>
                        <span className="flex-1 truncate font-mono text-xs text-foreground min-w-0">
                            {entry.name ?? entry.url}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {new Date(entry.date).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                    navigator.clipboard.writeText(entry.url);
                                    toast.show(t("history.copied"));
                                }}
                            >
                                {t("history.copy")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => window.electronAPI.openExternal(entry.url)}
                            >
                                {t("history.open")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                disabled={!entry.fileExists}
                                onClick={() =>
                                    handleFileAction(window.electronAPI.openHistoryFile, entry.id)
                                }
                            >
                                {t("history.openFile")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                disabled={!entry.fileExists}
                                onClick={() =>
                                    handleFileAction(
                                        window.electronAPI.showHistoryFileInFolder,
                                        entry.id,
                                    )
                                }
                            >
                                {t("history.showInFolder")}
                            </Button>
                            <ConfirmButton
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                variant="ghost"
                                confirmText={t("history.deleteConfirm")}
                                confirmLabel={t("history.delete")}
                                onConfirm={() => handleDelete(entry.id)}
                            >
                                {t("history.delete")}
                            </ConfirmButton>
                        </div>
                    </div>
                ))}
                {hasMore && <div ref={sentinelRef} className="h-1 shrink-0" />}
            </div>
        </div>
    );
}
