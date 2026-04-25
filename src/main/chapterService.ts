import fs from "node:fs";

export interface Chapter {
    start: number;
    end: number;
    title: string;
}

/** Read chapter metadata from a yt-dlp .info.json sidecar file. */
export function readChaptersFromInfoJson(infoJsonPath: string): Chapter[] {
    try {
        const raw = fs.readFileSync(infoJsonPath, "utf-8");
        const json = JSON.parse(raw);
        const chapters: unknown[] = json.chapters ?? [];

        return chapters.map((ch: unknown, i: number) => {
            const obj = ch as { start_time?: number; end_time?: number; title?: string };
            return {
                start: obj.start_time ?? 0,
                end: obj.end_time ?? 0,
                title: obj.title ?? `Chapter ${i + 1}`,
            };
        });
    } catch {
        return [];
    }
}
