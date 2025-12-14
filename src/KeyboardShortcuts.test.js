import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputHandler } from './controller/InputHandler.js';
import { MindMapModel } from './model/MindMapModel.js';

describe('Keyboard Shortcuts', () => {
    let model, renderer, inputHandler;

    beforeEach(() => {
        model = new MindMapModel();

        // Mock Renderer
        renderer = {
            draw: vi.fn(),
            canvas: document.createElement('canvas'),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 },
            screenToWorld: (x, y) => ({ x, y }),
            setTempConnection: vi.fn()
        };

        inputHandler = new InputHandler(model, renderer);
    });

    it('should increase bubble size (radius & font) on + key', () => {
        const bubble = { id: 1, type: 'bubble', x: 0, y: 0, radiusX: 50, radiusY: 30, fontSize: 16 };
        model.elements.push(bubble);
        model.selectedElement = bubble;

        // Simulate '+' (Shift+=)
        const event = { key: '+', target: document.body, preventDefault: vi.fn() };
        inputHandler.handleKeyDown(event);

        expect(bubble.fontSize).toBe(18); // 16 + 2
        expect(bubble.font).toContain('18px');
        // Radius is handled by renderer, so we don't test it here since renderer is mocked
    });

    it('should decrease bubble size on - key', () => {
        const bubble = { id: 1, type: 'bubble', x: 0, y: 0, radiusX: 50, radiusY: 30, fontSize: 16 };
        model.elements.push(bubble);
        model.selectedElement = bubble;

        // Simulate '-'
        const event = { key: '-', target: document.body, preventDefault: vi.fn() };
        inputHandler.handleKeyDown(event);

        expect(bubble.fontSize).toBe(14); // 16 - 2
    });

    it('should resize text elements (font only)', () => {
        const text = { id: 2, type: 'text', x: 0, y: 0, fontSize: 16, font: '16px Poppins' };
        model.elements.push(text);
        model.selectedElement = text;

        const event = { key: '+', target: document.body, preventDefault: vi.fn() };
        inputHandler.handleKeyDown(event);

        expect(text.fontSize).toBe(18);
        expect(text.font).toBe('18px Poppins');
        // Text doesn't have radius, ensure no error
        expect(text.radiusX).toBeUndefined();
    });

    it('should resize connection weight', () => {
        const conn = { id: 3, from: 1, to: 2, weight: 2 };
        model.connections.push(conn);
        model.selectedElement = conn;

        inputHandler.handleKeyDown({ key: '+', target: document.body, preventDefault: vi.fn() });
        expect(conn.weight).toBe(3);

        inputHandler.handleKeyDown({ key: '-', target: document.body, preventDefault: vi.fn() }); // 2
        inputHandler.handleKeyDown({ key: '-', target: document.body, preventDefault: vi.fn() }); // 1
        inputHandler.handleKeyDown({ key: '-', target: document.body, preventDefault: vi.fn() }); // 1 (min)
        expect(conn.weight).toBe(1);
    });
});
