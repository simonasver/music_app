import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { extractThumbnail, embedThumbnail, cleanupFile } from "./thumbnailUtil";

function toolsDir(): string {
    return app.isPackaged
        ? path.join(process.resourcesPath, "tools")
        : path.join(process.cwd(), "resources", "tools");
}

export interface SplitSegment {
    start: number;
    end: number;
    label: string;
}

export interface SplitParams {
    inputPath: string;
    segments: SplitSegment[];
    outputDir?: string;
    deleteOriginal?: boolean;
}

export interface SplitResult {
    outputPaths: string[];
}

/** Replace characters that are invalid in Windows filenames. */
function sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}

/** Split a media file into segments using ffmpeg stream copy (no re-encoding). */
export async function executeSplit(params: SplitParams): Promise<SplitResult> {
    const { inputPath, segments, outputDir, deleteOriginal } = params;

    if (!segments.length) {
        return { outputPaths: [] };
    }

    const ext = path.extname(inputPath);
    const base = path.basename(inputPath, ext);
    const dir = outputDir ?? path.dirname(inputPath);
    const ffmpegPath = path.join(toolsDir(), "ffmpeg.exe");
    const outputPaths: string[] = [];

    const thumbnailPath = await extractThumbnail(inputPath);

    try {
        for (const segment of segments) {
            const label = sanitizeFilename(segment.label);
            const outputPath = path.join(dir, `${base} - ${label}${ext}`);

            await splitSegment(ffmpegPath, inputPath, segment.start, segment.end, outputPath);

            if (thumbnailPath) {
                try {
                    await embedThumbnail(outputPath, thumbnailPath);
                } catch {
                    /* non-fatal — segment is still usable without thumbnail */
                }
            }

            outputPaths.push(outputPath);
        }
    } finally {
        cleanupFile(thumbnailPath);
    }

    if (deleteOriginal) {
        try {
            fs.unlinkSync(inputPath);
        } catch {
            /* ignore — file may already be gone or locked */
        }
    }

    return { outputPaths };
}

function splitSegment(
    ffmpegPath: string,
    inputPath: string,
    start: number,
    end: number,
    outputPath: string,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const args = [
            "-y",
            "-i",
            inputPath,
            "-ss",
            String(start),
            "-to",
            String(end),
            "-map",
            "0:a",
            "-c",
            "copy",
            outputPath,
        ];

        const proc = spawn(ffmpegPath, args, { windowsHide: true });

        const stderrLines: string[] = [];
        proc.stderr?.on("data", (data: Buffer) => {
            stderrLines.push(data.toString());
        });

        proc.on("close", (code) => {
            if (code !== 0) {
                try {
                    fs.unlinkSync(outputPath);
                } catch {
                    /* ignore */
                }
                return reject(new Error(stderrLines.join("") || `ffmpeg exited with code ${code}`));
            }
            resolve();
        });

        proc.on("error", (err) => reject(err));
    });
}
