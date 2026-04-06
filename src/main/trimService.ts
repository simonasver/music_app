import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

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

export function executeTrim(params: TrimParams): Promise<TrimResult> {
    return new Promise((resolve, reject) => {
        const { inputPath, start, end, replaceOriginal } = params;

        if (
            !inputPath ||
            typeof start !== "number" ||
            typeof end !== "number" ||
            !isFinite(start) ||
            !isFinite(end) ||
            end <= start
        ) {
            return reject(new Error("Invalid trim parameters"));
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

        const args = [
            "-y",
            "-i",
            inputPath,
            "-ss",
            String(start),
            "-to",
            String(end),
            "-c",
            "copy",
            tempOutputPath,
        ];

        const proc = spawn(ffmpegPath, args, { windowsHide: true });

        const stderrLines: string[] = [];
        proc.stderr?.on("data", (data: Buffer) => {
            stderrLines.push(data.toString());
        });

        proc.on("close", (code) => {
            if (code !== 0) {
                try {
                    fs.unlinkSync(tempOutputPath);
                } catch {
                    /* ignore */
                }
                return reject(new Error(stderrLines.join("") || `ffmpeg exited with code ${code}`));
            }
            if (replaceOriginal) {
                try {
                    fs.renameSync(tempOutputPath, finalOutputPath);
                } catch (e) {
                    return reject(e);
                }
            }
            resolve({ outputPath: finalOutputPath });
        });

        proc.on("error", (err) => {
            reject(err);
        });
    });
}
