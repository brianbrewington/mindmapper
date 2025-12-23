import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Text Creation', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="addBubbleBtn"></button>
            <button id="addTextBtn"></button>
            <input id="textInput" />
        `;

        model = new MindMapModel();

        // Mock Renderer
        renderer = {
            draw: vi.fn(),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };

        // Mock InputHandler (minimal)
        inputHandler = {};

        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should create a bubble when addBubbleBtn is clicked', () => {
        const btn = document.getElementById('addBubbleBtn');
        const input = document.getElementById('textInput');

        // 1. Click Button
        btn.click();
        expect(input.style.display).toBe('block');

        // 2. Type text
        input.value = 'My Bubble';

        // 3. Blur to commit
        input.blur();

        expect(model.elements).toHaveLength(1);
        expect(model.elements[0].type).toBe('bubble');
        expect(model.elements[0].text).toBe('My Bubble');
    });

    it('should create text when addTextBtn is clicked', () => {
        const btn = document.getElementById('addTextBtn');
        const input = document.getElementById('textInput');

        // 1. Click Button
        btn.click();
        expect(input.style.display).toBe('block');

        // 2. Type text
        input.value = 'Just Text';

        // 3. Blur to commit
        input.blur();

        expect(model.elements).toHaveLength(1);
        expect(model.elements[0].type).toBe('text');
        expect(model.elements[0].text).toBe('Just Text');
        // Check text-specific defaults
        expect(model.elements[0].color).toBeUndefined();
    });
});
