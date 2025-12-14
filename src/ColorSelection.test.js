import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';

describe('Color Selection Feature', () => {
    let model;
    let uiManager;
    let mockRenderer;
    let mockInputHandler;

    beforeEach(() => {
        model = new MindMapModel();
        mockRenderer = {
            draw: vi.fn(),
            screenToWorld: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            worldToScreen: vi.fn().mockReturnValue({ x: 0, y: 0 })
        };
        mockInputHandler = {};

        // Mock document elements required by UIManager
        document.body.innerHTML = `
            <div id="undoBtn"></div>
            <div id="redoBtn"></div>
            <div id="addBubbleBtn"></div>
            <div id="addTextBtn"></div>
            <div id="colorPalette"></div>
            <input id="textInput" />
            <div id="helpModal"></div>
             <div id="commentModal"></div>
            <div id="commentDisplay"></div>
            <div id="commentEditInput"></div>
            <div id="editCommentBtn"></div>
            <div id="saveCommentBtn"></div>
            <div id="scenesPanel"></div>
            <div id="scenesList"></div>
            <div id="largePlayBtn"></div>
            <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
        `;

        uiManager = new UIManager(model, mockRenderer, mockInputHandler);
    });

    it('should change the color of the selected bubble when a color swatch is clicked', () => {
        // 1. Create a bubble
        const bubble = { id: 1, type: 'bubble', text: 'Test', x: 0, y: 0, color: '#ffffff' };
        model.addElement(bubble);

        // 2. Select the bubble
        model.selectedElement = bubble; // Simulating selection (normally handled by InputHandler)

        // 3. Find a color swatch (assuming UIManager creates them)
        const palette = document.getElementById('colorPalette');
        const swatches = palette.getElementsByClassName('color-swatch');
        expect(swatches.length).toBeGreaterThan(0);

        // Pick the second color (e.g., Light Red #ffcccc from the list)
        const redSwatch = swatches[1];
        const newColor = redSwatch.title || redSwatch.style.backgroundColor; // We used title for color code

        // 4. Click the swatch
        redSwatch.onclick({ stopPropagation: vi.fn() });

        // 5. Verify bubble color updated
        const updatedBubble = model.elements.find(el => el.id === 1);
        expect(updatedBubble.color).toBe(newColor);
        expect(mockRenderer.draw).toHaveBeenCalled();
    });

    it('should set the default color for NEW bubbles when no bubble is selected', () => {
        // 1. Ensure nothing is selected
        model.selectedElement = null;

        // 2. Find a color swatch (e.g., Light Green #ccffcc)
        const palette = document.getElementById('colorPalette');
        const swatches = palette.getElementsByClassName('color-swatch');
        const greenSwatch = swatches[2];
        const newDefaultColor = greenSwatch.title; // Using title as the color source

        // 3. Click the swatch
        greenSwatch.onclick({ stopPropagation: vi.fn() });

        // 4. Verify model default color (checking internal state if exposed, or behavior)
        if (model.defaultColor) {
            expect(model.defaultColor).toBe(newDefaultColor);
        }

        // 5. Create a new bubble via UIManager
        // Mock the text input behavior
        const input = document.getElementById('textInput');

        // Trigger generic bubble creation flow
        uiManager.showInputAt(100, 100, '', null, 'bubble');
        input.value = 'New Bubble';
        input.onblur(); // Commit

        // 6. Verify new bubble has the default color
        const newBubble = model.elements[model.elements.length - 1];
        expect(newBubble.color).toBe(newDefaultColor);
    });
});
