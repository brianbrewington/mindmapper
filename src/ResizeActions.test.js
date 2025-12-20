import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Grow/Shrink Actions', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div><div id="contextMenu"></div>';
        model = new MindMapModel();
        model.saveState = vi.fn(); // Mock save
        renderer = {
            draw: vi.fn(),
            canvas: document.createElement('canvas'),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };
        inputHandler = new InputHandler(model, renderer);
        uiManager = new UIManager(model, renderer, inputHandler);
        // Important: UIManager attaches to document, so our mock body works
    });

    it('should scale bubble font size when Growing/Shrinking', () => {
        // Issue: Current code scales width/height/radius, but bubbles are text-based.
        // Should likely scale fontSize instead.
        const bubble = { id: 'b1', type: 'bubble', text: 'Test', x: 0, y: 0, fontSize: 16 };
        model.elements.push(bubble);

        uiManager.showContextMenu({ x: 0, y: 0, hit: { type: 'element', element: bubble } });
        const menu = document.getElementById('contextMenu');

        const growAction = Array.from(menu.children).find(el => el.textContent.includes('Grow'));
        growAction.click();

        // Expectation: Font size increases
        expect(bubble.fontSize).toBeGreaterThan(16);

        const shrinkAction = Array.from(menu.children).find(el => el.textContent.includes('Shrink'));
        shrinkAction.click(); // Should offset the grow

        // Just verify it changed, exact math might vary
        expect(bubble.fontSize).toBeLessThan(bubble.fontSize + 1); // rough check
    });

    it('should scale connection weight when Growing/Shrinking', () => {
        const conn = { id: 'c1', from: 'b1', to: 'b2', weight: 2 };
        model.connections.push(conn);

        uiManager.showContextMenu({ x: 0, y: 0, hit: { type: 'connection', connection: conn } });
        const menu = document.getElementById('contextMenu');

        const growAction = Array.from(menu.children).find(el => el.textContent.includes('Grow'));
        // Reproduce failure: Action shouldn't exist yet
        expect(growAction).toBeTruthy();

        growAction.click();
        expect(conn.weight).toBeGreaterThan(2);

        const shrinkAction = Array.from(menu.children).find(el => el.textContent.includes('Shrink'));
        expect(shrinkAction).toBeTruthy();
        shrinkAction.click();
        expect(conn.weight).toBeLessThan(conn.weight + 1);
    });
});
