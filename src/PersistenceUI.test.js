import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistenceManager } from './io/PersistenceManager.js';
import { MindMapModel } from './model/MindMapModel.js';

describe('Persistence Manager UI Integration', () => {
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
    });

    it('should trigger renderScenesList after loading JSON', () => {
        // Mock FileReader
        const mockReader = {
            readAsText: vi.fn(),
            onload: null
        };
        vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader);

        const mockEvent = { target: { files: [{}] }, value: '' };

        // Output data
        const testData = JSON.stringify({ elements: [], scenes: [] });

        persistenceManager.loadJSON(mockEvent);

        // Simulate read completion
        expect(mockReader.readAsText).toHaveBeenCalled();
        mockReader.onload({ target: { result: testData } });

        expect(model.restoreState).toHaveBeenCalled();
        expect(uiManager.renderScenesList).toHaveBeenCalled();
        expect(renderer.draw).toHaveBeenCalled();
    });

    it('should trigger renderScenesList after loading embedded data', () => {
        // Mock window.embeddedDataEncoded
        const testData = { scenes: [{ name: 'Scene 1' }] };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(testData))));
        window.embeddedDataEncoded = encoded;

        persistenceManager.loadEmbeddedData();

        expect(model.restoreState).toHaveBeenCalled();
        expect(uiManager.renderScenesList).toHaveBeenCalled();

        // Cleanup
        delete window.embeddedDataEncoded;
    });
});
