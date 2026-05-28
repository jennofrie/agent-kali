# Comprehensive Redesign Prompt — Agent Kali

> **Usage:** Upload this document together with `dsgn.png` to the LLM. The image is the visual reference. This prompt provides the full specification.

---

## ROLE

You are a Senior Full-Stack Engineer and GUI Designer specializing in Electron + React + TypeScript desktop applications with dark theme UI systems. You have deep expertise in:
- Pixel-perfect UI implementation from design references
- React component architecture with Zustand state management
- Tailwind CSS / CSS custom properties theming
- Electron desktop app patterns (IPC, sidecars, file dialogs)
- Building multi-panel, tab-based professional tools

---

## OBJECTIVE

Redesign the **Agent Kali** Electron desktop application to achieve **95–99% visual fidelity** with the attached `dsgn.png` reference image, while repurposing the design for an **NDIS Support Coordination** workflow tool.

The reference image shows a dark-themed media platform called "Papaya" with four layout variations:
1. **Top-left:** Home grid view — sidebar + top category pills + content card grid
2. **Top-right:** Same home view, slightly different state
3. **Bottom-left:** Detail/player view — large content area + right sidebar feed
4. **Bottom-right:** Channel/profile page — header banner + tab row + content grid below

You must extract the **design language** (colors, typography, spacing, layout patterns, component shapes, interaction patterns) and apply it to a support coordination desktop tool. The content changes completely, but the visual DNA must be identical.

---

## CURRENT CODEBASE

**Stack:** Electron + Vite + React 18 + TypeScript + Zustand + Tailwind CSS + react-pdf + Python FastAPI sidecar

**Current structure:**
```
src/
  App.tsx                                   — 3-column shell: nav-rail + sidebar + workspace
  components/
    Sidebar/Sidebar.tsx                     — Control panel (upload, RAG query, fill, export)
    DocumentViewer/DocumentViewer.tsx        — PDF viewer via react-pdf
    FieldsPanel/FieldsPanel.tsx             — Editable field cards
    DashboardHero/DashboardHero.tsx          — 4 stat hero cards
    AmbiguityModal/AmbiguityModal.tsx        — Low-confidence field resolution modal
  store/index.ts                            — Zustand (uploadedPath, fields, fieldValues, pipeline state)
  lib/ipc/sidecar.ts                        — Python sidecar HTTP client
  lib/rag/lightrag.ts                       — LightRAG query wrapper
  index.css                                 — Full design system (CSS custom properties + all component styles)
```

**Python sidecar endpoints (already built, keep as-is):**
- `POST /ingest` — analyze PDF editability, extract form map
- `POST /schema` — extract field schema (native AcroForm + Claude Vision)
- `POST /extract-values` — extract field values from source text
- `POST /extract-from-folder` — read folder files and extract field values
- `POST /replicate` — create pixel replica of locked/scanned PDF
- `POST /fill` — fill PDF (direct or replica path)
- `POST /export` — export filled PDF (flatten, format)

**Electron IPC (already built, keep as-is):**
- `window.api.openFile()` — file picker dialog
- `window.api.openFolder()` — folder picker dialog
- `window.api.saveFile(name)` — save dialog
- `window.api.readFile(path)` — read file as bytes
- `window.api.ragQuery(query, workspace?)` — query LightRAG CLI
- `window.api.sidecar(method, path, body?)` — HTTP to Python sidecar

---

## DESIGN SYSTEM — EXTRACTED FROM DSGN.PNG

Replace the current blue-based "nexora" tokens with the purple-based "papaya" tokens:

