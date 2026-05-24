# agent-form-filler

A macOS desktop app that fills any PDF form (fillable, locked, flattened, or scanned) from configurable sources — RAG, manual entry, or Claude — using a dual-path strategy: fillable PDFs are edited in place; locked/flattened/scanned PDFs are pixel-replicated via ReportLab and filled on the replica.

Full design: `docs/superpowers/specs/2026-05-25-agent-form-filler-design.md`
Implementation plan: `docs/superpowers/plans/2026-05-25-plan-1-mvp.md`

## Architecture

- **Electron main** (`electron/`) — window management, spawns the Python sidecar, IPC bridge, file dialogs, LightRAG CLI wrapper.
- **React renderer** (`src/`) — Sidebar (upload, path badge, RAG pull, fill, export), DocumentViewer (react-pdf via IPC bytes), FieldsPanel, AmbiguityModal. Zustand store.
- **Python sidecar** (`python/`) — FastAPI on a dynamic localhost port. PDF engine (PyMuPDF + ReportLab), hybrid schema extractor (native AcroForm + Claude Vision), Claude adapter (OAuth/`~/.claude/` with API-key fallback).

## Pipeline

Upload → `/ingest` (editability + form_map) → [if locked/flattened/scanned: `/replicate`] → `/schema` (native + vision) → pull from RAG / manual edit → `/fill` (direct or replica) → ambiguity prompts for low-confidence checkboxes → `/export`.

## Development

```bash
npm install
cd python && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt && cd ..
npm run dev
```

Default LLM: `claude-opus-4-6`. Default RAG workspace: `ndis`. All configurable in `config/agent.config.json` (no secrets — API keys come from env vars; OAuth token read from `~/.claude/`).

## Tests

```bash
npm run test:py     # Python backend (pytest)
npm run test:e2e    # Electron e2e (Playwright; requires `npx tsc && npx vite build` first)
npm test            # Vitest (frontend units, if any)
```

## Status

v0.1.0-mvp — Plan 1 complete (PDF only). Planned next: DOCX/XLSX/HTML engines, visual validation loop, embedded terminal, additional LLM adapters, iMessage/CSV/folder sources (Plans 2–3).
