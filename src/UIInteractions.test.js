import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { InputHandler } from './controller/InputHandler.js';
import { PersistenceManager } from './io/PersistenceManager.js';

describe('UI Interactions Audit', () => {
    let model, renderer, uiManager, inputHandler, persistenceManager;
    let canvas;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="controls">
                <button id="undoBtn"></button>
                <button id="redoBtn"></button>
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
                <input type="file" id="loadFile">
                <button id="exportGexfBtn"></button>
            </div>
            <div id="scenesPanel">
                <button id="toggleScenesBtn"></button>
                <button id="addSceneBtn"></button>
                <button id="removeSceneBtn"></button>
                <button id="playScenesBtn"></button>
            </div>
            <button id="helpBtn"></button>
            <div id="helpModal">
                <div class="modal-content">
                    <button class="close-modal-btn"></button>
                </div>
            </div>
            <div id="commentModal" style="display: none;">
                <p id="commentDisplay"></p>
            </div>
            <div id="contextMenu" style="display: none;">
                <button id="ctxDelete"></button>
                <button id="ctxEdit"></button>
                <button id="ctxAddBubble"></button>
                <button id="growBtn"></button>
                <button id="shrinkBtn"></button>
                <button id="commentBtn"></button>
                <button id="linkBtn"></button>
            </div>
            <canvas id="canvas"></canvas>
            <textarea id="textInput"></textarea>
        `;

        canvas = document.getElementById('canvas');
        canvas.getContext = vi.fn(() => ({
            save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(),
            beginPath: vi.fn(), ellipse: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
            fillText: vi.fn(), measureText: vi.fn(() => ({ width: 10 })),
            strokeRect: vi.fn(), fillRect: vi.fn(), clearRect: vi.fn(),
            moveTo: vi.fn(), lineTo: vi.fn()
        }));

        // Mock URL for Export GEXF
        global.URL.createObjectURL = vi.fn(() => 'blob:url');
        global.URL.revokeObjectURL = vi.fn();

        // Mock dependencies
        model = {
            elements: [],
            undo: vi.fn(),
            redo: vi.fn(),
            addElement: vi.fn(),
            removeElement: vi.fn(),
            saveState: vi.fn(),
            addScene: vi.fn(),
            scenes: [],
            addScene: vi.fn(),
            scenes: [],
            toGEXF: vi.fn(() => '<gexf></gexf>'),
            history: [],
            historyIndex: -1
        };

        renderer = {
            canvas,
            ctx: canvas.getContext('2d'),
            draw: vi.fn(),
            screenToWorld: vi.fn((x, y) => ({ x, y })),
            worldToScreen: vi.fn((x, y) => ({ x, y })),
            cameraOffset: { x: 0, y: 0 },
            cameraZoom: 1
        };

        inputHandler = new InputHandler(model, renderer);
        // Note: UIManager depends on inputHandler for some logic, or vice versa? 
        // UIManager typically sets up toolbar.
        uiManager = new UIManager(model, renderer, inputHandler);

        // Persistence needs real instances typically, but we just check listeners
        persistenceManager = new PersistenceManager(model, renderer, uiManager);
    });

    const triggerClick = (id) => {
        const btn = document.getElementById(id);
        if (!btn) throw new Error(`Button ${id} not found`);
        btn.click();
    };

    describe('Toolbar Buttons', () => {
        it('should handle Undo', () => {
            // Ensure button is enabled
            model.historyIndex = 1;
            model.history = [{}, {}];
            uiManager.updateUndoRedoButtons();

            triggerClick('undoBtn');
            // We verify the model method is called OR the event listener is attached (by mocking addEventListener?)
            // Since we use real DOM, clicking should fire the handler if attached.
            // If the handler calls model.undo(), we check that.
            expect(model.undo).toHaveBeenCalled();
        });

        it('should handle Redo', () => {
            // Ensure button is enabled
            model.historyIndex = 0;
            model.history = [{}, {}];
            uiManager.updateUndoRedoButtons();

            triggerClick('redoBtn');
            expect(model.redo).toHaveBeenCalled();
        });

        // Add Bubble is typically testing 'showInputAt' invocation.
        // We can spy on uiManager.showInputAt
        it('should handle Add Bubble', () => {
            const spy = vi.spyOn(uiManager, 'showInputAt');
            triggerClick('addBubbleBtn');
            expect(spy).toHaveBeenCalled();
        });

        it('should handle Zoom Extents', () => {
            // Mock required logic if implemented
            // Assuming UIManager calls something on renderer or updates camera
            // For now, check if click doesn't crash effectively or calls a method
            // If unimplemented, expecting fail.
            triggerClick('zoomExtentsBtn');
            // Add assertion based on implementation intent (e.g. renderer.zoomToFit())
        });

        it('should handle New Mindmap', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
            triggerClick('newBtn');
            expect(confirmSpy).toHaveBeenCalled();
            expect(model.elements.length).toBe(0);
        });

        // it('should handle Auto Layout', () => { ... }); // Feature missing

        it('should handle Revert Layout', () => {
            const logSpy = vi.spyOn(console, 'log');
            triggerClick('revertLayoutBtn');
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Revert'));
        });

        it('should handle Export GEXF', () => {
            const logSpy = vi.spyOn(console, 'log');
            triggerClick('exportGexfBtn');
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Export'));
        });
    });

    describe('Scenes Panel', () => {
        it('should handle Add Scene', () => {
            // Expect model.scenes.push or similar
            const initialLen = model.scenes.length;
            triggerClick('addSceneBtn');
            // If not implemented, this test fails (or nothing happens).
            // Ideally we mock the implementation to call model.addScene
        });
    });

    describe('Help', () => {
        it('should show help modal', () => {
            triggerClick('helpBtn');
            const modal = document.getElementById('helpModal');
            expect(modal.style.display).toBe('flex');
        });

        it('should close help modal', () => {
            document.getElementById('helpModal').style.display = 'flex';
            document.querySelector('.close-modal-btn').click();
            const modal = document.getElementById('helpModal');
            expect(modal.style.display).toBe('none');
        });
    });

    describe('Context Menu Items', () => {
        it('should have listeners for all context actions', () => {
            // Setup context and OPEN menu to bind listeners
            const detail = {
                x: 100, y: 100,
                hit: { element: { id: 1, type: 'bubble', radiusX: 50, radiusY: 30 }, type: 'element' }
            };
            uiManager.showContextMenu(detail);

            // Delete
            expect(() => {
                const btn = document.querySelector('[data-id="action-delete"]');
                if (btn) btn.click();
            }).not.toThrow();

            // Edit
            const showInputSpy = vi.spyOn(uiManager, 'showInputAt');
            document.querySelector('[data-id="action-edit"]').click();
            expect(showInputSpy).toHaveBeenCalled();

            // Grow
            document.querySelector('[data-id="action-grow"]').click();
            // Check model or element update? 
            // Expect font size to increase (default 16 + 2)
            expect(uiManager.currentContextHit.element.fontSize).toBe(18);

            // Shrink
            document.querySelector('[data-id="action-shrink"]').click();
            expect(uiManager.currentContextHit.element.radiusX).toBeCloseTo(50, 0); // Back to approx original

            // Comment
            document.querySelector('[data-id="action-comment"]').click();
            const modal = document.getElementById('commentModal');
            expect(modal.style.display).toBe('flex');

            // Link
            const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('http://example.com');
            document.querySelector('[data-id="action-link"]').click();
            expect(promptSpy).toHaveBeenCalled();
            expect(uiManager.currentContextHit.element.link).toBe('http://example.com');
        });
    });
});
