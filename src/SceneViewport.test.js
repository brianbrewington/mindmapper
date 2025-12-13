import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Scene Viewport Persistence', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="scenesPanel">
                <div id="scenesList"></div>
                <button id="addSceneBtn">Add Scene</button>
            </div>
            <canvas id="canvas"></canvas>
            <div id="helpModal" class="modal"><div class="modal-content"><button class="close-modal-btn"></button></div></div>
        `;

        model = new MindMapModel();
        // Mock renderer with camera state
        renderer = {
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 },
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            draw: vi.fn(),
            canvas: document.getElementById('canvas')
        };
        inputHandler = new InputHandler(model, renderer);
        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should restore camera zoom and offset when switching scenes', () => {
        // 1. Set initial view
        renderer.cameraZoom = 2;
        renderer.cameraOffset = { x: 100, y: 100 };

        // 2. Add Scene via UI
        // We simulate UI click to verify capture logic works.
        // This will create 'Scene 1' (since model was empty) with viewport.

        // Let's assume UIManager handles the capture and passes to model, 
        // OR Model captures it? Model shouldn't know about renderer.
        // So UIManager should capture.
        // But `model.addScene` currently only takes `name`.

        // Let's test via UIManager click to cover full flow
        const addBtn = document.getElementById('addSceneBtn');
        addBtn.click(); // Should trigger UIManager -> capture renderer state -> model.addScene

        // 3. Change view
        renderer.cameraZoom = 0.5;
        renderer.cameraOffset = { x: -50, y: -50 };

        // 4. Click scene item to restore
        const sceneItem = document.querySelector('.scene-item');
        expect(sceneItem).toBeTruthy();
        sceneItem.click();

        // 5. Verify Restore
        expect(renderer.cameraZoom).toBe(2);
        expect(renderer.cameraOffset).toEqual({ x: 100, y: 100 });
    });
});
