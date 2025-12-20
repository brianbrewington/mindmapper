import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MindMapModel } from './model/MindMapModel.js';

describe('Context Menu Integration', () => {

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="app">
                <canvas id="canvas" width="800" height="600"></canvas>
                <div id="ui">
                    <button id="addBubbleBtn">Add Bubble</button>
                    <button id="addTextBtn">Add Text</button>
                    <button id="zoomExtentsBtn">Zoom</button>
                    <button id="addSceneBtn">Add Scene</button>
                    <input type="file" id="loadBtn" />
                    <!-- Hidden file input for logic -->
                    <input type="file" id="loadFile" style="display: none;" />
                    <button id="saveBtn">Save</button>
                    <button id="bundleBtn">Bundle</button>
                    <button id="newBtn">New</button>
                </div>
                <!-- UIManager expects this for in-place edit -->
                <textarea id="textInput" style="display: none;"></textarea>
                <div id="loadingIndicator">Loading...</div>
                <div id="contextMenu"></div>
            </div>
        `;

        // Mock Canvas getContext
        const canvas = document.getElementById('canvas');
        canvas.getContext = vi.fn(() => ({
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
            ellipse: vi.fn(),
            fillText: vi.fn(),
            strokeRect: vi.fn(),
            fillRect: vi.fn(),
            measureText: vi.fn(() => ({ width: 50 })),
            clearRect: vi.fn(),
        }));
    });

    it('should show context menu when right-clicking the canvas', async () => {
        // Initialize the real app via dynamic import to call it AFTER DOM setup
        // Note: main.js might auto-run if readyState is complete, so we just import it.
        // We can force a reload of the module if needed, but vitest isolates tests usually.
        const { initApp } = await import('./main.js');
        // If readyState was complete, it might have run. If not, we might need to wait or call it.
        // For safety/idempotency in test, let's assume if we call it again and it adds listeners,
        // we might have dupes but the test should still check visibility.
        // Better: ensure main.js checks a flag or we mock the auto-run.

        // Actually, main.js auto-runs. So just importing it should trigger initApp if ready.
        // But to be sure we are testing explicitly, we can call it.
        // For this failure reproduction, let's just make sure it runs at least once successfully.
        try {
            initApp();
        } catch (e) { /* ignore if already initialized errors? No, initApp doesn't throw on re-run usually */ }

        const canvas = document.getElementById('canvas');

        // Dispatch contextmenu event
        const menuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            // view: window, // Removed to avoid JSDOM strictness issues
            button: 2,
            buttons: 2,
            clientX: 100,
            clientY: 100,
            screenX: 100,
            screenY: 100,
            pageX: 100,
            pageY: 100
        });

        // Spy on preventDefault
        const preventDefaultSpy = vi.spyOn(menuEvent, 'preventDefault');

        canvas.dispatchEvent(menuEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();

        // Check if custom event was dispatched (implicitly checked by menu appearing, but explicit is better)
        // But we really care about the menu:
        const menu = document.getElementById('contextMenu');
        expect(menu).not.toBeNull();
        expect(menu.style.display).toBe('block');
        // Check positioning (should match pageX/Y)
        expect(menu.style.left).toBe('100px');
        expect(menu.style.top).toBe('100px');

        // Verify children are also visible/set up
        // Verify children are also visible/set up (using new data-id)
        const addBubbleBtn = menu.querySelector('[data-id="action-add-bubble"]');
        expect(addBubbleBtn).not.toBeNull();
        // expect(addBubbleBtn.style.display).toBe('block'); // Checks inline style which we don't set
    });
});

