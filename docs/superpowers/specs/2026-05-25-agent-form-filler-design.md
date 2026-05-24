# agent-form-filler — Design Spec
**Date:** 2026-05-25  
**Status:** Approved  
**Location:** `~/Desktop/Github/agent-form-filler/`

---

## 1. Purpose

A macOS desktop application that accepts any uploaded PDF, Word, Excel, or HTML form and fills it from any configured source (RAG, iMessage, CSV, folder, manual, LLM prompt). The app uses a **dual-path fill strategy**: if the uploaded form is fillable (editable widgets, no lock), content is written directly into the original. If the form is locked, flattened, or scanned, the app first produces a pixel-perfect (95–99% fidelity) replica via PyMuPDF→ReportLab and fills the replica instead — bypassing the lock entirely. Field semantics (type, label, instructions, check style, ambiguity) are recovered via a hybrid native-metadata + Claude Vision extractor. An AI visual-validation loop catches rendering defects with user-approved fix iterations. All LLM, RAG, and source integrations are fully configurable — nothing is hardcoded.

---

## 2. Constraints & Decisions

| Constraint | Decision |
|------------|----------|
| Platform | macOS only (Apple Silicon M4) |
| Document input | User always uploads an empty source form — no scraping, no generation from scratch |
| Fill strategy | Auto-detected: `direct` (fillable forms) or `replicate` (locked / flattened / scanned). User can override per-document. |
| Fidelity target | 95–99% — the *filled output* visually matches the uploaded original (only the inserted content differs) |
| Document types | PDF, DOCX, XLSX, HTML (equal priority) |
| Content sources | Manual, LLM prompt, RAG, iMessage, CSV/JSON, folder watch |
| Ambiguity handling | When a checkbox/radio state can't be determined from the source, the app shows a modal asking the user — choices logged per template for auto-resolution on future fills |
| Validation loop | Semi-automatic — findings shown, fix prompts generated, user approves each batch |
| Export format | User-chosen at export time (PDF, DOCX, XLSX, HTML) |
| Terminal | Dual: real PTY shell (xterm.js + node-pty) + prompt template panel side-by-side |
| LLM auth | OAuth token by default (reads `~/.claude/`), API key fallback |
| Default LLM | `claude-opus-4-6` for both fill and validation |
| Default RAG workspace | `ndis` (`https://ndis.profexer.cloud`) — configurable |
| Package manager | npm only |

---

## 3. Architecture

Two processes communicate over a local socket:

```
┌─────────────────────────────────┐        ┌──────────────────────────────┐
│     Electron Main Process       │        │     Python Sidecar           │
│  - window management            │◄─────►│  FastAPI on localhost:<port> │
│  - file system access           │  HTTP  │  - document engines          │
│  - node-pty PTY sessions        │        │  - validator                 │
│  - IPC bridge to renderer       │        │  - OCR fallback              │
│  - sidecar lifecycle            │        │  - export pipeline           │
└───────────────┬─────────────────┘        └──────────────────────────────┘
                │ IPC
┌───────────────▼─────────────────┐
│     React Renderer (UI)         │
│  - DocumentViewer (dual pane)   │
│  - Terminal (xterm.js)          │
│  - PromptPanel (templates)      │
│  - ValidationPanel (findings)   │
│  - Sidebar (files, library)     │
└─────────────────────────────────┘
```

The Python sidecar port is chosen dynamically at startup and passed to Electron via IPC. All document-heavy work (parse, replicate, fill, render, export) runs in the sidecar. The renderer never calls Python directly — always through Electron IPC → main → HTTP.

---

## 4. Project Structure

