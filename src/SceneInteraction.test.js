import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';
import { CanvasRenderer } from './view/CanvasRenderer.js';

describe('Scene Interaction', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="scenesPanel">
                <div id="scenesList"></div>
                <button id="addSceneBtn">Add Scene</button>
                <button id="toggleScenesBtn">Toggle</button>
                <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
            </div>
            <div id="controls"></div>
            <div id="helpModal" class="modal"><div class="modal-content"><button class="close-modal-btn"></button></div></div>
            <canvas id="canvas"></canvas>
        `;

        model = new MindMapModel();
        // Mock renderer to avoid canvas context errors
        renderer = {
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            draw: vi.fn(),
            canvas: document.getElementById('canvas')
        };
        inputHandler = new InputHandler(model, renderer);
        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should add a scene to the list when Add Scene is clicked', () => {
        const addBtn = document.getElementById('addSceneBtn');
        const list = document.getElementById('scenesList');

        // Initial state
        expect(list.children.length).toBe(0);

        // Click
        addBtn.click();

        // Verify Model Updated
        expect(model.scenes.length).toBe(1);

        // Verify UI Updated (This is what the user says is broken)
        expect(list.children.length).toBe(1);
        expect(list.innerHTML).toContain('Scene 1');
    });
});
