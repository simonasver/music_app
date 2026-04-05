/**
 * Global design configuration — single source of truth for all design tokens.
 *
 * Colors are hex strings. They are converted to HSL at runtime (see apply-design.ts)
 * so that Tailwind opacity modifiers (e.g. bg-primary/50) continue to work.
 *
 * To retheme the entire app, change values here. Everything else (Tailwind utilities,
 * shadcn components, custom CSS) picks up the changes automatically via CSS variables.
 */
export const design = {
    // -------------------------------------------------------------------------
    // Colors — light mode
    // -------------------------------------------------------------------------
    colors: {
        background: "#ffffff",
        foreground: "#0a0f1e",

        card: "#ffffff",
        cardForeground: "#0a0f1e",

        popover: "#ffffff",
        popoverForeground: "#0a0f1e",

        primary: "#2563eb",
        primaryForeground: "#f0f5ff",

        secondary: "#f0f4fa",
        secondaryForeground: "#1a2540",

        muted: "#f0f4fa",
        mutedForeground: "#6b7a99",

        accent: "#f0f4fa",
        accentForeground: "#1a2540",

        destructive: "#ef4444",
        destructiveForeground: "#f0f5ff",

        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#2563eb",
    },

    // -------------------------------------------------------------------------
    // Colors — dark mode
    // -------------------------------------------------------------------------
    darkColors: {
        background: "#0a0f1e",
        foreground: "#f0f5ff",

        card: "#0a0f1e",
        cardForeground: "#f0f5ff",

        popover: "#0a0f1e",
        popoverForeground: "#f0f5ff",

        primary: "#0d4aac",
        primaryForeground: "#1a2540",

        secondary: "#1e2a45",
        secondaryForeground: "#f0f5ff",

        muted: "#1e2a45",
        mutedForeground: "#8fa3c4",

        accent: "#1e2a45",
        accentForeground: "#f0f5ff",

        destructive: "#7f1d1d",
        destructiveForeground: "#f0f5ff",

        border: "#1e2a45",
        input: "#1e2a45",
        ring: "#1d4ed8",
    },

    // -------------------------------------------------------------------------
    // Radius
    // -------------------------------------------------------------------------
    radius: "0.5rem",

    // -------------------------------------------------------------------------
    // Typography
    // -------------------------------------------------------------------------
    fonts: {
        sans: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        mono: "ui-monospace, 'Cascadia Code', monospace",
    },
} as const;
