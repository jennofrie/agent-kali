# agent-form-filler — Design Spec
**Date:** 2026-05-25  
**Status:** Approved  
**Location:** `~/Desktop/Github/agent-form-filler/`

---

## 1. Purpose

A macOS desktop application that accepts any uploaded PDF, Word, Excel, or HTML form, produces a pixel-perfect (95–99% fidelity) empty replica, semantically understands each field (type, label, instructions, check style) via a hybrid native-metadata + LLM Vision extractor, then fills it with content sourced from manual input, LLM prompts, RAG queries, iMessage, CSV, or any configured external source. An AI-powered visual validation loop identifies rendering defects and generates fix prompts for user-approved iterative refinement. All LLM, RAG, and source integrations are fully configurable — nothing is hardcoded.

---

## 2. Constraints & Decisions

| Constraint | Decision |
|------------|----------|
| Platform | macOS only (Apple Silicon M4) |
| Document input | User always uploads a clean empty source form — no scraping, no generation from scratch |
| Fidelity target | Pixel-perfect: visually identical when printed side-by-side |
| Document types | PDF, DOCX, XLSX, HTML (equal priority) |
| Content sources | Manual, LLM prompt, RAG, iMessage, CSV/JSON, folder watch |
| Validation loop | Semi-automatic — findings shown, fix prompts generated, user approves each batch |
| Export format | User-chosen at export time (PDF, DOCX, XLSX, HTML) |
| Terminal | Dual: real PTY shell (xterm.js + node-pty) + prompt template panel side-by-side |
| LLM auth | OAuth token by default (reads `~/.claude/`), API key fallback |
| Default LLM | `claude-opus-4-6` for both fill and validation |
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

## 5. Core Pipeline (6 Stages)

All stages are discrete, re-runnable Python FastAPI endpoints.

### Stage 1 — Ingest & Analyze (`POST /ingest`)
- User uploads a clean empty source form via drop zone, `File → Open`, or drag-onto-viewer
- Engine detected by file extension: `.pdf` → pdf_engine, `.docx` → docx_engine, `.xlsx` → xlsx_engine, `.html` → html_engine
- Engine extracts every structural element with exact coordinates into `form_map.json`:
  - Field bounding boxes (x, y, w, h)
  - Font family, size, weight, color per element
  - Border line weights and colors
  - Background fills and images
  - Embedded logos and assets
- OCR fallback: if PyMuPDF finds no selectable text layer, `ocr.py` runs pytesseract to approximate field positions. A warning is shown in the UI (fidelity ~90%).
- Output: `form_map.json` — canonical form structure, source of truth for all subsequent stages

### Stage 2 — Replicate (`POST /replicate`)
- Builds a pixel-perfect blank replica from `form_map.json`:
  - **PDF:** ReportLab canvas API reconstructs every element at exact coordinates. Sub-point positioning, exact RGB colors, embedded fonts, precise line weights.
  - **DOCX:** python-docx rebuilds document structure from extracted styles and layout
  - **XLSX:** openpyxl rebuilds cell structure, column widths, styles
  - **HTML:** static HTML + CSS replica with matching dimensions and styling
- Output: `{filename}_replica.{ext}` — the empty form ready to be filled
- The uploaded original becomes the permanent left-pane reference. The replica is what gets filled.

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
Content from one or more sources is merged into `field_values.json`, then written into the replica at the coordinates specified in `form_map.json` using the field types and instructions from `field_schema.json`.

| Source | Mechanism |
|--------|-----------|
| Manual terminal | `fill --field name="John Smith"` |
| Prompt template | LLM receives template + context → returns structured `field_values.json` |
| RAG query | `fill --from-rag "query" --workspace ndis` → lightrag CLI → LLM extracts fields |
| iMessage | AppleScript reads thread → LLM extracts structured fields |
| CSV/JSON | `fill --from-csv clients.csv` → field mapping via config |
| Folder watch | New files in watched folder trigger auto-fill prompt |

Filling is type-aware: checkboxes get the right glyph (`✓` / `✗` / `●` / `☑`) per `checkStyle`, radios mark exactly one option, signatures embed a configured signature image or rendered text, text fields auto-shrink font if content exceeds `maxLength` or bounding box width.

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
    "workspaces": {
      "technical": "https://rag.profexer.cloud",
      "ndis":      "https://ndis.profexer.cloud",
      "ctf":       "https://ctf.profexer.cloud"
    }
  },
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
Every successfully validated form is saved as a reusable template: `form_map.json` + `replica.{ext}` + associated prompt templates. Stored in `~/.agent-form-filler/templates/`. Re-opening the same form type skips Stage 1 (Ingest) entirely — instant replication.

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
POST /ingest → form_map.json                         (visual structure)
      ↓
POST /replicate → {filename}_replica.{ext}           (pixel-perfect blank)
      ↓
POST /schema → field_schema.json                     (hybrid: native widgets + LLM Vision)
      ↓
Fill content (manual / prompt / RAG / iMessage / CSV)
      ↓
POST /fill → {filename}_filled_v{n}.{ext}            (type-aware fill using schema)
      ↓
POST /validate → findings.json                       (pixel diff + Claude Vision)
      ↓
[findings empty?] → YES → POST /export → done
      ↓ NO
Validation Panel → user approves fix prompts
      ↓
Back to POST /fill (iteration n+1, max 5)
```

**Template library shortcut:** Re-uploading a previously processed form skips `/ingest`, `/replicate`, and `/schema` entirely — cached `form_map.json`, `replica.{ext}`, and `field_schema.json` are loaded directly, flow resumes at Fill.
