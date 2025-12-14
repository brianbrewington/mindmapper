import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';

describe('Theme Toggle', () => {
    let model, uiManager, renderer;

    beforeEach(() => {
        // Mock localStorage
        const storage = {};
        global.localStorage = {
            getItem: vi.fn(key => storage[key] || null),
            setItem: vi.fn((key, value) => { storage[key] = value.toString(); }),
            clear: vi.fn(() => { for (const key in storage) delete storage[key]; })
        };

        document.body.innerHTML = `
            <button id="themeToggleBtn"></button>
            <div id="commentModal" style="display:none;"></div>
            <p id="commentDisplay"></p>
            <textarea id="commentEditInput"></textarea>
            <button id="editCommentBtn"></button>
            <button id="saveCommentBtn"></button>
            <button id="undoBtn"></button>
            <button id="redoBtn"></button>
            <!-- Scenes -->
            <div id="scenesList"></div>
            <button id="addSceneBtn"></button>
            <button id="toggleScenesBtn"></button>
            <button id="largePlayBtn" style="display:inline-block;"></button>
        `;

        // Clear local storage
        localStorage.clear();
        document.body.classList.remove('dark-theme');

        model = new MindMapModel();
        model.on = vi.fn(); // Mock event emitter

        renderer = {
            draw: vi.fn(),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            setTheme: vi.fn()
        };
        const inputHandler = {};

        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should toggle theme on button click', () => {
        const toggleBtn = document.getElementById('themeToggleBtn');

        // Initial state: Light
        expect(document.body.classList.contains('dark-theme')).toBe(false);

        // Click -> Dark
        toggleBtn.click();
        expect(document.body.classList.contains('dark-theme')).toBe(true);
        expect(renderer.setTheme).toHaveBeenCalledWith('dark');
        expect(localStorage.getItem('theme')).toBe('dark');

        // Click -> Light
        toggleBtn.click();
        expect(document.body.classList.contains('dark-theme')).toBe(false);
        expect(renderer.setTheme).toHaveBeenCalledWith('light');
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should load saved theme from localStorage', () => {
        // Setup Saved Theme
        localStorage.setItem('theme', 'dark');

        // Re-init UIManager
        uiManager = new UIManager(model, renderer, {});

        expect(document.body.classList.contains('dark-theme')).toBe(true);
        expect(renderer.setTheme).toHaveBeenCalledWith('dark');
    });
});
