import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { AppSettings } from "./settingsService";
import type { HistoryEntry } from "./historyService";

contextBridge.exposeInMainWorld("electronAPI", {
    getSettings: (): Promise<AppSettings> => ipcRenderer.invoke("settings:get"),

    saveSettings: (settings: AppSettings): Promise<void> =>
        ipcRenderer.invoke("settings:save", settings),

    startDownload: (
        url: string,
        flags: string,
        outputDir: string,
        splitChapters?: boolean,
    ): Promise<void> => ipcRenderer.invoke("download:start", url, flags, outputDir, splitChapters ?? false),

    cancelDownload: (): void => {
        ipcRenderer.send("download:cancel");
    },

    getDefaultSettings: (): Promise<AppSettings> => ipcRenderer.invoke("settings:get-defaults"),

    selectFolder: (): Promise<string | null> => ipcRenderer.invoke("dialog:select-folder"),

    onDownloadOutput: (cb: (line: string) => void): (() => void) => {
        const handler = (_e: Electron.IpcRendererEvent, line: string) => cb(line);
        ipcRenderer.on("download:output", handler);
        return () => ipcRenderer.removeListener("download:output", handler);
    },

    onDownloadComplete: (cb: (code: number | null) => void): (() => void) => {
        const handler = (_e: Electron.IpcRendererEvent, code: number | null) => cb(code);
        ipcRenderer.on("download:complete", handler);
        return () => ipcRenderer.removeListener("download:complete", handler);
    },

    appendHistory: (entry: HistoryEntry): Promise<void> =>
        ipcRenderer.invoke("history:append", entry),

    getAllHistory: (): Promise<HistoryEntry[]> => ipcRenderer.invoke("history:get-all"),

    deleteHistoryEntry: (id: string): Promise<void> =>
        ipcRenderer.invoke("history:delete-entry", id),

    deleteAllHistory: (): Promise<void> => ipcRenderer.invoke("history:delete-all"),

    openExternal: (url: string): Promise<void> => ipcRenderer.invoke("shell:open-url", url),

    selectMediaFile: (): Promise<string | null> =>
        ipcRenderer.invoke("dialog:select-media-file", { multi: false }),

    executeTrim: (params: {
        inputPath: string;
        start: number;
        end: number;
        replaceOriginal: boolean;
    }): Promise<{ outputPath: string }> => ipcRenderer.invoke("trim:execute", params),

    readFile: (filePath: string): Promise<Buffer> => ipcRenderer.invoke("file:read", filePath),

    selectMediaFiles: (): Promise<string[]> =>
        ipcRenderer.invoke("dialog:select-media-file", { multi: true }),

    executeMerge: (params: {
        inputPaths: string[];
        outputPath: string;
    }): Promise<{ outputPath: string }> => ipcRenderer.invoke("merge:execute", params),

    saveFile: (): Promise<string | null> => ipcRenderer.invoke("dialog:save-file"),

    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
});
