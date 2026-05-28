# Agent Kali — Design System

Visual language based on the **Papaya** design system: dark purple, high-contrast, generous spacing, soft glassmorphic surfaces, rounded cards, and a vibrant purple accent with neon glow.

All tokens are CSS custom properties in `src/index.css` `:root`. That file is the single source of truth. Change a color by editing the token, never a literal.

Maintained by JD Space Digital Systems.

---

## Color Tokens

Defined in `src/index.css` `:root`.

### Backgrounds

| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#0f0f1a` | App background — deep near-black purple |
| `--bg-grad-top` | `#141428` | Subtle top-of-screen lift for ambient depth |
| `--surface` | `#1a1a2e` | Card / panel base |
| `--surface-elev` | `#252540` | Elevated card (hover, modal) |
| `--surface-2` | `#1f1f36` | Alternate surface for nested elements |
| `--surface-glass` | `rgba(26, 26, 46, 0.92)` | Glassmorphic card fill |

### Borders

| Token | Value | Role |
|-------|-------|------|
| `--border` | `rgba(255, 255, 255, 0.08)` | Subtle white hairline border |
| `--border-soft` | `rgba(255, 255, 255, 0.04)` | Ultra-subtle divider |
| `--border-strong` | `rgba(138, 100, 255, 0.4)` | Emphasized / active purple border |

### Brand (Purple)

| Token | Value | Role |
|-------|-------|------|
| `--primary` | `#8a64ff` | Primary — vibrant purple (buttons, active states, glow) |
| `--primary-hover` | `#a084ff` | Primary hover state — lighter purple |
| `--primary-2` | `#6c4fd4` | Primary gradient pair — deeper purple |
| `--secondary` | `#e74c8a` | Secondary — pink accent (notification dots, highlights) |
| `--accent-soft` | `#c4b5ff` | Light lavender text accent (labels, active nav, progress) |
| `--glow` | `rgba(138, 100, 255, 0.45)` | Neon purple glow (Papaya signature) |
| `--glow-soft` | `rgba(138, 100, 255, 0.12)` | Diffuse ambient glow / focus ring |

### Text

| Token | Value | Role |
|-------|-------|------|
| `--text` | `#e8e8f0` | Neutral body/heading text |
| `--text-hi` | `#ffffff` | Highest-contrast headline |
| `--text-muted` | `#a0a0b8` | Muted secondary text |
| `--text-faint` | `#5c5c72` | Placeholder / faint metadata |

### Semantic

| Token | Value | Role |
|-------|-------|------|
| `--danger` | `#fb5168` | Errors, destructive actions |
| `--warning` | `#f6b73c` | Warnings, unsupported-field notices |
| `--success` | `#34d399` | Positive feedback, completed states |
| `--info` | `#60a5fa` | Informational highlights |

---

## Typography

| Property | Value |
|----------|-------|
| Font | `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| Mono | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| Headlines | 800 weight, `--text-hi`, tight tracking |
| Eyebrow labels | 10-11px, 700 weight, uppercase, `--text-faint` |
| Body | 12-14px, `--text` / `--text-muted`, line-height 1.5 |
| Numerals | `font-variant-numeric: tabular-nums` |

---

## Shape and Elevation

| Token | Value | Use |
|-------|-------|-----|
| `--radius` | `12px` | Standard cards |
| `--radius-lg` | `16px` | Modals, banners |
| `--radius-sm` | `8px` | Inner cards, field cards |
| `--radius-pill` | `999px` | Chips, badges, toggles |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.3)` | Default card shadow |
| `--shadow-elev` | `0 12px 40px rgba(0,0,0,0.45)` | Elevated elements (modals) |
| `--shadow-glow` | `0 0 24px var(--glow)` | Purple neon glow on primary/active elements |

---

## Spacing Scale

| Token | Value |
|-------|-------|
| `--gap-1` | 4px |
| `--gap-2` | 8px |
| `--gap-3` | 12px |
| `--gap-4` | 16px |
| `--gap-5` | 20px |
| `--gap-6` | 24px |
| `--gap-8` | 32px |

