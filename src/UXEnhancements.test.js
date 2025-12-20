import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './view/UIManager.js';
import { InputHandler } from './controller/InputHandler.js';
import { MindMapModel } from './model/MindMapModel.js';
import { Modal } from './view/Modal.js';

describe('UX Enhancements', () => {
    let model, renderer, uiManager, inputHandler;

    beforeEach(() => {
        document.body.innerHTML = '<div id="contextMenu"></div><div id="commentModal"></div>';

        model = new MindMapModel();
        renderer = {
            draw: vi.fn(),
            canvas: {
                getContext: () => { },
                addEventListener: vi.fn(),
                classList: { add: vi.fn(), remove: vi.fn() },
                focus: vi.fn()
            },
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            cameraOffset: { x: 0, y: 0 },
            cameraZoom: 1,
            setTempConnection: vi.fn()
        };
        inputHandler = new InputHandler(model, renderer);
        uiManager = new UIManager(model, renderer, inputHandler);
        inputHandler.setUIManager(uiManager);
    });

    it('should validate URLs and reject invalid formats', async () => {
        const bubble = { id: 'b1', type: 'bubble', x: 0, y: 0, text: 'Test' };
        model.elements.push(bubble);

        vi.spyOn(Modal, 'showPrompt').mockResolvedValue('invalid-url');
        const alertSpy = vi.spyOn(Modal, 'showAlert').mockResolvedValue();

        const actions = [];
        uiManager.showContextMenu({ x: 0, y: 0, hit: { type: 'element', element: bubble }, actions });

        const menu = document.getElementById('contextMenu');
        const linkBtn = menu.querySelector('[data-id="action-link"]');
        expect(linkBtn).toBeTruthy();

        linkBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid URL'));
        expect(bubble.link).toBeUndefined();
    });

    it('should show tooltip on hover over element with comment', () => {
        const bubble = { id: 'b1', type: 'bubble', x: 100, y: 100, text: 'Test', comment: 'My Comment', width: 100, height: 50, radiusX: 50, radiusY: 30 };
        model.elements.push(bubble);

        const updateSpy = vi.spyOn(uiManager, 'updateTooltip');
        const hideSpy = vi.spyOn(uiManager, 'hideTooltip');

        inputHandler.handleMouseMove({ clientX: 100, clientY: 100 });

        expect(updateSpy).toHaveBeenCalledWith(100, 100, 'My Comment');
        expect(hideSpy).not.toHaveBeenCalled();
    });

    it('should hide tooltip when moving away', () => {
        const bubble = { id: 'b1', type: 'bubble', x: 100, y: 100, text: 'Test', comment: 'My Comment', width: 100, height: 50, radiusX: 50, radiusY: 30 };
        model.elements.push(bubble);

        const hideSpy = vi.spyOn(uiManager, 'hideTooltip');
        // Move to 0,0 where no bubble exists
        inputHandler.handleMouseMove({ clientX: 0, clientY: 0 });

        expect(hideSpy).toHaveBeenCalled();
    });

    it('should open link on Alt+Click', () => {
        const bubble = { id: 'b1', type: 'bubble', x: 100, y: 100, text: 'Link', link: 'http://google.com', width: 100, height: 50, radiusX: 50, radiusY: 30 };
        model.elements.push(bubble);

        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => { });

        inputHandler.handleMouseDown({
            preventDefault: () => { },
            button: 0,
            clientX: 100, clientY: 100,
            altKey: true
        });

        expect(openSpy).toHaveBeenCalledWith('http://google.com', '_blank');
    });
});
