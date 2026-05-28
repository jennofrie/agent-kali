# Contributing to Agent Kali

Thank you for your interest in contributing to Agent Kali. This document provides guidelines and instructions for contributing to the project.

Agent Kali is maintained by **JD Space Digital Systems**.

## Code of Conduct

All contributors are expected to conduct themselves professionally. Be respectful, constructive, and collaborative in all interactions.

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **macOS** (Electron desktop target)
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

2. Make your changes following the project conventions (see below).

3. Test your changes locally by running the full application.

4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "feat: add participant export to CSV"
   ```

5. Push to your fork and open a Pull Request against `main`.

### Pull Request Guidelines

- Keep PRs focused on a single change or feature.
- Provide a clear description of what the PR does and why.
- Reference any related issues using `Fixes #123` or `Relates to #456`.
- Ensure the application builds and runs without errors.
- Include screenshots for any UI changes.

## Project Conventions

### Frontend (React + TypeScript)

- Components are `.tsx` files, one component per file, using named exports.
- All styling uses CSS custom properties defined in `src/index.css`. Do not use inline styles except for dynamic CSS custom property values.
- Do not import React explicitly; the JSX transform handles it.
- State management uses Zustand (`src/store/index.ts`).

### Backend (Python FastAPI)

- Sidecar endpoints are defined in the `python/` directory.
- Do not change existing API signatures without updating the corresponding TypeScript types in the frontend.
- All PDF processing uses PyMuPDF and ReportLab.

### Styling

- The design system uses a dark purple theme (Papaya). Refer to `DESIGN.md` for color tokens and component patterns.
- Use the existing CSS custom properties. Do not introduce new color literals.
- Follow the established component patterns for cards, buttons, modals, and navigation.

### Commit Messages

Follow conventional commit format:

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring without behavior change
- `docs:` — documentation updates
- `style:` — formatting, whitespace, CSS-only changes
- `test:` — adding or updating tests
- `chore:` — build, tooling, dependency updates

## Architecture Notes

- The Electron main process spawns a Python FastAPI sidecar on a dynamic port. The React renderer communicates via IPC bridge to the main process, which proxies HTTP requests to the sidecar.
- Participant data is sourced from the filesystem (`~/Desktop/Support-Coordination/`), not a database.
- RAG integration connects to a self-hosted LightRAG instance over Tailscale VPN.

## Questions

If you have questions about contributing, open a GitHub Discussion or reach out to the maintainers at JD Space Digital Systems.

## License

By contributing to Agent Kali, you agree that your contributions will be licensed under the same license as the project.
