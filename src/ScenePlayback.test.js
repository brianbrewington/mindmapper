import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';

describe('Scene Playback', () => {
    let model, uiManager;

    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = `
            <div id="scenesList"></div>
            <!-- MOCK ONLY THE BUTTONS WE HAVE NOW -->
            <button id="largePlayBtn" style="display:inline-block;">▶️</button>
            
            <!-- Other Mocks needed for Init -->
            <div id="commentModal" style="display:none;"></div>
            <p id="commentDisplay"></p>
            <textarea id="commentEditInput"></textarea>
            <button id="editCommentBtn"></button>
            <button id="saveCommentBtn"></button>
            <button id="undoBtn"></button>
            <button id="redoBtn"></button>
            <button id="toggleScenesBtn"></button>
            <button id="addSceneBtn"></button>
        `;

        model = new MindMapModel();
        model.scenes = [
            { id: 1, name: 'Scene 1', duration: 1000, elements: [], connections: [] },
            { id: 2, name: 'Scene 2', duration: 1000, elements: [], connections: [] }
        ];

        const renderer = {
            draw: vi.fn(),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y })
        };
        const inputHandler = {};

        uiManager = new UIManager(model, renderer, inputHandler);

        // Mock restoreState to track calls
        vi.spyOn(model, 'restoreState');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should play through scenes and toggle icon when large play button is clicked', () => {
        const largePlayBtn = document.getElementById('largePlayBtn');

        // Initial State
        expect(largePlayBtn.textContent).toBe('▶️');

        // Click to Play
        largePlayBtn.click();

        // Should change to Stop Icon
        expect(uiManager.isPlaying).toBe(true);
        expect(largePlayBtn.textContent).toBe('⏹️');

        expect(model.restoreState).toHaveBeenCalledWith(model.scenes[0]);

        // Advance time 1s (Scene 1 duration)
        vi.advanceTimersByTime(1000);

        // Should be on Scene 2
        expect(model.restoreState).toHaveBeenCalledWith(model.scenes[1]);

        // Advance time 1s (Scene 2 duration)
        vi.advanceTimersByTime(1000);

        // Should loop back to Scene 1
        expect(model.restoreState).toHaveBeenCalledTimes(3);
        expect(model.restoreState).toHaveBeenLastCalledWith(model.scenes[0]);

        // Click to Stop
        largePlayBtn.click();
        expect(uiManager.isPlaying).toBe(false);
        expect(largePlayBtn.textContent).toBe('▶️');
    });
});
