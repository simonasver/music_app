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

function ffprobePath(): string {
    return path.join(toolsDir(), "ffprobe.exe");
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

function runFfprobe(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffprobePath(), args, { windowsHide: true });

        const stdoutLines: string[] = [];
        const stderrLines: string[] = [];

        proc.stdout?.on("data", (data: Buffer) => {
            stdoutLines.push(data.toString());
        });

        proc.stderr?.on("data", (data: Buffer) => {
            stderrLines.push(data.toString());
        });

        proc.on("close", (code) => {
            if (code !== 0) {
                return reject(
                    new Error(stderrLines.join("") || `ffprobe exited with code ${code}`),
                );
            }
            resolve(stdoutLines.join(""));
        });

        proc.on("error", (err) => reject(err));
    });
}

function cleanupFile(filePath: string | null): void {
    if (!filePath) return;
    try {
        fs.unlinkSync(filePath);
    } catch {
        /* ignore */
    }
}

export async function getThumbnail(filePath: string): Promise<string | null> {
    let hasCoverArt = false;
    try {
        const json = await runFfprobe(["-v", "error", "-show_streams", "-of", "json", filePath]);
        const parsed = JSON.parse(json) as {
            streams: Array<{
                codec_type: string;
                disposition?: { attached_pic?: number };
            }>;
        };
        hasCoverArt = parsed.streams.some(
            (s) => s.codec_type === "video" && s.disposition?.attached_pic === 1,
        );
    } catch {
        return null;
    }

    if (!hasCoverArt) return null;

    const tempPath = path.join(app.getPath("temp"), `thumb_${randomUUID()}.jpg`);

    try {
        await runFfmpeg(["-y", "-i", filePath, "-map", "0:v:0", "-f", "image2", tempPath]);
    } catch {
        cleanupFile(tempPath);
        return null;
    }

    if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
        cleanupFile(tempPath);
        return null;
    }

    try {
        const b64 = fs.readFileSync(tempPath).toString("base64");
        return `data:image/jpeg;base64,${b64}`;
    } finally {
        cleanupFile(tempPath);
    }
}

export async function setThumbnail(filePath: string, imagePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const tempOutput = path.join(dir, `thumb_tmp_${randomUUID()}${ext}`);

    const args = ["-y", "-i", filePath, "-i", imagePath];

    if (ext === ".mp3") {
        args.push(
            "-map",
            "0:a",
            "-map",
            "1:v",
            "-c:a",
            "copy",
            "-c:v",
            "copy",
            "-id3v2_version",
            "3",
        );
    } else if (ext === ".flac") {
        args.push("-map", "0", "-map", "1", "-c", "copy", "-disposition:v", "attached_pic");
    } else {
        args.push("-map", "0", "-map", "1", "-c", "copy");
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

export async function removeThumbnail(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const tempOutput = path.join(dir, `thumb_tmp_${randomUUID()}${ext}`);

    try {
        await runFfmpeg(["-y", "-i", filePath, "-map", "0:a", "-c:a", "copy", tempOutput]);
        fs.renameSync(tempOutput, filePath);
    } catch (err) {
        cleanupFile(tempOutput);
        throw err;
    }
}
