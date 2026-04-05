import { design } from "./design";

/** Convert a hex color string to a bare "H S% L%" string for CSS custom properties. */
function hexToHsl(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
        return `0 0% ${Math.round(l * 100)}%`;
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    switch (max) {
        case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
        case g:
            h = ((b - r) / d + 2) / 6;
            break;
        case b:
            h = ((r - g) / d + 4) / 6;
            break;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Convert camelCase token name to kebab-case CSS variable name. */
function toKebab(str: string): string {
    return str.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Writes all design tokens from `design.ts` to CSS custom properties on `:root`.
 * Hex colors are converted to HSL so Tailwind opacity modifiers (bg-primary/50) work.
 * Call this once before mounting React.
 */
export function applyDesignVars(): void {
    const root = document.documentElement;

    // Light-mode color variables
    for (const [key, value] of Object.entries(design.colors)) {
        root.style.setProperty(`--${toKebab(key)}`, hexToHsl(value));
    }

    // Radius and fonts
    root.style.setProperty("--radius", design.radius);
    root.style.setProperty("--font-sans", design.fonts.sans);
    root.style.setProperty("--font-mono", design.fonts.mono);

    // Dark-mode color variables via a <style> block
    const darkVars = Object.entries(design.darkColors)
        .map(([key, value]) => `  --${toKebab(key)}: ${hexToHsl(value)};`)
        .join("\n");

    const style = document.createElement("style");
    style.id = "design-dark-vars";
    style.textContent = `@media (prefers-color-scheme: dark) {\n  :root {\n${darkVars}\n  }\n}\n.dark {\n${darkVars}\n}`;
    document.head.appendChild(style);
}
