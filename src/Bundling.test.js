import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersistenceManager } from './io/PersistenceManager.js';
import { MindMapModel } from './model/MindMapModel.js';

describe('Bundle Round-Trip Verification', () => {
    let model, renderer, uiManager, persistenceManager;

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="saveBtn"></button>
            <button id="loadBtn"></button>
            <input type="file" id="loadFile" />
            <button id="bundleBtn"></button>
            <button id="newBtn"></button>
        `;
        model = new MindMapModel();

        // Mock UI components
        renderer = { draw: vi.fn(), canvas: { width: 800, height: 600 } };
        uiManager = { renderScenesList: vi.fn(), zoomExtents: vi.fn() };

        persistenceManager = new PersistenceManager(model, renderer, uiManager);

        if (typeof window !== 'undefined') {
            delete window.embeddedDataEncoded;
        }
    });

    afterEach(() => {
        document.body.innerHTML = '';
        if (typeof window !== 'undefined') {
            delete window.embeddedDataEncoded;
        }
    });

    it('should correctly encode, inject, decode, and restore a complex map state', () => {
        // 1. Create a Non-Trivial Map State
        const initialData = {
            elements: [
                { id: 1, type: 'bubble', x: 100, y: 100, text: 'Root Node', color: '#ff0000' },
                { id: 2, type: 'bubble', x: 300, y: 100, text: 'Child Node', color: '#00ff00' },
                { id: 3, type: 'text', x: 200, y: 200, text: 'Annotation' }
            ],
            connections: [
                { id: 101, from: 1, to: 2, weight: 2, color: 'black' }
            ],
            scenes: [
                { id: 'scene1', name: 'Start', viewport: { zoom: 1, offset: { x: 0, y: 0 } } },
                { id: 'scene2', name: 'Zoomed', viewport: { zoom: 2, offset: { x: 50, y: 50 } } }
            ],
            version: '1.0'
        };

        // Populate the model with this data
        model.restoreState(initialData, true);

        // 2. Encode and Inject (Simulate createBundle)
        // We can't easily mock document.documentElement.outerHTML in a way that includes our injected script *and* parses it back in the same JSDOM tick without full navigation.
        // So we will verify the generation logic directly, then simulate the load.

        const dummyHTML = '<html><head></head><body><h1>App</h1></body></html>';
        const bundleHTML = PersistenceManager.generateBundleHTML(dummyHTML, initialData);

        // Verify Injection Format
        expect(bundleHTML).toContain("window.embeddedDataEncoded = '");

        // Extract the encoded string to verify it is Base64
        const match = bundleHTML.match(/window\.embeddedDataEncoded = '([^']*)';/);
        expect(match).not.toBeNull();
        const encodedString = match[1];

        // 3. Simulate Application Start (Load)
        // Place the encoded string into the global variable as if the script ran
        window.embeddedDataEncoded = encodedString;

        // Reset the model to ensure we are actually restoring
        model.clear();
        expect(model.elements.length).toBe(0);

        // Trigger load
        persistenceManager.loadEmbeddedData();

        // 4. Assert State Matches exactly
        // We verify the internal state of the model matches the initialData

        // Helper to remove any undefined/optional props that might be added during runtime but weren't in input
        // For strict equality, we expect the restoreState to result in state equivalent to input.

        expect(model.elements).toMatchObject(initialData.elements);
        expect(model.connections).toMatchObject(initialData.connections);
        expect(model.scenes).toMatchObject(initialData.scenes);

        // Verify UI triggers
        expect(uiManager.renderScenesList).toHaveBeenCalled();
        expect(uiManager.zoomExtents).toHaveBeenCalled();
    });

    it('should use loadFromJSONString correctly', () => {
        const data = {
            elements: [{ id: 99, text: 'JSON Test' }],
            connections: [],
            scenes: []
        };
        const jsonString = JSON.stringify(data);

        persistenceManager.loadFromJSONString(jsonString);

        expect(model.elements[0].text).toBe('JSON Test');
    });
});
