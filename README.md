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
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** — YouTube downloader (bundled Windows binary)
- **[ffmpeg](https://ffmpeg.org/)** — audio/video processing (bundled Windows binary)
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — linting and formatting

## Prerequisites

- [Node.js](https://nodejs.org/) v22.13+
- npm v10+
- [Git LFS](https://git-lfs.com/)
- Windows

### Dependency install scripts

npm 12+ blocks dependency install scripts unless they are approved in the `allowScripts` field of `package.json`. The approved entries are:

- `electron-winstaller`: its install script selects the 7-Zip binary that the Squirrel installer needs. The approval is pinned to the reviewed version (e.g. `electron-winstaller@5.4.0`).

When a dependency update brings a new `electron-winstaller` version, the pinned approval no longer matches and its script is skipped:

- `npm install` / `npm ci` ends with `install scripts blocked ... electron-winstaller@x.y.z`
- `npm run make` / `npm run publish` then fails in Squirrel with `System.ComponentModel.Win32Exception: The system cannot find the file specified`

To fix it, review and approve the new version, commit `package.json`, and reinstall:

```bash
npm install-scripts approve electron-winstaller
npm ci
```

Run `npm install-scripts ls` to list any other dependencies whose install scripts are blocked.

### Bundled binaries (Git LFS)

The bundled tools in `resources/tools/` (`ffmpeg.exe` and the `yt-dlp` build) are stored with Git LFS, as configured in `.gitattributes`. Install Git LFS once before cloning:

```bash
git lfs install
```

If the repository was cloned without Git LFS, the files in `resources/tools/` are small text pointers instead of executables, and downloads, trims, and merges fail. Fetch the real files with:

```bash
git lfs pull
```

Run `git lfs ls-files` to list the tracked files. New or updated files placed under `resources/tools/` are tracked by LFS automatically. CI release builds check out with `lfs: true` (`.github/workflows/release.yml`).

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
│   ├── mediaService.ts      # media:// file streaming + waveform peaks via ffmpeg
│   ├── thumbnailService.ts  # ffmpeg cover art: crop image, embed into MP3, read current cover
│   ├── historyService.ts    # Download history persistence
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
    ├── config/
    │   ├── design.ts        # Global design tokens (colors, radius, fonts)
    │   └── apply-design.ts  # Applies tokens as CSS variables at startup
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

## TO-DO

1. Add "open folder" next to download history
2. Download history pagination
3. Automatic trim split by pasted structure
4. Make enabled download buttons more visible and different from the disabled ones. Cyan is too bright.
5. Add thumbnail modification - add, change, remove
6. Add semi-automatic split by chapters. Automatically load and display splits, additionally showing each item in a list, with changeable start, name (which will be saved to)
7. Normalize download information width so that time left would not jump around when speed changes.
8. Convert displayed date into the correct format for user in download history.
9. Update "merge" to work with different file types and different resolutions.
10. Sync running trim/merge process with frontend to show progress information and "Cancel" button.
