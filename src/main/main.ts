import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from "electron";
import fs from "node:fs";
import path from "node:path";
import started from "electron-squirrel-startup";
import { loadSettings, saveSettings, getDefaults } from "./settingsService";
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

interface WindowState {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized?: boolean;
    isFullScreen?: boolean;
}

function windowStatePath(): string {
    return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState(): WindowState {
    try {
        return JSON.parse(fs.readFileSync(windowStatePath(), "utf-8"));
    } catch {
        return { width: 1200, height: 800 };
    }
}

function saveWindowState(win: BrowserWindow): void {
    const isMaximized = win.isMaximized();
    const isFullScreen = win.isFullScreen();
    // Only update bounds when in normal state so we remember the restored size
    const bounds = isMaximized || isFullScreen ? loadWindowState() : win.getBounds();
    fs.writeFileSync(
        windowStatePath(),
        JSON.stringify({ ...bounds, isMaximized, isFullScreen }),
        "utf-8",
    );
}

const createWindow = () => {
    const { isMaximized, isFullScreen, ...windowBounds } = loadWindowState();
    const mainWindow = new BrowserWindow({
        ...windowBounds,
        center: windowBounds.x === undefined,
        autoHideMenuBar: true,
        icon: app.isPackaged
            ? path.join(process.resourcesPath, "icon.ico")
            : path.join(__dirname, "../../assets/icon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    if (isFullScreen) {
        mainWindow.setFullScreen(true);
    } else if (isMaximized) {
        mainWindow.maximize();
    }

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(
            path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        );
    }

    mainWindow.webContents.on("context-menu", (_event, params) => {
        const { isEditable, selectionText } = params;
        const hasSelection = selectionText.trim().length > 0;

        if (!isEditable && !hasSelection) return;

        const menuItems: Electron.MenuItemConstructorOptions[] = [];

        if (isEditable) {
            menuItems.push(
                { label: "Cut", role: "cut", enabled: hasSelection },
                { label: "Copy", role: "copy", enabled: hasSelection },
                { label: "Paste", role: "paste" },
                { type: "separator" },
                { label: "Select All", role: "selectAll" },
            );
        } else {
            menuItems.push({ label: "Copy", role: "copy" });
        }

        Menu.buildFromTemplate(menuItems).popup({ window: mainWindow });
    });

    mainWindow.on("close", () => saveWindowState(mainWindow));

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

    ipcMain.handle("settings:get-defaults", () => getDefaults());

    ipcMain.handle("dialog:select-folder", async () => {
        const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
        return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle("history:append", (_event, entry) => appendHistoryEntry(entry));
    ipcMain.handle("history:get-all", () => getAllHistory());
    ipcMain.handle("history:delete-entry", (_event, id: string) => deleteHistoryEntry(id));
    ipcMain.handle("history:delete-all", () => deleteAllHistory());
    ipcMain.handle("shell:open-url", (_event, url: string) => shell.openExternal(url));

    ipcMain.handle("dialog:select-media-file", async (_event, { multi }: { multi: boolean }) => {
        const result = await dialog.showOpenDialog({
            properties: multi ? ["openFile", "multiSelections"] : ["openFile"],
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
        if (result.canceled) return multi ? [] : null;
        return multi ? result.filePaths : result.filePaths[0];
    });

    ipcMain.handle("trim:execute", (_event, params) => executeTrim(params));

    ipcMain.handle("merge:execute", (_event, params) => executeMerge(params));

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
