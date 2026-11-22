# Music App — Claude Context

## Project

Windows desktop app for downloading, trimming, and merging audio/video. Built with Electron + React + TypeScript.

Features:

-   **YouTube Downloader** — download MP3/MP4 via yt-dlp, real-time progress, history
-   **Trimmer** — trim audio/video with waveform visualization (WaveSurfer.js)
-   **Merger** — merge multiple audio/video files via drag-and-drop
-   **Thumbnail** — add or replace embedded MP3 cover art (crop, zoom, pick/drop/paste image)
-   **Settings** — download folder, yt-dlp/ffmpeg flags, theme (light/dark/system), language (EN/LT)

## Tech Stack

| Layer          | Tech                                           |
| -------------- | ---------------------------------------------- |
| Runtime        | Electron 45                                    |
| UI             | React 19, TypeScript 6, Tailwind CSS 4         |
| Components     | shadcn/ui (Radix UI primitives)                |
| Bundler        | Vite 8 via electron-forge                      |
| i18n           | i18next + react-i18next (EN, LT)               |
| Waveform       | WaveSurfer.js 8                                |
| Drag-drop      | dnd-kit                                        |
| Database       | SQLite (better-sqlite3) + Drizzle ORM          |
| Packaging      | Electron Forge 8, Squirrel installer (Windows) |
| External tools | yt-dlp, ffmpeg (bundled binaries)              |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (imported below). Other docs: `docs/DEVELOPMENT.md`, `docs/RELEASING.md`, `docs/TODO.md`.

@docs/ARCHITECTURE.md

## Development

```bash
npm start            # Dev mode with hot reload + DevTools
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format:check # Prettier check
npm run format       # Prettier format
npm run db:generate  # Generate Drizzle migration after editing src/main/db/schema.ts
npm run package      # Compile without installer → out/
npm run make         # Windows Squirrel installer (runs lint + format first)
npm run publish      # Publish to GitHub (requires token)
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