---

## Background Treatment

The app background uses a layered gradient:

```css
body {
  background:
    radial-gradient(1000px 500px at 70% -15%, rgba(138,100,255,0.12), transparent 60%),
    linear-gradient(180deg, var(--bg-grad-top), var(--bg) 50%),
    var(--bg);
}
```

This creates a subtle purple ambient glow in the upper portion of the screen.

---

## Component Patterns

### Primary Action (Fill, Export, Open)
Purple gradient `--primary` to `--primary-2`, white text, purple glow shadow, lift on hover.

### Secondary Action
Glass surface, white hairline border, `--text` label.

### Cards (stat, document, participant, pipeline, field, toolbar, modal)
`--surface` or `--surface-glass` + `--border` + `--shadow-card`.

### Active / Progress States
`--primary` / `--accent-soft` with `--glow-soft` ring.

### Semantic States
- `--danger` for destructive actions and errors
- `--warning` for unsupported fields and scan notices
- `--success` for completed states and positive feedback
- `--info` for informational highlights

These remain non-purple for semantic clarity.

### Focus
`--border-strong` border + `--glow-soft` ring.

### Notification Dot
`--secondary` (pink) on icon buttons.

### Status Chips
Colored backgrounds at 14-16% opacity with matching text color.

### Sidebar Active State
Purple left border (3px), purple bg tint `rgba(138,100,255,0.08)`, white text and icon.

---

## Component List (20 TSX Components)

| Component | Path | Role |
|-----------|------|------|
| `App` | `src/App.tsx` | Root shell — Sidebar + TopBar + ContentRouter |
| `Sidebar` | `src/components/Layout/Sidebar.tsx` | Left nav with sections, recent participants, collapse |
| `TopBar` | `src/components/Layout/TopBar.tsx` | Search + category pills + avatar |
| `DashboardView` | `src/components/Dashboard/DashboardView.tsx` | Dashboard with stats and recent forms |
| `DashboardHero` | `src/components/DashboardHero/DashboardHero.tsx` | Stat cards row |
| `FormsView` | `src/components/Forms/FormsView.tsx` | Multi-doc workspace + auto-fill |
| `DocumentViewer` | `src/components/DocumentViewer/DocumentViewer.tsx` | react-pdf viewer |
| `FieldsPanel` | `src/components/FieldsPanel/FieldsPanel.tsx` | Editable field list |
| `ParticipantsView` | `src/components/Participants/ParticipantsView.tsx` | Card grid + detail view |
| `DraftsView` | `src/components/Drafts/DraftsView.tsx` | Email drafts list + preview |
| `ProvidersView` | `src/components/Providers/ProvidersView.tsx` | Provider directory (238+) |
| `ReportsView` | `src/components/Reports/ReportsView.tsx` | SC folder reports by type |
| `TemplatesView` | `src/components/Templates/TemplatesView.tsx` | Form template library |
| `RagView` | `src/components/Rag/RagView.tsx` | Standalone RAG search |
| `LightRagView` | `src/components/LightRag/LightRagView.tsx` | RAG workspace status |
| `FilesView` | `src/components/Files/FilesView.tsx` | Local file browser |
| `SettingsView` | `src/components/Settings/SettingsView.tsx` | App configuration |
| `AmbiguityModal` | `src/components/Shared/AmbiguityModal.tsx` | Low-confidence field resolution |
| `Icon` | `src/components/Shared/Icon.tsx` | Inline SVG icon set |
| `Sidebar` (legacy) | `src/components/Sidebar/Sidebar.tsx` | Original sidebar (superseded by Layout/Sidebar) |

---

## Design Rationale

The Papaya system is a near-monochrome purple palette: vibrant purple on deep dark surfaces, white text, neon glow. Progress and "active" states use the purple accent for cohesion. Semantic colors (danger, warning, success, info) break the monochrome only where usability demands it. The pink secondary (`--secondary`) is reserved for notification accents, used sparingly.
