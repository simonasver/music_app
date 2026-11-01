import { useTranslation } from "react-i18next";
import { formatTime } from "../lib/time";
import { TimeInput } from "./TimeInput";

interface TrimControlsProps {
    trimStart: number;
    trimEnd: number;
    onStartChange: (seconds: number) => void;
    onEndChange: (seconds: number) => void;
    disabled: boolean;
}

export function TrimControls({
    trimStart,
    trimEnd,
    onStartChange,
    onEndChange,
    disabled,
}: TrimControlsProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-end gap-4">
            <TimeInput
                id="trim-start"
                label={t("trimmer.startSeconds")}
                value={trimStart}
                onChange={onStartChange}
                disabled={disabled}
            />
            <TimeInput
                id="trim-end"
                label={t("trimmer.endSeconds")}
                value={trimEnd}
                onChange={onEndChange}
                disabled={disabled}
            />
            <div className="pb-2.5 text-sm text-muted-foreground whitespace-nowrap">
                {t("trimmer.selectionDuration")}: {formatTime(trimEnd - trimStart)}
            </div>
        </div>
    );
}
