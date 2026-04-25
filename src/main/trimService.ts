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

export interface TrimParams {
    inputPath: string;
    start: number;
    end: number;
    replaceOriginal: boolean;
}

export interface TrimResult {
    outputPath: string;
}

export async function executeTrim(params: TrimParams): Promise<TrimResult> {
    const { inputPath, start, end, replaceOriginal } = params;

    if (
        !inputPath ||
        typeof start !== "number" ||
        typeof end !== "number" ||
        !isFinite(start) ||
        !isFinite(end) ||
        end <= start
    ) {
        throw new Error("Invalid trim parameters");
    }

    const ext = path.extname(inputPath);
    const base = path.basename(inputPath, ext);
    const dir = path.dirname(inputPath);

    const finalOutputPath = replaceOriginal
        ? inputPath
        : path.join(dir, base + "_trimmed" + ext);

    const tempOutputPath = replaceOriginal
        ? path.join(dir, base + "_trimming_temp" + ext)
        : finalOutputPath;

    const ffmpegPath = path.join(toolsDir(), "ffmpeg.exe");

    const thumbnailPath = await extractThumbnail(inputPath);

    try {
        await runFfmpegTrim(ffmpegPath, inputPath, start, end, tempOutputPath);

        if (thumbnailPath) {
            try {
                await embedThumbnail(tempOutputPath, thumbnailPath);
            } catch {
                /* non-fatal — trimmed file still usable without thumbnail */
            }
        }
    } finally {
        cleanupFile(thumbnailPath);
    }

    if (replaceOriginal) {
        fs.renameSync(tempOutputPath, finalOutputPath);
    }

    return { outputPath: finalOutputPath };
}

function runFfmpegTrim(
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