```
~/Desktop/Github/agent-form-filler/
├── electron/
│   ├── main.ts               # app lifecycle, sidecar spawn, window management
│   ├── preload.ts            # IPC bridge exposed to renderer
│   └── ipc/
│       ├── fileHandlers.ts   # open/save dialogs, file system ops
│       ├── sidecarProxy.ts   # proxy renderer requests to Python FastAPI
│       └── ptyHandlers.ts    # node-pty session management
├── src/                      # React/TypeScript UI
│   ├── components/
│   │   ├── DocumentViewer/   # dual-pane original vs filled, scroll-synced
│   │   ├── Terminal/         # xterm.js shell (real PTY)
│   │   ├── PromptPanel/      # template picker + editable prompt editor
│   │   ├── ValidationPanel/  # findings cards, diff overlay, approve/skip
│   │   └── Sidebar/          # upload drop zone, recents, template library
│   ├── lib/
│   │   ├── llm/              # pluggable LLM adapter layer
│   │   │   ├── adapter.ts    # LLMAdapter interface
│   │   │   ├── claude.ts     # ClaudeAdapter (OAuth + API key)
│   │   │   ├── openai.ts     # OpenAIAdapter
│   │   │   ├── ollama.ts     # OllamaAdapter
│   │   │   └── custom.ts     # CustomHTTPAdapter
│   │   ├── rag/
│   │   │   └── lightrag.ts   # wraps /Users/sharan/.local/bin/lightrag CLI
│   │   └── sources/
│   │       ├── imessage.ts   # AppleScript iMessage extractor
│   │       ├── csv.ts        # CSV/JSON field mapper
│   │       └── folder.ts     # folder watch connector
│   └── store/                # Zustand — document state, validation state, config
├── python/
│   ├── server.py             # FastAPI entrypoint, port selection
│   ├── engines/
│   │   ├── pdf_engine.py     # PyMuPDF (parse) + ReportLab (generate/fill)
│   │   ├── docx_engine.py    # python-docx (parse + write)
│   │   ├── xlsx_engine.py    # openpyxl (parse + write)
│   │   └── html_engine.py    # Playwright headless (capture + fill)
│   ├── schema_extractor.py   # hybrid: native widget metadata + Claude Vision → field_schema.json
│   ├── validator.py          # Pillow+numpy diff + Claude Vision findings
│   └── ocr.py                # pytesseract fallback for scanned PDFs
├── config/
│   └── agent.config.json     # all endpoints, paths, preferences — no secrets
├── docs/
│   └── superpowers/specs/
│       └── 2026-05-25-agent-form-filler-design.md
└── package.json
```

**Frontend stack:** Electron 33 · Vite 6 · React 19 · TypeScript 5 · Tailwind 4 · shadcn/ui · Zustand · xterm.js · node-pty  
**Backend stack:** Python 3.9 · FastAPI · PyMuPDF · ReportLab · python-docx · docx2pdf · openpyxl · Playwright · Pillow · numpy · pytesseract

---

## 5. Core Pipeline (6 Stages — Stage 2 is Conditional)

All stages are discrete, re-runnable Python FastAPI endpoints. **Stage 2 (Replicate) only runs when the uploaded form's editability prevents safe in-place filling** (locked / flattened / scanned). For fillable forms, the pipeline is effectively 5 stages: Ingest → Schema → Fill → Validate → Export.

### Stage 1 — Ingest & Analyze (`POST /ingest`)
- User uploads an empty source form via drop zone, `File → Open`, or drag-onto-viewer
- Engine detected by file extension: `.pdf` → pdf_engine, `.docx` → docx_engine, `.xlsx` → xlsx_engine, `.html` → html_engine
- Engine extracts every structural element with exact coordinates into `form_map.json`:
  - Field bounding boxes (x, y, w, h)
  - Font family, size, weight, color per element
  - Border line weights and colors
  - Background fills and images
  - Embedded logos and assets
- **Editability detection** also runs at this stage and sets `form_map.editability` to one of:
  | Flag | Detection signal (PDF) | Resulting path |
  |------|-------------------------|----------------|
  | `fillable` | `doc.permissions & PDF_PERM_FORM`, AcroForm widgets present, dry-run `widget.set_value()` succeeds | **Direct fill** of uploaded original |
  | `locked` | `doc.is_encrypted` or `permissions` blocks modify | **Replicate**, then fill replica |
  | `flattened` | No widgets present but text layer present (form was visually rendered with no interactive fields) | **Replicate**, then fill replica |
  | `scanned` | No selectable text layer at all | **Replicate** + OCR fallback to recover field positions |
  
  Equivalent signals for other formats: DOCX checks `<w:documentProtection>` and edit restrictions; XLSX checks `sheetProtection` / `workbookProtection`; HTML is virtually always `fillable` via Playwright.

