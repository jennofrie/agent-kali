# agent-form-filler — Design System

Visual language derived from `nexora.png` (the NEXORA agency aesthetic) and the structural
principles of stitch.withgoogle.com: dark, high-contrast, generous spacing, soft glassmorphic
surfaces, rounded cards, and a single vibrant accent with neon glow.

All tokens live as CSS custom properties in `src/index.css` `:root` — that file is the single
source of truth. Change a color here-and-there by editing the token, never a literal.

## Color Tokens

Sampled directly from `nexora.png` (exact hex via PIL pixel sampling).

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#050813` | App background — dominant near-black navy (sampled, 28.9k px) |
| `--bg-grad-top` | `#0A1024` | Subtle top-of-screen lift for ambient depth |
| `--surface` | `#0B1120` | Card / panel base |
| `--surface-elev` | `#101A30` | Elevated card (hover, modal) |
| `--surface-glass` | `rgba(13,19,34,0.88)` | Glassmorphic card fill |
| `--border` | `rgba(89,150,236,0.14)` | Subtle blue-tinted hairline border |
| `--border-strong` | `rgba(89,150,236,0.34)` | Emphasized / active border |
| **`--primary`** | `#2354F3` | **Primary** — electric blue, sampled most-vibrant pixel (buttons, active, glow) |
| `--primary-2` | `#4D72E2` | Primary gradient pair |
| **`--secondary`** | `#5996EC` | **Secondary** — lighter sky blue (hovers, secondary accents) |
| **`--tertiary`** | `#122D99` | **Tertiary** — deep indigo (glow tint, deep surfaces) |
| `--accent-soft` | `#AEC4FF` | Light-blue text accent (labels, active nav) |
| `--glow` | `rgba(35,84,243,0.45)` | Neon primary glow (the nexora signature) |
| `--glow-soft` | `rgba(35,84,243,0.12)` | Diffuse ambient glow / focus ring |
| **`--text`** | `#E8EEFB` | **Neutral** body/heading text |
| `--text-hi` | `#FFFFFF` | Highest-contrast headline |
| `--text-muted` | `#99A3B8` | Muted secondary text (sampled `#99999A` family) |
| `--text-faint` | `#5C6478` | Placeholder / faint metadata |
| `--danger` | `#FB5168` | Negative actions (Cross, errors) — kept semantic |
| `--warning` | `#F6B73C` | Warnings (unsupported field, scanned-doc notice) |

## Typography

- Font: `Inter, ui-sans-serif, system-ui, …` (already loaded)
- Headlines: 800–850 weight, `--text-hi`, tight tracking — bold uppercase eyebrows over titles (nexora pattern)
- Eyebrow labels: 10px, 800 weight, uppercase, `--text-muted`
- Body: 12–14px, `--text` / `--text-muted`, line-height 1.45–1.55
- Numerals: `font-variant-numeric: tabular-nums`

## Shape & Elevation

- `--radius: 10px` cards · `--radius-pill: 999px` chips/dots
- `--shadow-card`: inset top highlight + soft drop shadow
- `--shadow-glow`: blue neon glow on primary/active elements (brand mark, primary button, score ring, active pipeline dot, focus state)

## Component Patterns

- **Primary action** (Open Form, Fill): blue gradient `--primary → --primary-2`, white text, blue glow shadow, lift on hover.
- **Secondary action**: glass surface, blue hairline border, `--text` label.
- **Cards** (score, document, pipeline, field, viewer toolbar, modal): `--surface-glass` + `--border` + `--shadow-card`.
- **Active / progress states**: `--primary` / `--accent-soft` with `--glow-soft` ring (replaces the old green).
- **Danger** (Cross): `--danger`. **Warning**: `--warning`. These remain non-blue for semantic clarity.
- **Focus**: `--border-strong` border + 3px `--glow-soft` ring.

## Why these choices

The reference is a near-monochrome system: electric blue on deep navy, white text, neon glow. Progress and "active" states use the blue accent (not green) to stay faithful. Only danger/warning break monochrome, for usability.
