import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import started from "electron-squirrel-startup";
import { loadSettings, saveSettings, DEFAULTS } from "./settingsService";
import { startDownload, cancelDownload } from "./downloadService";
import { executeTrim } from "./trimService";
import { executeMerge } from "./mergeService";
import {
    appendHistoryEntry,
    getAllHistory,
    deleteHistoryEntry,
    deleteAllHistory,
} from "./historyService";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        center: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(
            path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        );
    }

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }
};

app.on("ready", () => {
    createWindow();
    registerIpcHandlers();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function registerIpcHandlers() {
    ipcMain.handle("settings:get", () => loadSettings());

    ipcMain.handle("settings:save", (_event, data) => saveSettings(data));

    ipcMain.handle("download:start", (event, url: string, flags: string, outputDir: string) => {
        startDownload(
            url,
            flags,
            outputDir,
            (line: string) => event.sender.send("download:output", line),
            (code: number | null) => event.sender.send("download:complete", code),
        );
    });

    ipcMain.on("download:cancel", () => cancelDownload());

    ipcMain.handle("settings:get-defaults", () => DEFAULTS);

    ipcMain.handle("dialog:select-folder", async () => {
        const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
        return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle("history:append", (_event, entry) => appendHistoryEntry(entry));
    ipcMain.handle("history:get-all", () => getAllHistory());
    ipcMain.handle("history:delete-entry", (_event, id: string) => deleteHistoryEntry(id));
    ipcMain.handle("history:delete-all", () => deleteAllHistory());
    ipcMain.handle("shell:open-url", (_event, url: string) => shell.openExternal(url));

    ipcMain.handle("dialog:select-media-file", async () => {
        const result = await dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [
                {
                    name: "Audio/Video",
                    extensions: [
                        "mp3",
                        "mp4",
                        "wav",
                        "ogg",
                        "flac",
                        "m4a",
                        "aac",
                        "opus",
                        "wma",
                        "webm",
                        "mkv",
                        "avi",
                        "mov",
                        "m4v",
                    ],
                },
            ],
        });
        return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle("trim:execute", (_event, params) => executeTrim(params));

    ipcMain.handle("merge:execute", (_event, params) => executeMerge(params));

    ipcMain.handle("dialog:select-media-files", async () => {
        const result = await dialog.showOpenDialog({
            properties: ["openFile", "multiSelections"],
            filters: [
                {
                    name: "Audio/Video",
                    extensions: [
                        "mp3",
                        "mp4",
                        "wav",
                        "ogg",
                        "flac",
                        "m4a",
                        "aac",
                        "opus",
                        "wma",
                        "webm",
                        "mkv",
                        "avi",
                        "mov",
                        "m4v",
                    ],
                },
            ],
        });
        return result.canceled ? [] : result.filePaths;
    });

    ipcMain.handle("dialog:save-file", async () => {
        const result = await dialog.showSaveDialog({
            filters: [
                { name: "MP3", extensions: ["mp3"] },
                { name: "MP4", extensions: ["mp4"] },
                { name: "WAV", extensions: ["wav"] },
            ],
        });
        return result.canceled ? null : result.filePath;
    });

    ipcMain.handle("file:read", (_event, filePath: string) => fs.readFileSync(filePath));
}
