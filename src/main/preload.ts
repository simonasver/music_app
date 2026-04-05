import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings } from "./settingsService";

contextBridge.exposeInMainWorld("electronAPI", {
    getSettings: (): Promise<AppSettings> => ipcRenderer.invoke("settings:get"),

    saveSettings: (settings: AppSettings): Promise<void> =>
        ipcRenderer.invoke("settings:save", settings),

    startDownload: (url: string, flags: string, outputDir: string): Promise<void> =>
        ipcRenderer.invoke("download:start", url, flags, outputDir),

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
});