```css
:root {
  color-scheme: dark;

  /* Background layers */
  --bg:             #0f0f1a;
  --bg-grad-top:    #141428;
  --surface:        #1a1a2e;
  --surface-elev:   #252540;
  --surface-glass:  rgba(26, 26, 46, 0.92);

  /* Borders */
  --border:         rgba(255, 255, 255, 0.08);
  --border-strong:  rgba(138, 100, 255, 0.4);

  /* Brand (purple) */
  --primary:        #8a64ff;
  --primary-hover:  #a084ff;
  --primary-2:      #6c4fd4;
  --secondary:      #e74c8a;
  --accent-soft:    #c4b5ff;
  --glow:           rgba(138, 100, 255, 0.45);
  --glow-soft:      rgba(138, 100, 255, 0.12);

  /* Text */
  --text:           #e8e8f0;
  --text-hi:        #ffffff;
  --text-muted:     #a0a0b8;
  --text-faint:     #5c5c72;

  /* Semantic */
  --danger:         #fb5168;
  --warning:        #f6b73c;
  --success:        #34d399;

  /* Shape */
  --radius:         12px;
  --radius-pill:    999px;
  --radius-sm:      8px;
  --shadow-card:    0 4px 24px rgba(0, 0, 0, 0.3);
  --shadow-glow:    0 0 24px var(--glow);
}
```

### Typography
- Font: `Inter, ui-sans-serif, system-ui, sans-serif`
- App title: 20px, weight 800
- Section headings: 16px, weight 700
- Card titles: 14px, weight 600, white, line-clamp 2
- Body: 13px, weight 400, `--text-muted`
- Labels/eyebrows: 11px, weight 700, uppercase, `--text-faint`
- Pill text: 13px, weight 600

### Body Background
```css
body {
  background:
    radial-gradient(1000px 500px at 70% -15%, rgba(138,100,255,0.12), transparent 60%),
    linear-gradient(180deg, var(--bg-grad-top), var(--bg) 50%),
    var(--bg);
}
```

---

## LAYOUT SPECIFICATION

### Overall Shell
```
┌──────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌──────────────────────────────────────────┐ │
│ │         │ │ TOP BAR (search + pills + avatar)        │ │
│ │         │ ├──────────────────────────────────────────┤ │
│ │ SIDEBAR │ │                                          │ │
│ │  240px  │ │          CONTENT AREA                    │ │
│ │         │ │    (switches per active tab)              │ │
│ │         │ │                                          │ │
│ │         │ │                                          │ │
│ └─────────┘ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

Grid: `grid-template-columns: 240px minmax(0, 1fr)` (expandable to `72px` when collapsed)

### Sidebar (matches dsgn.png left nav exactly)
- **Top:** App logo/brand — "AF" monogram in a rounded square with purple glow, app name "FormPilot" or "Agent Kali" next to it (hidden when collapsed)
- **Nav Section "Main":** Dashboard, Forms, Participants, Drafts — each with icon + label
- **Divider line**
- **Nav Section "Tools":** RAG Search, Templates, Reports, Providers — each with icon + label
- **Divider line**
- **Nav Section "Data":** LightRAG, Local Files — each with icon + label
- **Divider line**
- **Recent Participants (like "Subscriptions" in dsgn.png):** Show 5 most recent participants with avatar circle (initials) + name. Expandable "Show More" toggle.
- **Bottom:** Settings nav item + collapse toggle button
- **Active state:** Purple left border (3px), purple bg tint `rgba(138,100,255,0.08)`, white text, white icon
- **Inactive state:** `--text-muted` icon + text
- **Hover:** `--surface-elev` background

### Top Bar (matches dsgn.png top bar exactly)
- **Left:** Current tab title (e.g., "Dashboard", "Forms")
- **Center:** Search bar — rounded pill input, 480px max-width, `--surface` bg, `--border` border, search icon, placeholder "Search participants, forms, drafts..."
- **Center-below or inline:** Category pill tabs — horizontal scroll, pill-shaped buttons, active pill = white text on `--surface-elev` bg, inactive = `--text-muted` on transparent
- **Right:** Notification bell icon + user avatar circle (initials "JD")

### Content Area
Renders the active tab's view component. Smooth transition between views.

---

## MULTI-DOCUMENT TAB SYSTEM (CRITICAL FEATURE)

The Forms view must support opening **up to 4 documents simultaneously** with a minimize/maximize paradigm:

### Default State (All Minimized)
When multiple documents are open, show a **2x2 grid** of minimized document cards:
```
┌─────────────────┐  ┌─────────────────┐
│  Doc 1 (mini)   │  │  Doc 2 (mini)   │
│  [preview]      │  │  [preview]      │
│  filename.pdf   │  │  filename.pdf   │
│  ○ 75% filled   │  │  ○ 30% filled   │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│  Doc 3 (mini)   │  │  + Open New     │
│  [preview]      │  │                 │
│  filename.pdf   │  │                 │
│  ○ 100% filled  │  │                 │
└─────────────────┘  └─────────────────┘
```

Each minimized card shows:
- Small PDF thumbnail/preview (first page, scaled down)
- Filename
- Completion badge (% fields filled)
- Maximize button (icon)
- Close button (X icon)

### Maximized State (Single Document)
When one document is clicked/maximized, it takes over the full content area:
- Full DocumentViewer + FieldsPanel split (current layout)
- Top of the view shows a **document tab bar** with all open documents as small tabs
- The active tab is highlighted, others are muted
- Minimize button returns to the 2x2 grid
- Tab bar allows switching between documents without minimizing

### Tab Bar (when maximized)
```
┌──────────────────────────────────────────────────┐
│ [Doc1.pdf ✕] [Doc2.pdf ✕] [Doc3.pdf ✕] [+ New] │
│ ▬▬▬▬▬▬▬▬▬▬▬▬                                    │  ← active underline
└──────────────────────────────────────────────────┘
```

### State Management
```typescript
type DocumentTab = {
  id: string
  filePath: string
  fileName: string
  fields: FieldSchema[]
  fieldValues: Record<string, string | boolean>
  editability: EditabilityFlag
  fillPath: FillPath
  filledPath: string | null
  formMap: any
  replicaPath: string | null
}

