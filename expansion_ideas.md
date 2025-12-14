# Expansion Ideas & Implementation Plans

## 1. Google Drive Integration
Allow users to open and save mind maps directly to their Google Drive.

### Goal
Replace or augment the local file system storage with cloud storage, enabling access from any device.

### Implementation Plan
#### Dependencies
- Google API Client Library (`gapi`)
- Google Identity Services (`gis`)

#### 1. Authentication Setup
- Create a `GoogleAuthManager` class.
- Implement OAuth 2.0 Implicit Grant flow (client-side only).
- Scopes: `https://www.googleapis.com/auth/drive.file` (only access files created by the app).
- **User Review**: User must provide/host their own Client ID, or we host a proxy. For a pure static app, User providing Client ID in settings is the most flexible "developer" approach, but a hosted turnkey solution is better for end users. *Decision*: Implement a "Settings" panel where user enters Client ID/API Key for now.

#### 2. File Picker (Open)
- Integrate `Google Picker API`.
- Filter for `.json` and `.gexf` files (or custom MIME type).
- On selection, download file content via Drive API (`GET /files/fileId?alt=media`).
- Load into `MindMapModel`.

#### 3. Save / Save As
- **Save**: Update existing file content (`PATCH /files/fileId`).
- **Save As**: Create new file (`POST /files`).
- Store `googleFileId` in the Model metadata to track syncing.

#### 4. UI Changes
- Add "Connect Drive" button in a new "Cloud" menu/panel.
- Replace/Augment "Load" and "Save" buttons with "Open from Drive" / "Save to Drive" options when connected.

---

## 2. Theming Engine
Abstract hardcoded colors and fonts into a configurable theme system.

### Goal
Allow users to switch between "Light", "Dark", and "High Contrast" modes, and customize fonts.

### Implementation Plan
#### 1. Theme Model
- Create `ThemeManager` class.
- Define `Theme` schema:
  - `background`: Canvas background color.
  - `nodeFill`: Default bubble color.
  - `nodeStroke`: Bubble border color.
  - `text`: Main text color.
  - `connection`: Line color.
  - `fontFamily`: Global font preference.

#### 2. Renderer Update
- Refactor `CanvasRenderer` to replace string literals (`#ffffff`, `Poppins`) with `theme.property`.
- Inject `ThemeManager` into `CanvasRenderer`.

#### 3. UI Integration
- Add "Appearance" section to controls.
- Dropdown for presets.
- Color pickers for overrides.

---

## 3. Real-time Collaboration (Expansion)
Enable multiple users to edit the same map simultaneously.

### Goal
Transform the single-player app into a collaborative whiteboard.

### Implementation Plan
#### 1. Backend Service
- Needs a signaling server (WebSocket / WebRTC).
- Use a peer-to-peer approach (PeerJS) to keep it serverless/static.

#### 2. CRDT Integration
- Replace `JSON.parse` state snapshots with a CRDT (Conflict-free Replicated Data Type) library like Y.js or Automerge.
- This solves the "Inefficient State Management" bug simultaneously.

#### 3. Presence UI
- Show cursors of other users.
- Lock/Unlock elements being edited.

---

## 4. Scene Enhancements
Improve the "Scenes" presentation mode.

- **Drag-to-Reposition**: Add drag handles to scene list items to reorder them easily.
- **Single-Step Mode**: Add a "Step Forward" button/icon. When "Play" is active, this should be disabled.
- **Scene Notes**: Add a text area for each scene to store presenter notes or long-form comments.

## 5. Media Integration
- **Add Images**: (Currently broken/disabled). Re-implement the ability to add images to the canvas, potentially via Drag & Drop or a file picker.

---

## Common Work Priorities

Across these expansion plans, several common foundational improvements are needed:

1.  **Settings/Configuration Manager**: Both Google Drive (API Keys) and Theming require a way to manage global application settings that persist (likely in `localStorage`).
2.  **Metadata Expansion**: The `MindMapModel` needs to support arbitrary metadata (e.g., `googleFileId`, `themeId`, `author`) without breaking the core structure.
3.  **Modular IO**: The `PersistenceManager` needs to be refactored into an interface-based system (`StorageProvider`) to support multiple backends (Local File, LocalStorage, Google Drive).

## Recommendation
Start with **Refactoring PersistenceManager** to support a "Storage Provider" pattern. This prepares the ground for Google Drive without writing the specific API code yet.
