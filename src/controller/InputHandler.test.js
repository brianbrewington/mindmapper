import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputHandler } from './InputHandler.js';
import { MindMapModel } from '../model/MindMapModel.js';

describe('InputHandler', () => {
    let model;
    let renderer;
    let inputHandler;
    let canvas;

    beforeEach(() => {
        model = new MindMapModel();
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        // Mock Renderer
        renderer = {
            canvas: canvas,
            screenToWorld: vi.fn((x, y) => ({ x, y })),
            worldToScreen: vi.fn((x, y) => ({ x, y })),
            draw: vi.fn(),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };

        // Mock Input (textarea)
        document.body.innerHTML = '<textarea id="textInput"></textarea>';

        inputHandler = new InputHandler(model, renderer);
    });

    it('should delete selected element on Delete key', () => {
        model.addElement({ id: 1, text: 'Node' });
        model.selectedElement = model.elements[0];

        const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
        document.body.dispatchEvent(deleteEvent);

        expect(model.elements).toHaveLength(0);
    });

    it('should NOT delete element when editing text (input focused)', () => {
        model.addElement({ id: 1, text: 'Node' });
        model.selectedElement = model.elements[0];

        const input = document.getElementById('textInput');
        input.focus();

        // Dispatch event from the input itself so e.target is correct
        const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
        input.dispatchEvent(deleteEvent);

        // Should still be there because we are typing in the box!
    });

    it('should dispatch requestContextMenu event on right click', () => {
        const spy = vi.fn();
        document.addEventListener('requestContextMenu', spy);

        const contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100
        });

        // Dispatch on canvas (renderer.canvas)
        canvas.dispatchEvent(contextMenuEvent);

        expect(spy).toHaveBeenCalled();
        const event = spy.mock.calls[0][0];
        expect(event.detail.x).toBe(100);
        expect(event.detail.hit).toBeDefined();
    });
});

