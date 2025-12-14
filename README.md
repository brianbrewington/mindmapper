# Mind Mapper

A modern, web-based mind mapping application built with Vanilla JavaScript and Vite.

![Mind Mapper Screenshot](placeholder_screenshot.png)

## Features

- **Visual Mind Maps**: Create bubbles, text annotations, and images (drag & drop supported).
- **Interactive Connections**: Connect bubbles by middle-clicking or Shift-clicking.
- **Scene Management**: Create sequences of views ("Scenes") for presentations, with custom delays and transitions.
- **Persistence**: automatically saves to local storage. Import/Export to JSON.
- **Quine Mode**: "Bundle" the entire application and your map into a single self-contained HTML file that can be shared and opened offline.
- **GEXF Export**: Export your graph structure for analysis in tools like Gephi.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/brianbrewington/mindmapper.git
   ```
2. Install dependencies:
   ```bash
   cd mindmapper
   npm install
   ```

### Usage

Start the development server:

```bash
npm run dev
```

Open your browser to the URL shown (usually `http://localhost:5173`).

### Controls

| Action | Control |
|--------|---------|
| **Pan** | Left-click drag on canvas |
| **Zoom** | Mouse Scroll |
| **Add Bubble** | Double-click canvas or press `B` |
| **Connect** | Middle-click drag between bubbles (or Shift-click) |
| **Context Menu** | Right-click on element |
| **Delete** | Select + `Delete`/`Backspace` |
| **Undo/Redo** | `Ctrl+Z` / `Ctrl+Y` |

## Project Structure

- `src/model`: Core logic and state management.
- `src/view`: Canvas rendering and UI components.
- `src/controller`: Input handling (mouse/keyboard).
- `src/io`: Persistence and file handling.

## License

ISC
