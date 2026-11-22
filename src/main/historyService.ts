import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { app, shell } from "electron";
import { desc, eq } from "drizzle-orm";
import * as database from "./db/database";
import { history } from "./db/schema";

export interface HistoryEntry {
    id: string;
    url: string;
    date: string;
    name?: string;
    filePath?: string;
}

export interface HistoryListEntry extends HistoryEntry {
    fileExists: boolean;
}

export interface HistoryPage {
    entries: HistoryListEntry[];
    hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 50;
// TODO: Remove in the next release (only used by the legacy history.jsonl import).
const IMPORT_BATCH_SIZE = 500;

// TODO: Remove the legacy history.jsonl import (legacyHistoryFilePath, parseLegacyLine,
// importLegacyHistory) in the next release, once users have migrated to SQLite.
function legacyHistoryFilePath(): string {
    return path.join(app.getPath("userData"), "history.jsonl");
}

function parseLegacyLine(line: string): HistoryEntry | null {
    try {
        const entry = JSON.parse(line) as Partial<HistoryEntry>;
        if (
            typeof entry.id !== "string" ||
            typeof entry.url !== "string" ||
            typeof entry.date !== "string"
        ) {
            return null;
        }
        return {
            id: entry.id,
            url: entry.url,
            date: entry.date,
            name: typeof entry.name === "string" ? entry.name : undefined,
        };
    } catch {
        return null;
    }
}

export function importLegacyHistory(): void {
    const filePath = legacyHistoryFilePath();
    if (!fs.existsSync(filePath)) {
        return;
    }

    try {
        const entries = fs
            .readFileSync(filePath, "utf-8")
            .split("\n")
            .filter((line) => line.trim())
            .map(parseLegacyLine)
            .filter((entry): entry is HistoryEntry => entry !== null);

        database.getDb().transaction((tx) => {
            for (let i = 0; i < entries.length; i += IMPORT_BATCH_SIZE) {
                const batch = entries.slice(i, i + IMPORT_BATCH_SIZE).map((entry) => ({
                    id: entry.id,
                    url: entry.url,
                    date: entry.date,
                    name: entry.name ?? null,
                }));
                tx.insert(history).values(batch).onConflictDoNothing().run();
            }
        });

        fs.renameSync(filePath, filePath + ".migrated");
    } catch (err) {
        console.error("Failed to import legacy history:", err);
    }
}

export function recordDownload(url: string, filePaths: string[]): void {
    const now = Date.now();
    const rows = (filePaths.length ? filePaths : [null]).map((filePath, index) => ({
        id: crypto.randomUUID(),
        url,
        // Offset by index so files from one run keep their download order.
        date: new Date(now + index).toISOString(),
        name: filePath ? path.basename(filePath) : null,
        filePath,
    }));
    database.getDb().insert(history).values(rows).run();
}

export function getHistoryPage(offset = 0, limit = DEFAULT_PAGE_SIZE): HistoryPage {
    const rows = database
        .getDb()
        .select()
        .from(history)
        .orderBy(desc(history.date), desc(history.id))
        .limit(limit + 1)
        .offset(offset)
        .all();

    return {
        entries: rows.slice(0, limit).map((row) => ({
            id: row.id,
            url: row.url,
            date: row.date,
            name: row.name ?? undefined,
            filePath: row.filePath ?? undefined,
            fileExists: row.filePath ? fs.existsSync(row.filePath) : false,
        })),
        hasMore: rows.length > limit,
    };
}

function existingFilePath(id: string): string | null {
    const row = database
        .getDb()
        .select({ filePath: history.filePath })
        .from(history)
        .where(eq(history.id, id))
        .get();
    return row?.filePath && fs.existsSync(row.filePath) ? row.filePath : null;
}

export async function openHistoryFile(id: string): Promise<boolean> {
    const filePath = existingFilePath(id);
    if (!filePath) return false;
    return (await shell.openPath(filePath)) === "";
}

export function showHistoryFileInFolder(id: string): boolean {
    const filePath = existingFilePath(id);
    if (!filePath) return false;
    shell.showItemInFolder(filePath);
    return true;
}

export function deleteHistoryEntry(id: string): void {
    database.getDb().delete(history).where(eq(history.id, id)).run();
}

export function deleteAllHistory(): void {
    database.getDb().delete(history).run();
}
