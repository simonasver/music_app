import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export interface HistoryEntry {
    id: string;
    url: string;
    date: string;
}

function historyFilePath(): string {
    return path.join(app.getPath("appData"), "music_app", "history.jsonl");
}

export function appendHistoryEntry(entry: HistoryEntry): void {
    const filePath = historyFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, JSON.stringify(entry) + "\n", "utf-8");
}

export function getAllHistory(): HistoryEntry[] {
    try {
        const raw = fs.readFileSync(historyFilePath(), "utf-8");
        const entries = raw
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line) as HistoryEntry);
        return entries.reverse();
    } catch {
        return [];
    }
}

export function deleteHistoryEntry(id: string): void {
    const filePath = historyFilePath();
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const filtered = raw
            .split("\n")
            .filter((line) => line.trim())
            .filter((line) => {
                try {
                    return (JSON.parse(line) as HistoryEntry).id !== id;
                } catch {
                    return true;
                }
            });
        fs.writeFileSync(filePath, filtered.join("\n") + (filtered.length ? "\n" : ""), "utf-8");
    } catch {
        // file doesn't exist, nothing to delete
    }
}

export function deleteAllHistory(): void {
    const filePath = historyFilePath();
    try {
        fs.writeFileSync(filePath, "", "utf-8");
    } catch {
        // file doesn't exist, nothing to delete
    }
}