// Store additions:
openTabs: DocumentTab[]          // max 4
activeTabId: string | null
viewMode: "grid" | "maximized"   // grid = 2x2 minimized, maximized = single doc
```

---

## TAB-SPECIFIC VIEWS

### 1. Dashboard
**Maps to:** dsgn.png home grid (top-left quadrant)
- **Stats row:** 4 cards in a row (matches hero-grid pattern)
  - Total Participants (number + icon)
  - Forms Filled This Month (number + trend)
  - Pending Actions (number, colored badge if > 0)
  - RAG Queries Today (number)
- **Recent Forms grid:** Card grid (3 columns), each card like a dsgn.png video card:
  - Thumbnail area = small PDF preview or form type icon
  - Title = participant name + form name
  - Subtitle = date filled, completion %, status
  - Badge = "Exported", "In Progress", "Pending Review"
- **Quick Actions:** Row of primary action buttons

### 2. Forms (Core Workspace)
**Maps to:** dsgn.png video player view (bottom-left quadrant)
- Multi-document tab system (described above)
- When maximized: Left = PDF viewer, Right = tabbed control panel
  - **Fields tab** — editable field list
  - **Sources tab** — RAG query input + folder picker + participant selector
  - **Pipeline tab** — Ingest → Schema → Fill → Export steps
  - **Info tab** — document metadata

### 3. Participants
**Maps to:** dsgn.png channel page (bottom-right quadrant)
- Card grid, each card = participant "channel card"
  - Circle avatar (initials, colored bg)
  - Name (bold), NDIS # (muted)
  - Primary diagnosis
  - Plan expiry date badge
  - "Fill Form" quick action button
- Click card → detail panel slides in from right

### 4. Drafts
- List view with preview panel (like an email client)
- Left column: draft items (filename, participant, date, type badge)
- Right column: rendered markdown preview
- Actions: Copy, Delete, Mark Sent

### 5. RAG Search
- Full-width search experience
- Large search input top
- Workspace + mode selector pills
- Results rendered as formatted text
- "Apply to Form" button if a form is open

### 6. Templates
**Maps to:** dsgn.png browse/explore
- Card grid of form templates
- Each card: form icon, template name, provider, field count badge
- Click → opens in Forms view

### 7. Reports
- Card grid of existing reports + "New Report" CTA card
- Report builder wizard (step indicator top, content below)

### 8. Providers
- Card grid of providers
- Each card: provider name, service type, location, capacity badge
- Click → detail panel

### 9. Settings
- Clean form layout with sections
- API config, paths, profile, connections

---

## IMPLEMENTATION RULES

1. **All styles in `src/index.css`** using CSS custom properties. No inline styles except dynamic values (like `--pct` for gauges).
2. **Component files are .tsx**, one component per file, named exports.
3. **Zustand store** in `src/store/index.ts` — extend the existing store, don't replace it. All current form-filling state must continue working.
4. **Keep all Python sidecar calls working.** The sidecar API doesn't change. Only the frontend changes.
5. **Keep all Electron IPC working.** `window.api.*` calls don't change.
6. **react-pdf** stays for PDF viewing. The DocumentViewer component gets refined, not replaced.
7. **Icons:** Use inline SVG or a lightweight icon set (Lucide React recommended). No icon fonts.
8. **Animations:** CSS transitions only (transform, opacity, background, border-color). 150ms ease default. No JavaScript animation libraries.
9. **Responsive:** Sidebar collapses at < 1200px width. Content reflows. Minimum 980px.
10. **Features don't need to be fully functional** — they need to be **present in the design** with proper UI components, correct styling, and placeholder data. The visual shell must be complete. Backend integration for new features (participants, drafts, reports, providers) can use mock data initially.
11. **Multi-document tabs must be structurally implemented** — the tab state, minimize/maximize toggle, and 2x2 grid layout must work. The actual per-tab form state can initially share the existing store.

---

## FILE DELIVERABLES

After implementation, the project should contain:

```
src/
  App.tsx                         — Shell with Sidebar + TopBar + ContentRouter
  index.css                       — Complete redesigned CSS (papaya purple theme)
  components/
    Layout/
      Sidebar.tsx                 — Full sidebar nav with sections + recent participants
      TopBar.tsx                  — Search bar + category pills + avatar
      ContentRouter.tsx           — Tab-based view switching
    Dashboard/
      DashboardView.tsx
      StatCard.tsx
      RecentFormCard.tsx
    Forms/
      FormsView.tsx               — Multi-doc tab container
      DocumentTab.tsx             — Single tab state wrapper
      DocumentGrid.tsx            — 2x2 minimized grid
      DocumentViewer.tsx          — PDF viewer (refined from existing)
      ControlPanel.tsx            — Right panel with sub-tabs
      FieldsPanel.tsx             — Refined from existing
      SourcesPanel.tsx
      PipelinePanel.tsx
    Participants/
      ParticipantsView.tsx
      ParticipantCard.tsx
      ParticipantDetail.tsx
    Drafts/
      DraftsView.tsx
      DraftPreview.tsx
    Rag/
      RagView.tsx
    Templates/
      TemplatesView.tsx
      TemplateCard.tsx
    Reports/
      ReportsView.tsx
    Providers/
      ProvidersView.tsx
      ProviderCard.tsx
    Settings/
      SettingsView.tsx
    Shared/
      Card.tsx
      CategoryPills.tsx
      SearchBar.tsx
      Avatar.tsx
      Badge.tsx
      Modal.tsx
      AmbiguityModal.tsx          — Refined from existing
  store/
    index.ts                      — Extended Zustand store
  lib/                            — Unchanged (sidecar, rag, config, utils)
