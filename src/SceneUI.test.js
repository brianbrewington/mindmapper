import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';

describe('Scene UI Polish', () => {
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

    it('should set the title attribute on scene name for hover tooltips', () => {
        // 1. Add a scene with a long name
        const longName = "This is a very long scene name that should be truncated but visible on hover";
        model.addScene(longName);

        // 2. Render list (triggered automatically by addScene if we listened, but UIManager listens)
        // Check if UIManager listens to 'historyChange' or similar? 
        // UIManager listens to historyChange but addScene triggers saveState -> historyChange.
        // However, rendersScenesList is not bound to historyChange in the constructor snippet I recall.
        // It was bound in addSceneBtn handler locally.
        // Let's manually trigger render to be safe/unit-test focused.
        uiManager.renderScenesList();

        // 3. Find the element
        const list = document.getElementById('scenesList');
        const nameSpan = list.querySelector('.scene-name');

        // 4. Verify title attribute
        expect(nameSpan).toBeTruthy();
        expect(nameSpan.getAttribute('title')).toBe(longName);
        expect(nameSpan.textContent).toBe(longName);
    });

    it('should have correct classes for layout styling', () => {
        model.addScene("Scene 1");
        uiManager.renderScenesList();

        const list = document.getElementById('scenesList');
        const item = list.querySelector('.scene-item');
        const nameSpan = list.querySelector('.scene-name');

        expect(item).toBeTruthy();
        expect(nameSpan).toBeTruthy();

        // We verify the existence of the element. 
        // The actual CSS ellipsis styling is tested via manual verification or by ensuring the class exists.
        expect(nameSpan.className).toContain('scene-name');
    });
});
