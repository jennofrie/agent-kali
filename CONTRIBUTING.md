# Contributing to Agent Kali

Agent Kali is maintained by **JD Space Digital Systems**.

## Code of Conduct

All contributors are expected to conduct themselves professionally. Be respectful, constructive, and collaborative.

## Getting Started

### Prerequisites

- **macOS** 12+ (Electron desktop target)
- **Node.js** 18+ and npm
- **Python** 3.10+
- **Git**

### Setting Up the Development Environment

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-fork>/agent-kali.git
   cd agent-kali
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Set up the Python sidecar:
   ```bash
   cd python
   python3 -m venv .venv
   ./.venv/bin/pip install -r requirements.txt
   cd ..
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   This starts Electron, Vite, and the Python sidecar together.

## Project Structure

```
agent-kali/
├── electron/              # Main process (window, IPC, sidecar)
│   ├── main.ts
│   ├── preload.ts
│   ├── sidecar.ts
│   └── ipc/               # Handler modules
│       ├── fileHandlers.ts
│       ├── participantHandlers.ts
│       ├── ragHandlers.ts
│       └── sidecarProxy.ts
├── src/                   # React renderer
│   ├── App.tsx            # Root shell
│   ├── index.css          # Design system (1392 lines)
│   ├── components/        # 20 TSX components
│   ├── store/             # Zustand state
│   └── lib/               # Utilities, IPC clients, RAG wrapper
├── python/                # FastAPI sidecar
│   ├── server.py          # API endpoints
│   ├── engines/           # PDF engine (PyMuPDF + ReportLab)
│   ├── llm/               # LLM adapter + field extraction
│   ├── sources/           # Folder source reader
│   └── tests/             # pytest suite
├── config/                # Runtime config (no secrets)
└── public/                # Static assets, logos
```

## How to Contribute

### Reporting Issues

- Search existing issues before creating a new one.
- Include steps to reproduce, expected behavior, and actual behavior.
- Attach screenshots or logs where applicable.
- Specify your macOS version and Node/Python versions.

### Submitting Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the conventions below.

3. Run the test suites:
   ```bash
   npm test              # Vitest unit tests
   npm run test:e2e      # Playwright E2E tests
   npm run test:py       # pytest for sidecar
   ```

4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "feat: add participant export to CSV"
   ```

5. Push to your fork and open a Pull Request against `main`.

### Pull Request Guidelines

- Keep PRs focused on a single change or feature.
- Provide a clear description of what the PR does and why.
- Reference related issues with `Fixes #123` or `Relates to #456`.
- Ensure the application builds and runs without errors.
- Include screenshots for UI changes.

## Conventions

### Frontend (React + TypeScript)

- Components are `.tsx` files, one component per file, named exports.
- Do not import React explicitly; the JSX transform handles it.
- State management uses Zustand (`src/store/index.ts`).
- No inline styles except for dynamic CSS custom property values (e.g., `style={{ '--pct': value }}`).

### Styling (Papaya Design System)

- All styles live in `src/index.css` using CSS custom properties.
- Refer to `DESIGN.md` for the full token reference.
- Use existing tokens. Do not introduce new color literals.
- Follow established component patterns for cards, buttons, modals, and navigation.

### Backend (Python FastAPI)

- Sidecar endpoints are in the `python/` directory.
- Do not change existing API signatures without updating TypeScript types in `src/lib/ipc/`.
- All PDF processing uses PyMuPDF and ReportLab.

### Commit Messages

Follow conventional commit format:

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring without behavior change
- `docs:` — documentation updates
- `style:` — formatting, whitespace, CSS-only changes
- `test:` — adding or updating tests
- `chore:` — build, tooling, dependency updates

### Branding

- The app is called "Agent Kali" in all contexts.
- Do not add third-party AI company branding or attribution in the UI, documentation, or code comments.

## Architecture Notes

- The Electron main process spawns a Python FastAPI sidecar on a dynamic port. The React renderer communicates via IPC bridge to the main process, which proxies HTTP requests to the sidecar.
- Participant data is sourced from the filesystem (`~/Desktop/Support-Coordination/`), not a database.
- Provider data is read from markdown files in `~/Desktop/Jin-Obsidian/`.
- RAG integration connects to a self-hosted LightRAG instance over Tailscale VPN.
- The LLM adapter loads OAuth tokens from the macOS Keychain. Empty environment variables must be cleared before SDK initialization.

## Questions

Open a GitHub Discussion or reach out to the maintainers at JD Space Digital Systems.

## License

By contributing to Agent Kali, you agree that your contributions will be licensed under the same license as the project (MIT).
