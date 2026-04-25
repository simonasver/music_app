import { exec, spawn, ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { readChaptersFromInfoJson } from "./chapterService";
import { executeSplit } from "./splitService";

let activeProcess: ChildProcess | null = null;

function toolsDir(): string {
    return app.isPackaged
        ? path.join(process.resourcesPath, "tools")
        : path.join(process.cwd(), "resources", "tools");
}

/** Split a flags string into an args array, respecting quoted strings. */
function parseFlags(flagsString: string): string[] {
    const args: string[] = [];
    let current = "";
    let inQuote = false;
    let quoteChar = "";

    for (const char of flagsString) {
        if (inQuote) {
            if (char === quoteChar) {
                inQuote = false;
            } else {
                current += char;
            }
        } else if (char === '"' || char === "'") {
            inQuote = true;
            quoteChar = char;
        } else if (char === " ") {
            if (current.length > 0) {
                args.push(current);
                current = "";
            }
        } else {
            current += char;
        }
    }

    if (current.length > 0) {
        args.push(current);
    }

    return args;
}


/** Find the most recently created .info.json file in a directory. */
function findInfoJson(dir: string): string | null {
    try {
        const files = fs.readdirSync(dir)
            .filter((f) => f.endsWith(".info.json"))
            .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);
        return files.length > 0 ? path.join(dir, files[0].name) : null;
    } catch {
        return null;
    }
}

/** Derive the media file path from an .info.json path by finding a matching base name. */
function findMediaForInfoJson(infoJsonPath: string): string | null {
    const dir = path.dirname(infoJsonPath);
    const base = path.basename(infoJsonPath, ".info.json");
    try {
        const match = fs.readdirSync(dir).find(
            (f) => f.startsWith(base) && !f.endsWith(".info.json") && f !== base,
        );
        return match ? path.join(dir, match) : null;
    } catch {
        return null;
    }
}

export function startDownload(
    url: string,
    flagsString: string,
    outputDir: string,
    splitChapters: boolean,
    onData: (line: string) => void,
    onExit: (code: number | null) => void,
): void {
    const dir = toolsDir();
    const ytDlpPath = path.join(dir, "yt-dlp.exe");
    const flags = parseFlags(flagsString);

    const PROGRESS_FLAGS = [
        "--newline",
        "--progress-template",
        'download:{"type":"progress","status":"%(progress.status)s","pct":"%(progress._percent_str)s","speed":"%(progress._speed_str)s","eta":"%(progress._eta_str)s","total":"%(progress._total_bytes_str)s","fragIdx":"%(progress.fragment_index)s","fragCount":"%(progress.fragment_count)s"}',
        "--progress-template",
        'postprocess:{"type":"postprocess","status":"%(progress.status)s","processor":"%(progress.postprocessor)s"}',
    ];

    const args = [
        ...PROGRESS_FLAGS,
        ...flags,
        ...(splitChapters ? ["--write-info-json"] : []),
        "-o",
        path.join(outputDir, "%(title)s.%(ext)s"),
        url,
    ];

    activeProcess = spawn(ytDlpPath, args, {
        env: { ...process.env, PATH: dir + ";" + process.env.PATH },
        windowsHide: true,
    });

    activeProcess.stdout?.on("data", (data: Buffer) => {
        for (const line of data.toString().split(/\r?\n|\r/)) {
            if (line.trim()) onData(line);
        }
    });

    activeProcess.stderr?.on("data", (data: Buffer) => {
        for (const line of data.toString().split(/\r?\n|\r/)) {
            if (line.trim()) onData(line);
        }
    });

    activeProcess.on("close", async (code) => {
        activeProcess = null;

        if (code === 0 && splitChapters) {
            const jsonPath = findInfoJson(outputDir);
            if (!jsonPath) {
                onData("[SplitChapters] No .info.json found, skipping.");
                onExit(code);
                return;
            }
            const mediaPath = findMediaForInfoJson(jsonPath);
            if (!mediaPath) {
                onData("[SplitChapters] Could not find media file for splitting.");
                try { fs.unlinkSync(jsonPath); } catch { /* */ }
                onExit(code);
                return;
            }
            try {
                onData(JSON.stringify({ type: "postprocess", status: "started", processor: "SplitChapters" }));
                const chapters = readChaptersFromInfoJson(jsonPath);

                if (chapters.length > 0) {
                    const segments = chapters.map((ch) => ({
                        start: ch.start,
                        end: ch.end,
                        label: ch.title,
                    }));
                    const result = await executeSplit({
                        inputPath: mediaPath,
                        segments,
                        deleteOriginal: true,
                    });
                    for (const p of result.outputPaths) {
                        onData(`[SplitChapters] Created: ${path.basename(p)}`);
                    }
                } else {
                    onData("[SplitChapters] No chapters found, keeping original file.");
                }
            } catch (err) {
                onData(`[SplitChapters] Error: ${err instanceof Error ? err.message : err}`);
            } finally {
                try { fs.unlinkSync(jsonPath); } catch { /* already gone */ }
            }
        }

        onExit(code);
    });
}

export function cancelDownload(): void {
    if (activeProcess?.pid) {
        exec(`taskkill /F /T /PID ${activeProcess.pid}`);
        activeProcess = null;
    }
}
