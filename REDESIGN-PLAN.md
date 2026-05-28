# Agent Kali — Redesign Plan

## Reference: dsgn.png (Papaya Dark Theme)

---

## 1. DESIGN SYSTEM EXTRACTION FROM DSGN.PNG

### Color Palette (sampled from the image)
| Token | Hex | Mapped Role |
|-------|-----|-------------|
| Background | `#0f0f1a` | App body, deepest layer |
| Surface | `#1a1a2e` | Sidebar, cards, panels |
| Surface Elevated | `#252540` | Hover states, active cards, modals |
| Surface Glass | `rgba(26,26,46,0.92)` | Glassmorphic overlays, dropdowns |
| Border | `rgba(255,255,255,0.08)` | Subtle dividers, card borders |
| Border Active | `rgba(138,100,255,0.4)` | Active nav item, focused inputs |
| Primary | `#8a64ff` | Purple accent — active nav, selected tabs, primary buttons |
| Primary Hover | `#a084ff` | Lighter purple for hover states |
| Secondary | `#e74c8a` | Pink accent — subscribe buttons, badges, notifications |
| Accent Text | `#c4b5ff` | Light purple text on active elements |
| Text Primary | `#ffffff` | Headings, card titles |
| Text Secondary | `#a0a0b8` | Descriptions, metadata, timestamps |
| Text Muted | `#5c5c72` | Placeholder, faint labels |
| Category Pill BG | `rgba(255,255,255,0.08)` | Unselected top tab pills |
| Category Pill Active | `#ffffff` | Active pill text with dark bg |
| Card Thumbnail BG | `#2a2a44` | Thumbnail placeholder |
| Timestamp Badge | `rgba(0,0,0,0.7)` | Duration badges on thumbnails |

### Typography
- **Font Family:** Inter or system sans-serif stack
- **Headings:** 16–22px, weight 700–800, white
- **Body:** 13–14px, weight 400–500, `#a0a0b8`
- **Labels/Eyebrows:** 11–12px, weight 600–700, uppercase, `#5c5c72`
- **Card titles:** 14px, weight 600, white, max 2 lines truncated

### Layout Structure
- **Left Sidebar:** 240px expanded / 72px collapsed, fixed height 100vh
  - Logo/brand top
  - Nav items with icons + labels (Home, Shorts, Subscriptions, etc.)
  - Section dividers with group labels ("My Channel", "Subscriptions")
  - Scrollable channel list at bottom with avatars
  - Active item: purple left border accent + purple bg tint + white text
  - Inactive: icon + muted text
- **Top Bar:** Full width minus sidebar, ~56px height
  - Search bar center (rounded pill, dark bg, placeholder text)
  - Category tab pills (scrollable horizontal, pill-shaped, first one active)
  - Right: notification icon, user avatar circle
- **Content Area:** Responsive card grid
  - Cards: rounded corners (12px), thumbnail top, metadata below
  - Grid: 3–4 columns, 16px gap
  - Card hover: subtle elevation/scale

### Component Patterns
- **Nav Item:** Icon (20px) + Label (13px), 44px row height, 12px left padding, purple accent border on active
- **Category Pills:** Horizontal scroll, pill shape (radius 20px), 32px height, 14px horizontal padding, white-on-dark when active
- **Content Cards:** 100% width within grid cell, thumbnail 16:9 ratio, 12px padding below thumbnail, title + channel + metadata stack
- **Search Bar:** Centered, max-width 520px, rounded pill, subtle border, search icon left
- **Avatar:** 32px circle, top-right corner
- **Section Divider:** 1px border-top + uppercase label below

---

## 2. APPLICATION MAPPING — SC WORKFLOW TABS

### Sidebar Navigation (maps to Papaya sidebar)

**Main Section**
| Nav Item | Icon | Purpose |
|----------|------|---------|
| Dashboard | `LayoutDashboard` | Overview: recent activity, quick stats, at-a-glance cards |
| Forms | `FileText` | Core form-filling workspace (current main feature) |
| Participants | `Users` | Caseload browser — all participants as cards |
| Drafts | `Mail` | Email drafts from Jin-Obsidian/CDSS-SSS-EMAIL |

**Tools Section**
| Nav Item | Icon | Purpose |
|----------|------|---------|
| RAG Search | `Search` | Standalone LightRAG query interface (NDIS + Technical) |
| Templates | `LayoutTemplate` | Blank form templates library (Glowing Therapy, CDSS SA, etc.) |
| Reports | `ClipboardList` | Report builder — SC Progress, 90-day, Plan Review |
| Providers | `Building2` | Provider directory with contacts, capacity, service types |

**Data Section**
| Nav Item | Icon | Purpose |
|----------|------|---------|
| LightRAG | `Database` | RAG connection status, query history, workspace selector |
| Local Files | `FolderOpen` | Browse Support-Coordination folder tree |

**Bottom**
| Nav Item | Icon | Purpose |
|----------|------|---------|
| Settings | `Settings` | Config: API keys, RAG endpoints, default paths, LLM model |

### Top Bar Category Pills (context-dependent per tab)

