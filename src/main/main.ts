import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { loadSettings, saveSettings, DEFAULTS } from "./settingsService";
import { startDownload, cancelDownload } from "./downloadService";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
}
