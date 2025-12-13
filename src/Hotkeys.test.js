import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputHandler } from './controller/InputHandler.js';

describe('Hotkeys', () => {
    let model, renderer, inputHandler;
    let canvas;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        // Mock Model
        model = {
            undo: vi.fn(),
            redo: vi.fn(),
            selectedElement: null,
            removeElement: vi.fn(),
            elements: [],
            addAnnotation: vi.fn(),
            addImage: vi.fn(),
            addBubble: vi.fn() // Assuming this exists or will exist
        };

        // Mock Renderer
        renderer = {
            canvas,
            draw: vi.fn(),
            zoomToFit: vi.fn(), // The expected method for 'Z'
            screenToWorld: vi.fn((x, y) => ({ x, y })),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };

        inputHandler = new InputHandler(model, renderer);
    });

    const triggerKey = (key, ctrl = false, shift = false) => {
        const event = new KeyboardEvent('keydown', {
            key: key,
            ctrlKey: ctrl,
            metaKey: ctrl, // Cover mac cmd
            shiftKey: shift,
            bubbles: true
        });
        document.dispatchEvent(event);
    };

    it('should handle Z for Zoom Extents', () => {
        triggerKey('z');
        expect(renderer.zoomToFit).toHaveBeenCalled();
    });

    it('should handle Ctrl+Z for Undo', () => {
        triggerKey('z', true);
        expect(model.undo).toHaveBeenCalled();
    });

    // Ctrl+Y or Ctrl+Shift+Z for Redo
    it('should handle Ctrl+Y for Redo', () => {
        triggerKey('y', true);
        expect(model.redo).toHaveBeenCalled();
    });

    it('should handle B for Add Bubble', () => {
        // Mock a method on inputHandler or model? 
        // Usually hotkeys trigger model actions or UI modes.
        // Let's assume inputHandler dispatches an event or calls model.
        // For 'B', user instructions say "Add a new bubble".
        // Let's spy on document dispatchEvent if it uses that pattern 
        // OR check if it calls model.addElement
        const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
        triggerKey('b');
        // Based on previous analysis, we used events like 'requestCreateBubble'
        // But B might just create one at center?
        // Let's assert that *something* happened.
        // If untested, this will likely fail.
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'requestCreateBubble' }));
    });
});
