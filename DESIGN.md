# Agent Kali — Design System

Visual language based on the **Papaya** design system: dark purple, high-contrast, generous spacing,
soft glassmorphic surfaces, rounded cards, and a vibrant purple accent with neon glow.

All tokens live as CSS custom properties in `src/index.css` `:root` — that file is the single
source of truth. Change a color by editing the token, never a literal.

## Color Tokens

Defined in `src/index.css` `:root`.

| Token | Hex / Value | Role |
|-------|-------------|------|
| `--bg` | `#0f0f1a` | App background — deep near-black purple |
| `--bg-grad-top` | `#141428` | Subtle top-of-screen lift for ambient depth |
| `--surface` | `#1a1a2e` | Card / panel base |
| `--surface-elev` | `#252540` | Elevated card (hover, modal) |
| `--surface-2` | `#1f1f36` | Alternate surface for nested elements |
| `--surface-glass` | `rgba(26, 26, 46, 0.92)` | Glassmorphic card fill |
| `--border` | `rgba(255, 255, 255, 0.08)` | Subtle white hairline border |
| `--border-soft` | `rgba(255, 255, 255, 0.04)` | Ultra-subtle divider |
| `--border-strong` | `rgba(138, 100, 255, 0.4)` | Emphasized / active purple border |
| **`--primary`** | `#8a64ff` | **Primary** — vibrant purple (buttons, active states, glow) |
| `--primary-hover` | `#a084ff` | Primary hover state — lighter purple |
| `--primary-2` | `#6c4fd4` | Primary gradient pair — deeper purple |
| **`--secondary`** | `#e74c8a` | **Secondary** — pink accent (notification dots, secondary highlights) |
| `--accent-soft` | `#c4b5ff` | Light lavender text accent (labels, active nav, progress) |
| `--glow` | `rgba(138, 100, 255, 0.45)` | Neon purple glow (the Papaya signature) |
| `--glow-soft` | `rgba(138, 100, 255, 0.12)` | Diffuse ambient glow / focus ring |
| **`--text`** | `#e8e8f0` | **Neutral** body/heading text |
| `--text-hi` | `#ffffff` | Highest-contrast headline |
| `--text-muted` | `#a0a0b8` | Muted secondary text |
| `--text-faint` | `#5c5c72` | Placeholder / faint metadata |
| `--danger` | `#fb5168` | Negative actions (errors, destructive) — semantic |
| `--warning` | `#f6b73c` | Warnings (unsupported field, scanned-doc notice) — semantic |
| `--success` | `#34d399` | Positive feedback (completed, success) — semantic |
| `--info` | `#60a5fa` | Informational highlights — semantic |

## Typography

- Font: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- Mono: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
- Headlines: 800 weight, `--text-hi`, tight tracking
- Eyebrow labels: 10-11px, 700 weight, uppercase, `--text-faint`
- Body: 12-14px, `--text` / `--text-muted`, line-height 1.5
- Numerals: `font-variant-numeric: tabular-nums`

## Shape & Elevation

| Token | Value | Use |
|-------|-------|-----|
| `--radius` | `12px` | Standard cards |
| `--radius-lg` | `16px` | Modals, banners |
| `--radius-sm` | `8px` | Inner cards, field cards |
| `--radius-pill` | `999px` | Chips, badges, toggles |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.3)` | Default card shadow |
| `--shadow-elev` | `0 12px 40px rgba(0,0,0,0.45)` | Elevated elements (modals) |
| `--shadow-glow` | `0 0 24px var(--glow)` | Purple neon glow on primary/active elements |

## Spacing Scale

`--gap-1` (4px) through `--gap-8` (32px), increments: 4, 8, 12, 16, 20, 24, 32.

## Component Patterns

- **Primary action** (Open Form, Fill): purple gradient `--primary` to `--primary-2`, white text, purple glow shadow, lift on hover.
- **Secondary action**: glass surface, white hairline border, `--text` label.
- **Cards** (stat, document, participant, pipeline, field, viewer toolbar, modal): `--surface` or `--surface-glass` + `--border` + `--shadow-card`.
- **Active / progress states**: `--primary` / `--accent-soft` with `--glow-soft` ring.
- **Danger**: `--danger`. **Warning**: `--warning`. **Success**: `--success`. **Info**: `--info`. These remain non-purple for semantic clarity.
- **Focus**: `--border-strong` border + `--glow-soft` ring.
- **Notification dot**: `--secondary` (pink) on icon buttons.
- **Status chips**: colored backgrounds at 14-16% opacity with matching text color.

## Background Treatment

The app background uses a layered gradient approach:
```css
radial-gradient(1000px 500px at 70% -15%, rgba(138,100,255,0.12), transparent 60%),
linear-gradient(180deg, var(--bg-grad-top), var(--bg) 50%),
var(--bg);
```
This creates a subtle purple ambient glow in the upper portion of the screen.

## Why These Choices

The Papaya system is a near-monochrome purple palette: vibrant purple on deep dark surfaces, white text, neon glow. Progress and "active" states use the purple accent to stay cohesive. Semantic colors (danger, warning, success, info) break the monochrome only where usability demands it. The pink secondary (`--secondary`) is used sparingly for notification accents.
