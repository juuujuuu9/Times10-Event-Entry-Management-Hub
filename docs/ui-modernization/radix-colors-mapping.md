# Radix Colors — Component Mapping

Reference for which Radix/semantic tokens apply to each component. See `src/styles/tokens.css` for full token definitions.

## Semantic Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg-app` | mauve-1 | mauve-1 | Page background |
| `--bg-card` | mauve-2 | mauve-2 | Cards, elevated surfaces |
| `--bg-hover` | mauve-3 | mauve-3 | Hover states, accent bg |
| `--text-primary` | mauve-12 | mauve-12 | Primary text |
| `--text-muted` | mauve-10 | mauve-10 | Secondary text |
| `--border-subtle` | mauve-6 | mauve-6 | Borders |
| `--brand-9` | #d63a2e | #d63a2e | Primary CTAs, active tab |
| `--brand-10` | #c43328 | #c43328 | Primary hover |

## Component-Specific Mapping

| Component | Element | Token / Class |
|-----------|---------|---------------|
| **Scanner** | Fullscreen result overlay (success) | `bg-success` (green-9) |
| **Scanner** | Fullscreen result overlay (already checked in) | `bg-warning` (amber-9) |
| **Scanner** | Fullscreen result overlay (error) | `bg-error` (red-9) |
| **Scanner** | Inline result card (success) | `bg-[var(--green-2)]` border `--green-6` text `--green-11` |
| **Scanner** | Inline result card (amber) | `bg-[var(--amber-2)]` border `--amber-6` text `--amber-11` |
| **Scanner** | Inline result card (error) | `bg-[var(--red-2)]` border `--red-6` text `--red-11` |
| **Scanner** | QR frame corner brackets | `--brand-9` (scanner-frame in global.css) |
| **Scanner** | Viewfinder overlay | `var(--mauve-12)` 80% opacity (qr-scan-overlay) |
| **Primary CTA** | Buttons | `bg-primary` = `--brand-9` |
| **Toasts** | Success | `--green-2`, `--green-11`, `--green-6` |
| **Toasts** | Error | `--red-2`, `--red-11`, `--red-6` |
| **Errors** | Error banners | `--red-2`, `--red-6`, `--red-11` |
| **Focus ring** | Focus visible | `--border-strong` / `--mauve-8` |

## Tailwind Theme Mapping

`--color-primary` → `--brand-9` (used by `bg-primary`, `text-primary`)
`--color-success` → `--green-9`
`--color-error` → `--red-9`
`--color-warning` → `--amber-9`
