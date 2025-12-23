import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { CanvasRenderer } from './view/CanvasRenderer.js';
import { InputHandler } from './controller/InputHandler.js';
import { UIManager } from './view/UIManager.js';
import { PersistenceManager } from './io/PersistenceManager.js';

// We need to simulate the DOM environment and the modules trying to run
describe('App Initialization', () => {

    beforeEach(() => {
        // Set up the DOM as expected by index.html
        document.body.innerHTML = `
            <div id="loadingIndicator">Loading...</div>
            <div id="controls">
              <button id="addBubbleBtn"></button>
              <button id="addTextBtn"></button>
              <button id="addImageBtn"></button>
              <button id="zoomExtentsBtn"></button>
              <button id="forceLayoutBtn"></button>
              <button id="revertLayoutBtn"></button>
              <button id="newBtn"></button>
              <button id="saveBtn"></button>
              <button id="bundleBtn"></button>
              <button id="loadBtn"></button>
              <button id="exportGexfBtn"></button>
              <input type="file" id="loadFile">
              <div id="colorPalette"></div>
            </div>
            <div id="scenesPanel">
                <div id="scenesList"></div>
                <div id="scenesPlayControls">
                    <button id="largePlayBtn"></button>
                    <button id="largeStopBtn"></button>
                </div>
                 <div id="scenesHeader">
                    <button id="toggleScenesBtn"></button>
                </div>
                <div id="scenesControls">
                    <button id="addSceneBtn"></button>
                    <button id="removeSceneBtn"></button>
                    <button id="playScenesBtn"></button>
                </div>
                <div id="countdownTimer"><span id="countdownValue"></span></div>
            </div>
             <button id="helpBtn"></button>
             <div id="helpModal"><div class="modal-content"><button class="close-modal-btn"></button></div></div>
             <div id="commentModal"><div class="modal-content"><p id="commentDisplay"></p><button class="close-modal-btn"></button></div></div>
             <div id="contextMenu">
                <button id="addBubbleContextBtn"></button>
                <button id="addAnnotationContextBtn"></button>
                <button id="addImageContextBtn"></button>
                <button id="growBtn"></button>
                <button id="shrinkBtn"></button>
                <button id="commentBtn"></button>
                <button id="viewCommentBtn"></button>
                <button id="linkBtn"></button>
                <button id="openLinkBtn"></button>
                <button id="deleteBtn"></button>
             </div>
             <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
            <canvas id="canvas"></canvas>
            <textarea id="textInput"></textarea>
        `;

        // Mock Canvas context
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
            ellipse: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn(() => ({ width: 10 })),
            fillRect: vi.fn(),
        }));
    });

    it('should initialize without error and hide loading indicator', async () => {
        // Use the real initialization logic
        console.log('Starting init test...');

        // Dynamic import to ensure DOM is ready? 
        // No, we can just import it since we are in a test env where modules are handled by vitest
        const { initApp } = await import('./main.js');

        try {
            initApp();

            const loader = document.getElementById('loadingIndicator');
            expect(loader.style.display).toBe('none');

        } catch (error) {
            console.error(error);
            throw error;
        }
    });
});