- User can override via `config.fillStrategy` (`auto` | `direct` | `replicate`). Default `auto`.
- OCR fallback for `scanned`: `ocr.py` runs pytesseract to approximate field positions. A UI warning is shown (fidelity ~90%).
- Output: `form_map.json` — canonical form structure, source of truth for all subsequent stages, including the chosen `path: "direct" | "replicate"`.

### Stage 2 — Replicate (`POST /replicate`) — CONDITIONAL
Runs only when `form_map.path === "replicate"` (form is locked, flattened, or scanned). Builds a pixel-perfect blank replica from `form_map.json`:
- **PDF:** ReportLab canvas API reconstructs every element at exact coordinates. Sub-point positioning, exact RGB colors, embedded fonts, precise line weights.
- **DOCX:** python-docx rebuilds document structure from extracted styles and layout.
- **XLSX:** openpyxl rebuilds cell structure, column widths, styles.
- **HTML:** static HTML + CSS replica with matching dimensions and styling.

Output: `{filename}_replica.{ext}` — the canvas Stage 4 (Fill) will write into.

When `path === "direct"` this stage is skipped entirely. The uploaded original remains the canvas.

The UI surfaces the chosen path with a badge in the Sidebar: 🟢 *Filling original* or 🟡 *Filling replica (locked form detected)* so the user always knows which path is active. A manual override toggle is available next to the badge.

### Stage 3 — Schema Extraction (`POST /schema`)
Produces `field_schema.json` — the semantic contract describing what each field is and how to fill it. Uses a hybrid approach so authoritative metadata is trusted when present and LLM Vision fills the gaps.

**Native metadata extraction (first pass, authoritative):**
- **PDF AcroForm / XFA:** PyMuPDF reads widget annotations directly → field name, type (`text` | `checkbox` | `radio` | `signature` | `choice`), default value, options, required flag
- **DOCX content controls:** python-docx reads structured document tags and form fields → name, type, options
- **XLSX:** openpyxl reads named ranges, data validations (dropdowns, checkboxes via boolean cells), and defined input regions
- **HTML:** DOM parsed directly → `<input type="...">`, `<select>`, `<textarea>` give exact types and constraints

**LLM Vision pass (second pass, semantic):**
- Form pages rendered as 300 DPI PNGs sent to Claude Opus 4.6 Vision
- Vision pass identifies fields not declared in native metadata (visual-only fields like printed signature lines, hand-drawn boxes, instruction-driven check marks)
- Reads visible form instructions and attaches them to fields: *"Tick if you agree"*, *"Cross out if not applicable"*, *"Select one"*
- Determines `checkStyle` (`tick` ✓ | `cross` ✗ | `filled` ● | `check` ☑) based on context and surrounding instructions
- Groups radio button sets and identifies their shared label
- Returns a JSON delta merged with the native pass

**Output: `field_schema.json`**
```json
{
  "fields": [
    {
      "id": "f1",
      "type": "text",
      "label": "Full Name",
      "instructions": "Enter legal name as it appears on your NDIS plan",
      "required": true,
      "maxLength": 100,
      "location": { "page": 1, "x": 120, "y": 340, "w": 200, "h": 24 }
    },
    {
      "id": "f2",
      "type": "checkbox",
      "label": "I agree to the terms",
      "instructions": "Tick if you agree",
      "checkStyle": "tick",
      "required": true,
      "location": { "page": 1, "x": 120, "y": 380, "w": 16, "h": 16 }
    },
    {
      "id": "f3",
      "type": "radio",
      "label": "Plan duration",
      "options": ["6 months", "12 months", "24 months"],
      "instructions": "Select one",
      "required": true,
      "location": { "page": 2, "x": 80, "y": 200, "w": 300, "h": 80 }
    },
    {
      "id": "f4",
      "type": "signature",
      "label": "Participant Signature",
      "instructions": "Sign in blue or black ink",
      "required": true,
      "location": { "page": 3, "x": 100, "y": 600, "w": 250, "h": 60 }
    }
  ]
}
```

The schema is cached alongside `form_map.json` in the template library — re-uploading the same form skips this stage entirely.

### Stage 4 — Fill (`POST /fill`)
Content from one or more sources is merged into `field_values.json`, then written into the canvas chosen in Stage 1 (uploaded original if `path === "direct"`, replica if `path === "replicate"`) at the coordinates from `form_map.json` using the field types and instructions from `field_schema.json`.

