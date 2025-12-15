import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistenceManager } from './io/PersistenceManager.js';
import { MindMapModel } from './model/MindMapModel.js';

describe('Bundle Verification', () => {
    let model, renderer, uiManager, persistenceManager;

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="saveBtn"></button>
            <button id="loadBtn"></button>
            <input type="file" id="loadFile" />
            <button id="bundleBtn"></button>
        `;
        model = new MindMapModel();
        model.restoreState = vi.fn();
        renderer = { draw: vi.fn() };
        uiManager = { renderScenesList: vi.fn() };
        persistenceManager = new PersistenceManager(model, renderer, uiManager);

        // Reset global
        delete window.embeddedDataEncoded;
    });

    // TEST 1: Isolation - Correct injection
    it('should inject data into HTML correctly', () => {
        const originalHtml = '<html><head></head><body></body></html>';
        const data = { foo: 'bar' };

        const result = PersistenceManager.generateBundleHTML(originalHtml, data);

        // Verify script tag presence
        expect(result).toContain('<script>window.embeddedDataEncoded =');

        // Verify data correctness
        // Extract the base64 string
        const match = result.match(/window\.embeddedDataEncoded = '([^']*)'/);
        expect(match).not.toBeNull();
        const encoded = match[1];
        const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        expect(decoded).toEqual(data);
    });

    // TEST 2: Isolation - Re-bundling
    it('should replace existing embedded data if re-bundling', () => {
        const oldData = { foo: 'old' };
        const oldEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(oldData))));
        // Using the variable pattern handled by regex
        const originalHtml = `<html><script>const embeddedDataEncoded = '${oldEncoded}';</script></html>`;

        const newData = { foo: 'new' };
        const result = PersistenceManager.generateBundleHTML(originalHtml, newData);

        // Should update the string, not add a new script tag
        // Note: The Implementation currently supports replacing `const embeddedDataEncoded` or adding `window.embeddedDataEncoded`.
        // The implementation checks `if (html.includes('const embeddedDataEncoded ='))`

        // Verify it replaced it in place
        const newEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(newData))));
        expect(result).toContain(`const embeddedDataEncoded = '${newEncoded}'`);
        // Verify it didn't add the window version
        expect(result).not.toContain('window.embeddedDataEncoded =');
    });

    // TEST 3: Isolation - Special Characters (UTF-8)
    it('should handle special characters in bundle data', () => {
        const originalHtml = '<html><head></head></html>';
        const data = { text: 'Hello 🌎 / "Quotes" & <Tags>' };

        const result = PersistenceManager.generateBundleHTML(originalHtml, data);

        const match = result.match(/window\.embeddedDataEncoded = '([^']*)'/);
        const encoded = match[1];

        // Using the exact decoding logic from loadEmbeddedData
        const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        expect(decoded).toEqual(data);
    });

    // TEST 4: Integration - Render Pipeline Trigger
    it('should trigger render pipeline upon loading embedded data', () => {
        // Setup encoded data
        const data = { elements: [1, 2, 3] };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        window.embeddedDataEncoded = encoded;

        persistenceManager.loadEmbeddedData();

        expect(model.restoreState).toHaveBeenCalledWith(data, true);
        expect(uiManager.renderScenesList).toHaveBeenCalled();
        expect(renderer.draw).toHaveBeenCalled(); // The critical missing piece
    });

    // TEST 5: Integration - Init Safety
    it('should handle missing embedded data gracefully', () => {
        // window.embeddedDataEncoded is undefined

        const consoleSpy = vi.spyOn(console, 'log');

        persistenceManager.loadEmbeddedData();

        expect(model.restoreState).not.toHaveBeenCalled();
        expect(model.restoreState).not.toHaveBeenCalled();
        expect(renderer.draw).not.toHaveBeenCalled();
        // Should not crash
    });

    // TEST 6: Deep Verification - Full Cycle
    it('should fully restore model state from bundle', () => {
        // 1. Create complex data
        const inputData = {
            elements: [
                { id: 1, type: 'bubble', x: 10, y: 10, text: 'Node 1', color: 'red' },
                { id: 2, type: 'bubble', x: 50, y: 50, text: 'Node 2', color: 'blue' }
            ],
            connections: [
                { id: 101, from: 1, to: 2, weight: 2 }
            ],
            scenes: [
                { id: 's1', name: 'Scene 1', viewport: { zoom: 1.5, offset: { x: 100, y: 100 } } }
            ],
            version: '1.0'
        };

        // 2. Generate Bundle HTML
        const html = PersistenceManager.generateBundleHTML('<html></html>', inputData);

        // 3. Simulate Browser Environment (Extract and set global)
        const match = html.match(/window\.embeddedDataEncoded = '([^']*)'/);
        window.embeddedDataEncoded = match[1];

        // 4. Load Data
        // IMPORTANT: We need a REAL model here, not a mock, to verify state update.
        // Re-initialize manager with real model
        const realModel = new MindMapModel();
        const manager = new PersistenceManager(realModel, renderer, uiManager);

        manager.loadEmbeddedData();

        // 5. Verify Model Properties
        expect(realModel.elements).toEqual(inputData.elements);
        expect(realModel.connections).toEqual(inputData.connections);
        expect(realModel.scenes).toEqual(inputData.scenes);

        // 6. Verify Visual Trigger
        expect(renderer.draw).toHaveBeenCalled();
    });
});
