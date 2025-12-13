import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Scene Playback', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = `
            <div id="scenesPanel">
                <div id="scenesList"></div>
                <div id="scenesPlayControls">
                    <button id="largePlayBtn">Play</button>
                    <button id="largeStopBtn" style="display:none">Stop</button>
                    <button id="addSceneBtn" style="display:none">Add</button>
                </div>
                <div id="scenesControls">
                    <button id="playScenesBtn">Play</button>
                    <div id="countdownTimer"><span id="countdownValue"></span></div>
                </div>
                <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
            </div>
            <canvas id="canvas"></canvas>
            <div id="helpModal" class="modal"><div class="modal-content"><button class="close-modal-btn"></button></div></div>
        `;

        model = new MindMapModel();
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

        // Add 3 scenes
        const viewport = { zoom: 1, offset: { x: 0, y: 0 } };
        model.addScene('Scene 1', viewport);
        model.addScene('Scene 2', viewport);
        model.addScene('Scene 3', viewport);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should cycle through scenes when play is clicked', () => {
        const playBtn = document.getElementById('playScenesBtn');
        const overlayName = document.getElementById('currentSceneName');

        // Mock restoreState
        const restoreSpy = vi.spyOn(model, 'restoreState');

        // Click Play
        playBtn.click();

        // Initially should show Scene 1 immediately (or just start timer?)
        // Let's assume it restores Scene 0 immediately.
        expect(restoreSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Scene 1' }));

        // Advance 2 seconds (default interval)
        vi.advanceTimersByTime(2000);
        expect(restoreSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Scene 2' }));

        // Advance 2 seconds
        vi.advanceTimersByTime(2000);
        expect(restoreSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Scene 3' }));

        // Loop back to 1
        vi.advanceTimersByTime(2000);
        expect(restoreSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Scene 1' }));
    });
});
