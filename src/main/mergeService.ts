import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

function toolsDir(): string {
    return app.isPackaged
        ? path.join(process.resourcesPath, "tools")
        : path.join(process.cwd(), "resources", "tools");
}

export interface MergeParams {
    inputPaths: string[];
    outputPath: string;
}

export interface MergeResult {
    outputPath: string;
}

const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "flac", "m4a", "aac", "opus", "wma"]);

function buildArgs(inputPaths: string[], outputPath: string): string[] {
    const n = inputPaths.length;
    const ext = path.extname(outputPath).replace(".", "").toLowerCase();
    const isAudio = AUDIO_EXTENSIONS.has(ext);

    const inputArgs = inputPaths.flatMap((p) => ["-i", p]);

    if (isAudio) {
        const filterInputs = inputPaths.map((_, i) => `[${i}:a]`).join("");
        const filterComplex = `${filterInputs}concat=n=${n}:v=0:a=1[outa]`;
        return ["-y", ...inputArgs, "-filter_complex", filterComplex, "-map", "[outa]", outputPath];
    } else {
        const filterInputs = inputPaths.map((_, i) => `[${i}:v][${i}:a]`).join("");
        const filterComplex = `${filterInputs}concat=n=${n}:v=1:a=1[outv][outa]`;
        return [
            "-y",
            ...inputArgs,
            "-filter_complex",
            filterComplex,
            "-map",
            "[outv]",
            "-map",
            "[outa]",
            outputPath,
        ];
    }
}

export function executeMerge(params: MergeParams): Promise<MergeResult> {
    return new Promise((resolve, reject) => {
        const { inputPaths, outputPath } = params;

        if (!inputPaths || inputPaths.length < 2) {
            return reject(new Error("At least 2 input files are required"));
        }
        if (!outputPath) {
            return reject(new Error("Output path is required"));
        }

        const ffmpegPath = path.join(toolsDir(), "ffmpeg.exe");
        const args = buildArgs(inputPaths, outputPath);
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
            resolve({ outputPath });
        });

        proc.on("error", (err) => {
            reject(err);
        });
    });
}
