import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';

describe('Scene Color Persistence', () => {
    let model, uiManager, renderer;

    beforeEach(() => {
        model = new MindMapModel();
        renderer = {
            draw: vi.fn(),
            screenToWorld: (x, y) => ({ x, y }),
            worldToScreen: (x, y) => ({ x, y }),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 }
        };
        uiManager = new UIManager(model, renderer, {});

        // Setup initial element
        model.addElement({ id: 'b1', x: 0, y: 0, text: 'Bubble', color: '#ffffff' });
    });

    it('should persist color changes across scenes', () => {
        // 1. Create Scene 1 (Snapshot Logic: Saves Bubble as White)
        model.addScene('Scene 1');

        // 2. Change Bubble Color to Red
        const bubble = model.elements[0];
        model.updateElement(bubble.id, { color: '#ff0000' });
        expect(bubble.color).toBe('#ff0000');

        // 3. Create Scene 2 (Snapshot Logic: Saves Bubble as Red)
        model.addScene('Scene 2');

        // 4. Go back to Scene 1
        // If Scenes restore FULL ELEMENT STATE, Scene 1 (saved when White) will revert the bubble to White.
        // The user EXPECTS Global Persistence, so it should REMAIN Red.
        uiManager.stepScene(); // Scene 1 (or specific restore)

        // Actually stepScene goes to Scene 1 (index 0) if called first time?
        // Let's use explicit restore to be sure.
        model.restoreState(model.scenes[0]);

        // VERIFY: Should still be Red
        expect(model.elements[0].color).toBe('#ff0000');
    });
});
