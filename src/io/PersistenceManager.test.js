import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistenceManager } from './PersistenceManager.js';
import { MindMapModel } from '../model/MindMapModel.js';

describe('PersistenceManager', () => {
    let model;
    let manager;

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock saveBtn, loadBtn, etc.
    document.body.innerHTML = `
        <button id="saveBtn"></button>
        <button id="loadBtn"></button>
        <button id="bundleBtn"></button>
        <input type="file" id="loadFile">
    `;

    beforeEach(() => {
        model = new MindMapModel();
        // Mock renderer and uiManager as they are dependencies
        const renderer = { draw: vi.fn() };
        const uiManager = {};

        manager = new PersistenceManager(model, renderer, uiManager);
    });

    it('should generate valid JSON for save', () => {
        model.addElement({ id: 1, text: 'Test' });

        // Mock downloadFile to intercept the content
        const downloadSpy = vi.spyOn(manager, 'downloadFile');
        // Prevent actual download logic (optional if we trust jsdom but cleaner)
        downloadSpy.mockImplementation(() => { });

        manager.saveJSON();

        expect(downloadSpy).toHaveBeenCalled();
        const content = downloadSpy.mock.calls[0][0]; // First Arg
        const json = JSON.parse(content);

        expect(json.elements).toHaveLength(1);
        expect(json.elements[0].text).toBe('Test');
        expect(json.version).toBe('1.0');
    });

    it('should create bundle with embedded data', () => {
        model.addElement({ id: 1, text: 'Bundle Node' });

        const downloadSpy = vi.spyOn(manager, 'downloadFile');
        downloadSpy.mockImplementation(() => { });

        // Mock document structure
        // createBundle reads outerHTML

        manager.createBundle();

        const content = downloadSpy.mock.calls[0][0];
        // Check if it contains the embedded data variable assignment
        expect(content).toContain('embeddedDataEncoded =');

        // Let's extract the encoded data and verify it
        // The implementation uses window.embeddedDataEncoded = ... in the fallback case (which this test hits)
        const match = content.match(/embeddedDataEncoded = '([^']*)';/);
        expect(match).not.toBeNull();

        const encoded = match[1];
        const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));

        expect(decoded.elements[0].text).toBe('Bundle Node');
    });
});
