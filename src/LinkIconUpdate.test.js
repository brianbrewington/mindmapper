import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { MindMapModel } from './model/MindMapModel.js';
import { Modal } from './view/Modal.js';

describe('Link Icon Immediate Update', () => {
    let model, renderer, uiManager;

    beforeEach(() => {
        document.body.innerHTML = '<div id="contextMenu"></div><div id="commentModal"></div>';

        model = new MindMapModel();
        renderer = {
            draw: vi.fn(),
            canvas: { getContext: () => { }, addEventListener: () => { } },
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            cameraOffset: { x: 0, y: 0 },
            cameraZoom: 1
        };
        uiManager = new UIManager(model, renderer, {});
    });

    it('should trigger draw() immediately after adding a link to a bubble', async () => {
        const bubble = { id: 'b1', type: 'bubble', x: 0, y: 0, text: 'Test' };
        model.elements.push(bubble);

        // Open Context Menu
        uiManager.showContextMenu({
            x: 100, y: 100,
            hit: { type: 'element', element: bubble }
        });

        // Find Link Action
        const menu = document.getElementById('contextMenu');
        const linkBtn = menu.querySelector('[data-id="action-link"]');
        expect(linkBtn).toBeTruthy();

        // Spy on Modal and Renderer
        vi.spyOn(Modal, 'showPrompt').mockResolvedValue('http://newlink.com');
        const drawSpy = renderer.draw;

        // Trigger Action
        linkBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify
        expect(bubble.link).toBe('http://newlink.com');
        expect(drawSpy).toHaveBeenCalled();
    });
});
