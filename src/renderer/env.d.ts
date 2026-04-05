/// <reference types="vite/client" />

export interface AppSettings {
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
        };
    }
}
