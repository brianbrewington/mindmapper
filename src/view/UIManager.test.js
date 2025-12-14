import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './UIManager.js';
import { MindMapModel } from '../model/MindMapModel.js';

describe('UIManager', () => {
    let model;
    let renderer;
    let uiManager;
    let textInput;

    beforeEach(() => {
        model = new MindMapModel();
        // Mock renderer
        renderer = {
            draw: vi.fn(),
            screenToWorld: vi.fn((x, y) => ({ x, y })), // Identity transform for simplicity
            worldToScreen: vi.fn((x, y) => ({ x, y })),
        };

        // Mock DOM
        document.body.innerHTML = `
            <textarea id="textInput" style="display: none;"></textarea>
            <button id="addBubbleBtn"></button>
            <button id="addTextBtn"></button>
            <button id="zoomExtentsBtn"></button>
            <button id="addSceneBtn"></button>
            <div id="contextMenu"></div>
        `;
        textInput = document.getElementById('textInput');

        // InputHandler mock is not strictly needed if we trigger events manually
        const inputHandler = {};

        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should show text input on requestCreateBubble', () => {
        const event = new CustomEvent('requestCreateBubble', { detail: { x: 100, y: 200 } });
        document.dispatchEvent(event);

        expect(textInput.style.display).toBe('block');
        expect(textInput.style.left).toBe('100px');
        expect(textInput.style.top).toBe('200px');
    });

    it('should create bubble on Enter key', () => {
        // Show input first
        uiManager.showInputAt(100, 200);

        textInput.value = 'New Node';

        // Simulate Enter keydown
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, bubbles: true });
        textInput.dispatchEvent(enterEvent);

        expect(model.elements).toHaveLength(1);
        expect(model.elements[0].text).toBe('New Node');
        expect(textInput.style.display).toBe('none');
    });

    it('should NOT create bubble on Shift+Enter', () => {
        uiManager.showInputAt(100, 200);
        textInput.value = 'Line 1';

        // Simulate Shift+Enter
        const shiftEnterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true });
        textInput.dispatchEvent(shiftEnterEvent);

        // Should still be open and no element added
        expect(model.elements).toHaveLength(0);
        expect(textInput.style.display).toBe('block');

        // Logic check: ensure default prevented is false (so newline works)
        // In our implementation we only call preventDefault if !shiftKey
        // We can't easily check preventDefault on the event object after dispatch in jsdom 
        // without spying on the event itself, but the side effect (model length) is sufficient.
    });

    it('should close input on Escape', () => {
        uiManager.showInputAt(100, 200);
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        textInput.dispatchEvent(escapeEvent);

        expect(textInput.style.display).toBe('none');
        expect(model.elements).toHaveLength(0);
    });

    it('should open existing bubble for edit', () => {
        // Setup: Add a bubble
        model.addElement({ id: 99, x: 100, y: 100, text: 'Old Text', type: 'bubble' });

        // Dispatch edit request (simulating InputHandler detecting double click on node)
        const event = new CustomEvent('requestEditBubble', { detail: { element: model.elements[0] } });
        document.dispatchEvent(event);

        expect(textInput.style.display).toBe('block');
        expect(textInput.value).toBe('Old Text');

        // Modify and Commit
        textInput.value = 'New Text';
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, bubbles: true });
        textInput.dispatchEvent(enterEvent);

    });

    it('should show context menu on right click', () => {
        // Let UIManager create the menu dynamically

        // Dispatch custom event (simulated from InputHandler)
        const event = new CustomEvent('requestContextMenu', {
            detail: { x: 100, y: 200, hit: { type: 'none' } }
        });
        document.dispatchEvent(event);

        const menu = document.getElementById('contextMenu');
        expect(menu.style.display).toBe('block');
        expect(menu.style.left).toBe('100px');
    });
});


