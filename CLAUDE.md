# Music App — Claude Context

## Project

Windows desktop app for downloading, trimming, and merging audio/video. Built with Electron + React + TypeScript.

Features:

-   **YouTube Downloader** — download MP3/MP4 via yt-dlp, real-time progress, history
-   **Trimmer** — trim audio/video with waveform visualization (WaveSurfer.js)
-   **Merger** — merge multiple audio/video files via drag-and-drop
-   **Settings** — download folder, yt-dlp/ffmpeg flags, theme (light/dark/system), language (EN/LT)

## Tech Stack

| Layer          | Tech                                           |
| -------------- | ---------------------------------------------- |
| Runtime        | Electron 41                                    |
| UI             | React 19, TypeScript 6, Tailwind CSS 4         |
| Components     | shadcn/ui (Radix UI primitives)                |
| Bundler        | Vite 5 via electron-forge                      |
| i18n           | i18next + react-i18next (EN, LT)               |
| Waveform       | WaveSurfer.js 7                                |
| Drag-drop      | dnd-kit                                        |
| Packaging      | Electron Forge 7, Squirrel installer (Windows) |
| External tools | yt-dlp, ffmpeg (bundled binaries)              |

## Architecture

**Main process** (`src/main/`): IPC handlers, service layer for all business logic.

-   `main.ts` — window creation, IPC handler registration
-   `preload.ts` — contextBridge exposing `electronAPI` to renderer
-   `downloadService.ts` — yt-dlp child process orchestration
-   `trimService.ts` / `mergeService.ts` / `splitService.ts` — ffmpeg operations
-   `settingsService.ts` / `historyService.ts` — JSON persistence in `userData/`

**Renderer** (`src/renderer/`): React frontend, communicates only through `window.electronAPI`.

-   `App.tsx` — tab-based layout (Radix Tabs), 4 feature tabs
-   `features/` — self-contained feature folders (youtubeDownloader, trimmer, merger, settings)
-   `components/ui/` — shadcn/ui components
-   `lib/` — toast system, utilities
-   `locales/` — `en.json`, `lt.json` translation files

**State**: React hooks (local), `userData/settings.json` (settings), `userData/history.json` (history), window state saved on close.

**IPC flow**: Renderer calls `window.electronAPI.someMethod()` → contextBridge → main process service → spawns child process → streams events back via IPC.

## Development

```bash
npm start          # Dev mode with hot reload + DevTools
npm run lint       # ESLint check
npm run lint:fix   # ESLint auto-fix
npm run format     # Prettier format
npm run package    # Compile without installer → out/
npm run make       # Windows Squirrel installer (runs lint + format first)
npm run publish    # Publish to GitHub (requires token)
```

Lint and format checks run automatically before `make`/`package` and will abort on failure.

## Code Conventions

-   TypeScript strict mode (`noImplicitAny: true`)
-   Path alias `@/*` maps to `src/renderer/`
-   Styling: Tailwind v4 utility classes, `clsx` + `tailwind-merge` for conditionals
-   Dark mode: toggled by adding/removing `"dark"` class on `document.documentElement`
-   System theme detected via `matchMedia`
-   External binary flags: custom parser that respects quoted arguments
-   Import order enforced by ESLint plugin

## Miscellaneous Requirements

-   **Do not change code that was not requested.** If a task touches function X, leave everything else untouched — even if nearby code looks improvable.
-   **Do not fix unrelated bugs.** If a bug is spotted outside the requested scope, report it to the user and wait for instruction. Do not silently fix it.
-   **Do not undo or alter deliberate user choices.** If something looks unusual but is clearly intentional (custom flag, non-standard pattern, specific wording), leave it. Ask before touching it.
-   **Ask before deciding.** When a task has multiple valid approaches or any meaningful tradeoff, present the options and let the user choose. Do not pick unilaterally.
-   **No unrequested refactors, abstractions, or cleanups.** Scope changes exactly to what was asked. If cleanup seems warranted, mention it and ask.
-   **No unrequested comments or documentation** added to existing code.
