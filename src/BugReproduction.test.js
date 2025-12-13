import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';
import { InputHandler } from './controller/InputHandler.js';
// We need minimal mock for renderer
const mockRenderer = {
    canvas: {
        getContext: () => ({
            measureText: () => ({ width: 10 }),
            beginPath: () => { },
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fillText: () => { }
        }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        addEventListener: () => { },
        classList: { add: () => { }, remove: () => { } }
    },
    screenToWorld: (x, y) => ({ x, y }),
    worldToScreen: (x, y) => ({ x, y }),
    draw: () => { },
    cameraZoom: 1,
    cameraOffset: { x: 0, y: 0 }
};

describe('Bug Reproduction', () => {
    let model;

    beforeEach(() => {
        model = new MindMapModel();
    });

    it('Bug 1: Undo after load should not vanish map', () => {
        // 1. Load mock data (Simulating PersistenceManager.restoreState)
        const loadedData = {
            elements: [{ id: 1, type: 'bubble', text: 'Loaded' }],
            connections: []
        };
        model.restoreState(loadedData, true); // simulate PersistenceManager calling with 'true'

        // Critical Step: In the bug scenario, history probably wasn't updated here?
        // Let's verify our assumption: If restoreState DOES NOT save to history, then:
        // History: [Empty] (Index 0)

        // 2. Add a bubble
        model.addElement({ id: 2, type: 'bubble', text: 'New' });
        // History: [Empty, Loaded+New] (Index 1)

        // 3. Undo
        model.undo();
        // History Index 0 -> Empty

        // Expectation: The 'Loaded' bubble should be there.
        // If bug exists, it will be empty.
        expect(model.elements.find(el => el.text === 'Loaded')).toBeDefined();
    });

    it('Bug 2: Add Scene should work', () => {
        // Expectation: model has addScene method
        expect(typeof model.addScene).toBe('function');
        model.addScene('Scene 1');
        expect(model.scenes).toHaveLength(1);
    });

    it('Bug 3: Right click on edge/bubble should trigger menu', () => {
        // This requires Integration-like setup with InputHandler -> UIManager
        // But we can check if hitTest detects connections and if UIManager handles it.
        const inputHandler = new InputHandler(model, mockRenderer);
        const uiManager = new UIManager(model, mockRenderer, inputHandler);

        // Spy on showContextMenu
        const showMenuSpy = vi.spyOn(uiManager, 'showContextMenu');

        // Setup bubble and connection
        const b1 = { id: 1, type: 'bubble', x: 0, y: 0, radiusX: 50, radiusY: 50 };
        const b2 = { id: 2, type: 'bubble', x: 200, y: 200, radiusX: 50, radiusY: 50 };
        const conn = { id: 3, from: 1, to: 2 };
        model.elements = [b1, b2];
        model.connections = [conn];

        // Mock hitTest to return connection (since math is hard to mock perfectly without real renderer logic affecting it)
        // Actually, let's trust InputHandler.hitTest if it was working? 
        // No, current InputHandler code for connection hit test was "// ...". It was MISSING.
        // So we can assume it will return 'none'.

        // Force mock hitTest for this test to prove UIManager CAN handle it if InputHandler finds it
        // Or better: Fail because InputHandler won't find it.
        // Let's try to hit the bubble first (easier)

        // inputHandler.handleContextMenu({ clientX: 0, clientY: 0, preventDefault: () => {} });
        // Bubbles worked in previous test.

        // Now we can assert that hitTest actually returns the connection!
        const result = inputHandler.hitTest(100, 100);
        // 100,100 is indeed midpoint of (0,0) and (200,200)
        expect(result.type).toBe('connection');
        expect(result.connection.id).toBe(3);
    });

    it('Bug 4: Export GEXF should generate content', () => {
        model.elements = [{ id: 1, text: 'A', type: 'bubble' }, { id: 2, text: 'B', type: 'bubble' }];
        model.connections = [{ from: 1, to: 2 }];

        expect(typeof model.toGEXF).toBe('function');
        const output = model.toGEXF();
        expect(output).toContain('<?xml');
        expect(output).toContain('label="A"');
    });
});
