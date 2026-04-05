import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { app } from "electron";

export interface AppSettings {
    youtubeDownloaderSettings: {
        downloadFileLocation: string;
        mp3Config: string;
        mp4Config: string;
    };
}

export const DEFAULTS: AppSettings = {
    youtubeDownloaderSettings: {
        downloadFileLocation: path.join(os.homedir(), "Downloads"),
        mp3Config:
            "-f bestaudio -x --audio-format mp3 --audio-quality 0 --no-mtime --no-playlist --no-overwrites",
        mp4Config: "-f bestvideo+bestaudio --no-mtime --no-playlist --no-overwrites",
    },
};

function settingsFilePath(): string {
    return path.join(app.getPath("appData"), "music_app", "settings.json");
}

export function loadSettings(): AppSettings {
    try {
        const raw = fs.readFileSync(settingsFilePath(), "utf-8");
        return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULTS };
    }
}

export function saveSettings(settings: AppSettings): void {
    const filePath = settingsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 4), "utf-8");
}
