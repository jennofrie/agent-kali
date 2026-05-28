# Agent Kali — Development Guide

## Project Overview
Agent Kali is a macOS desktop application for NDIS (National Disability Insurance Scheme) support coordinators. It automates PDF form filling using AI-powered field extraction, RAG (Retrieval-Augmented Generation) data sources, and a dual-path PDF strategy (direct edit for fillable forms, pixel-replica for locked/scanned forms).

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **State:** Zustand
- **Desktop:** Electron 30
- **Backend:** Python FastAPI sidecar (PyMuPDF + ReportLab)
- **PDF Rendering:** react-pdf (pdfjs-dist)
- **RAG:** LightRAG (self-hosted, Tailscale VPN)

## Architecture
```
Electron main → spawns Python sidecar (FastAPI on dynamic port)
React renderer → communicates via IPC bridge to main process
Main process → proxies HTTP to sidecar + handles file dialogs, RAG CLI
```

## Key Directories
- `electron/` — Main process: window management, IPC, sidecar lifecycle
- `src/` — React renderer: components, store, styles
- `src/components/Layout/` — Sidebar, TopBar (shell navigation)
- `src/components/Dashboard/` — Dashboard stat cards, recent forms
- `src/components/Forms/` — Multi-document form workspace
- `src/components/Participants/` — Participant caseload (wired to ~/Desktop/Support-Coordination/)
- `python/` — FastAPI sidecar: PDF engine, schema extraction, fill pipeline
- `config/` — Runtime configuration (no secrets)
- `public/` — Static assets, logo

## Data Flow
1. User opens a PDF form → Electron file dialog → sidecar `/ingest`
2. Sidecar analyzes editability (fillable/locked/flattened/scanned)
3. Schema extraction via native AcroForm + Vision fallback → `/schema`
4. Values extracted from RAG or local folders → `/extract-values`
5. PDF filled via direct edit or pixel-replica → `/fill`
6. Export flattened PDF → `/export`

## Development
```bash
npm install
cd python && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt && cd ..
npm run dev
```

## Conventions
- All styles in `src/index.css` using CSS custom properties (purple/dark theme)
- Components are `.tsx`, one per file, named exports
- Zustand store in `src/store/index.ts`
- Python sidecar endpoints are stable — frontend changes don't require backend changes
- Participant data comes from filesystem scanning of `~/Desktop/Support-Coordination/`
- Mock data in `src/lib/mockData.ts` serves as fallback when Electron APIs unavailable

## Do NOT
- Add AI company branding or attribution in the UI
- Modify Python sidecar API signatures without updating the TypeScript types
- Use inline styles except for dynamic CSS custom property values
- Import React explicitly (JSX transform handles it)
