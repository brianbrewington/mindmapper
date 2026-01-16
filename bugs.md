# Bug Tracker & Feature Backlog

Use this document to track bugs, technical debt, and feature requests.
Format: `- [ ] Description (File/Context)`

## 🐛 Bugs & Technical Debt

### Critical / Functionality Missing

- [ ] **Force Layout Action**: Button exists but logs to console. Need physics engine.
- [ ] **Complete Resize Logic**: `InputHandler.js` only handles `top-left` resizing; other handles are missing/simplified.

### Architectural Issues

- [ ] **Fix UIManager Encapsulation**: `UIManager` directly resets `model.elements = []`. Use `model.clear()` instead.
- [ ] **Fix Undo/Redo State Issue**: `BugReproduction.test.js` suggests `undo()` might vanish elements after a load if history isn't synced correctly.
- [ ] **Decouple Renderer Selection**: `CanvasRenderer` accesses `model.selectedElement` directly (marked as hacky). Should be passed in or handled via state.

### UX / Polish

*(No open items)*

## 🚀 Features & Enhancements

### Performance

- [ ] **Spatial Indexing (Quadtree)**: Implement Quadtree for O(logN) hit testing instead of current O(N) iteration (`MindMapModel.js`).
- [ ] **Optimized Undo/Redo**: Switch from deep-cloning (`JSON.parse(JSON.stringify)`) to an improved state management strategy for large maps.

### Planned

- [ ] **Auto Layout / Force Directed**: Implement the algorithm for the "Force Layout" button.

## ✅ Completed

*(Sorted by date, newest first)*

### 2026-01-16

- [x] **Double-click text to edit**: Double-clicking text annotations now edits them instead of creating a new bubble.
- [x] **Color Palette Selection Indicator**: Clicking a color swatch now shows a thin outline to indicate selection.
- [x] **Comment Modal Auto-Edit Mode**: When selecting "Comment" from context menu, modal opens directly in edit mode with input focused.
- [x] **Direct Link Icon Click**: Clicking the 🔗 icon on a bubble/image opens the link immediately.
- [x] **Animated Scene Transitions**: Added smooth camera animations with eased "whoosh" effect during scene playback.
- [x] **Google Drive Integration**: Implemented DriveClient, DriveStorageProvider, and storage choice modal for save/load.
- [x] **Vitest UI Dashboard**: Added `npm run test:ui` for browser-based test runner.
- [x] **Replace Blocking Prompts in ScenesPanel**: Replaced with Modal class.
- [x] **Add Loading Indicators**: Added spinner overlay for save/load/bundle operations.
- [x] **Missing Error Handling**: Image load errors now show visual error state with retry on double-click.
- [x] **Duplicate Method Definition**: `InputHandler.js` had `setUIManager` defined twice.

### 2025-12-19

- [x] **Fragile Bundle Creation**: `PersistenceManager` uses robust `decodeURIComponent` and safe injection.
- [x] **Replace Blocking Prompts in UIManager**: Replaced with custom `Modal` class.

### 2025-12-14

- [x] **Hardcoded Visuals**: Fonts and magic numbers are now in `src/Constants.js`, mostly used by `CanvasRenderer`.
- [x] **Color Buttons Broken**: Implemented `defaultColor` and `updateElement` in Model.

### 2025-12-13

- [x] **Scene stop button has vanished / Play broken**: Fixed missing `setupScenesPanel()` call in `UIManager` constructor.
- [x] **Scene delay units should be seconds**: Converted UI to display/prompt in seconds while storing as ms.
- [x] **Redo action does not work**: Wired UIManager to listen for model history changes. Fixed missing UI updates.
- [x] **When shrinking a bubble...**: Removed hardcoded 50x30 minimum size in `CanvasRenderer`. Bubbles now autosize down to 10px min.
- [x] **Text Annotations cannot be moved**: Implemented rectangular hit testing for text and images.
- [x] **Create a dark theme toggle**: Done.
- [x] **Color edit boxes have vanished**: Re-implemented `setupColorPalette` in `UIManager.js`.
- [x] **Shift-Click to Connect**: Implemented in `InputHandler.js`.
- [x] **Fix Ghost Connection Drawing**: `CanvasRenderer.js` no longer relies on `InputHandler` drawing directly.
- [x] **Bubble and Line Comments are not editable**: Added edit/save UI to comment modal.
- [x] **+ and - keyboard shortcuts**: Implemented resizing. Fixed `CanvasRenderer` generating invalid font strings.
- [x] **Display Scenes on Load**: Fixed PersistenceManager to refresh scene list on load.
- [x] **Implement "Add Text" button logic**: Added support for 'text' type in UIManager and wired button.
- [x] **Fix InputHandler Encapsulation**: Refactored to use `renderer.setTempConnection`.
