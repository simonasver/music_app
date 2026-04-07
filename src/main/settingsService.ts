import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { app } from "electron";

export interface AppSettings {
    general: {
        language: string;
        theme: "light" | "dark" | "system";
    };
    youtubeDownloaderSettings: {
        downloadFileLocation: string;
        mp3Config: string;
        mp4Config: string;
    };
}

export const DEFAULTS: AppSettings = {
    general: {
        language: "system",
        theme: "system",
    },
    youtubeDownloaderSettings: {
        downloadFileLocation: path.join(os.homedir(), "Downloads"),
        mp3Config:
            "-f bestaudio -x --audio-format mp3 --audio-quality 0 --no-mtime --no-playlist --no-overwrites --embed-thumbnail",
        mp4Config: "-f bestvideo+bestaudio --no-mtime --no-playlist --no-overwrites",
    },
};

function settingsFilePath(): string {
    return path.join(app.getPath("userData"), "settings.json");
}

export function loadSettings(): AppSettings {
    try {
        const raw = fs.readFileSync(settingsFilePath(), "utf-8");
        const saved = JSON.parse(raw);
        return {
            general: { ...DEFAULTS.general, ...saved.general },
            youtubeDownloaderSettings: {
                ...DEFAULTS.youtubeDownloaderSettings,
                ...saved.youtubeDownloaderSettings,
            },
        };
    } catch {
        return { ...DEFAULTS };
    }
}

export function saveSettings(settings: AppSettings): void {
    const filePath = settingsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 4), "utf-8");
}
