import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';

describe('Scene Playback UI', () => {
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

        // Mock DOM ensuring all expected elements exist to prevent UIManager crashes
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
            
            <!-- The Overlay Element in Question -->
            <div id="sceneNameOverlay" style="display: none; opacity: 0;">
                <span id="currentSceneName"></span>
            </div>
            
            <div id="contextMenu" style="display:none;"></div> 
        `;

        uiManager = new UIManager(model, mockRenderer, {});
    });

    it('should display scene name overlay when playing or stepping', async () => {
        // Add a scene
        model.addScene("Test Scene");

        // Setup UI
        uiManager.renderScenesList(); // Just in case

        // Step to the scene
        uiManager.stepScene();

        // Check Overlay
        const overlay = document.getElementById('sceneNameOverlay');
        const nameSpan = document.getElementById('currentSceneName');

        expect(nameSpan.textContent).toBe("Test Scene");

        // Should be visible (opacity 1 AND display block)
        expect(overlay.style.opacity).toBe('1');
        expect(overlay.style.display).not.toBe('none');
    });
});
