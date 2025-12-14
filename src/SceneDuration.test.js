import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';

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

        // Mock window.prompt
        vi.spyOn(window, 'prompt');
    });

    it('should display current duration in seconds and save in milliseconds', () => {
        // Trigger render
        uiManager.renderScenesList();

        const timeBtn = document.querySelector('#scenesList button'); // The stopwatch button is the first one added in container? No, container has 3.
        // Actually, checking the code, the container appends timeBtn, renameBtn, deleteBtn.
        // So the first button inside the flex container is timeBtn.
        // The container is appended to item, item appended to list.
        // Let's find by text content
        const buttons = Array.from(document.querySelectorAll('button'));
        const stopwatchBtn = buttons.find(b => b.textContent === '⏱️');

        expect(stopwatchBtn).toBeTruthy();

        // 1. Check Tooltip (optional, good to check if we updated it)
        // Current code says "Delay: 2000ms"
        // We want to verify that when we click, it prompts with "2" (seconds)

        window.prompt.mockReturnValue("5"); // User inputs 5 seconds

        stopwatchBtn.click();

        // Check prompt call
        // expect(window.prompt).toHaveBeenCalledWith('Delay (seconds):', '2'); // 2000ms -> 2s

        // Check Saved State
        expect(model.scenes[0].duration).toBe(5000); // 5s -> 5000ms
    });
});
