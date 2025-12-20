import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from './controller/InputHandler.js';
import { MindMapModel } from './model/MindMapModel.js';

describe('Copy/Paste Functionality', () => {
    let model, renderer, inputHandler;

    beforeEach(() => {
        model = new MindMapModel();
        renderer = {
            canvas: {
                addEventListener: vi.fn(),
                classList: { add: vi.fn(), remove: vi.fn() },
                focus: vi.fn()
            },
            draw: vi.fn(),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            cameraOffset: { x: 0, y: 0 },
            cameraZoom: 1
        };
        inputHandler = new InputHandler(model, renderer);
    });

    it('should copy selected element to clipboard', () => {
        const bubble = { id: 'b1', type: 'bubble', text: 'To Copy', x: 100, y: 100 };
        model.elements.push(bubble);
        model.selectedElement = bubble;

        // Trigger Copy (Cmd+C)
        inputHandler.handleKeyDown({
            key: 'c', metaKey: true, preventDefault: vi.fn(), target: { tagName: 'BODY' }
        });

        // Verify Clipboard
        expect(inputHandler.clipboard).toBeTruthy();
        expect(inputHandler.clipboard.text).toBe('To Copy');
        expect(inputHandler.clipboard.id).toBe('b1');
    });

    it('should paste element from clipboard with new ID and offset', () => {
        const bubble = { id: 'b1', type: 'bubble', text: 'Source', x: 100, y: 100 };
        model.elements.push(bubble);

        // Manual Clipboard set
        inputHandler.clipboard = JSON.parse(JSON.stringify(bubble));

        // Trigger Paste (Cmd+V)
        inputHandler.handleKeyDown({
            key: 'v', metaKey: true, preventDefault: vi.fn(), target: { tagName: 'BODY' }
        });

        // Verify Model
        expect(model.elements.length).toBe(2);
        const newBubble = model.elements.find(el => el.id !== 'b1');
        expect(newBubble).toBeTruthy();
        expect(newBubble.text).toBe('Source');
        expect(newBubble.x).toBe(120); // Offset +20
        expect(newBubble.y).toBe(120);
        expect(model.selectedElement).toBe(newBubble);
    });

    it('should NOT paste if clipboard is empty', () => {
        model.elements = [];
        inputHandler.clipboard = null;

        inputHandler.handleKeyDown({
            key: 'v', metaKey: true, preventDefault: vi.fn(), target: { tagName: 'BODY' }
        });

        expect(model.elements.length).toBe(0);
    });

    it('should NOT copy/paste if editing text', () => {
        const bubble = { id: 'b1', type: 'bubble', text: 'To Copy', x: 100, y: 100 };
        model.elements.push(bubble);
        model.selectedElement = bubble;

        const e = {
            key: 'c', metaKey: true, preventDefault: vi.fn(),
            target: { tagName: 'INPUT' } // Simulated Input 
        };
        inputHandler.handleKeyDown(e);

        expect(inputHandler.clipboard).toBeNull();
    });
});
