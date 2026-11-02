const pad = (value: number, length: number) => String(value).padStart(length, "0");

/** Whole number, e.g. "1", "02" */
const WHOLE_NUMBER = /^\d+$/;
/** Seconds with optional fraction, e.g. "5", "5.", "5.25", ".5" */
const DECIMAL_SECONDS = /^(\d+(\.\d*)?|\.\d+)$/;

/** Formats seconds as H:MM:SS.mmm */
export function formatTime(seconds: number): string {
    const totalMs = Math.max(0, Math.round(seconds * 1000));
    const h = Math.floor(totalMs / 3_600_000);
    const m = Math.floor((totalMs % 3_600_000) / 60_000);
    const s = Math.floor((totalMs % 60_000) / 1000);
    const ms = totalMs % 1000;
    return `${h}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
}

/**
 * Parses SS, SS.mmm, M:SS(.mmm) or H:MM:SS(.mmm) into seconds.
 * Accepts "," as the decimal separator. Returns null for invalid input.
 */
export function parseTime(input: string): number | null {
    const parts = input.trim().replace(",", ".").split(":");
    if (parts.length > 3) return null;

    const secondsPart = parts.pop() ?? "";
    if (!DECIMAL_SECONDS.test(secondsPart)) return null;
    if (!parts.every((part) => WHOLE_NUMBER.test(part))) return null;

    const [h, m] = parts.length === 2 ? parts.map(Number) : [0, Number(parts[0] ?? 0)];
    return h * 3600 + m * 60 + parseFloat(secondsPart);
}
