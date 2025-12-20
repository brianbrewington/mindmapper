/**
 * @fileoverview Main entry point for the Mind Mapping application.
 * Initializes the Model, View, and Controller, and sets up the application loop.
 */

import { MindMapModel } from './model/MindMapModel.js';
import { CanvasRenderer } from './view/CanvasRenderer.js';
import { InputHandler } from './controller/InputHandler.js';
import { PersistenceManager } from './io/PersistenceManager.js';
import { UIManager } from './view/UIManager.js';
import { DebugOverlay } from './view/DebugOverlay.js';

/**
 * Initializes the application when the DOM is fully loaded.
 */
export function initApp() {
    console.log('Initializing Mind Mapper...');

    // Clear potential "Zombie UI" from static bundle HTML
    const scenesList = document.getElementById('scenesList');
    if (scenesList) scenesList.innerHTML = '';

    // 1. Initialize Model
    const model = new MindMapModel();

    // 2. Initialize View
    const canvas = document.getElementById('canvas');
    const renderer = new CanvasRenderer(canvas, model);

    // 3. Initialize Controller
    const inputHandler = new InputHandler(model, renderer);

    // 4. Initialize UI Manager (Buttons, Panels)
    const uiManager = new UIManager(model, renderer, inputHandler);

    // 5. Initialize Persistence (Load/Save/Bundle)
    const persistenceManager = new PersistenceManager(model, renderer, uiManager);

    // 6. Debug Overlay
    new DebugOverlay(model);

    // Start the application
    // Check for embedded data (from bundle)
    persistenceManager.loadEmbeddedData();

    // Initial draw
    renderer.draw();

    // Hide loading indicator
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = 'none';

    // Expose for testing/debugging
    window.app = { model, renderer, inputHandler, uiManager, persistenceManager };
}

// Ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
