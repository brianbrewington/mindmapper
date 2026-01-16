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
import { ThemeManager } from './Constants.js';
import { driveClient } from './io/DriveClient.js';

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
    inputHandler.setUIManager(uiManager);

    // 5. Initialize Persistence (Load/Save/Bundle)
    const persistenceManager = new PersistenceManager(model, renderer, uiManager);

    // 6. Debug Overlay
    new DebugOverlay(model);

    // 7. Theme Initialization
    const setupTheme = () => {
        if (!window.matchMedia) {
            console.warn('matchMedia not supported');
            return;
        }
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (isDark) => {
            const theme = isDark ? 'dark' : 'light';
            console.log(`Applying theme: ${theme}`);
            ThemeManager.setTheme(theme);
            if (isDark) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        };

        // Initial check
        applyTheme(darkModeQuery.matches);

        // Listen for system changes
        darkModeQuery.addEventListener('change', (e) => applyTheme(e.matches));

        // Listen for internal changes (e.g. if we add a toggle later)
        ThemeManager.onThemeChange((mode) => {
            if (mode === 'dark') document.body.classList.add('dark-mode');
            else document.body.classList.remove('dark-mode');
        });
    };
    setupTheme();

    // 8. Bind Persistence Buttons
    // NOTE: This logic was moved from PersistenceManager.js to allow for cleaner storage swapping
    document.getElementById('saveBtn').addEventListener('click', () => persistenceManager.saveJSON());

    // Load Button Logic (Trigger abstraction)
    document.getElementById('loadBtn').addEventListener('click', () => persistenceManager.loadJSON());

    // document.getElementById('loadFile').addEventListener('change', ...); // Handled by LocalStorageProvider
    document.getElementById('bundleBtn').addEventListener('click', () => persistenceManager.createBundle());
    document.getElementById('newBtn').addEventListener('click', async () => persistenceManager.newMap());

    // Start the application
    // Check for embedded data (from bundle)
    persistenceManager.loadEmbeddedData();

    // 9. Initialize Google Drive Client
    driveClient.init();

    // 10. Wire up Drive Status Indicator
    const driveStatus = document.getElementById('driveStatus');
    if (driveStatus) {
        // Update UI on auth state change
        driveClient.onAuthChange((isAuthenticated) => {
            if (isAuthenticated) {
                driveStatus.style.opacity = '1';
                driveStatus.title = 'Google Drive Connected';
            } else {
                driveStatus.style.opacity = '0.3';
                driveStatus.title = 'Google Drive Disconnected';
            }
        });

        // Allow clicking to manually trigger auth
        driveStatus.addEventListener('click', () => {
            driveClient.ensureAuth().catch(console.error);
        });
    }

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
