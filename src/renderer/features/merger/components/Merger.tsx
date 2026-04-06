import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { MergeTrack } from "./MergeTrack";

interface Track {
    id: string;
    path: string;
}

export function Merger() {
    const { t } = useTranslation();
    const { show: showToast } = useToast();

    const [tracks, setTracks] = useState<Track[]>([]);
    const [isMerging, setIsMerging] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor));

    async function handleAddFiles() {
        const paths = await window.electronAPI.selectMediaFiles();
        if (!paths.length) return;
        const newTracks: Track[] = paths.map((path) => ({
            id: crypto.randomUUID(),
            path,
        }));
        setTracks((prev) => [...prev, ...newTracks]);
    }

    function handleRemove(id: string) {
        setTracks((prev) => prev.filter((t) => t.id !== id));
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setTracks((prev) => {
                const oldIndex = prev.findIndex((t) => t.id === active.id);
                const newIndex = prev.findIndex((t) => t.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    }

    async function handleMerge() {
        const outputPath = await window.electronAPI.saveFile();
        if (!outputPath) return;

        setIsMerging(true);
        try {
            const result = await window.electronAPI.executeMerge({
                inputPaths: tracks.map((t) => t.path),
                outputPath,
            });
            showToast(t("merger.mergeComplete", { path: result.outputPath }));
            setTracks([]);
        } catch {
            showToast(t("merger.mergeError"));
        } finally {
            setIsMerging(false);
        }
    }

    if (!tracks.length) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 h-full gap-3">
                <Button size="lg" onClick={handleAddFiles}>
                    {t("merger.addFiles")}
                </Button>
                <p className="text-sm text-muted-foreground">{t("merger.supportedFormats")}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {/* Track list */}
            <div className="flex-1 overflow-auto flex flex-col gap-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={tracks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {tracks.map((track) => (
                            <MergeTrack
                                key={track.id}
                                id={track.id}
                                path={track.path}
                                onRemove={handleRemove}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between shrink-0">
                <Button variant="outline" onClick={handleAddFiles} disabled={isMerging}>
                    {t("merger.addMore")}
                </Button>
                <div className="flex items-center gap-3">
                    {tracks.length < 2 && (
                        <span className="text-sm text-muted-foreground">
                            {t("merger.minFilesHint")}
                        </span>
                    )}
                    <Button
                        size="lg"
                        onClick={handleMerge}
                        disabled={tracks.length < 2 || isMerging}
                    >
                        {isMerging ? t("merger.merging") : t("merger.mergeAndSave")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
