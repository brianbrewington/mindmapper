# MindMapper

A modern, web-based mind mapping application built with Vanilla JavaScript and Vite. Create visual diagrams, present ideas with animated walkthroughs, and share self-contained HTML bundles.

![Mind Mapper Screenshot](screenshot.png)

## ✨ Features

### Core
- **Visual Mind Maps** — Bubbles, text annotations, and images (drag & drop)
- **Interactive Connections** — Connect nodes via middle-click or Shift+click
- **Infinite Canvas** — Pan and zoom with mouse

### Presentations
- **Scene Management** — Save viewport snapshots as "scenes"
- **Animated Walkthroughs** — Play scenes with smooth camera transitions
- **Custom Timing** — Set delay per scene for pacing

### Persistence
- **Local/Cloud Save** — JSON files locally or to Google Drive
- **Quine Bundling** — Export app + data as a single self-contained HTML file
- **GEXF Export** — Graph format for analysis in Gephi

### Polish
- **Dark Mode** — Default dark theme with toggle
- **Keyboard Shortcuts** — Full keyboard navigation
- **Loading States** — Visual feedback for async operations

## 🚀 Quick Start

```bash
# Install
git clone https://github.com/brianbrewington/mindmapper.git
cd mindmapper
npm install

# Run
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

## 🧪 Testing

```bash
npm test             # Watch mode
npm run test:run     # Single run (CI)
npm run test:ui      # Browser-based test dashboard
```

**105 tests** across 35 test files. Pre-commit hook runs full suite + build.

## 🎮 Controls

| Action | Control |
|--------|---------|
| Pan | Left-click drag |
| Zoom | Mouse scroll |
| Add Bubble | Double-click or `B` |
| Connect | Shift+click / Middle-click |
| Context Menu | Right-click |
| Delete | Select + `Delete` |
| Undo/Redo | `Ctrl+Z` / `Ctrl+Y` |
| Resize | `+` / `-` |
| Toggle Theme | 🌗 button |

## 📁 Project Structure

```
mindmapper/
├── src/
│   ├── model/          # Data model (MindMapModel)
│   ├── view/           # Rendering (CanvasRenderer, UIManager)
│   ├── controller/     # Input handling (InputHandler)
│   └── io/             # Persistence (PersistenceManager, DriveClient)
├── docs/               # Documentation
│   ├── ideas/          # Brainstorming
│   ├── requirements/   # PRDs
│   ├── design/         # Architecture
│   └── bugs.md         # Known issues
└── scripts/            # Build & test scripts
```

## 📖 Documentation

See [`docs/README.md`](docs/README.md) for full documentation index:

- [Code Critique](docs/design/code_critique.md) — Quality analysis
- [Known Bugs](docs/bugs.md) — Issue tracking
- [JSON Format](docs/ideas/interoperability_format.md) — Schema for external tools

## 🛠 Development

### TDD Workflow

1. **Red** — Write a failing test first
2. **Green** — Minimal code to pass
3. **Refactor** — Clean up, tests stay green

### Pre-commit Hook

Husky runs `scripts/pre-commit.sh` before every commit:
- Full test suite must pass
- Production build must succeed

```bash
# Manual verification
./scripts/pre-commit.sh
```

## 📄 License

ISC
