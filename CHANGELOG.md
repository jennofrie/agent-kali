# Changelog

All notable changes to Agent Kali will be documented in this file.

## [0.3.0] — 2026-05-28

### Added
- **Auto-Fill workflow** — single "Auto-Fill Form" button runs the entire pipeline (Ingest, Schema, Extract, Fill, Export) after selecting a participant
- **Instructions field** with highest priority — supports page-level skip directives, checkbox directives, and per-field overrides that take precedence over LLM extraction
- **Providers tab** — reads 6 real markdown directory files from Jin-Obsidian (OT 59, Physio 44, Psychology 39, EP 27, Dietitian 25, Art Therapy 44 = 238+ providers), category filters, search, contact details
- **Prompts tab** — connected to `~/Desktop/Jin-Obsidian/SupportCoordination/Prompt-Engineering-for-Support-Coordination/`, reads `.md` files, copy to clipboard, send via email, delete, configurable folder path
- **Research history view** — past data extractions categorized by source (RAG, Email, SC Folder, Local), participant, date, with expandable full text
- **Reports connected to SC folder** — classifies reports by type (Plan Reassessment, Support Letter, Budget Utilisation, Monthly Summary, Outcome Reports, Progress Reports), configurable root path
- **Local Files** defaults to `~/Desktop/Support-Coordination/`, shows real participant folders with file counts
- **LightRAG view** shows real workspace URLs (`ndis.profexer.cloud`, `rag.profexer.cloud`), test connection buttons, config display
- **Real participants in sidebar** — 22 participants scanned from filesystem, pinned participants: Kydan, Tara, Mary, Monica, Rebecca
- **Document workflow** — replace file content, move documents to participant folders

### Fixed
- **OAuth token fix** — empty LLM provider env vars were blocking OAuth token from macOS Keychain; fixed by clearing empty env vars before SDK client init
- **Traffic lights** — macOS window control buttons now position and render correctly in frameless window

## [0.2.0] — 2026-05-28

### Added
- Complete UI redesign — dark purple theme (Papaya design system)
- Multi-document tab system (up to 4 documents, 2x2 grid / maximized views)
- 11 navigation tabs: Dashboard, Forms, Participants, Drafts, RAG Search, Templates, Reports, Providers, LightRAG, Local Files, Settings
- Real participant data from `~/Desktop/Support-Coordination/` filesystem scanning
- Participant detail view with subtabs (Overview, Documents, Providers, Case notes, Budget, History)
- Reports view connected to SC folder with type classification
- Import/move documents to participant folders
- macOS frameless window with proper sizing
- Dragon shield logo integration

### Changed
- Project renamed from "agent-form-filler" to "Agent Kali"
- Color system migrated from blue (Nexora) to purple (Papaya)
- Sidebar redesigned with sections, recent participants, collapse toggle

## [0.1.0] — 2026-05-25

### Added
- Initial MVP: PDF form filling (fillable, locked, flattened, scanned)
- Python FastAPI sidecar with PyMuPDF + ReportLab
- RAG integration via LightRAG CLI
- Ambiguity resolution modal for low-confidence fields
- Electron desktop wrapper with IPC bridge
