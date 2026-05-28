# Changelog

All notable changes to Agent Kali will be documented in this file.

## [0.2.0] — 2026-05-28

### Added
- Complete UI redesign — dark purple theme (Papaya design system)
- Multi-document tab system (up to 4 documents, 2x2 grid / maximized views)
- 11 navigation tabs: Dashboard, Forms, Participants, Drafts, RAG Search, Templates, Reports, Providers, LightRAG, Local Files, Settings
- Real participant data from ~/Desktop/Support-Coordination/ filesystem scanning
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
