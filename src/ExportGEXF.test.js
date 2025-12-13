import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Export Functionality', () => {
    let uiManager, model, renderer, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="controls">
                <button id="exportGexfBtn">Export GEXF</button>
            </div>
            <canvas id="canvas"></canvas>
            <div id="helpModal" class="modal"><div class="modal-content"><button class="close-modal-btn"></button></div></div>
        `;

        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = vi.fn();

        model = new MindMapModel();
        renderer = {
            draw: vi.fn(),
            canvas: document.getElementById('canvas'),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
        };
        inputHandler = new InputHandler(model, renderer);
        uiManager = new UIManager(model, renderer, inputHandler);
    });

    it('should trigger a file download when Export GEXF is clicked', () => {
        const btn = document.getElementById('exportGexfBtn');

        // Spy on body methods to accept fake nodes
        const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
        const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

        // Spy on link creation
        const createElementSpy = vi.spyOn(document, 'createElement');
        const clickSpy = vi.fn();

        // Mock the anchor element behavior
        // When document.createElement('a') is called, we return a mock object
        // but we need to ensure it's robust enough for standard DOM manipulations
        // Alternative: Let it create a real element, but spy on its click() method.
        // But we can't easily spy on the specific element created inside the method unless we hijack createElement.

        // Let's rely on hijacking createElement for 'a' tag
        createElementSpy.mockImplementation((tagName) => {
            if (tagName === 'a') {
                return {
                    tagName: 'A',
                    click: clickSpy,
                    href: '',
                    download: '',
                    style: {},
                    setAttribute: vi.fn(),
                    nodeType: 1,
                };
            }
            // For others, invalid to call original if we don't have reference.
            // But we can return a simple mock element or try to get a new element from another doc.
            return document.implementation.createHTMLDocument().createElement(tagName);
        });

        // Add some data
        model.addElement({ type: 'bubble', id: 1, text: 'Test', x: 0, y: 0, width: 100, height: 50 });

        btn.click();

        expect(model.toGEXF).toBeDefined();

        // Expect URL.createObjectURL to be called
        expect(global.URL.createObjectURL).toHaveBeenCalled();

        // Expect anchor click to be called (Download trigger)
        expect(clickSpy).toHaveBeenCalled();

        // Verify Blob content (Start of GEXF)
        const blob = global.URL.createObjectURL.mock.calls[0][0];
        expect(blob).toBeInstanceOf(Blob);
        // We can't easily read Blob text synchronously in JSDOM/Node without FileReader + Promise
        // But we verified a Blob was created.
    });
});
