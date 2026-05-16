# Music App

A Windows desktop application for downloading, trimming, and merging audio/video files.

## Features

-   **YouTube Downloader** — download audio (MP3) or video (MP4) from YouTube URLs using yt-dlp, with real-time progress tracking and download history
-   **Trimmer** — trim audio/video files to a specific time range using ffmpeg
-   **Merger** — merge multiple audio/video files into one using ffmpeg
-   **Settings** — configure download output folder, yt-dlp flags for MP3/MP4, UI theme (light/dark/system), and language (English/Lithuanian)

> **Windows only.** Bundled `yt-dlp.exe` and `ffmpeg.exe` executables are Windows binaries — macOS and Linux are not supported.

## Tech Stack

-   **[Electron](https://www.electronjs.org/)** — desktop runtime
-   **[React 19](https://react.dev/)** — UI framework
-   **[TypeScript](https://www.typescriptlang.org/)** — type-safe JavaScript
-   **[Vite](https://vitejs.dev/)** — bundler and dev server (via electron-forge plugin)
-   **[Electron Forge](https://www.electronforge.io/)** — build, package, and publish toolchain
-   **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first CSS framework (via PostCSS)
-   **[shadcn/ui](https://ui.shadcn.com/)** — component library built on Radix UI
-   **[i18next](https://www.i18next.com/)** — internationalization (English, Lithuanian)
-   **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** — YouTube downloader (bundled Windows binary)
-   **[ffmpeg](https://ffmpeg.org/)** — audio/video processing (bundled Windows binary)
-   **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — linting and formatting

## Prerequisites

-   [Node.js](https://nodejs.org/) v18+
-   npm v9+
-   Windows

## Getting Started

Install dependencies:

```bash
npm install
```

Start the app in development mode (with hot reload):

```bash
npm start
```

## Code Quality

Run the linter:

```bash
npm run lint
```

Auto-fix lint issues:

```bash
npm run lint:fix
```

Check formatting:

```bash
npm run format:check
```

Auto-format source files:

```bash
npm run format
```

## Building

> Lint and format checks run automatically before every build and will abort if they fail.

Package the app (compiles to `out/` without creating an installer):

```bash
npm run package
```

Create a Windows installer (also runs `package` internally):

```bash
npm run make
```

Output is written to `out/`.

| Platform | Output                      |
| -------- | --------------------------- |
| Windows  | Squirrel installer (`.exe`) |

## Publishing a New Release

Releases are built and published automatically via GitHub Actions when a version tag is pushed.

1. Bump the version in `package.json`
2. Commit the change:
    ```bash
    git add package.json
    git commit -m "vX.Y.Z"
    ```
3. Tag and push:
    ```bash
    git tag vX.Y.Z
    git push origin main
    git push origin vX.Y.Z
    ```

GitHub Actions will build the Windows installer and create a **draft** GitHub Release with the artifacts attached. Once you've verified the build, go to the [Releases page](https://github.com/simonasver/music_app/releases) and click **Publish release**.

### Adding shadcn components

```bash
npx shadcn@latest add <component>
```

Components are placed in `src/renderer/components/ui/` and imported as `@/components/ui/<component>`.

## Project Structure

```
resources/
└── tools/
    ├── ffmpeg.exe           # Bundled ffmpeg binary (Windows)
    └── yt-dlp.exe           # Bundled yt-dlp binary (Windows)
src/
├── main/
│   ├── main.ts              # Electron main process + IPC handlers
│   ├── preload.ts           # Preload script (context bridge)
│   ├── downloadService.ts   # yt-dlp download logic
│   ├── trimService.ts       # ffmpeg trim logic
│   ├── mergeService.ts      # ffmpeg merge logic
│   ├── historyService.ts    # Download history persistence
│   └── settingsService.ts   # App settings persistence
└── renderer/
    ├── renderer.tsx         # React entry point
    ├── index.css            # Tailwind entry + @theme token mappings
    ├── i18n.ts              # i18next setup and language detection
    ├── config/
    │   ├── design.ts        # Global design tokens (colors, radius, fonts)
    │   └── apply-design.ts  # Applies tokens as CSS variables at startup
    ├── components/
    │   └── ui/              # shadcn components (added via CLI)
    ├── features/
    │   ├── youtubeDownloader/  # YouTube download tab
    │   ├── trimmer/            # Trim tab
    │   ├── merger/             # Merge tab
    │   └── settings/           # Settings tab
    ├── lib/
    │   ├── utils.ts         # cn() helper (clsx + tailwind-merge)
    │   └── toast.tsx        # Toast notification context
    └── locales/
        ├── en.json          # English translations
        └── lt.json          # Lithuanian translations
```

## TO-DO

1. Add "open folder" next to download history
2. Download history pagination
3. Automatic trim split by pasted structure
4. Make enabled download buttons more visible and different from the disabled ones. Cyan is too bright.
5. Add thumbnail modification - add, change, remove
