import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app, clipboard } from "electron";
import { fileExtension } from "../shared/media";
import { ffmpegPath } from "./tools";

const MAX_COVER_SIZE = 1000;

// Format-specific ffmpeg args for writing the cover. Supporting a new format means adding an
// entry here (and to THUMBNAIL_EXTENSIONS in shared/media.ts) after testing it.
const THUMBNAIL_FORMATS: Record<string, string[]> = {
    mp3: [
        "-id3v2_version",
        "3",
        "-metadata:s:0",
        "title=Album cover",
        "-metadata:s:0",
        "comment=Cover (front)",
    ],
};

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface EmbedThumbnailParams {
    mediaPath: string;
    imagePath: string;
    crop: CropArea;
    replaceOriginal: boolean;
}

export interface EmbedThumbnailResult {
    outputPath: string;
}

let clipboardImagePath: string | null = null;

function formatArgs(mediaPath: string): string[] {
    const ext = fileExtension(mediaPath);
    const args = THUMBNAIL_FORMATS[ext];
    if (!args) {
        throw new Error(`Unsupported format ".${ext}": only MP3 is supported`);
    }
    return args;
}

function isValidCrop(crop: CropArea): boolean {
    return (
        !!crop &&
        [crop.x, crop.y, crop.width, crop.height].every(
            (v) => typeof v === "number" && isFinite(v),
        ) &&
        crop.x >= 0 &&
        crop.y >= 0 &&
        crop.width > 0 &&
        crop.height > 0
    );
}

function tempPath(name: string): string {
    return path.join(app.getPath("temp"), `music_app_${name}_${Date.now()}`);
}

function removeFile(filePath: string): void {
    try {
        fs.unlinkSync(filePath);
    } catch {
        /* ignore */
    }
}

function runFfmpeg(args: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath(), args, { windowsHide: true });

        const stdout: Buffer[] = [];
        let stderr = "";
        proc.stdout.on("data", (data: Buffer) => stdout.push(data));
        proc.stderr.on("data", (data: Buffer) => (stderr += data.toString()));

        proc.on("close", (code) => {
            if (code !== 0) {
                return reject(new Error(stderr || `ffmpeg exited with code ${code}`));
            }
            resolve(Buffer.concat(stdout));
        });

        proc.on("error", reject);
    });
}

function cropImage(imagePath: string, crop: CropArea, outputPath: string): Promise<Buffer> {
    const x = Math.round(crop.x);
    const y = Math.round(crop.y);
    const width = Math.round(crop.width);
    const height = Math.round(crop.height);
    // JPEG 4:2:0 needs even dimensions; an explicit S:S keeps the cover square
    const size = Math.min(MAX_COVER_SIZE, Math.floor(width / 2) * 2);

    return runFfmpeg([
        "-v",
        "error",
        "-y",
        "-i",
        imagePath,
        "-vf",
        `crop=${width}:${height}:${x}:${y},scale=${size}:${size}`,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        "-pix_fmt",
        "yuvj420p",
        outputPath,
    ]);
}

export async function embedThumbnail(params: EmbedThumbnailParams): Promise<EmbedThumbnailResult> {
    const { mediaPath, imagePath, crop, replaceOriginal } = params;

    if (!mediaPath || !imagePath || !isValidCrop(crop)) {
        throw new Error("Invalid thumbnail parameters");
    }
    const extraArgs = formatArgs(mediaPath);

    const ext = path.extname(mediaPath);
    const base = path.basename(mediaPath, ext);
    const dir = path.dirname(mediaPath);

    const finalOutputPath = replaceOriginal ? mediaPath : path.join(dir, base + "_thumbnail" + ext);

    const tempOutputPath = replaceOriginal
        ? path.join(dir, base + "_thumbnail_temp" + ext)
        : finalOutputPath;

    const coverPath = tempPath("cover") + ".jpg";

    try {
        await cropImage(imagePath, crop, coverPath);

        // Cover is mapped first so it is always output stream 0; any existing cover is dropped
        await runFfmpeg([
            "-v",
            "error",
            "-y",
            "-i",
            mediaPath,
            "-i",
            coverPath,
            "-map",
            "1",
            "-map",
            "0",
            "-map",
            "-0:disp:attached_pic?",
            "-c",
            "copy",
            "-disposition:0",
            "attached_pic",
            ...extraArgs,
            tempOutputPath,
        ]);
    } catch (e) {
        removeFile(tempOutputPath);
        throw e;
    } finally {
        removeFile(coverPath);
    }

    if (replaceOriginal) {
        fs.renameSync(tempOutputPath, finalOutputPath);
    }

    return { outputPath: finalOutputPath };
}

export async function getThumbnail(mediaPath: string): Promise<string | null> {
    formatArgs(mediaPath);

    try {
        const png = await runFfmpeg([
            "-v",
            "error",
            "-i",
            mediaPath,
            "-map",
            "0:disp:attached_pic",
            "-frames:v",
            "1",
            "-c:v",
            "png",
            "-f",
            "image2pipe",
            "pipe:1",
        ]);
        return `data:image/png;base64,${png.toString("base64")}`;
    } catch (e) {
        if (e instanceof Error && /matches no streams/i.test(e.message)) {
            return null;
        }
        throw e;
    }
}

export async function saveClipboardImage(): Promise<string | null> {
    for (const item of await clipboard.read()) {
        const type = item.types.find((t): t is `image/${string}` => t.startsWith("image/"));
        if (!type) continue;

        const blob = await item.getType(type);
        const ext = type === "image/jpeg" ? "jpg" : type.slice("image/".length);

        if (clipboardImagePath) removeFile(clipboardImagePath);
        clipboardImagePath = `${tempPath("clipboard")}.${ext}`;
        fs.writeFileSync(clipboardImagePath, Buffer.from(await blob.arrayBuffer()));
        return clipboardImagePath;
    }
    return null;
}
