import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { Modal } from './view/Modal.js';

describe('Scene Duration Units', () => {
    let model, uiManager;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="scenesList"></div>
            <!-- Missing Mocks causing crash -->
            <div id="commentModal" style="display:none;"></div>
            <p id="commentDisplay"></p>
            <textarea id="commentEditInput"></textarea>
            <button id="editCommentBtn"></button>
            <button id="saveCommentBtn"></button>
            <button id="undoBtn"></button>
            <button id="redoBtn"></button>
        `;

        model = new MindMapModel();
        model.scenes = [{ id: 1, name: 'Scene 1', duration: 2000 }];

        const renderer = {
            draw: vi.fn(),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y })
        };
        const inputHandler = {};

        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should display current duration in seconds and save in milliseconds', async () => {
        // Mock Modal.showPrompt instead of window.prompt
        vi.spyOn(Modal, 'showPrompt').mockResolvedValue('5'); // User inputs 5 seconds

        // Trigger render
        uiManager.renderScenesList();

        const buttons = Array.from(document.querySelectorAll('button'));
        const stopwatchBtn = buttons.find(b => b.textContent === '⏱️');

        expect(stopwatchBtn).toBeTruthy();

        stopwatchBtn.click();

        // Wait for async handler to complete
        await vi.waitFor(() => {
            expect(Modal.showPrompt).toHaveBeenCalled();
        });

        // Check Saved State - 5s -> 5000ms
        expect(model.scenes[0].duration).toBe(5000);
    });
});
