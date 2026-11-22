import path from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type AppDatabase = BetterSQLite3Database<typeof schema>;

const NATIVE_BINDING_FILE = "win32-x64.node";

let sqlite: Database.Database | null = null;
let db: AppDatabase | null = null;

function resourcePath(packagedPath: string, devPath: string): string {
    return app.isPackaged
        ? path.join(process.resourcesPath, packagedPath)
        : path.join(app.getAppPath(), devPath);
}

/** Path to better-sqlite3's prebuilt binary, shipped via Forge `extraResource`. */
function nativeBindingPath(): string {
    return resourcePath(
        NATIVE_BINDING_FILE,
        path.join("node_modules", "better-sqlite3", "prebuilds", NATIVE_BINDING_FILE),
    );
}

/** Opens the database and applies pending migrations. Call once at app startup. */
export function init(): void {
    if (db) {
        return;
    }

    sqlite = new Database(path.join(app.getPath("userData"), "app.db"), {
        nativeBinding: nativeBindingPath(),
    });
    sqlite.pragma("journal_mode = WAL");
    db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: resourcePath("drizzle", "drizzle") });
}

export function getDb(): AppDatabase {
    if (!db) {
        throw new Error("Database is not initialized. Call init() at app startup.");
    }
    return db;
}

export function close(): void {
    sqlite?.close();
    sqlite = null;
    db = null;
}
