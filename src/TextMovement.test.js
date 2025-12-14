import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputHandler } from './controller/InputHandler.js';
import { MindMapModel } from './model/MindMapModel.js';
import { CanvasRenderer } from './view/CanvasRenderer.js';

describe('Text Annotations Movement', () => {
    let model, renderer, inputHandler;

    beforeEach(() => {
        model = new MindMapModel();

        // Mock Canvas
        const canvas = {
            getContext: () => ({
                measureText: () => ({ width: 50 }),
                save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn()
            }),
            addEventListener: vi.fn(),
            focus: vi.fn(),
            classList: { add: vi.fn(), remove: vi.fn() }
        };

        renderer = new CanvasRenderer(canvas, model);
        // Mock transformers
        renderer.screenToWorld = (x, y) => ({ x, y });
        renderer.worldToScreen = (x, y) => ({ x, y });
        renderer.draw = vi.fn();

        inputHandler = new InputHandler(model, renderer);
    });

    it('should select and move text annotation', () => {
        const text = {
            id: 1, type: 'text',
            x: 100, y: 100,
            text: 'Annotation',
            fontSize: 16,
            height: 20, // CanvasRenderer usually sets this but we mock it here since draw isn't fully running
            width: 50
        };
        model.elements.push(text);

        // 1. Mouse Down on Text
        // We need to ensure hitTest works.
        // InputHandler stores dragStart.
        inputHandler.handleMouseDown({
            preventDefault: vi.fn(),
            button: 0,
            clientX: 105, clientY: 105 // Inside 100,100 + 50x20
        });

        expect(model.selectedElement).toBe(text);
        expect(inputHandler.isDragging).toBe(true);

        // 2. Mouse Move
        inputHandler.handleMouseMove({
            clientX: 125, clientY: 125 // +20, +20
        });

        // 3. Verify Position Update
        // New Pos = Old Pos + Delta
        // 100 + 20 = 120
        expect(text.x).toBe(120);
        expect(text.y).toBe(120);
    });
});