| Source | Mechanism |
|--------|-----------|
| Manual terminal | `fill --field name="John Smith"` |
| Manual UI | Fields panel inputs (one per detected field) |
| Prompt template | LLM receives template + context → returns structured `field_values.json` |
| RAG query | `fill --from-rag "query"` (workspace defaults to `ndis`) → lightrag CLI → LLM extracts fields |
| iMessage | AppleScript reads thread → LLM extracts structured fields |
| CSV/JSON | `fill --from-csv clients.csv` → field mapping via config |
| Folder watch | New files in watched folder trigger auto-fill prompt |

**Type-aware filling:**
- **Text:** insert at field coordinates using the form's existing font/size/color from `form_map.json`; auto-shrink font if content exceeds `maxLength` or bounding box width
- **Checkbox:** insert the correct glyph (`✓` / `✗` / `●` / `☑`) per `checkStyle` — using widget value setting (direct path) or canvas overlay (replicate path)
- **Radio:** mark exactly one option from the group
- **Signature:** embed a configured signature image (`config.signatureImage`) or rendered text in the form's signature font

**Ambiguity resolution:** Before committing the fill, the engine inspects every checkbox/radio. If the LLM's source-derived decision is unclear (`confidence < 0.7` or "ask" return value), a modal is surfaced in the UI:

```
┌─ Ambiguity ──────────────────────────────────────────────┐
│  Field:        "I agree to terms"                        │
│  Instructions: "Tick if you agree"                       │
│  Source said:  "client mentioned reviewing terms but no  │
│                explicit consent statement"               │
│                                                          │
│  [Tick ✓]  [Cross ✗]  [Leave blank]  [Skip]              │
└──────────────────────────────────────────────────────────┘
```

User choice is logged to `~/.agent-form-filler/templates/<form_hash>/ambiguity_log.json` keyed by field id, so identical situations on the same form template auto-resolve next time (configurable per-template).

Output: `{filename}_filled_v{n}.{ext}` (versioned snapshot)

### Stage 5 — Validate (`POST /validate`)
1. **Render:** Original and filled documents rendered as 300 DPI PNGs page-by-page. DOCX rendered via `docx2pdf` (uses installed Microsoft Word on macOS via subprocess), then PyMuPDF renders the resulting PDF to PNG.
2. **Pixel diff:** Pillow + numpy compare original vs filled PNGs pixel-by-pixel → diff image with changed regions highlighted in red, unchanged regions dimmed
3. **AI Vision:** Claude Opus 4.6 Vision receives original PNG + filled PNG + diff PNG with a structured prompt checking for:
   - Text overflow (characters outside bounding box)
   - Font mismatches (family, size, weight)
   - Color discrepancies (fill, border, text)
   - Misaligned elements (>2px from original position)
   - Missing elements (present in original, absent in filled)
   - Overlapping content
4. **Findings:** Returns structured `findings.json`:
   ```json
   [{
     "id": "f1",
     "type": "text_overflow",
     "severity": "high",
     "page": 1,
     "location": { "x": 120, "y": 340, "w": 200, "h": 24 },
     "description": "Name field text extends 18px beyond right border",
     "fixPrompt": "Reduce font size on field 'name' from 12pt to 10pt"
   }]
   ```
5. **Validation Panel:** Each finding shown as a card with View / Auto-fix prompt (editable) / Approve / Skip actions
6. **Fix loop:** Approved fixes re-enter Stage 4 (Fill) → automatic re-validate. Cycle counter shown (`Iteration 2/5`). Hard stop at `validation.autoFixMaxIterations` (default: 5).

### Stage 6 — Export (`POST /export`)
User picks format at export time. Converts validated filled document:
- `pdf` → ReportLab output or PyMuPDF flatten
- `docx` → python-docx write
- `xlsx` → openpyxl write
- `html` → static file with embedded styles

---

