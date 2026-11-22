# Architecture

## Overview

**Main process** (`src/main/`): IPC handlers and the service layer for all business logic.

- `main.ts` — window creation, IPC handler registration
- `preload.ts` — contextBridge exposing `electronAPI` to the renderer
- `downloadService.ts` — yt-dlp child process orchestration
- `trimService.ts` / `mergeService.ts` / `thumbnailService.ts` — ffmpeg operations
- `mediaService.ts` — `media://` file streaming and waveform peaks
- `settingsService.ts` — JSON persistence in `userData/settings.json`
- `historyService.ts` — download history in SQLite (`userData/app.db`) via Drizzle (`db/`)

**Renderer** (`src/renderer/`): React frontend, communicates only through `window.electronAPI`.

- `App.tsx` — tab-based layout (Radix Tabs), 5 feature tabs
- `features/` — self-contained feature folders (youtubeDownloader, trimmer, merger, thumbnail, settings)
- `components/ui/` — shadcn/ui components
- `lib/` — toast system, utilities
- `locales/` — `en.json`, `lt.json` translation files

**Shared** (`src/shared/`): types and helpers used by both main and renderer.

**State**: React hooks (local), `userData/settings.json` (settings), `userData/app.db` (download history, SQLite), `userData/window-state.json` (window state, saved on close).

**IPC flow**: Renderer calls `window.electronAPI.someMethod()` → contextBridge → main process service → spawns child process → streams events back via IPC.

## Project Structure

```
drizzle/                     # Generated SQL migrations (npm run db:generate)
resources/
└── tools/
    ├── ffmpeg.exe           # Bundled ffmpeg binary (Windows)
    └── yt-dlp.exe           # Bundled yt-dlp binary (Windows)
src/
├── main/
│   ├── main.ts              # Electron main process + IPC handlers
│   ├── preload.ts           # Preload script (context bridge)
│   ├── db/
│   │   ├── database.ts      # SQLite connection + migrations at startup
│   │   └── schema.ts        # Drizzle table definitions
│   ├── downloadService.ts   # yt-dlp download logic
│   ├── trimService.ts       # ffmpeg trim logic
│   ├── mergeService.ts      # ffmpeg merge logic
│   ├── mediaService.ts      # media:// file streaming + waveform peaks via ffmpeg
│   ├── thumbnailService.ts  # ffmpeg cover art: crop image, embed into MP3, read current cover
│   ├── historyService.ts    # Download history (SQLite via Drizzle)
│   ├── settingsService.ts   # App settings persistence
│   └── tools.ts             # Paths to the bundled yt-dlp/ffmpeg binaries
├── shared/
│   └── media.ts             # Media types/extensions + media:// URL helpers (main + renderer)
└── renderer/
    ├── renderer.tsx         # React entry point
    ├── App.tsx              # Tab-based layout with the feature tabs
    ├── index.css            # Tailwind entry + @theme token mappings
    ├── i18n.ts              # i18next setup and language detection
    ├── env.d.ts             # Shared renderer types + window.electronAPI typing
    ├── vite-env.d.ts        # Vite client types
    ├── components/
    │   ├── ConfirmButton.tsx  # Button with a confirmation dialog
    │   └── ui/              # shadcn components (added via CLI)
    ├── features/
    │   ├── youtubeDownloader/  # YouTube download tab
    │   ├── trimmer/            # Trim tab
    │   ├── merger/             # Merge tab
    │   ├── thumbnail/          # Thumbnail tab (cover art editor)
    │   └── settings/           # Settings tab
    ├── lib/
    │   ├── utils.ts         # cn() helper (clsx + tailwind-merge)
    │   └── toast.tsx        # Toast notification context
    └── locales/
        ├── en.json          # English translations
        └── lt.json          # Lithuanian translations
```
