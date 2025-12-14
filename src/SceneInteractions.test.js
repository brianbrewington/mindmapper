import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';

describe('Scene Interactions', () => {
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
            <div id="scenesPanel">
                <div id="scenesHeader"></div>
                <div id="scenesList"></div>
                <div id="scenesControls">
                    <button id="addSceneBtn"></button>
                    <button id="stepSceneBtn"></button>
                </div>
            </div>
            <div id="largePlayBtn"></div>
            <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
            <!-- We expect a context menu to be created dynamically or exist -->
            <div id="contextMenu" style="display:none;"></div> 
        `;

        uiManager = new UIManager(model, mockRenderer, {});
    });

    it('should have a Single Step button in the scenes panel', () => {
        uiManager.setupScenesPanel();
        const stepBtn = document.getElementById('stepSceneBtn'); // We expect this ID
        expect(stepBtn).toBeTruthy();
    });

    it('should advance to next scene when Single Step is clicked', () => {
        // Add 2 scenes
        model.addScene("Scene 1");
        model.addScene("Scene 2");

        // Mock restoreState
        vi.spyOn(model, 'restoreState');

        // Setup UI
        uiManager.renderScenesList();
        // uiManager.setupScenesPanel(); // Called in constructor

        // We need to set the current playing index or ensure it starts at -1 or 0
        // UIManager internal state `currentSceneIndex` is usually reset on play.
        // For stepping, we might need to know which is active. 
        // Let's assume stepping starts from 0 if stopped.

        const stepBtn = document.getElementById('stepSceneBtn');
        expect(stepBtn).toBeTruthy();

        stepBtn.click();

        // Should restore Scene 0 (or Scene 1 if we consider 0 current?)
        // If we are "stopped", hitting step should show Scene 0? Or Scene 1?
        // Usually "Next" implies Scene 0 if fresh.
        expect(model.restoreState).toHaveBeenCalled();
        // Check argument (scene object)
        const lastCallArgs = model.restoreState.mock.lastCall;
        expect(lastCallArgs[0].name).toBe("Scene 1");

        // Click again
        stepBtn.click();
        const secondCallArgs = model.restoreState.mock.lastCall;
        expect(secondCallArgs[0].name).toBe("Scene 2");
    });

    it('should show extended options in Scene Context Menu', () => {
        // Add a scene
        model.addScene("Scene 1");
        uiManager.renderScenesList();

        const list = document.getElementById('scenesList');
        const item = list.querySelector('.scene-item');

        // Spy on showContextMenu
        // Since showContextMenu is a method on uiManager, we can spy it.
        // But the event handler calls it. 
        // We'll verify it calls showContextMenu with correct options.
        // Or deeper: we verify the generated menu items IF we can mock the menu generation.

        // Actually, `UIManager.js` likely calls `this.showContextMenu(options)`.
        // Let's spy on that.
        const spy = vi.spyOn(uiManager, 'showContextMenu');

        // Context menu event
        const evt = new Event('contextmenu');
        item.dispatchEvent(evt);

        expect(spy).toHaveBeenCalled();
        const callArgs = spy.mock.lastCall[0]; // { x, y, hit: { type: 'scene', ... } }

        expect(callArgs.hit).toBeDefined();
        expect(callArgs.hit.type).toBe('scene');

        // Now, checking if the MENU actually renders "Change Duration" requires 
        // looking at how `contextMenu` is populated. 
        // Usually `showContextMenu` populates `#contextMenu`.
        // Let's call `showContextMenu` manually with the structure we expect to verify logic.

        uiManager.showContextMenu(callArgs);

        const menu = document.getElementById('contextMenu');
        const textContent = menu.textContent || menu.innerText;

        expect(textContent).toContain('Duration'); // Expect "Duration" option
        expect(textContent).toContain('Rename');
        expect(textContent).toContain('Delete');
    });
});