**Dashboard:** All | Today | This Week | Pending | Completed
**Forms:** All | Active | Recently Filled | Pending Review | Exported | Templates
**Participants:** All Active | Archived | By Plan Expiry | By Diagnosis | Needs Attention
**Drafts:** All | Unsent | Today | By Participant
**RAG Search:** NDIS Workspace | Technical Workspace | Both
**Templates:** OT Forms | Service Agreements | Reports | NDIS Submissions | All
**Reports:** In Progress | Completed | Pending Info | By Participant
**Providers:** All | OT | Psychology | PBS | Physio | Plan Management | AT

---

## 3. VIEW DESIGNS PER TAB

### Dashboard View (Home equivalent in dsgn.png)
**Layout:** Card grid (3–4 columns)
- **Stats Row:** 4 hero cards (Total participants, Forms filled this month, Pending actions, RAG queries)
- **Recent Forms:** Card grid — each card shows form thumbnail/icon, participant name, completion %, date, status badge
- **Quick Actions Bar:** "New Form", "Pull from RAG", "Open Template", "Add Participant" buttons
- **Pending Items:** List of action items needing attention (unanswered emails, unfilled forms, expiring plans)
- **Activity Feed:** Timeline of recent actions (forms filled, emails drafted, reports generated)

### Forms View (Video Player equivalent — the main workspace)
**Layout:** Split view — Document viewer left (60%) + Fields/Controls right (40%)
- **Left Panel:** PDF viewer with page navigation, zoom, filled/source toggle
- **Right Panel:** Tabbed interface
  - **Fields Tab:** Current FieldsPanel (editable field list)
  - **Sources Tab:** RAG query input, folder picker, manual entry toggle
  - **Pipeline Tab:** Ingest → Schema → Fill → Export with status at each step
  - **Info Tab:** Document metadata, editability, path strategy, file size
- **Bottom Bar:** Fill button, Export button, status message, confidence score

### Participants View (Channel list / Subscriptions equivalent)
**Layout:** Card grid (3–4 columns)
- Each card: participant avatar/initials circle, name, NDIS #, primary diagnosis, plan expiry date
- Click card → side panel or full view with:
  - Personal details (DOB, address, phone, email)
  - NDIS plan summary (dates, funding, management type)
  - Active providers list
  - Recent case notes
  - Available documents
  - "Fill Form for This Participant" button → pre-loads their data into any selected form
  - "Query RAG" button → pre-fills query with participant name

### Drafts View
**Layout:** List view with preview panel
- Left: scrollable list of .md files from CDSS-SSS-EMAIL folder
- Right: rendered preview of selected draft
- Actions: Copy to clipboard, Open in editor, Mark as sent, Delete
- Filter pills: By participant, by date, by type (email/SMS/iMessage)

### RAG Search View
**Layout:** Single column, search-focused
- Large search input at top
- Workspace selector (NDIS / Technical / Both)
- Mode selector pills (mix / local / global / hybrid / naive)
- Results area: formatted response with source references
- Query history sidebar (collapsible)
- "Use in Form" button — extracts values from RAG response into active form

### Templates View (Browse equivalent in dsgn.png)
**Layout:** Card grid
- Each card: form thumbnail, template name, provider name, field count
- Categories: OT Referral Forms, Service Agreements, NDIS Reports, SC Progress Reports
- Click → opens in Forms view ready to fill
- Upload new template button

### Reports View
**Layout:** Card grid + report builder wizard
- Existing reports as cards (thumbnail, participant, type, date, status)
- "New Report" wizard:
  1. Select participant
  2. Select report type (90-day Implementation, Plan Review, SC Progress, Change of Circumstances)
  3. Pull data from RAG + participant folder
  4. Generate draft → edit → export PDF

### Providers View
**Layout:** Card grid + detail panel
- Each card: provider logo/initials, name, service type, location, capacity status
- Detail panel: full contact info, service areas, registration #, linked participants
- Add/edit provider functionality
- Quick actions: "Send referral", "Check capacity email"

### Settings View
**Layout:** Form-based settings panel
- API Configuration: RAG API key, endpoint URLs, LLM model selection
- Default Paths: SC folder, email drafts folder, templates folder, output folder
- Profile: SC name, org, email, phone (auto-populates referral forms)
- Connections: Tailscale status, RAG status, Gmail status
- Theme: (future) light/dark toggle

---

## 4. DATA ARCHITECTURE

### New Store Slices (extend Zustand)
```
activeTab: "dashboard" | "forms" | "participants" | "drafts" | "rag" | "templates" | "reports" | "providers" | "settings"
sidebarCollapsed: boolean
categoryFilter: string
participants: Participant[]
drafts: Draft[]
templates: Template[]
providers: Provider[]
recentForms: RecentForm[]
ragHistory: RagQuery[]
```

### Participant Type
```
{
  id: string
  fullName: string
  dob: string
  ndisNumber: string
  address: string
  phone: string
  email: string
  diagnosis: string
  additionalDiagnoses: string[]
  planDates: { start: string, end: string }
  planManagement: "NDIA" | "Plan Managed" | "Self Managed"
  planManager: { name: string, email: string }
  scLevel: 2 | 3
  livingStatus: string
  providers: { name: string, service: string, contact: string }[]
  folderPath: string
}
```

