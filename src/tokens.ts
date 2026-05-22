/**
 * Vox Pop design tokens — parallel TypeScript export of the same values
 * defined in `tokens.css`.
 *
 * Use this when CSS variables aren't available — e.g., Canvas rendering
 * (the `RadialBlob` audio visualizer paints into a 2D canvas and can't
 * read CSS var values without a layout pass), or dark-mode-aware JS
 * logic (theme toggle that needs to read the active value rather than
 * defer to the cascade).
 *
 * Keep this file in lockstep with `tokens.css`. The values must match
 * exactly — a vitest snapshot would be nice as a guard, but for now
 * the convention is "if you change a value, change it in both files".
 *
 * Values are stored as the bare HSL fragment expected by Tailwind's
 * `hsl(var(--token))` consumption pattern. To get a usable color
 * string, wrap with `hsl(...)`:
 *
 *   const primary = `hsl(${lightTokens.primary})`;
 *   // → "hsl(12 92% 58%)"
 *
 * Shadows are stored as their full CSS value (multi-stop with hsl
 * function calls already embedded).
 */

export interface TokenSet {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    radius: string;

    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
    info: string;
    infoForeground: string;

    surfaceRaised: string;
    surfaceSunken: string;
    inkStrong: string;
    inkMuted: string;
    inkSubtle: string;
    accentWarm: string;
    rule: string;
    shadowEditorial: string;
}

/** Light, workspace register (`:root`). */
export const lightTokens: TokenSet = {
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    card: '0 0% 100%',
    cardForeground: '222 47% 11%',
    popover: '0 0% 100%',
    popoverForeground: '222 47% 11%',
    primary: '12 92% 58%',
    primaryForeground: '0 0% 100%',
    secondary: '30 20% 96%',
    secondaryForeground: '222 47% 11.2%',
    muted: '30 15% 96%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '35 100% 50%',
    accentForeground: '0 0% 100%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 100%',
    border: '30 20% 90%',
    input: '30 20% 90%',
    ring: '12 92% 58%',
    radius: '0.75rem',

    success: '158 64% 42%',
    successForeground: '158 64% 97%',
    warning: '38 92% 50%',
    warningForeground: '48 96% 89%',
    info: '199 89% 48%',
    infoForeground: '204 94% 94%',

    surfaceRaised: '0 0% 100%',
    surfaceSunken: '30 15% 96%',
    inkStrong: '222 47% 11%',
    inkMuted: '215 16% 47%',
    inkSubtle: '215 16% 65%',
    accentWarm: '20 75% 55%',
    rule: '30 20% 82%',
    shadowEditorial:
        '0 6px 24px -8px hsl(20 15% 15% / 0.08), 0 2px 6px -2px hsl(20 15% 15% / 0.04)',
};

/** Dark, workspace register (`.dark`). */
export const darkTokens: TokenSet = {
    background: '224 71% 4%',
    foreground: '210 40% 98%',
    card: '224 71% 4%',
    cardForeground: '210 40% 98%',
    popover: '224 71% 4%',
    popoverForeground: '210 40% 98%',
    primary: '14 90% 62%',
    primaryForeground: '0 0% 10%',
    secondary: '220 25% 14%',
    secondaryForeground: '210 40% 98%',
    muted: '220 25% 14%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '38 100% 55%',
    accentForeground: '0 0% 100%',
    destructive: '0 62.8% 45%',
    destructiveForeground: '210 40% 98%',
    border: '220 25% 18%',
    input: '220 25% 18%',
    ring: '14 90% 62%',
    radius: '0.75rem',

    success: '158 60% 50%',
    successForeground: '158 60% 97%',
    warning: '38 92% 56%',
    warningForeground: '48 96% 12%',
    info: '199 89% 56%',
    infoForeground: '204 94% 12%',

    surfaceRaised: '220 25% 10%',
    surfaceSunken: '224 71% 4%',
    inkStrong: '210 40% 98%',
    inkMuted: '215 20% 65%',
    inkSubtle: '215 20% 45%',
    accentWarm: '18 70% 60%',
    rule: '220 25% 22%',
    shadowEditorial:
        '0 6px 24px -8px hsl(0 0% 0% / 0.4), 0 2px 6px -2px hsl(0 0% 0% / 0.3)',
};

