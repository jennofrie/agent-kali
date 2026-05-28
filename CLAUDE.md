# Agent Kali — Development Guide

## Project Overview

Agent Kali is a macOS Electron desktop application for NDIS support coordinators. It automates PDF form filling, participant data management, provider lookups, and document workflows. The app uses a Python FastAPI sidecar for PDF processing and LLM-powered field extraction, with a React frontend for the UI.

Maintained by JD Space Digital Systems.

## Tech Stack

- **Desktop:** Electron 30 (macOS, frameless window)
- **Frontend:** React 18 + TypeScript 5 + Vite 5
- **State:** Zustand 5
- **Styling:** Tailwind CSS 4 + CSS Custom Properties (Papaya dark purple theme)
- **PDF Rendering:** react-pdf (pdfjs-dist)
- **PDF Engine:** Python FastAPI sidecar (PyMuPDF + ReportLab)
- **RAG:** LightRAG (self-hosted, Tailscale VPN)
- **Testing:** Vitest + Playwright + pytest

## Architecture

```
Electron Main Process
├── Window Manager (frameless, macOS traffic lights)
├── IPC Bridge (preload.ts → contextBridge)
├── Sidecar Spawner (FastAPI on dynamic port)
└── IPC Handlers
    ├── fileHandlers.ts       → file open/save/read/delete/move/replace
    ├── participantHandlers.ts → SC folder scanning, file listing, import
    ├── ragHandlers.ts        → LightRAG CLI wrapper
    └── sidecarProxy.ts       → HTTP proxy to Python sidecar

React Renderer
├── 20 TSX components across 11 views
├── Zustand store (navigation, forms, participants, providers, pipeline)
├── react-pdf for PDF viewing
└── IPC client layer (lib/ipc/)

Python Sidecar (FastAPI)
├── server.py          → API endpoints
├── engines/pdf_engine.py → PyMuPDF + ReportLab
├── llm/llm_adapter.py    → LLM adapter (OAuth from macOS Keychain)
├── llm/field_values.py   → Value extraction
├── sources/folder_source.py → Participant folder reader
└── schema_extractor.py   → AcroForm + Vision field extraction
```

## Key Directories

| Path | Contents |
|------|----------|
| `electron/` | Main process: window, IPC handlers, sidecar lifecycle |
| `electron/ipc/` | IPC handler modules (files, participants, RAG, sidecar) |
| `src/` | React renderer: 6699 lines TypeScript |
| `src/components/Layout/` | Sidebar, TopBar (app shell) |
| `src/components/Dashboard/` | Dashboard stat cards, recent forms |
| `src/components/Forms/` | Multi-doc form workspace, auto-fill workflow |
| `src/components/DocumentViewer/` | react-pdf viewer |
| `src/components/FieldsPanel/` | Editable field list |
| `src/components/Participants/` | Participant cards, detail view with subtabs |
| `src/components/Providers/` | Provider directory (238+ providers from MD files) |
| `src/components/Reports/` | SC folder reports, type classification |
| `src/components/LightRag/` | RAG workspace status and connection |
| `src/components/Files/` | Local file browser |
| `src/components/Settings/` | App configuration |
| `src/components/Shared/` | Reusable components (Icon, AmbiguityModal) |
| `src/store/` | Zustand state management |
| `src/lib/` | Utilities, IPC clients, RAG wrapper, config, mock data |
| `src/index.css` | Full design system: 1392 lines, all tokens and component styles |
| `python/` | FastAPI sidecar: ~718 lines Python |
| `python/engines/` | PDF engine (PyMuPDF + ReportLab) |
| `python/llm/` | LLM adapter + field value extraction |
| `python/sources/` | Folder source reader |
| `python/tests/` | pytest suite |
| `config/` | Runtime config (`agent.config.json`, no secrets) |
| `public/` | Static assets, logos |

## Data Flow (Auto-Fill Pipeline)

The core workflow is a single-button auto-fill:

1. User uploads a PDF form via native file picker
2. User selects a participant from the sidebar
3. User enters optional instructions (page-level skip, checkbox directives, field overrides)
4. User clicks "Auto-Fill Form" — the pipeline runs sequentially:

```
POST /ingest     → Analyze PDF editability (fillable / locked / flattened / scanned)
POST /schema     → Extract field schema (native AcroForm + Vision fallback)
POST /extract-values → Map participant data to form fields (from RAG + SC folder + instructions)
POST /fill       → Write values to PDF (direct edit for fillable, pixel-replica for locked/scanned)
POST /export     → Flatten and save final PDF
```

Instructions have highest priority. The pipeline respects page-level skips, checkbox directives, and field-level overrides before any LLM extraction.

## All IPC Handlers

### File Operations
- `file:open` — native file picker dialog
- `file:openFolder` — native folder picker dialog
- `file:save` — native save dialog
- `file:read` — read file as byte buffer
- `delete-file` — delete a file at path
- `replace-file` — replace a file with new content
- `move-file` — move a file to a new location

### Sidecar
- `sidecar:request` — proxy HTTP request to Python FastAPI sidecar (method, path, body)

### RAG
- `rag:query` — execute LightRAG CLI query (query string, optional workspace)

### Participants
- `participants:scan` — scan `~/Desktop/Support-Coordination/` for participant folders
- `participants:listFiles` — list all files in a participant's folder
- `participants:importFile` — import a file into a participant's folder

### Providers
- `providers:scan` — read provider directory markdown files from Jin-Obsidian

## Development Commands

```bash
npm install                 # Install frontend dependencies
cd python && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt  # Python setup
npm run dev                 # Start Electron + Vite + sidecar
npm run build               # Production build (tsc + vite + electron-builder)
npm run lint                # ESLint
npm test                    # Vitest unit tests
npm run test:e2e            # Playwright E2E tests
npm run test:py             # pytest (Python sidecar)
```

## Conventions

### Styling
- All styles live in `src/index.css` using CSS custom properties
- The design system is called "Papaya" — dark purple, glassmorphic, neon glow
- Change colors by editing tokens in `:root`, never use color literals in components
- Refer to `DESIGN.md` for the full token reference

### Components
- `.tsx` files, one component per file, named exports
- Do not import React explicitly (JSX transform handles it)
- No inline styles except for dynamic CSS custom property values (e.g., `--pct`)

### State
- Zustand store in `src/store/index.ts`
- Navigation, form pipeline, participants, providers all managed in one store

### Data Sources
- Participant data from filesystem scanning of `~/Desktop/Support-Coordination/`
- Provider data from markdown files in `~/Desktop/Jin-Obsidian/`
- Prompt templates from `~/Desktop/Jin-Obsidian/SupportCoordination/Prompt-Engineering-for-Support-Coordination/`
- Reports from the SC folder, classified by type
- Mock data in `src/lib/mockData.ts` as fallback when Electron APIs are unavailable

### Python Sidecar
- Endpoints are stable — frontend changes should not require backend changes
- Do not modify API signatures without updating TypeScript types
- OAuth token is loaded from macOS Keychain; empty env vars must be cleared before SDK init

### Naming
- The app is called "Agent Kali" everywhere
- Do not add third-party AI company branding or attribution in the UI or documentation

## Do NOT

- Reference or attribute any third-party AI company in the UI, docs, or code comments
- Modify Python sidecar API signatures without updating TypeScript types in `src/lib/ipc/`
- Use inline styles except for dynamic CSS custom property values
- Import React explicitly (JSX transform handles it)
- Store secrets in `config/agent.config.json` or commit them
- Use color literals in CSS — always use the design tokens from `:root`
