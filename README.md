<div align="center">

# Agent Kali

**NDIS Form Automation for Support Coordinators**

*Maintained by [JD Space Digital Systems](https://github.com/userx0234)*

![Agent Kali Dashboard](screenshots/dashboard.png)

[![License](https://img.shields.io/badge/license-MIT-purple.svg)](#license)
[![Platform](https://img.shields.io/badge/platform-macOS-black.svg)](#)
[![Electron](https://img.shields.io/badge/electron-30-blue.svg)](#tech-stack)
[![React](https://img.shields.io/badge/react-18-61dafb.svg)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/typescript-5-3178c6.svg)](#tech-stack)
[![Python](https://img.shields.io/badge/python-3.10+-3776ab.svg)](#tech-stack)

</div>

---

## What is Agent Kali?

Agent Kali is a macOS desktop application for NDIS support coordinators. It automates PDF form filling, participant management, provider lookups, and document workflows that consume hours of administrative time every week.

### The Problem

Support coordinators fill dozens of forms per week: service agreements, plan reviews, referral forms, progress reports. Each form requires pulling participant details from multiple sources — NDIS plans, case notes, provider records, email threads. The manual process is slow, error-prone, and takes time away from participant support.

### The Solution

Agent Kali ingests any PDF form (fillable, locked, flattened, or scanned), extracts the field schema, pulls relevant data from configured sources (RAG knowledge base, local SC folders, manual overrides), and fills the form in a single click. An instructions field gives operators full control — page-level skips, checkbox directives, and field overrides all take highest priority in the pipeline.

---

## Features

### 1. Dashboard
Real participant count scanned from the filesystem. Recent forms grid, quick action buttons, at-a-glance caseload stats.

![Dashboard](screenshots/final-dashboard.png)

### 2. Forms
Upload any PDF via native file picker. One-button Auto-Fill workflow: select a participant, click "Auto-Fill Form", and the pipeline runs end-to-end (Ingest, Schema, Extract, Fill, Export). Real PDF viewer powered by react-pdf. Instructions field with highest priority — page-level skip, checkbox directives, field overrides. Move completed forms to participant folders.

![Forms View](screenshots/01-check4.png)

### 3. Participants
22 real participants scanned from `~/Desktop/Support-Coordination/`. Detail view with subtabs: Overview, Documents, Providers, Case Notes, Budget, History. Pinned participants: Kydan, Tara, Mary, Monica, Rebecca.

![Participants View](screenshots/01-check5.png)

### 4. Prompts
Connected to `~/Desktop/Jin-Obsidian/SupportCoordination/Prompt-Engineering-for-Support-Coordination/`. Reads `.md` files. Copy to clipboard, send via email, delete. Configurable folder path.

### 5. Research
History view of past data extractions, categorized by source (RAG, Email, SC Folder, Local), participant, and date. Expandable full-text results.

### 6. Templates
Form template library for commonly used NDIS documents.

### 7. Reports
Connected to the SC folder. Classifies by type: Plan Reassessment, Support Letter, Budget Utilisation, Monthly Summary, Outcome Reports, Progress Reports. Configurable root path.

### 8. Providers
Reads 6 real markdown directory files from Jin-Obsidian: OT (59), Physio (44), Psychology (39), EP (27), Dietitian (25), Art Therapy (44) — 238+ providers total. Category filters, search, contact details.

### 9. LightRAG
Shows real workspace URLs (`ndis.profexer.cloud`, `rag.profexer.cloud`). Test connection buttons and config display.

### 10. Local Files
Defaults to `~/Desktop/Support-Coordination/`. Shows real participant folders with file counts.

### 11. Settings
Profile configuration, sidecar settings, path management, and preferences.

![Participant Detail](screenshots/02-check5.png)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 30 (macOS, frameless window) |
| Frontend | React 18 + TypeScript 5 + Vite 5 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 + CSS Custom Properties (Papaya dark theme) |
| PDF Rendering | react-pdf (pdfjs-dist) |
| PDF Engine | Python FastAPI sidecar (PyMuPDF + ReportLab) |
| RAG | LightRAG (self-hosted, Tailscale VPN) |
| Testing | Vitest + Playwright + pytest |
| Icons | Custom inline SVG (Lucide-style) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Electron Main Process                  │
│  ┌───────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │  Window    │  │  IPC Bridge │  │  Sidecar Spawner   │ │
│  │  Manager   │  │  (preload)  │  │  (FastAPI on port) │ │
│  └───────────┘  └──────┬──────┘  └─────────┬──────────┘ │
└─────────────────────────┼──────────────────-┼────────────┘
                          │                   │
           ┌──────────────▼──────┐  ┌────────▼──────────────┐
           │   React Renderer    │  │   Python Sidecar       │
           │  ┌───────────────┐  │  │  ┌──────────────────┐  │
           │  │ Sidebar       │  │  │  │ POST /ingest     │  │
           │  │ TopBar        │  │  │  │ POST /schema     │  │
           │  │ 11 Views      │  │  │  │ POST /extract-*  │  │
           │  │ Zustand Store │  │  │  │ POST /fill       │  │
           │  │ react-pdf     │  │  │  │ POST /replicate  │  │
           │  └───────────────┘  │  │  │ POST /export     │  │
           └─────────────────────┘  │  └──────────────────┘  │
                                    │  PyMuPDF + ReportLab   │
                                    │  LLM Adapter           │
                                    └────────────────────────┘
```

### Pipeline Flow

```
PDF Upload → /ingest (editability check)
          → /schema (field extraction: AcroForm + Vision fallback)
          → /extract-values (data from RAG + SC folder + instructions)
          → /fill (direct for fillable, pixel-replica for locked/scanned)
          → /export (flatten + save)
```

### IPC Handlers

| Channel | Purpose |
|---------|---------|
| `sidecar:request` | Proxy HTTP to Python FastAPI sidecar |
| `rag:query` | LightRAG CLI wrapper |
| `file:open` | Native file picker dialog |
| `file:openFolder` | Native folder picker dialog |
| `file:save` | Native save dialog |
| `file:read` | Read file as bytes |
| `participants:scan` | Scan SC folder for participant directories |
| `participants:listFiles` | List files in a participant folder |
| `participants:importFile` | Import a file into a participant folder |
| `providers:scan` | Read provider directory markdown files |
| `delete-file` | Delete a file |
| `replace-file` | Replace a file |
| `move-file` | Move a file to a new location |

---

## Getting Started

### Prerequisites

- macOS 12+
- Node.js 18+
- Python 3.10+

### Installation

```bash
git clone https://github.com/userx0234/agent-kali.git
cd agent-kali
npm install
cd python && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt && cd ..
```

### Development

```bash
npm run dev
```

This starts the Vite dev server, Electron main process, and the Python sidecar simultaneously.

### Build

```bash
npm run build
```

### Testing

```bash
npm test              # Vitest unit tests
npm run test:e2e      # Playwright end-to-end tests
npm run test:py       # pytest for Python sidecar
```

---

## Configuration

### Participant Data

Agent Kali scans `~/Desktop/Support-Coordination/` for participant folders. Each subfolder represents a participant, with documents organized into subdirectories (Case-Notes, Correspondence, Reports, etc.).

### RAG Endpoints

Configure LightRAG workspace URLs in `config/agent.config.json`. Default workspaces: `ndis.profexer.cloud` and `rag.profexer.cloud`. Requires Tailscale VPN.

### Provider Directories

Provider markdown files are read from `~/Desktop/Jin-Obsidian/`. Each file contains a category of providers (OT, Physio, Psychology, EP, Dietitian, Art Therapy).

### Prompts

Prompt templates are loaded from `~/Desktop/Jin-Obsidian/SupportCoordination/Prompt-Engineering-for-Support-Coordination/`. Path is configurable in Settings.

### Reports

Report root path defaults to the SC folder. Reports are classified by type automatically.

---

## Project Structure

```
agent-kali/
├── electron/                    # Electron main process
│   ├── main.ts                  # Window creation, app lifecycle
│   ├── preload.ts               # IPC bridge (contextBridge)
│   ├── sidecar.ts               # Python sidecar lifecycle
│   ├── electron-env.d.ts        # Type declarations
│   └── ipc/                     # IPC handler modules
│       ├── fileHandlers.ts      # File open/save/read/delete/move
│       ├── participantHandlers.ts  # SC folder scanning
│       ├── ragHandlers.ts       # LightRAG CLI wrapper
│       └── sidecarProxy.ts      # HTTP proxy to FastAPI
├── src/                         # React renderer (6699 lines TS)
│   ├── App.tsx                  # Root shell — Sidebar + TopBar + ContentRouter
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Design system — 1392 lines, all tokens
│   ├── components/              # 20 TSX components
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx      # Left nav with sections + recent participants
│   │   │   └── TopBar.tsx       # Search + category pills + avatar
│   │   ├── Dashboard/
│   │   │   └── DashboardView.tsx
│   │   ├── DashboardHero/
│   │   │   └── DashboardHero.tsx  # Stat cards
│   │   ├── Forms/
│   │   │   └── FormsView.tsx    # Multi-doc workspace + auto-fill
│   │   ├── DocumentViewer/
│   │   │   └── DocumentViewer.tsx  # react-pdf viewer
│   │   ├── FieldsPanel/
│   │   │   └── FieldsPanel.tsx  # Editable field list
│   │   ├── Participants/
│   │   │   └── ParticipantsView.tsx  # Card grid + detail view
│   │   ├── Drafts/
│   │   │   └── DraftsView.tsx
│   │   ├── Providers/
│   │   │   └── ProvidersView.tsx  # 238+ providers from MD files
│   │   ├── Reports/
│   │   │   └── ReportsView.tsx  # SC folder reports by type
│   │   ├── Templates/
│   │   │   └── TemplatesView.tsx
│   │   ├── Rag/
│   │   │   └── RagView.tsx
│   │   ├── LightRag/
│   │   │   └── LightRagView.tsx
│   │   ├── Files/
│   │   │   └── FilesView.tsx    # Local file browser
│   │   ├── Settings/
│   │   │   └── SettingsView.tsx
│   │   ├── Shared/
│   │   │   ├── AmbiguityModal.tsx  # Low-confidence field resolution
│   │   │   └── Icon.tsx         # Inline SVG icon set
│   │   ├── AmbiguityModal/
│   │   │   └── AmbiguityModal.tsx
│   │   └── Sidebar/
│   │       └── Sidebar.tsx
│   ├── store/
│   │   └── index.ts             # Zustand store
│   └── lib/
│       ├── config.ts            # Runtime config
│       ├── mockData.ts          # Fallback data for non-Electron contexts
│       ├── utils.ts             # Utilities
│       └── ipc/
│           ├── sidecar.ts       # Sidecar HTTP client
│           └── window.d.ts      # Window API type declarations
│       └── rag/
│           └── lightrag.ts      # LightRAG query wrapper
├── python/                      # FastAPI sidecar (~718 lines)
│   ├── server.py                # API endpoints
│   ├── config.py                # Sidecar configuration
│   ├── schema_extractor.py      # Field schema extraction
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── engines/
│   │   └── pdf_engine.py        # PyMuPDF + ReportLab PDF ops
│   ├── llm/
│   │   ├── llm_adapter.py       # LLM adapter (OAuth token)
│   │   └── field_values.py      # Value extraction from text
│   ├── sources/
│   │   └── folder_source.py     # Read docs from participant folders
│   └── tests/                   # pytest suite
├── config/
│   └── agent.config.json        # Runtime config (no secrets)
├── public/                      # Static assets
│   ├── logo-*.png               # App logos (32, 64, 128, full)
│   └── *.svg                    # Vite/Electron SVGs
├── screenshots/                 # App screenshots
└── package.json
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Agent Kali** — Maintained by **JD Space Digital Systems**

</div>
