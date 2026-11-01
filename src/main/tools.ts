import path from "node:path";
import { app } from "electron";

export function toolsDir(): string {
    return app.isPackaged
        ? path.join(process.resourcesPath, "tools")
        : path.join(process.cwd(), "resources", "tools");
}

export function ffmpegPath(): string {
    return path.join(toolsDir(), "ffmpeg.exe");
}

export function ytDlpPath(): string {
    return path.join(toolsDir(), "yt-dlp.exe");
}
