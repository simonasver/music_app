import fs from "node:fs";
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

export function getDefaults(): AppSettings {
    return {
        general: {
            language: "system",
            theme: "system",
        },
        youtubeDownloaderSettings: {
            downloadFileLocation: app.getPath("downloads"),
            mp3Config:
                "-f bestaudio -x --audio-format mp3 --audio-quality 0 --no-mtime --no-playlist --no-overwrites --embed-thumbnail --embed-metadata",
            mp4Config: "-f bestvideo+bestaudio --no-mtime --no-playlist --no-overwrites",
        },
    };
}

function settingsFilePath(): string {
    return path.join(app.getPath("userData"), "settings.json");
}

export function loadSettings(): AppSettings {
    const defaults = getDefaults();
    try {
        const raw = fs.readFileSync(settingsFilePath(), "utf-8");
        const saved = JSON.parse(raw);
        return {
            general: { ...defaults.general, ...saved.general },
            youtubeDownloaderSettings: {
                ...defaults.youtubeDownloaderSettings,
                ...saved.youtubeDownloaderSettings,
            },
        };
    } catch {
        return defaults;
    }
}

export function saveSettings(settings: AppSettings): void {
    const filePath = settingsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 4), "utf-8");
}
