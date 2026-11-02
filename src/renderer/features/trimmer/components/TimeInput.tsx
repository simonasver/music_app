import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TRIM_NUDGE_STEPS } from "@/lib/steps";
import { formatTime, parseTime } from "@/lib/time";
import { StepButtons } from "@/components/media/StepButtons";

interface TimeInputProps {
    id: string;
    label: string;
    /** Value in seconds */
    value: number;
    onChange: (seconds: number) => void;
    disabled: boolean;
}

export function TimeInput({ id, label, value, onChange, disabled }: TimeInputProps) {
    // null = not editing, show the formatted value
    const [draft, setDraft] = useState<string | null>(null);

    function commitDraft() {
        if (draft !== null) {
            const seconds = parseTime(draft);
            if (seconds !== null) onChange(seconds);
        }
        setDraft(null);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(null);
    }

    function nudge(step: number) {
        onChange(Math.round((value + step) * 1000) / 1000);
    }

    return (
        <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-1">
                <StepButtons
                    steps={TRIM_NUDGE_STEPS}
                    direction="decrease"
                    onStep={nudge}
                    disabled={disabled}
                />
                <Input
                    id={id}
                    type="text"
                    spellCheck={false}
                    className="min-w-0 tabular-nums"
                    value={draft ?? formatTime(value)}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitDraft}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                <StepButtons
                    steps={TRIM_NUDGE_STEPS}
                    direction="increase"
                    onStep={nudge}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
