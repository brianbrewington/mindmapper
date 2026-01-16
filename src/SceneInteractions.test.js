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

    it('should advance to next scene when Single Step is clicked', async () => {
        // Add 2 scenes with DISTINCT viewports to verify switching
        const vp1 = { zoom: 1.5, offset: { x: 10, y: 10 } };
        const vp2 = { zoom: 2.0, offset: { x: 20, y: 20 } };
        model.addScene("Scene 1", vp1);
        model.addScene("Scene 2", vp2);

        // Setup UI
        uiManager.renderScenesList();

        // Mock animateToSceneViewport to immediately apply viewport changes (no animation)
        vi.spyOn(uiManager, 'animateToSceneViewport').mockImplementation((scene) => {
            if (scene && scene.viewport) {
                mockRenderer.cameraZoom = scene.viewport.zoom;
                mockRenderer.cameraOffset = { ...scene.viewport.offset };
                mockRenderer.draw();
            }
            return Promise.resolve();
        });

        const stepBtn = document.getElementById('stepSceneBtn');
        expect(stepBtn).toBeTruthy();

        // 1. Click Step -> Should go to Scene 1 (index 0)
        stepBtn.click();

        // Verify Viewport update
        expect(mockRenderer.cameraZoom).toBe(1.5);
        expect(mockRenderer.cameraOffset).toEqual({ x: 10, y: 10 });
        expect(mockRenderer.draw).toHaveBeenCalled();

        // Verify Overlay update
        const nameSpan = document.getElementById('currentSceneName');
        expect(nameSpan.textContent).toBe("Scene 1");

        // 2. Click Step -> Should go to Scene 2 (index 1)
        stepBtn.click();
        expect(mockRenderer.cameraZoom).toBe(2.0);
        expect(mockRenderer.cameraOffset).toEqual({ x: 20, y: 20 });
        expect(nameSpan.textContent).toBe("Scene 2");
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
