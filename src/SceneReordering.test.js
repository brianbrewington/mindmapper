import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';

describe('Scene Reordering', () => {
    let model;
    let uiManager;
    let mockRenderer;

    beforeEach(() => {
        model = new MindMapModel();
        mockRenderer = {
            draw: vi.fn(),
            screenToWorld: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            worldToScreen: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };

        // Mock DOM
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

        uiManager = new UIManager(model, mockRenderer, {});
    });

    it('should reorder scenes in the model', () => {
        // This tests the Model logic directly (unit test)
        model.addScene("A");
        model.addScene("B");
        model.addScene("C");

        expect(model.scenes.map(s => s.name)).toEqual(["A", "B", "C"]);

        // Simulate reorder: Move 0 (A) to 2 (C)
        // Note: The UI logic usually implies "insert before". 
        // If I drag A (0) and drop ON C (2), it might mean "insert after C" or "insert before C".
        // Let's assume standard behavior: dropping on an item inserts at that index.
        // If I move 0 to 2: The array becomes [B, C, A] (if appending) or [B, A, C]?

        // Let's assume the method reorderScene(fromIndex, toIndex) behaves like array move.
        // We expect this method to exist.
        if (model.reorderScene) {
            model.reorderScene(0, 2);
            expect(model.scenes.map(s => s.name)).toEqual(["B", "C", "A"]);
        } else {
            // Fail if method missing (red phase)
            expect(model.reorderScene).toBeDefined();
        }
    });

    it('should render drag handles in the UI', () => {
        model.addScene("Scene 1");
        uiManager.renderScenesList();

        const list = document.getElementById('scenesList');
        const handle = list.querySelector('.drag-handle');

        expect(handle).toBeTruthy();
        expect(handle.getAttribute('draggable')).toBe('true');
    });

    it('should handle drop event to trigger reorder', () => {
        model.addScene("A"); // 0
        model.addScene("B"); // 1

        uiManager.renderScenesList();

        // Spy on model method
        model.reorderScene = vi.fn();

        const list = document.getElementById('scenesList');
        const items = list.querySelectorAll('.scene-item');
        const sourceItem = items[0]; // A
        const targetItem = items[1]; // B

        // Simulate events
        // 1. Drag Start on Source
        const dataTransfer = { setData: vi.fn(), getData: vi.fn().mockReturnValue('0') };
        const dragStartEvent = new Event('dragstart');
        dragStartEvent.dataTransfer = dataTransfer;

        // We need to trigger it on the HANDLE or the ITEM depending on implementation.
        // Assuming handle triggers it, but bubbles to item? Or handle is the target.
        // Let's assume we find the handle of source Item.
        const sourceHandle = sourceItem.querySelector('.drag-handle');
        if (sourceHandle) {
            sourceHandle.dispatchEvent(dragStartEvent);
        } else {
            // If handle doesn't exist yet (fail test), skip
            expect(sourceHandle).toBeTruthy();
        }

        // 2. Drop on Target
        const dropEvent = new Event('drop', { bubbles: true });
        dropEvent.dataTransfer = dataTransfer;
        // Mock getting data
        dataTransfer.getData.mockReturnValue('0'); // Dragged from 0

        targetItem.dispatchEvent(dropEvent);

        // Verify model called with (0, 1)
        expect(model.reorderScene).toHaveBeenCalledWith(0, 1);
    });
});