/**
 * Light, editorial register (`.theme-editorial`). Public pages, warm paper.
 *
 * Fields marked `inherited from :root` reference `lightTokens` instead
 * of duplicating literals — the CSS rule doesn't redefine `--destructive`
 * etc., so the cascaded value comes from `:root` at runtime. Referencing
 * the parent here keeps the TS constants in lockstep with that behavior
 * automatically.
 */
export const editorialTokens: TokenSet = {
    background: '34 36% 97%',
    foreground: '20 20% 14%',
    card: '0 0% 100%',
    cardForeground: '20 20% 14%',
    popover: '0 0% 100%',
    popoverForeground: '20 20% 14%',
    primary: '12 86% 55%',
    primaryForeground: '0 0% 100%',
    secondary: '30 30% 94%',
    secondaryForeground: '20 20% 14%',
    muted: '30 25% 94%',
    mutedForeground: '25 12% 38%',
    accent: '32 70% 62%',
    accentForeground: '0 0% 100%',
    destructive: lightTokens.destructive, // inherited from :root — editorial doesn't redefine
    destructiveForeground: lightTokens.destructiveForeground,
    border: '28 22% 88%',
    input: '28 22% 88%',
    ring: '12 86% 55%',
    radius: '1rem',

    success: lightTokens.success, // inherited from :root
    successForeground: lightTokens.successForeground,
    warning: lightTokens.warning,
    warningForeground: lightTokens.warningForeground,
    info: lightTokens.info,
    infoForeground: lightTokens.infoForeground,

    surfaceRaised: '0 0% 100%',
    surfaceSunken: '30 25% 94%',
    inkStrong: '20 25% 12%',
    inkMuted: '25 14% 32%',
    inkSubtle: '25 14% 55%',
    accentWarm: '20 75% 55%',
    rule: '28 18% 78%',
    shadowEditorial:
        '0 6px 24px -8px hsl(20 15% 15% / 0.08), 0 2px 6px -2px hsl(20 15% 15% / 0.04)',
};

/**
 * Dark, editorial register (`.dark .theme-editorial`). Newsprint on espresso.
 *
 * Same inheritance pattern as `editorialTokens`: fields the CSS rule
 * doesn't redefine (`destructive`, `success`, etc.) cascade from
 * `.dark` at runtime, so the TS export references `darkTokens` here.
 * `radius` references `editorialTokens` because the dark-editorial CSS
 * rule doesn't redefine it — it cascades from `.theme-editorial`'s
 * `--radius: 1rem`.
 */
export const darkEditorialTokens: TokenSet = {
    background: '24 14% 9%',
    foreground: '32 28% 92%',
    card: '24 14% 12%',
    cardForeground: '32 28% 92%',
    popover: '24 14% 12%',
    popoverForeground: '32 28% 92%',
    primary: '14 88% 62%',
    primaryForeground: '0 0% 10%',
    secondary: '24 14% 14%',
    secondaryForeground: '32 28% 92%',
    muted: '24 14% 14%',
    mutedForeground: '32 14% 65%',
    accent: '20 55% 55%',
    accentForeground: '0 0% 100%',
    destructive: darkTokens.destructive, // inherited from .dark
    destructiveForeground: darkTokens.destructiveForeground,
    border: '24 14% 20%',
    input: '24 14% 20%',
    ring: '14 88% 62%',
    radius: editorialTokens.radius, // inherited from .theme-editorial

    success: darkTokens.success, // inherited from .dark
    successForeground: darkTokens.successForeground,
    warning: darkTokens.warning,
    warningForeground: darkTokens.warningForeground,
    info: darkTokens.info,
    infoForeground: darkTokens.infoForeground,

    surfaceRaised: '24 14% 14%',
    surfaceSunken: '24 14% 7%',
    inkStrong: '32 28% 94%',
    inkMuted: '32 16% 72%',
    inkSubtle: '32 12% 52%',
    accentWarm: '20 70% 60%',
    rule: '24 14% 24%',
    shadowEditorial:
        '0 6px 24px -8px hsl(0 0% 0% / 0.4), 0 2px 6px -2px hsl(0 0% 0% / 0.3)',
};
