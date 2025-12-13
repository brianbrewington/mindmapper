# Deep Critique: Context Menu Implementation

## Current State Assessment
The current context menu implementation is **broken** and exhibits signs of "messy thinking" and technical debt. While the underlying pattern of separating Input (detection) from UI (rendering) is sound, the execution in `UIManager.js` is fragile, tightly coupled, and riddled with temporary hacks.

## 🔴 Critical Flaws & "Messy Thinking"

### 1. Ad-Hoc Initialization & Idempotency Hacks
**Location:** `src/view/UIManager.js` (approx line 147-152)
```javascript
showContextMenu(detail) {
    // ...
    // For now, let's just make setupContextMenu idempotent-ish...
    this.setupContextMenu(); 
    // ...
}
```
**Critique:** Calling `setupContextMenu()` *every time* the menu is shown is a performance smell and indicates a lack of confidence in the initialization lifecycle. The comment "idempotent-ish" admits that the method wasn't designed to be called safely multiple times, yet it is being forced to. This leads to potential duplicate event listeners or DOM thrashing.

### 2. Ambiguous DOM Ownership
**Location:** `src/view/UIManager.js` (approx line 122-124)
```javascript
// ... (assumed to be part of initial HTML for now, or we inject it)
// For portability, let's inject it if missing
if (!document.getElementById('contextMenu')) { ... }
```
**Critique:** The code is unsure if it owns the DOM or if the HTML provided it. This ambiguity means the code defends against a missing element by creating it, but might conflict if the HTML *does* provide it but with different IDs or structure. This allows the "View" logic to leak into "Integration" logic.

### 3. Hardcoded Declarative Logic in Imperative Code
**Location:** `src/view/UIManager.js` (approx line 227-231)
```javascript
document.getElementById('ctxDelete').style.display = isElement ? 'block' : 'none';
document.getElementById('ctxEdit').style.display = isElement ? 'block' : 'none';
```
**Critique:** The visibility of each menu item is toggle manually based on a boolean `isElement`. As soon as you add a third state (e.g., "Connection"), this becomes a combinatorial explosion of `if/else` checks. This is brittle and hard to extend.

### 4. Event Listener Leaks
**Location:** `src/view/UIManager.js`
The code repeatedly calls `setText` (which acts as a helper to set `onclick`) every time the menu opens.
```javascript
const setText = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.onclick = handler;
};
```
**Critique:** While overwriting `.onclick` prevents duplicate listeners (unlike `addEventListener`), it is an anti-pattern to re-bind behavior on every render. The behavior should be defined *once*, or the menu should be generated fresh each time (Stateless UI).

---

## 🔎 Hypotheses: Why is it Broken?

Given that "Context Clicks are not working", here are 5 specific hypotheses:

1.  **Z-Index / Positioning Issue:**
    *   **Hypothesis:** The menu is being created and shown, but it is rendered *behind* the Canvas (z-index issue) or off-screen (coordinate mapping error).
    *   **Evidence:** `menu.style.left = ...`. If `detail.x` is relative to the canvas but the menu is absolute to the body, zooming/panning might throw it off.

2.  **CSS `display: none` Persistence:**
    *   **Hypothesis:** The `setupContextMenu` function creates the menu with `display: none`. The `showContextMenu` sets `display: block`. usage of `setupGlobalEvents` attaches a global click listener to *hide* the menu. If the right-click event propagates to the `document` click listener immediately, the menu might be showing and then immediately hiding in the same tick.
    *   **Evidence:** `document.addEventListener('click', ...)` on line 128. `contextmenu` events can sometimes trigger click-related behaviors or bubbling that hits the document.

3.  **Missing Global Event Coordination:**
    *   **Hypothesis:** `InputHandler` dispatches `requestContextMenu` on `document`. `UIManager` listens on `document`. If `UIManager` initializes *before* `InputHandler` or if the listener isn't set up correctly in `setupGlobalEvents`, the event falls on deaf ears.
    *   **Code:** `UIManager` listens for `requestContextMenu`. Check if `setupGlobalEvents` is actually called in the constructor.

4.  **Ghost DOM Elements:**
    *   **Hypothesis:** The "Injection if missing" logic might be creating a *second* context menu if one already exists but wasn't found due to timing (or Shadow DOM, though unlikely here). If the code selects the first one (hidden) but updates the second one (visible), or vice-versa, interaction fails.

5.  **Event Default Prevention:**
    *   **Hypothesis:** The browser's native context menu is fighting with the custom one. `e.preventDefault()` is called in `InputHandler`, but if an error occurs before that line, the native menu might block the custom one.

---

## ✅ Recommendations: The Data-Driven Fix

Do not patch the current logic. Replace it with a data-driven rendering approach.

### 1. Define Actions as Data
Create a configuration constant that defines all possible context actions.
```javascript
const CONTEXT_ACTIONS = {
    DELETE: { label: 'Delete', icon: '🗑️', id: 'action-delete' },
    RENAME: { label: 'Rename', icon: '✏️', id: 'action-rename' },
    // ...
};
```

### 2. Single Source of Truth for Menu State
Do not rely on checking `document.getElementById` to see if the menu exists. The `UIManager` class should hold a reference to its menu: `this.contextMenu`. If it's null, create it.

### 3. Render, Don't Toggle
When opening the menu, clear the container and append only the relevant items.
```javascript
renderMenu(items) {
    this.contextMenu.innerHTML = ''; // Start clean
    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'menu-item';
        el.textContent = item.label;
        el.onclick = (e) => {
            e.stopPropagation(); // Prevent immediate closing
            item.handler();
            this.hideMenu();
        };
        this.contextMenu.appendChild(el);
    });
}
```

### 4. Fix Event Propagation
Ensure that clicking the context menu itself does not trigger the "Global Click" listener that closes the menu.
