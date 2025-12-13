import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Data-Driven Context Menu', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="app"></div>
             <!-- Menu container might not exist yet, UIManager should create it -->
            <button id="addBubbleBtn"></button>
            <div id="textInput" style="display:none;"></div>
        `;

        model = new MindMapModel();
        model.removeElement = vi.fn();

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
    });

    it('should create context menu container on demand', () => {
        // Initial state: no menu (Lazy creation)
        expect(document.getElementById('contextMenu')).toBeNull();

        // Trigger show
        uiManager.showContextMenu({ x: 0, y: 0, hit: { type: 'canvas' } });
        expect(document.getElementById('contextMenu')).toBeTruthy();
    });

    it('should render "Bubble" actions when a bubble is clicked', () => {
        const bubble = { id: 1, type: 'bubble', text: 'Test' };
        const detail = { x: 100, y: 100, hit: { type: 'element', element: bubble } };

        uiManager.showContextMenu(detail);

        const menu = document.getElementById('contextMenu');
        expect(menu.style.display).toBe('block');

        // Expect specific actions
        const deleteBtn = menu.querySelector('[data-id="action-delete"]');
        const editBtn = menu.querySelector('[data-id="action-edit"]');

        expect(deleteBtn).toBeTruthy();
        expect(editBtn).toBeTruthy();
        expect(deleteBtn.textContent).toContain('Delete');
    });

    it('should render "Canvas" actions when background is clicked', () => {
        const detail = { x: 200, y: 200, hit: { type: 'none' } };

        uiManager.showContextMenu(detail);

        const menu = document.getElementById('contextMenu');
        const addBtn = menu.querySelector('[data-id="action-add-bubble"]');
        const deleteBtn = menu.querySelector('[data-id="action-delete"]');

        expect(addBtn).toBeTruthy();
        expect(deleteBtn).toBeFalsy(); // Should not show delete on canvas
    });

    it('should execute action when clicked', () => {
        const bubble = { id: 'b1', type: 'bubble' };
        const detail = { x: 100, y: 100, hit: { type: 'element', element: bubble } };

        uiManager.showContextMenu(detail);

        const deleteBtn = document.querySelector('[data-id="action-delete"]');
        deleteBtn.click();

        expect(model.removeElement).toHaveBeenCalledWith('b1');

        // Menu should hide
        const menu = document.getElementById('contextMenu');
        expect(menu.style.display).toBe('none');
    });

    it('should render actions for "Text" element', () => {
        const detail = { x: 0, y: 0, hit: { type: 'element', element: { type: 'text' } } };
        uiManager.showContextMenu(detail);
        const menu = document.getElementById('contextMenu');
        expect(menu.querySelector('[data-id="action-edit"]')).toBeTruthy();
        expect(menu.querySelector('[data-id="action-grow"]')).toBeFalsy();
    });

    it('should render actions for "Image" element', () => {
        const detail = { x: 0, y: 0, hit: { type: 'element', element: { type: 'image' } } };
        uiManager.showContextMenu(detail);
        const menu = document.getElementById('contextMenu');
        expect(menu.querySelector('[data-id="action-grow"]')).toBeTruthy();
        expect(menu.querySelector('[data-id="action-edit"]')).toBeFalsy();
    });

    it('should render extended actions for "Connection"', () => {
        const detail = { x: 0, y: 0, hit: { type: 'connection', connection: { id: 'c1' } } };
        uiManager.showContextMenu(detail);
        const menu = document.getElementById('contextMenu');
        expect(menu.querySelector('[data-id="action-delete"]')).toBeTruthy();
        expect(menu.querySelector('[data-id="action-comment"]')).toBeTruthy();
        expect(menu.querySelector('[data-id="action-link"]')).toBeTruthy();
    });
});
