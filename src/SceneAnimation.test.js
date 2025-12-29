import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { UIManager } from './view/UIManager.js';
import { ScenesPanel } from './view/ScenesPanel.js';
import { CONFIG } from './Constants.js';

describe('Scene Animation Logic', () => {
    let model;
    let uiManager;
    let mockRenderer;
    let requestAnimationFrameMock;
    let cancelAnimationFrameMock;
    let frameCallbacks = [];

    beforeEach(() => {
        vi.useFakeTimers();

        // Mock requestAnimationFrame
        frameCallbacks = [];
        requestAnimationFrameMock = vi.fn((cb) => {
            frameCallbacks.push(cb);
            return frameCallbacks.length - 1;
        });
        cancelAnimationFrameMock = vi.fn();

        global.requestAnimationFrame = requestAnimationFrameMock;
        global.cancelAnimationFrame = cancelAnimationFrameMock;
        global.performance = { now: vi.fn(() => 0) };

        model = new MindMapModel();
        mockRenderer = {
            draw: vi.fn(),
            screenToWorld: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            worldToScreen: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            cameraZoom: 1,
            cameraOffset: { x: 0, y: 0 },
            zoomToFit: vi.fn()
        };

        // Mock DOM needed for UIManager/ScenesPanel
        document.body.innerHTML = `
            <div id="undoBtn"></div>
            <div id="scenesPanel"></div>
            <div id="themeToggle"></div>
            <div id="largePlayBtn"></div>
            <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
        `;

        uiManager = new UIManager(model, mockRenderer, {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should animate camera position and zoom over time', async () => {
        const startState = { zoom: 1, offset: { x: 0, y: 0 } };
        const targetState = { zoom: 2, offset: { x: 100, y: 100 } };
        const scene = { name: 'S1', viewport: targetState };

        mockRenderer.cameraZoom = startState.zoom;
        mockRenderer.cameraOffset = { ...startState.offset };

        const duration = 1000;
        const animationPromise = uiManager.animateToSceneViewport(scene, duration);

        // Advance time to 50%
        global.performance.now.mockReturnValue(500);

        // Trigger the frame
        if (frameCallbacks.length > 0) {
            frameCallbacks.shift()(500);
        }

        // At 50%, position should be roughly halfway (cubic ease-in-out at 0.5 is 0.5)
        // x: 0 -> 100 => 50
        expect(mockRenderer.cameraOffset.x).toBeCloseTo(50, 0);

        // Zoom check with Dip effect
        // Linear midpoint zoom would be 1.5
        // Parabolic dip at 0.5 is max influence.
        // zoomMultiplier = 1 - (0.3 * 1) = 0.7
        // expectedZoom = 1.5 * 0.7 = 1.05
        const expectedZoom = 1.5 * (1 - 0.3); // 1.05
        expect(mockRenderer.cameraZoom).toBeCloseTo(expectedZoom, 1);

        // Advance to end
        global.performance.now.mockReturnValue(1000);
        if (frameCallbacks.length > 0) {
            frameCallbacks.shift()(1000);
        }

        await animationPromise;

        // Should be exactly at target
        expect(mockRenderer.cameraOffset.x).toBe(100);
        expect(mockRenderer.cameraOffset.y).toBe(100);
        expect(mockRenderer.cameraZoom).toBe(2);
    });

    it('should clamp zoom to minZoom during animation', async () => {
        // Start very zoomed out (min zoom)
        mockRenderer.cameraZoom = CONFIG.minZoom;
        const targetState = { zoom: CONFIG.minZoom, offset: { x: 100, y: 100 } };
        const scene = { name: 'S1', viewport: targetState };

        const animationPromise = uiManager.animateToSceneViewport(scene, 1000);

        // Advance to 50%
        global.performance.now.mockReturnValue(500);
        if (frameCallbacks.length > 0) {
            frameCallbacks.shift()(500);
        }

        // Calculation: 
        // Base zoom = minZoom
        // Mul = 0.7
        // Result < minZoom
        // Should be clamped
        expect(mockRenderer.cameraZoom).toBe(CONFIG.minZoom);

        // Finish
        global.performance.now.mockReturnValue(1000);
        if (frameCallbacks.length > 0) frameCallbacks.shift()(1000);
        await animationPromise;
    });

    it(' ScenesPanel should wait for animation before playing next scene', async () => {
        model.addScene('S1', { zoom: 1, offset: { x: 0, y: 0 } });
        model.addScene('S2', { zoom: 1, offset: { x: 10, y: 10 } });

        const scenesPanel = uiManager.scenesPanel;
        const spyAnimate = vi.spyOn(uiManager, 'animateToSceneViewport');

        scenesPanel.playScenes();

        // Should start animation to S1 (index 0)
        expect(spyAnimate).toHaveBeenCalledWith(model.scenes[0], 2000);

        // Timer for next scene should NOT be set yet
        expect(scenesPanel.playbackTimer).toBeNull();

        // Resolve the first animation (manually by running frames) or mocking the promise?
        // Since we are using real code, we must pump frames.
        // It's easier if we just mock animateToSceneViewport for this test to control flow.
    });
});

// Separate suite for flow control with mocks
describe('Scene Playback Flow', () => {
    let model;
    let uiManager;
    let mockRenderer;

    beforeEach(() => {
        vi.useFakeTimers();
        model = new MindMapModel();
        mockRenderer = { draw: vi.fn(), cameraZoom: 1, cameraOffset: { x: 0, y: 0 } };

        // DOM Mock
        document.body.innerHTML = `
            <div id="scenesPanel"><div id="scenesList"></div></div>
            <div id="largePlayBtn"></div>
            <div id="sceneNameOverlay"><span id="currentSceneName"></span></div>
        `;

        uiManager = new UIManager(model, mockRenderer, {});
        // Mock animation to separate logic testing
        uiManager.animateToSceneViewport = vi.fn().mockResolvedValue();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('playSequence should flow correctly', async () => {
        model.addScene('S1', { zoom: 1, offset: { x: 0, y: 0 } });
        const s1 = model.scenes[0];
        s1.duration = 1000;

        const scenesPanel = uiManager.scenesPanel;

        scenesPanel.playScenes();

        // 1. Should animate to scene
        expect(uiManager.animateToSceneViewport).toHaveBeenCalledWith(s1, 2000);

        // Wait for async loop to proceed (simulation)
        await Promise.resolve();
        await Promise.resolve();

        // 2. Timer should be set for DWELL time (1000ms)
        expect(scenesPanel.playbackTimer).not.toBeNull();

        // Advance time
        vi.advanceTimersByTime(1000);

        // Should loop to next (or same if only 1)
        expect(uiManager.animateToSceneViewport).toHaveBeenCalledTimes(2);
    });
});
