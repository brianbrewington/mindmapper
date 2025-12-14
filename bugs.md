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
- [ ] **Scene delay units should be seconds**: The scene delay units are in seconds, but the input field is in milliseconds, which is less intuitive. 
- [ ] **Scene stop button has vanished**: The scene stop button has vanished. When playing through the scenes, there should be a stop button to stop the animation.
- [ ] **Create a dark theme toggle**: Attempted but reverted due to UI regressions.
- [x] **Color edit boxes have vanished**: Re-implemented `setupColorPalette` in `UIManager.js`. (2025-12-13)
- [x] **Shift-Click to Connect**: Implemented in `InputHandler.js`. (2025-12-13)
- [ ] **Force Layout Action**: Button exists but logs to console. Need physics engine. I wonder if there is a way to make a "dark theme"? 
- [ ] **Complete Resize Logic**: `InputHandler.js` only handles `top-left` resizing; other handles are missing/simplified.
- [ ] **Fix Ghost Connection Drawing**: `CanvasRenderer.js` relies on `InputHandler` to draw the temp connection line. This violates separation of concerns.


### Architectural Issues
- [ ] **Fix UIManager Encapsulation**: `UIManager` directly resets `model.elements = []`. Use `model.clear()` instead.
- [ ] **Fix Undo/Redo State Issue**: `BugReproduction.test.js` suggests `undo()` might vanish elements after a load if history isn't synced correctly.
- [ ] **Decouple Renderer Selection**: `CanvasRenderer` accesses `model.selectedElement` directly (marked as hacky). Should be passed in or handled via state.
- [ ] **Fragile Bundle Creation**: `PersistenceManager` uses regex replacement (`html.replace`) to inject data. This is brittle to code formatting changes.
- [ ] **Hardcoded Visuals**: Fonts ("Poppins") and magic numbers (padding 20/15) are hardcoded in `CanvasRenderer`.
- [ ] **Missing Error Handling**: Image loading failures leave elements in 'loading' state indefinitely or silently fail.


### UX / Polish
- [ ] **Replace Blocking Prompts**: `UIManager` uses `confirm()` and `prompt()`. Replace with custom non-blocking modals (as noted in IDEA comments).

## 🚀 Features & Enhancements

### Performance
- [ ] **Spatial Indexing (Quadtree)**: Implement Quadtree for O(logN) hit testing instead of current O(N) iteration (`MindMapModel.js`).
- [ ] **Optimized Undo/Redo**: Switch from deep-cloning (`JSON.parse(JSON.stringify)`) to a improved state management strategy for large maps.

### planned
- [ ] **Auto Layout / Force Directed**: Implement the algorithm for the "Force Layout" button.

## ✅ Completed
*(Move completed items here with the date)*
- [x] **Text Annotations cannot be moved**: Implemented rectangular hit testing for text and images. (2025-12-13)
- [x] **Bubble and Line Comments are not editable**: Added edit/save UI to comment modal. (2025-12-13)
- [x] **+ and - keyboard shortcuts**: Implemented resizing. Fixed `CanvasRenderer` generating invalid font strings. (2025-12-13)
- [x] **Display Scenes on Load**: Fixed PersistenceManager to refresh scene list on load. (2025-12-13)
- [x] **Implement "Add Text" button logic**: Added support for 'text' type in UIManager and wired button. (2025-12-13)
- [x] **Fix InputHandler Encapsulation**: Refactored to use `renderer.setTempConnection`. (2025-12-13)
