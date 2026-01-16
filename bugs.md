# Bug Tracker & Feature Backlog

Use this document to track bugs, technical debt, and feature requests.
Format: `- [ ] Description (File/Context)`

## 🐛 Bugs & Technical Debt

### Critical / functionality Missing

- [x] **Scene stop button has vanished / Play broken**: Fixed missing `setupScenesPanel()` call in `UIManager` constructor. Stop button should appear now too. (2025-12-13)
- [x] **Scene delay units should be seconds**: Converted UI to display/prompt in seconds while storing as ms. (2025-12-13)
- [x] **Redo action does not work**: Wired UIManager to listen for model history changes. Fixed missing UI updates. (2025-12-13)
- [x] **When shrinking a bubble...**: Removed hardcoded 50x30 minimum size in `CanvasRenderer`. Bubbles now autosize down to 10px min. (2025-12-13)
- [x] **Text Annotations cannot be moved**: Implemented rectangular hit testing for text and images. (2025-12-13)
- [x] **Scene delay units should be seconds**: The scene delay units are in seconds, but the input field is in milliseconds, which is less intuitive. 
- [x] **Scene stop button has vanished**: The scene stop button has vanished. When playing through the scenes, there should be a stop button to stop the animation.
- [x] **Create a dark theme toggle**: Done.
- [x] **Color edit boxes have vanished**: Re-implemented `setupColorPalette` in `UIManager.js`. (2025-12-13)
- [x] **Shift-Click to Connect**: Implemented in `InputHandler.js`. (2025-12-13)
- [x] **Color Buttons Broken**: The color palette buttons do not work for bubbles at all. (Fixed 2025-12-14: Implemented `defaultColor` and `updateElement` in Model)
- [ ] **Force Layout Action**: Button exists but logs to console. Need physics engine.
- [ ] **Complete Resize Logic**: `InputHandler.js` only handles `top-left` resizing; other handles are missing/simplified.
- [x] **Fix Ghost Connection Drawing**: `CanvasRenderer.js` no longer relies on `InputHandler` drawing directly. `InputHandler` sets state, `CanvasRenderer` draws. (Fixed 2025-12-13)


### Architectural Issues
- [ ] **Fix UIManager Encapsulation**: `UIManager` directly resets `model.elements = []`. Use `model.clear()` instead.
- [ ] **Fix Undo/Redo State Issue**: `BugReproduction.test.js` suggests `undo()` might vanish elements after a load if history isn't synced correctly.
- [ ] **Decouple Renderer Selection**: `CanvasRenderer` accesses `model.selectedElement` directly (marked as hacky). Should be passed in or handled via state.
- [x] **Fragile Bundle Creation**: `PersistenceManager` uses robust `decodeURIComponent` and safe injection. (Fixed 2025-12-19)
- [x] **Hardcoded Visuals**: Fonts and magic numbers are now in `src/Constants.js`, mostly used by `CanvasRenderer`. (Fixed 2025-12-14)
- [ ] **Missing Error Handling**: Image loading failures leave elements in 'loading' state indefinitely or silently fail.
- [x] **Duplicate Method Definition**: `InputHandler.js` had `setUIManager` defined twice. (Fixed 2026-01-16)


### UX / Polish
- [x] **Replace Blocking Prompts in UIManager**: Replaced with custom `Modal` class. (2025-12-19)
- [x] **Replace Blocking Prompts in ScenesPanel**: Replaced with Modal class. (2026-01-16) `ScenesPanel.js` still uses native `prompt()` and `confirm()` for scene operations.
- [x] **Add Loading Indicators**: Added spinner overlay for save/load/bundle operations. (2026-01-16)

## 🚀 Features & Enhancements

### Performance
- [ ] **Spatial Indexing (Quadtree)**: Implement Quadtree for O(logN) hit testing instead of current O(N) iteration (`MindMapModel.js`).
- [ ] **Optimized Undo/Redo**: Switch from deep-cloning (`JSON.parse(JSON.stringify)`) to a improved state management strategy for large maps.

### Planned
- [ ] **Auto Layout / Force Directed**: Implement the algorithm for the "Force Layout" button.

## ✅ Completed
*(Move completed items here with the date)*
- [x] **Text Annotations cannot be moved**: Implemented rectangular hit testing for text and images. (2025-12-13)
- [x] **Bubble and Line Comments are not editable**: Added edit/save UI to comment modal. (2025-12-13)
- [x] **+ and - keyboard shortcuts**: Implemented resizing. Fixed `CanvasRenderer` generating invalid font strings. (2025-12-13)
- [x] **Display Scenes on Load**: Fixed PersistenceManager to refresh scene list on load. (2025-12-13)
- [x] **Implement "Add Text" button logic**: Added support for 'text' type in UIManager and wired button. (2025-12-13)
- [x] **Fix InputHandler Encapsulation**: Refactored to use `renderer.setTempConnection`. (2025-12-13)
- [x] **Animated Scene Transitions**: Added smooth camera animations with eased "whoosh" effect during scene playback. (2026-01-16)
- [x] **Google Drive Integration**: Implemented DriveClient, DriveStorageProvider, and storage choice modal for save/load. (2026-01-16)
- [x] **Vitest UI Dashboard**: Added `npm run test:ui` for browser-based test runner. (2026-01-16)
