# Development

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

## Database

Download history is stored in SQLite (`app.db` in the Electron `userData` folder) via [Drizzle ORM](https://orm.drizzle.team/) and `better-sqlite3`. The schema lives in `src/main/db/schema.ts`, and migrations are generated into `drizzle/`.

After changing the schema, generate a migration and commit it:

```bash
npm run db:generate
```

Pending migrations are applied automatically at app startup. The `drizzle/` folder and the `better-sqlite3` native binary are shipped with the packaged app via Forge `extraResource` (`forge.config.ts`).

## Adding shadcn components

```bash
npx shadcn@latest add <component>
```

Components are placed in `src/renderer/components/ui/` and imported as `@/components/ui/<component>`.

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

To publish a release, see [RELEASING.md](RELEASING.md).
