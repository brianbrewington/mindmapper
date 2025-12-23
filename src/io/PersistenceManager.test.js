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
        <button id="newBtn"></button>
        <input type="file" id="loadFile">
    `;

    beforeEach(() => {
        model = new MindMapModel();
        // Mock renderer and uiManager as they are dependencies
        const renderer = { draw: vi.fn() };
        const uiManager = {};

        manager = new PersistenceManager(model, renderer, uiManager);
    });

    it('should trigger storage.save on saveJSON', async () => {
        model.addElement({ id: 1, text: 'Test' });

        const saveSpy = vi.spyOn(manager.storage, 'save');
        saveSpy.mockResolvedValue();

        await manager.saveJSON();

        expect(saveSpy).toHaveBeenCalled();
        const [fileName, content, contentType] = saveSpy.mock.calls[0];
        const json = JSON.parse(content);

        expect(fileName).toBe('mindmap.json');
        expect(json.elements).toHaveLength(1);
        expect(json.elements[0].text).toBe('Test');
        // Theme defaults to light if not set, or whatever ThemeManager.getTheme() returns
        expect(json.theme).toBeDefined();
    });

    it('should create bundle with embedded data', () => {
        model.addElement({ id: 1, text: 'Bundle Node' });

        const saveSpy = vi.spyOn(manager.storage, 'save');
        saveSpy.mockResolvedValue();

        // Mock document structure
        // createBundle reads outerHTML

        manager.createBundle();

        const content = saveSpy.mock.calls[0][1]; // 2nd arg is content
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
