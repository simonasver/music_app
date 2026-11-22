# Music App

A Windows desktop application for downloading, trimming, and merging audio/video files.

## Features

- **YouTube Downloader** — download audio (MP3) or video (MP4) from YouTube URLs using yt-dlp, with real-time progress tracking and download history
- **Trimmer** — trim audio/video files to a specific time range using ffmpeg
- **Merger** — merge multiple audio/video files into one using ffmpeg
- **Thumbnail** — add or replace the embedded cover image of MP3 files; position and zoom the image in a square crop frame, pick/drop/paste (Ctrl+V) the image, and preview the current cover
- **Settings** — configure download output folder, yt-dlp flags for MP3/MP4, UI theme (light/dark/system), and language (English/Lithuanian)

> **Windows only.** Bundled `yt-dlp.exe` and `ffmpeg.exe` executables are Windows binaries — macOS and Linux are not supported.

## Tech Stack

- **[Electron](https://www.electronjs.org/)** — desktop runtime
- **[React 19](https://react.dev/)** — UI framework
- **[TypeScript](https://www.typescriptlang.org/)** — type-safe JavaScript
- **[Vite](https://vitejs.dev/)** — bundler and dev server (via electron-forge plugin)
- **[Electron Forge](https://www.electronforge.io/)** — build, package, and publish toolchain
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first CSS framework (via PostCSS)
- **[shadcn/ui](https://ui.shadcn.com/)** — component library built on Radix UI
- **[i18next](https://www.i18next.com/)** — internationalization (English, Lithuanian)
- **[WaveSurfer.js](https://wavesurfer.xyz/)** — waveform visualization in the trimmer
- **[dnd-kit](https://dndkit.com/)** — drag-and-drop ordering in the merger
- **[SQLite](https://www.sqlite.org/)** ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) + **[Drizzle ORM](https://orm.drizzle.team/)** — download history storage
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** — YouTube downloader (bundled Windows binary)
- **[ffmpeg](https://ffmpeg.org/)** — audio/video processing (bundled Windows binary)
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — linting and formatting

## Quick Start

Requires Windows, Node.js v22.13+, and [Git LFS](https://git-lfs.com/) (see [Development](docs/DEVELOPMENT.md#prerequisites)).

```bash
npm install
npm start
```

## Documentation

- [Development](docs/DEVELOPMENT.md) — prerequisites, code quality, database migrations, building
- [Architecture](docs/ARCHITECTURE.md) — process model, IPC flow, project structure
- [Releasing](docs/RELEASING.md) — publishing a new version
- [TO-DO](docs/TODO.md) — planned work
