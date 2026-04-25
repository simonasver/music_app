import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { app } from "electron";

function toolsDir(): string {
    return app.isPackaged
        ? path.join(process.resourcesPath, "tools")
        : path.join(process.cwd(), "resources", "tools");
}

function ffmpegPath(): string {
    return path.join(toolsDir(), "ffmpeg.exe");
}

function runFfmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath(), args, { windowsHide: true });

        const stderrLines: string[] = [];
        proc.stderr?.on("data", (data: Buffer) => {
            stderrLines.push(data.toString());
        });

        proc.on("close", (code) => {
            if (code !== 0) {
                return reject(new Error(stderrLines.join("") || `ffmpeg exited with code ${code}`));
            }
            resolve();
        });

        proc.on("error", (err) => reject(err));
    });
}

/** Extract embedded thumbnail from a media file. Returns temp file path, or null if none found. */
export async function extractThumbnail(inputPath: string): Promise<string | null> {
    const tempPath = path.join(app.getPath("temp"), `thumb_${randomUUID()}.jpg`);

    try {
        await runFfmpeg(["-y", "-i", inputPath, "-an", "-vcodec", "copy", tempPath]);
    } catch {
        cleanupFile(tempPath);
        return null;
    }

    if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
        cleanupFile(tempPath);
        return null;
    }

    return tempPath;
}

/** Embed a thumbnail image into a media file (re-mux in place). */
export async function embedThumbnail(filePath: string, thumbnailPath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const tempOutput = path.join(dir, `thumb_tmp_${randomUUID()}${ext}`);

    const args = [
        "-y",
        "-i",
        filePath,
        "-i",
        thumbnailPath,
        "-map",
        "0:a",
        "-map",
        "1:0",
        "-c",
        "copy",
        "-disposition:v",
        "attached_pic",
    ];

    if (ext === ".mp3") {
        args.push("-id3v2_version", "3");
        args.push("-metadata:s:v", "title=Album cover");
        args.push("-metadata:s:v", "comment=Cover (front)");
    }

    args.push(tempOutput);

    try {
        await runFfmpeg(args);
        fs.renameSync(tempOutput, filePath);
    } catch (err) {
        cleanupFile(tempOutput);
        throw err;
    }
}

export function cleanupFile(filePath: string | null): void {
    if (!filePath) return;
    try {
        fs.unlinkSync(filePath);
    } catch {
        /* ignore */
    }
}
