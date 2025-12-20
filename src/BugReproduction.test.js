import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { PersistenceManager } from './io/PersistenceManager.js';
import { Modal } from './view/Modal.js';

describe('Bug Reproduction', () => {
    let model, renderer, uiManager, persistenceManager;
    let newBtnHandler;

    beforeEach(() => {
        // Setup DOM for UIManager
        document.body.innerHTML = `
            <button id="addBubbleBtn"></button>
            <button id="addTextBtn"></button>
            <button id="zoomExtentsBtn"></button>
            <button id="undoBtn"></button>
            <button id="redoBtn"></button>
            <button id="newBtn"></button>
            <button id="saveBtn"></button>
            <button id="loadBtn"></button>
            <input type="file" id="loadFile" />
            <button id="bundleBtn"></button>
            <div id="scenesList"></div>
        `;

        model = new MindMapModel();

        // Mock Renderer with meaningful canvas dimensions
        renderer = {
            draw: vi.fn(),
            screenToWorld: vi.fn((x, y) => ({ x, y })),
            worldToScreen: vi.fn((x, y) => ({ x, y })),
            canvas: { width: 800, height: 600 },
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };

        // We need to capture the 'newBtn' handler to trigger it manually
        // since we are testing UIManager internals essentially
        const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');

        uiManager = new UIManager(model, renderer, {});
        // Initialize PersistenceManager to attach its handlers (including newBtn)
        persistenceManager = new PersistenceManager(model, renderer, uiManager);

        // Find the New Button handler
        const newBtnCall = addEventListenerSpy.mock.calls.find(call =>
            call[0] === 'click' && (call[1].name === 'handler' || call[1].toString().includes('newBtn')) // Heuristic
        );
        // Better way: trigger click on element
    });

    // Bug 1: Blank Canvas after Bundle Load
    it('should properly center camera (zoomExtents) after loading bundle', () => {
        persistenceManager = new PersistenceManager(model, renderer, uiManager);

        // 1. Setup Data that is "off screen" if camera is at 0,0
        // Element at 5000, 5000
        const offScreenData = {
            elements: [{ id: 1, type: 'bubble', x: 5000, y: 5000, text: 'Far away', width: 100, height: 50 }],
            connections: [],
            scenes: [],
            version: '1.0'
        };
        const jsonString = JSON.stringify(offScreenData);

        // 2. Load it
        persistenceManager.loadFromJSONString(jsonString);

        // 3. Verify Zoom Extents logic applied
        // We now delegate to renderer.zoomToFit, so we just check it was called.
        // Note: verify renderer.zoomToFit mock exists or spy on it
        // The mock renderer defined above does NOT have zoomToFit.
        // We need to add it.
        renderer.zoomToFit = vi.fn();

        // Reload to trigger logic with new mock
        persistenceManager.loadFromJSONString(jsonString);

        expect(renderer.zoomToFit).toHaveBeenCalled();
    });

    // Bug 2: New Button does not clear scenes
    it('should clear scenes list UI when New button is clicked', async () => {
        // 1. Setup Model with Scenes
        model.addScene("Scene 1", {});
        uiManager.renderScenesList();

        const list = document.getElementById('scenesList');
        expect(list.children.length).toBe(1);

        // 2. Click New
        // 2. Click New
        // Mock Modal.showConfirm to return true
        const confirmSpy = vi.spyOn(Modal, 'showConfirm').mockResolvedValue(true);

        const newBtn = document.getElementById('newBtn');
        newBtn.click();

        // Wait for promise resolution (microtask queue)
        await new Promise(resolve => setTimeout(resolve, 0));

        // 3. Assert Model is cleared
        expect(model.scenes).toHaveLength(0);

        // 4. Assert UI is cleared (The Bug)
        expect(list.children.length).toBe(0);
    });
});
