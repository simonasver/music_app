// Drizzle table definitions. After changing this file, run `npm run db:generate`.
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const history = sqliteTable(
    "history",
    {
        id: text("id").primaryKey(),
        url: text("url").notNull(),
        date: text("date").notNull(),
        name: text("name"),
        filePath: text("file_path"),
    },
    (table) => [index("idx_history_date_id").on(table.date, table.id)],
);