### Data Sources
- **Participants:** Scan ~/Desktop/Support-Coordination/ subfolders, parse intake forms + RAG
- **Drafts:** Scan ~/Desktop/Jin-Obsidian/CDSS-SSS-EMAIL/*.md files
- **Templates:** Scan ~/Desktop/Forms-To-FillOut/*.pdf
- **Providers:** JSON file in config/ or extracted from participant folders
- **RAG:** Live queries to ndis.profexer.cloud / rag.profexer.cloud

---

## 5. COMPONENT ARCHITECTURE

```
src/
  App.tsx                    — Shell: Sidebar + TopBar + Content router
  components/
    Layout/
      Sidebar.tsx            — Left nav (collapsible, sections, icons)
      TopBar.tsx             — Search + category pills + user avatar
      ContentRouter.tsx      — Renders active tab content
    Dashboard/
      DashboardView.tsx      — Stats grid + recent forms + quick actions
      StatCard.tsx           — Individual stat hero card
      RecentFormCard.tsx     — Form thumbnail card
      PendingItem.tsx        — Action item row
    Forms/
      FormsView.tsx          — Split: DocumentViewer + ControlPanel
      DocumentViewer.tsx     — PDF viewer (existing, refined)
      ControlPanel.tsx       — Tabbed right panel (Fields/Sources/Pipeline/Info)
      FieldsPanel.tsx        — Editable field list (existing, refined)
      SourcesPanel.tsx       — RAG query + folder picker
      PipelinePanel.tsx      — Pipeline steps with status
      FillBar.tsx            — Bottom action bar (Fill/Export/Status)
    Participants/
      ParticipantsView.tsx   — Card grid of caseload
      ParticipantCard.tsx    — Individual participant card
      ParticipantDetail.tsx  — Full detail side panel
    Drafts/
      DraftsView.tsx         — List + preview split
      DraftItem.tsx          — Draft list row
      DraftPreview.tsx       — Rendered markdown preview
    Rag/
      RagView.tsx            — Search interface + results
      RagHistoryItem.tsx     — Previous query row
    Templates/
      TemplatesView.tsx      — Card grid of templates
      TemplateCard.tsx       — Template thumbnail card
    Reports/
      ReportsView.tsx        — Card grid + wizard
      ReportWizard.tsx       — Step-by-step report builder
    Providers/
      ProvidersView.tsx      — Card grid + detail panel
      ProviderCard.tsx       — Provider card
    Settings/
      SettingsView.tsx       — Config form
    Shared/
      Card.tsx               — Reusable card component
      CategoryPills.tsx      — Horizontal scrollable pill tabs
      SearchBar.tsx          — Search input component
      Avatar.tsx             — User/participant avatar circle
      Badge.tsx              — Status badge
      Modal.tsx              — Reusable modal
      AmbiguityModal.tsx     — Existing (refined)
  store/
    index.ts                 — Main Zustand store (extended)
    slices/
      navigation.ts
      forms.ts
      participants.ts
      drafts.ts
      rag.ts
  lib/
    ipc/sidecar.ts           — Existing
    rag/lightrag.ts          — Existing
    config.ts                — Existing
    utils.ts                 — Existing
    parsers/
      participant.ts         — Parse SC folder into Participant objects
      draft.ts               — Parse .md email drafts
      template.ts            — Parse template folder
```

---

## 6. IMPLEMENTATION PHASES

### Phase 1 — Shell & Navigation (Week 1)
- New Sidebar with icons, sections, collapse toggle
- TopBar with search, category pills, avatar
- ContentRouter with tab switching
- Dashboard view with placeholder cards
- Color system migration from nexora blue → papaya purple

### Phase 2 — Core Views (Week 2)
- Participants view with card grid (parse SC folder)
- Drafts view with list + preview
- Templates view with card grid
- Refactored Forms view (split panel with tabs)

### Phase 3 — Intelligence Features (Week 3)
- RAG Search standalone view
- Report Builder wizard
- Providers directory
- Participant → Form pre-fill flow

### Phase 4 — Polish & Integration (Week 4)
- Settings view
- Keyboard shortcuts
- Animations & transitions
- Performance optimization
- Testing

---

## 7. KEY DESIGN DECISIONS

1. **Sidebar is king.** Every feature is one click away. No nested menus, no buried screens.
2. **Cards everywhere.** Consistent card component with thumbnail area, title, metadata, and status badge — same pattern across all views.
3. **Context-aware top bar.** Category pills change per tab. Search scope changes per tab.
4. **Form filling stays central.** The Forms tab is the power view — everything else feeds into it.
5. **Participant-first workflow.** Select a participant → their data pre-fills everything: forms, RAG queries, email drafts, report templates.
6. **Purple accent system.** Matches dsgn.png. Active states, primary actions, glow effects all in purple instead of current blue.
7. **No wasted space.** Every pixel serves the SC workflow. No decorative elements that don't help fill forms or manage participants.