## 6. GUI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Open Form] [Replicate] [Fill] [Validate] [Export]    [Config] [Theme] │
├───────────┬──────────────────────────────┬──────────────────────────────┤
│           │  ORIGINAL    │   FILLED       │  PROMPT PANEL               │
│ SIDEBAR   │              │               │  ┌─────────────────────────┐ │
│           │  [uploaded   │  [filled doc  │  │ Templates               │ │
│ ▼ Recents │   original   │   preview]    │  │ > NDIS Service Agmt     │ │
│ ▼ Library │   preview]   │               │  │ > Batch from CSV        │ │
│ ▼ Config  │              │               │  │ > Pull from iMessage    │ │
│           │     ← scroll sync →          │  └─────────────────────────┘ │
│  [+Upload]│              │               │  [editable prompt field]     │
│           │              │               │  [Run Prompt]                │
├───────────┴──────────────────────────────┤                              │
│  SHELL TERMINAL (xterm.js + node-pty)    │                              │
│  $ fill --from-rag "John plan" --workspace ndis                         │
│  $ validate --visual                                                     │
│  $ export --format pdf                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  VALIDATION PANEL (drawer, appears after validate)                       │
│  ⚠ Text overflow — field 3   [View] [fix prompt ▼] [Approve] [Skip]    │
│  ⚠ Font mismatch — header    [View] [fix prompt ▼] [Approve] [Skip]    │
│  ✓ No color mismatches                           Iteration: 1/5         │
└──────────────────────────────────────────────────────────────────────────┘
```

**UX rules:**
- Dual pane scrolls in sync — original and filled always show the same page
- "View" on a finding jumps both panes to the exact page/location and overlays the diff highlight
- Auto-fix prompt is always editable before approving
- Shell terminal pane is vertically resizable
- Prompt templates stored as `.prompt.md` files in `~/.agent-form-filler/templates/` — editable outside the app

---

## 7. Shell Commands

```bash
# Filling
fill --field "name=John Smith" --field "dob=01/01/1990"
fill --from-csv ~/Desktop/clients.csv
fill --from-rag "John Smith NDIS plan" --workspace ndis
fill --from-imessage --contact "Sarah Fry" --last 10

# Validation
validate --visual          # full pixel diff + AI vision
validate --structural      # field presence check only (faster)

# Export
export --format pdf --out ~/Desktop/
export --format docx

# Prompts
prompt list
prompt run "NDIS Service Agreement"
prompt add --name "My Template" --file ~/Desktop/my.prompt.md

# Config (live, no restart needed)
config set llm.fill claude
config set llm.validate claude
config set claude_runtime.default_runtime freecode
config set llm.adapters.claude.model claude-haiku-4-5-20251001
config set fillStrategy auto         # auto | direct | replicate
config set rag.defaultWorkspace ndis
config get llm

# Batch
fill --batch ~/Desktop/clients.csv --template "NDIS Service Agreement"
```

---

## 8. LLM Adapter Layer

### Interface (TypeScript)
```typescript
interface LLMAdapter {
  name: string;
  complete(prompt: string, images?: string[]): Promise<string>;
  stream(prompt: string): AsyncGenerator<string>;
}
```

### Built-in Adapters
| Adapter | Auth | Notes |
|---------|------|-------|
| `ClaudeAdapter` | OAuth token (`~/.claude/`) or `ANTHROPIC_API_KEY` | Default. Used for fill + validation Vision calls. |
| `OpenAIAdapter` | `OPENAI_API_KEY` | |
| `OllamaAdapter` | None | Local models via `http://localhost:11434` |
| `CustomHTTPAdapter` | Configurable env var | Any OpenAI-compatible endpoint |

---

## 9. Claude Runtime Integration

The embedded terminal can run Claude Code CLI or FreeCode directly. `--dangerously-skip-permissions` is injected automatically on every Claude Code invocation.

### Auto-Detection Order (runs at startup)
```
1. which claude                          → system PATH
2. /opt/homebrew/bin/claude              → Homebrew (M4 default)
3. ~/.local/bin/claude
4. $(npm root -g)/.bin/claude            → npm global
5. ~/Desktop/Github/free-code-main       → FreeCode fallback
6. prompt user in Settings              → manual fallback
```

### Settings UI
- Auth mode toggle: OAuth / API Key
- Detected path shown with status indicator
- Manual override field
- FreeCode path field (pre-filled from detection or config)
- "Re-detect" button

---

## 10. Configuration (`agent.config.json`)

All secrets come from environment variables. The config file contains no secrets and is safe to commit.