```

---

## CRITICAL VISUAL FIDELITY NOTES

Study the attached `dsgn.png` image pixel-by-pixel. The following details are what separate 80% from 95%+. Get these right:

### Spacing & Proportions (measure from image)
- **Sidebar width:** 240px expanded. Nav items are ~44px tall with 12px left padding. Active item has a 3px left border in purple.
- **Sidebar sections:** Separated by a `1px rgba(255,255,255,0.06)` horizontal line with 16px vertical margin. Section labels ("My Channel", "Subscriptions") are 11px uppercase, `--text-faint`, with 8px bottom margin.
- **Top bar height:** ~56px. Search bar is centered, max-width 480px, height 36px, border-radius 20px (pill), background `--surface`, border `1px solid var(--border)`.
- **Category pills:** Height 32px, border-radius 16px (pill), horizontal padding 16px, font-size 13px weight 600. Gap between pills: 8px. Active pill: `--surface-elev` bg + white text. Inactive: transparent + `--text-muted`.
- **Content card grid:** 3 columns, 16px gap. Card border-radius 12px. No visible border, just subtle shadow.
- **Card thumbnail:** 16:9 aspect ratio, border-radius 12px top corners (or all corners if standalone). Duration badge: bottom-right corner, 6px inset, `rgba(0,0,0,0.75)` bg, 11px white text, border-radius 4px, padding 2px 6px.
- **Card metadata:** 12px padding below thumbnail. Title: 14px weight 600 white, max 2 lines, line-clamp. Channel/source: 12px `--text-muted`. Stats: 12px `--text-faint`, dot separator between items.

### Sidebar Active State (critical — this is the brand pattern)
```css
.nav-item.active {
  position: relative;
  background: rgba(138, 100, 255, 0.08);
  color: #ffffff;
}
.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--primary);
}
```

### Sidebar "Subscriptions" / Recent Participants Section
Each item: 36px height, circle avatar (24px, colored bg with white initials), name (13px, `--text-muted`), right chevron "›" (`--text-faint`). On hover: bg `--surface-elev`.

### "Show More" Toggle
Chevron-down icon (16px) + "Show More" text (13px, `--text-muted`). On click: expands list, icon rotates 180deg.

### Player/Detail View (Forms maximized state maps to this)
Look at bottom-left quadrant of dsgn.png:
- Left: large content area (65% width), full-bleed content
- Right: scrollable vertical list (35% width) — each item is a horizontal card: small square thumbnail (120px) + title/metadata stacked right
- This maps to: DocumentViewer (left 60%) + ControlPanel (right 40%)

### Channel/Profile View (Participant Detail maps to this)
Look at bottom-right quadrant of dsgn.png:
- Hero banner area at top (full width, ~200px tall, background image or gradient)
- Profile info overlaid: large avatar circle, name, handle, stats, "Subscribed" button
- **Secondary tab row below:** horizontal text tabs (Home, Video, Shorts, Live, Playlists, Community, Channels, About) with active underline
- Content grid below the tabs
- This maps to: Participant Detail view — hero header with participant name/NDIS#/diagnosis, then tabs for Details, Providers, Documents, Case Notes, with content grid below each tab

### Window Chrome
macOS frameless window with custom drag region. The top bar serves as the titlebar drag area. Traffic light buttons (close/minimize/maximize) positioned in the sidebar top-left, 12px from top and left, with 8px gaps.
```css
.sidebar-header {
  -webkit-app-region: drag;
  padding-left: 78px; /* space for traffic lights */
}
```

### Multi-Document Cards (2x2 grid)
Use the same card component as the dashboard — thumbnail area shows first page of PDF (scaled down), metadata below shows filename + completion badge. The "+ Open New" empty slot uses a dashed border card with a plus icon.

---

## QUALITY CHECKLIST

- [ ] **Sidebar:** Matches dsgn.png exactly — sections, dividers, active left-border, subscription/participant list with avatars + chevrons, Show More toggle, collapse behavior
- [ ] **Top Bar:** Centered search pill, category pills with correct active/inactive states, right-side avatar + notification
- [ ] **Card Grid:** 3-column grid, 16:9 thumbnail ratio, rounded corners, duration/status badges, metadata spacing matches image
- [ ] **Dashboard:** Stats row + recent forms card grid (identical to dsgn.png home view)
- [ ] **Forms:** Multi-doc tabs (up to 4), 2x2 minimized grid, maximize = split view matching player quadrant
- [ ] **Participants:** Card grid, click → detail view matching channel page quadrant (hero + secondary tabs + content)
- [ ] **Color:** Purple accent system throughout, no leftover blue, all tokens from papaya palette
- [ ] **Typography:** Inter font, correct weights/sizes per hierarchy level
- [ ] **Spacing:** Consistent 8/12/16/24px spacing grid, matches image proportions
- [ ] **Hover/Active/Disabled states** on all interactive elements with 150ms transitions
- [ ] **All 9 sidebar tabs** present, navigable, with correct category pills per tab
- [ ] **Existing form-filling pipeline** (ingest/schema/fill/export/RAG) continues working
- [ ] No console errors, no broken layouts at 1280x720+
- [ ] macOS traffic lights positioned correctly in frameless window
