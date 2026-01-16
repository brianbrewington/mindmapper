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
            <button id="newBtn"></button>
        `;

        model = new MindMapModel();
        model.restoreState = vi.fn();

        renderer = { draw: vi.fn(), canvas: { width: 800, height: 600 }, cameraOffset: { x: 0, y: 0 } };
        uiManager = { renderScenesList: vi.fn(), zoomExtents: vi.fn() };

        persistenceManager = new PersistenceManager(model, renderer, uiManager);
    });

    it('should trigger renderScenesList after loading JSON', async () => {
        // Output data
        const testData = JSON.stringify({ elements: [], scenes: [] });

        // Updated: manager now uses providers.local instead of storage
        persistenceManager.providers.local.load = vi.fn().mockResolvedValue(testData);

        // Mock the storage choice modal to return 'local'
        const { Modal } = await import('./view/Modal.js');
        vi.spyOn(Modal, 'showStorageChoice').mockResolvedValue('local');

        await persistenceManager.loadJSON();

        expect(model.restoreState).toHaveBeenCalled();
        expect(uiManager.renderScenesList).toHaveBeenCalled();
        expect(uiManager.zoomExtents).toHaveBeenCalled();
    });

    it('should trigger renderScenesList after loading embedded data', () => {
        // Mock window.embeddedDataEncoded
        const testData = { scenes: [{ name: 'Scene 1' }] };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(testData))));
        window.embeddedDataEncoded = encoded;

        persistenceManager.loadEmbeddedData();

        expect(model.restoreState).toHaveBeenCalled();
        expect(uiManager.renderScenesList).toHaveBeenCalled();
        expect(uiManager.zoomExtents).toHaveBeenCalled();

        // Cleanup
        delete window.embeddedDataEncoded;
    });
});
