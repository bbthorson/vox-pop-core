import type { Config } from 'tailwindcss';
import { FONT_RUBIK_VAR, FONT_ARVO_VAR } from './fonts';

/**
 * Shared Tailwind preset for Vox Pop apps.
 *
 * Maps the CSS variables defined in `tokens.css` to Tailwind theme
 * keys, so Tailwind classes like `bg-primary`, `text-ink-strong`,
 * `rounded-lg`, `shadow-editorial` resolve to the right HSL values
 * regardless of which app (apps/web Next.js, apps/embed Vite) is
 * doing the resolving.
 *
 * App-specific concerns stay in each app's own `tailwind.config.ts`:
 *
 *   - `content` paths (each app scans its own components)
 *   - `plugins` (tailwindcss-animate for apps/web; embed may differ)
 *   - app-specific keyframes/animations (Radix accordion variants in
 *     apps/web; embed has none today)
 *
 * The preset is the FOUNDATION — apps extend it.
 */
/**
 * Exported as a NAMED export rather than `default` to avoid CommonJS
 * default-interop pitfalls — Tailwind's `tailwind.config.ts` loader
 * (jiti / @swc/core / similar) historically interops default exports
 * inconsistently. Named imports are unambiguous in every loader.
 */
export const preset: Partial<Config> = {
    theme: {
        extend: {
            fontFamily: {
                sans: [`var(${FONT_RUBIK_VAR})`, 'sans-serif'],
                heading: [`var(${FONT_ARVO_VAR})`, 'serif'],
                serif: [`var(${FONT_ARVO_VAR})`, 'serif'],
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))',
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))',
                },
                info: {
                    DEFAULT: 'hsl(var(--info))',
                    foreground: 'hsl(var(--info-foreground))',
                },
                ink: {
                    strong: 'hsl(var(--ink-strong))',
                    muted: 'hsl(var(--ink-muted))',
                    subtle: 'hsl(var(--ink-subtle))',
                },
                surface: {
                    raised: 'hsl(var(--surface-raised))',
                    sunken: 'hsl(var(--surface-sunken))',
                },
                rule: 'hsl(var(--rule))',
                'accent-warm': 'hsl(var(--accent-warm))',
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            borderRadius: {
                xl: '0.75rem',
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            maxWidth: {
                prose: '62ch',
                editorial: '72rem',
            },
            letterSpacing: {
                editorial: '-0.01em',
            },
            lineHeight: {
                editorial: '1.25',
            },
            boxShadow: {
                editorial: 'var(--shadow-editorial)',
            },
        },
    },
};