```json
{
  "llm": {
    "fill": "claude",
    "validate": "claude",
    "adapters": {
      "claude":  { "model": "claude-opus-4-6", "apiKeyEnv": "ANTHROPIC_API_KEY" },
      "openai":  { "model": "gpt-4o",           "apiKeyEnv": "OPENAI_API_KEY" },
      "ollama":  { "endpoint": "http://localhost:11434", "model": "llama3.2" },
      "custom":  { "endpoint": "", "model": "", "apiKeyEnv": "" }
    }
  },
  "claude_runtime": {
    "auth": "oauth",
    "oauth_token_path": "~/.claude/",
    "default_runtime": "claude_code",
    "auto_detect": true,
    "runtimes": {
      "claude_code": {
        "path": "",
        "args": ["--dangerously-skip-permissions"]
      },
      "freecode": {
        "path": "~/Desktop/Github/free-code-main",
        "args": []
      }
    }
  },
  "rag": {
    "cli": "/Users/sharan/.local/bin/lightrag",
    "defaultWorkspace": "ndis",
    "workspaces": {
      "technical": "https://rag.profexer.cloud",
      "ndis":      "https://ndis.profexer.cloud",
      "ctf":       "https://ctf.profexer.cloud"
    }
  },
  "fillStrategy": "auto",
  "signatureImage": "",
  "sources": {
    "iMessage": { "enabled": true, "contactFilter": [] },
    "folders":  [],
    "gmail":    { "enabled": false }
  },
  "output": {
    "defaultFolder": "~/Desktop/",
    "formats": ["pdf", "docx", "xlsx", "html"]
  },
  "validation": {
    "dpi": 300,
    "fidelityThreshold": 0.95,
    "autoFixMaxIterations": 5
  }
}
```

---

## 11. Additional Features

### Template Library
Every successfully validated form is saved as a reusable template under `~/.agent-form-filler/templates/<form_hash>/`:
- `form_map.json` (visual structure + editability flag + chosen path)
- `replica.{ext}` (only present when path === "replicate")
- `field_schema.json` (semantic field contract)
- `ambiguity_log.json` (prior user decisions on ambiguous checkboxes/radios)
- Associated `.prompt.md` files

Re-opening the same form (matched by SHA-256 content hash) skips Stages 1, 2, and 3 entirely — the flow resumes directly at Fill with all caches loaded.

### Version Snapshots
Each Fill + Validate cycle writes a numbered snapshot (`filled_v1`, `filled_v2`, …). Sidebar shows history. Roll back by clicking any snapshot — no re-running the pipeline.

### OCR Fallback
Silent fallback only. Triggers if PyMuPDF detects no text layer in an uploaded PDF. Runs pytesseract, approximates field positions. UI shows a warning: "Scanned document detected — fidelity ~90%, pixel-perfect mode unavailable."

### Batch Mode
`fill --batch clients.csv --template "NDIS Service Agreement"` fills one document per CSV row, validates each, exports all to the output folder. Progress tracked in a batch panel in the Sidebar.

---

## 12. Data Flow Summary

```
Upload empty form
      ↓
POST /ingest → form_map.json                            (visual structure + editability flag)
      ↓
   ┌─ form_map.path ─┐
   │  direct         → skip replicate, canvas = uploaded original
   │  replicate      → POST /replicate → {filename}_replica.{ext}, canvas = replica
   └──────────────────┘
      ↓
POST /schema → field_schema.json                        (hybrid: native widgets + Claude Vision)
      ↓
Source pull (manual / prompt / RAG[default: ndis] / iMessage / CSV / folder)
      ↓
POST /fill                                              (type-aware fill into canvas)
      ├─ checkbox/radio ambiguous? → modal asks user (decision logged per template)
      ↓
{filename}_filled_v{n}.{ext}
      ↓
POST /validate → findings.json                          (pixel diff + Claude Vision)
      ↓
[findings empty?] → YES → POST /export → done
      ↓ NO
Validation Panel → user approves fix prompts
      ↓
Back to POST /fill (iteration n+1, max 5)
```

**Template library shortcut:** Re-uploading a previously processed form skips `/ingest`, `/replicate`, and `/schema` entirely — cached `form_map.json`, `replica.{ext}` (if applicable), `field_schema.json`, and `ambiguity_log.json` are loaded directly, flow resumes at Fill.
