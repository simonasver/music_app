import { exec, spawn, ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { toolsDir, ytDlpPath } from "./tools";

let activeProcess: ChildProcess | null = null;

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

function readFinalFilePaths(outputFile: string): string[] {
    try {
        return fs
            .readFileSync(outputFile, "utf-8")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    } catch {
        return [];
    } finally {
        fs.rmSync(outputFile, { force: true });
    }
}

export function startDownload(
    url: string,
    flagsString: string,
    outputDir: string,
    onData: (line: string) => void,
    onExit: (code: number | null, filePaths: string[]) => void,
): void {
    const dir = toolsDir();
    const flags = parseFlags(flagsString);

    const PROGRESS_FLAGS = [
        "--newline",
        "--progress-template",
        'download:{"type":"progress","status":"%(progress.status)s","pct":"%(progress._percent_str)s","speed":"%(progress._speed_str)s","eta":"%(progress._eta_str)s","total":"%(progress._total_bytes_str)s","fragIdx":"%(progress.fragment_index)s","fragCount":"%(progress.fragment_count)s"}',
        "--progress-template",
        'postprocess:{"type":"postprocess","status":"%(progress.status)s","processor":"%(progress.postprocessor)s"}',
    ];

    const filePathsOutput = path.join(
        os.tmpdir(),
        `music_app-filepaths-${crypto.randomUUID()}.txt`,
    );

    const args = [
        ...PROGRESS_FLAGS,
        "--print-to-file",
        "after_move:filepath",
        filePathsOutput.replace(/%/g, "%%"),
        ...flags,
        "-o",
        path.join(outputDir, "%(title)s.%(ext)s"),
        url,
    ];

    activeProcess = spawn(ytDlpPath(), args, {
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

    activeProcess.on("close", (code) => {
        activeProcess = null;
        onExit(code, readFinalFilePaths(filePathsOutput));
    });
}

export function cancelDownload(): void {
    if (activeProcess?.pid) {
        exec(`taskkill /F /T /PID ${activeProcess.pid}`);
        activeProcess = null;
    }
}
