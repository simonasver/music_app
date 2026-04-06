/// <reference types="vite/client" />

export interface HistoryEntry {
    id: string;
    url: string;
    date: string;
    name?: string;
}

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

declare global {
    interface Window {
        electronAPI: {
            getSettings(): Promise<AppSettings>;
            getDefaultSettings(): Promise<AppSettings>;
            saveSettings(settings: AppSettings): Promise<void>;
            startDownload(url: string, flags: string, outputDir: string): Promise<void>;
            cancelDownload(): void;
            selectFolder(): Promise<string | null>;
            onDownloadOutput(cb: (line: string) => void): () => void;
            onDownloadComplete(cb: (code: number | null) => void): () => void;
            appendHistory(entry: HistoryEntry): Promise<void>;
            getAllHistory(): Promise<HistoryEntry[]>;
            deleteHistoryEntry(id: string): Promise<void>;
            deleteAllHistory(): Promise<void>;
            openExternal(url: string): Promise<void>;
            selectMediaFile(): Promise<string | null>;
            executeTrim(params: {
                inputPath: string;
                start: number;
                end: number;
                replaceOriginal: boolean;
            }): Promise<{ outputPath: string }>;
            readFile(filePath: string): Promise<Buffer>;
            selectMediaFiles(): Promise<string[]>;
            executeMerge(params: {
                inputPaths: string[];
                outputPath: string;
            }): Promise<{ outputPath: string }>;
            saveFile(): Promise<string | null>;
            getPathForFile(file: File): string;
        };
    }
}
