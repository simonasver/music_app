import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import { Readable } from "node:stream";
import { mediaMimeType, mediaPathFromUrl } from "../shared/media";
import { ffmpegPath } from "./tools";

const PEAKS_SAMPLE_RATE = 8000;
const PEAKS_PER_SECOND = 50;
const SAMPLES_PER_PEAK = PEAKS_SAMPLE_RATE / PEAKS_PER_SECOND;

function parseRange(header: string, size: number): { start: number; end: number } | null {
    const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
    if (!match) return null;
    const [, startStr, endStr] = match;

    // "bytes=-500" means the last 500 bytes
    const start = startStr === "" ? Math.max(0, size - Number(endStr)) : Number(startStr);
    const end = startStr === "" || endStr === "" ? size - 1 : Math.min(Number(endStr), size - 1);

    return start <= end && start < size ? { start, end } : null;
}

function fileResponse(
    filePath: string,
    status: number,
    headers: Record<string, string>,
    range?: { start: number; end: number },
): Response {
    const body = Readable.toWeb(fs.createReadStream(filePath, range)) as unknown as ReadableStream;
    return new Response(body, {
        status,
        headers: { "Accept-Ranges": "bytes", "Content-Type": mediaMimeType(filePath), ...headers },
    });
}

export async function handleMediaRequest(req: Request): Promise<Response> {
    const filePath = mediaPathFromUrl(req.url);

    let size: number;
    try {
        size = (await fs.promises.stat(filePath)).size;
    } catch {
        return new Response(null, { status: 404 });
    }

    const rangeHeader = req.headers.get("Range");
    if (!rangeHeader) {
        return fileResponse(filePath, 200, { "Content-Length": String(size) });
    }

    const range = parseRange(rangeHeader, size);
    if (!range) {
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }

    return fileResponse(
        filePath,
        206,
        {
            "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
            "Content-Length": String(range.end - range.start + 1),
        },
        range,
    );
}

export interface PeaksResult {
    peaks: Float32Array;
    duration: number;
}

async function readPeaks(stdout: AsyncIterable<Buffer>) {
    const peaks: number[] = [];
    let max = 0;
    let samplesInPeak = 0;
    let totalSamples = 0;

    for await (const chunk of stdout) {
        // Signed 8-bit PCM: one byte per sample, so chunks never split a sample
        const samples = new Int8Array(chunk.buffer, chunk.byteOffset, chunk.length);
        for (let i = 0; i < samples.length; i++) {
            const value = Math.abs(samples[i]);
            if (value > max) max = value;
            if (++samplesInPeak === SAMPLES_PER_PEAK) {
                peaks.push(max / 128);
                max = 0;
                samplesInPeak = 0;
            }
        }
        totalSamples += samples.length;
    }
    if (samplesInPeak > 0) peaks.push(max / 128);

    return { peaks, totalSamples };
}

export async function computePeaks(filePath: string): Promise<PeaksResult> {
    // ffmpeg decodes only the audio, mixed to mono at a low rate, streamed through stdout
    const args = [
        "-v",
        "error",
        "-i",
        filePath,
        "-vn",
        "-ac",
        "1",
        "-ar",
        String(PEAKS_SAMPLE_RATE),
        "-f",
        "s8",
        "pipe:1",
    ];

    const proc = spawn(ffmpegPath(), args, { windowsHide: true });

    let stderr = "";
    proc.stderr.on("data", (data: Buffer) => (stderr += data.toString()));

    const [{ peaks, totalSamples }, [code]] = await Promise.all([
        readPeaks(proc.stdout),
        once(proc, "close"),
    ]);

    if (code !== 0) {
        // A file without an audio track has nothing to draw, but is still trimmable
        if (/does not contain any stream|matches no streams/i.test(stderr)) {
            return { peaks: new Float32Array(0), duration: 0 };
        }
        throw new Error(stderr || `ffmpeg exited with code ${code}`);
    }

    return { peaks: Float32Array.from(peaks), duration: totalSamples / PEAKS_SAMPLE_RATE };
}
