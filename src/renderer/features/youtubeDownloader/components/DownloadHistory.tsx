import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ConfirmButton";
import { useToast } from "@/lib/toast";
import type { HistoryEntry } from "../../../env";

interface Props {
    entries: HistoryEntry[];
    onRefresh: () => void;
}

export function DownloadHistory({ entries, onRefresh }: Props) {
    const toast = useToast();

    async function handleDelete(id: string) {
        await window.electronAPI.deleteHistoryEntry(id);
        onRefresh();
        toast.show("Entry deleted");
    }

    if (entries.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No history yet.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto rounded-md border border-border bg-muted/30 min-h-0">
            <div className="p-2 flex flex-col gap-1">
                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 min-w-0 w-full"
                    >
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
                                    toast.show("Copied to clipboard");
                                }}
                            >
                                Copy
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => window.electronAPI.openExternal(entry.url)}
                            >
                                Open
                            </Button>
                            <ConfirmButton
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                variant="ghost"
                                confirmText="Delete this entry?"
                                confirmLabel="Delete"
                                onConfirm={() => handleDelete(entry.id)}
                            >
                                Delete
                            </ConfirmButton>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
