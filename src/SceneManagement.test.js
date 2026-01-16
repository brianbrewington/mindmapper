import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';
import { Modal } from './view/Modal.js';

describe('Scene Management', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="scenesPanel">
                <div id="scenesList"></div>
                <div id="scenesControls">
                    <button id="addSceneBtn">Add Scene</button>
                    <button id="removeSceneBtn" disabled>Remove Scene</button>
                    <button id="playScenesBtn">Play</button>
                    <div id="countdownTimer"><span id="countdownValue"></span></div>
                </div>
                <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
            </div>
            <div id="controls"></div>
            <canvas id="canvas"></canvas>
            <div id="helpModal" class="modal"><div class="modal-content"><button class="close-modal-btn"></button></div></div>
        `;

        model = new MindMapModel();
        // Mock renderer
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

        // Add 1 scene
        model.addScene('Scene 1');
        uiManager.renderScenesList();
    });

    // Test removed: Remove Scene button replaced by Context Menu
    it('should rename scene via Pencil button', async () => {
        const list = document.getElementById('scenesList');
        const renameBtn = list.querySelector('button[title="Rename Scene"]');
        expect(renameBtn).toBeTruthy();

        // Mock Modal.showPrompt instead of window.prompt
        const promptSpy = vi.spyOn(Modal, 'showPrompt').mockResolvedValue('New Scene Name');
        renameBtn.click();

        // Wait for async handler to complete
        await vi.waitFor(() => {
            expect(promptSpy).toHaveBeenCalled();
        });
        
        expect(model.scenes[0].name).toBe('New Scene Name');
        expect(list.querySelector('.scene-name').textContent).toBe('New Scene Name');
    });

    it('should set duration via Stopwatch button', async () => {
        const list = document.getElementById('scenesList');
        const timeBtn = list.querySelector('button[title*="Delay"]');
        expect(timeBtn).toBeTruthy();

        // Mock Modal.showPrompt instead of window.prompt
        const promptSpy = vi.spyOn(Modal, 'showPrompt').mockResolvedValue('5');
        timeBtn.click();

        // Wait for async handler to complete
        await vi.waitFor(() => {
            expect(promptSpy).toHaveBeenCalled();
        });
        
        expect(model.scenes[0].duration).toBe(5000);
    });

    it('should show context menu for scenes', () => {
        const list = document.getElementById('scenesList');
        const sceneItem = list.querySelector('.scene-item');

        const contextMenuSpy = vi.spyOn(uiManager, 'showContextMenu');

        // Dispatch contextmenu event
        sceneItem.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100
        }));

        expect(contextMenuSpy).toHaveBeenCalledWith(expect.objectContaining({
            hit: expect.objectContaining({ type: 'scene' })
        }));
    });
});
