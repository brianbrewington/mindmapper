# MindMapper Software Documentation

## 1. Overview
MindMapper is a web-based mind mapping application built with Vanilla JavaScript and Vite. It allows users to create visual diagrams consisting of bubbles, text, and images, connected by directional lines. The application features a unique "scene" system for creating presentations and a "bundle" feature that allows the map to be saved as a self-contained HTML file.

## 2. Architecture
The application follows a Model-View-Controller (MVC) pattern:
- **Model (`src/model/MindMapModel.js`)**: Manages the state of elements, connections, scenes, and history. It is pure logic and has no DOM dependencies.
- **View (`src/view/CanvasRenderer.js`, `UIManager.js`)**: Handles rendering to the HTML5 Canvas and managing DOM overlays (tooltips, panels).
- **Controller (`src/controller/InputHandler.js`)**: Processes user input (mouse, keyboard) and translates it into actions on the Model or View.
- **IO (`src/io/PersistenceManager.js`)**: Handles file import/export and the bundling process.

## 3. Features

### 3.1 Mind Map Elements
The application supports three types of elements:
- **Bubbles**: Elliptical shapes containing text. Created by double-clicking or pressing `B`.
- **Text**: Standalone text labels.
- **Images**: Images dropped onto the canvas.

**Properties:**
- **Text Editing**: Double-click a bubble or text to edit its content.
- **Resizing**:
    - Bubbles/Text: Font size can be increased/decreased via context menu or default shortcuts `+`/`-`.
    - Images: Can be resized via context menu.
- **Movement**: Drag and drop to reposition elements.
- **Deletion**: Select and press `Delete`/`Backspace` or use context menu.

### 3.2 Connections
Elements (specifically Bubbles) can be connected to represent relationships.
- **Creation**:
    - Middle-click drag between bubbles.
    - Shift-click a bubble to start, then click another to finish.
- **Properties**:
    - **Weight**: Thickness of the connecting line. Can be adjusted.
    - **Directionality**: Connections are directed (From -> To).
    - **Deletion**: Select connection and press `Delete` or use context menu.

### 3.3 Interactive Features
- **Context Menu**: Right-click on any element, connection, or the background to access specific actions (Edit, Delete, Grow, Shrink, Link, Comment).
- **Tooltips**: Hovering over elements/connections with comments displays the comment in a tooltip.
- **Hyperlinks**: Elements and connections can have URLs attached (`Alt + Click` to open).
- **Comments**: Text notes can be attached to elements/connections via the context menu.

### 3.4 Scene Management
The application allows saving specific viewports as "Scenes" to create a narrative or presentation.
- **Creation**: "Add Scene" button captures the current camera position and zoom.
- **Playback**:
    - **Play**: Cycles through scenes automatically.
    - **Step**: Manually advance to the next scene.
    - **Looping**: Playback loops when it reaches the end.
- **Customization**:
    - **Delay**: Set the duration (in seconds) for each scene during playback.
    - **Rename**: Custom names for scenes.
    - **Reorder**: Drag and drop scenes in the list to change sequence.

### 3.5 Persistence & Export
- **Local Storage**: Auto-saves state to browser history stack (Undo/Redo).
- **JSON Export/Import**: Full state (elements, connections, scenes) can be saved to `.json`.
- **GEXF Export**: Exports the graph structure to GEXF format for analysis in tools like Gephi.
- **Quine Bundling**:
    - The entire application logic and specific map data are bundled into a single `.html` file.
    - This file is offline-capable and contains the map data embedded within it.
    - When opened, it bootstraps itself and loads the embedded data.

## 4. Controls Reference

| Context | Input | Action |
|---------|-------|--------|
| **Canvas** | Left Drag | Pan Camera |
| | Wheel | Zoom In/Out |
| | Double Click | Create Bubble |
| | Right Click | Context Menu |
| **Element** | Left Click | Select |
| | Left Drag | Move Element |
| | Double Click | Edit Text |
| | Shift + Click | Start Connection |
| | Alt + Click | Open URL |
| **Grid/Global** | `Ctrl + Z` | Undo |
| | `Ctrl + Y` | Redo |
| | `Ctrl + C/V` | Copy/Paste |
| | `+` / `-` | Resize Selected |
| | `Delete` | Remove Selected |
