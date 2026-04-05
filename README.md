# Music App

A cross-platform desktop music application built with Electron, React, and TypeScript.

## Tech Stack

- **[Electron](https://www.electronjs.org/)** — cross-platform desktop runtime
- **[React 19](https://react.dev/)** — UI framework
- **[TypeScript](https://www.typescriptlang.org/)** — type-safe JavaScript
- **[Vite](https://vitejs.dev/)** — fast bundler and dev server (via electron-forge plugin)
- **[Electron Forge](https://www.electronforge.io/)** — build, package, and publish toolchain
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first CSS framework (via PostCSS)
- **[shadcn/ui](https://ui.shadcn.com/)** — copy-paste component library built on Radix UI
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — linting and formatting

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+

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

Package the app (compiles to `out/` without creating installers):

```bash
npm run package
```

Create platform-specific installers (also runs `package` internally):

```bash
npm run make
```

Output is written to `out/`.

| Platform | Output |
|----------|--------|
| Windows  | Squirrel installer (`.exe`) |
| macOS    | ZIP archive |
| Linux    | `.rpm` and `.deb` packages |

## Publishing

```bash
npm run publish
```

Configure your publish target in [forge.config.ts](forge.config.ts) before running this command.

## Design System

All design tokens (colors, radius, fonts) live in a single file:

```
src/renderer/config/design.ts
```

Edit values there to retheme the entire app — changes cascade automatically to all Tailwind utilities and shadcn components via CSS custom properties.

### Adding shadcn components

```bash
npx shadcn@latest add <component>
```

Components are placed in `src/renderer/components/ui/` and imported as `@/components/ui/<component>`.

Example:

```bash
npx shadcn@latest add button
```

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Click me</Button>
```

Available variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.

## Project Structure

```
src/
├── main/
│   ├── main.ts              # Electron main process
│   └── preload.ts           # Preload script (context bridge)
└── renderer/
    ├── renderer.tsx         # React entry point
    ├── index.css            # Tailwind entry + @theme token mappings
    ├── config/
    │   ├── design.ts        # Global design tokens (colors, radius, fonts)
    │   └── apply-design.ts  # Applies tokens as CSS variables at startup
    ├── components/
    │   └── ui/              # shadcn components (added via CLI)
    └── lib/
        └── utils.ts         # cn() helper (clsx + tailwind-merge)
```
