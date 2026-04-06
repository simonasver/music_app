export type DownloadStage = "idle" | "fetching" | "downloading" | "processing" | "done" | "error";

export interface DownloadProgress {
    stage: DownloadStage;
    pct: string;
    speed: string;
    eta: string;
    total: string;
    fragIdx: string;
    fragCount: string;
    processor: string;
    filename: string | null;
    raw: Record<string, string> | null;
}

export const defaultProgress: DownloadProgress = {
    stage: "idle",
    pct: "",
    speed: "",
    eta: "",
    total: "",
    fragIdx: "",
    fragCount: "",
    processor: "",
    filename: null,
    raw: null,
};

export function parseYtDlpLine(line: string, current: DownloadProgress): DownloadProgress {
    if (line.startsWith("{")) {
        try {
            const obj = JSON.parse(line) as Record<string, string>;
            if (obj.type === "progress") {
                return {
                    ...current,
                    stage: "downloading",
                    pct: obj.pct ?? "",
                    speed: obj.speed === "Unknown B/s" ? "" : obj.speed ?? "",
                    eta: obj.eta === "Unknown" || obj.eta === "NA" ? "" : obj.eta ?? "",
                    total: obj.total ?? "",
                    fragIdx: obj.fragIdx ?? "",
                    fragCount: obj.fragCount ?? "",
                    raw: obj,
                };
            }
            if (obj.type === "postprocess" && obj.status === "started") {
                return {
                    ...current,
                    stage: "processing",
                    speed: "",
                    eta: "",
                    processor: obj.processor ?? "",
                    raw: obj,
                };
            }
            return current;
        } catch {
            // fall through to plain-text handling
        }
    }

    if (line.startsWith("[download] Destination:")) {
        const full = line.replace("[download] Destination:", "").trim();
        const filename = full.split(/[\\/]/).pop() ?? null;
        return { ...current, filename, stage: "downloading", pct: "", raw: null };
    }

    if (current.stage === "idle" && line.startsWith("[")) {
        return { ...current, stage: "fetching" };
    }

    return current;
}

export function stageLabel(p: DownloadProgress): string {
    switch (p.stage) {
        case "idle":
            return "Ready";
        case "fetching":
            return "Fetching info…";
        case "downloading":
            return "Downloading…";
        case "processing":
            return `Processing (${p.processor || "…"})`;
        case "done":
            return "Download complete";
        case "error":
            return "Error";
    }
}
