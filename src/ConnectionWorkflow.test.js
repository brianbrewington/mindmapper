import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MindMapModel } from './model/MindMapModel.js';
import { CanvasRenderer } from './view/CanvasRenderer.js';
import { InputHandler } from './controller/InputHandler.js';

describe('Connection Workflow', () => {
    let model;
    let renderer;
    let inputHandler;
    let canvas;

    beforeEach(() => {
        model = new MindMapModel();
        // Mock canvas and renderer methods
        canvas = document.createElement('canvas');
        canvas.classList.add = vi.fn();
        canvas.classList.remove = vi.fn();

        renderer = new CanvasRenderer(canvas, model);
        renderer.draw = vi.fn();
        renderer.setTempConnection = vi.fn();
        renderer.screenToWorld = vi.fn().mockReturnValue({ x: 0, y: 0 });

        inputHandler = new InputHandler(model, renderer);
    });

    it('should start connection mode on Shift-Click', () => {
        // Setup
        const bubble = { id: 1, type: 'bubble', x: 0, y: 0, radiusX: 50, radiusY: 30 };
        model.addElement(bubble);

        // Mock hit test to return bubble
        vi.spyOn(inputHandler, 'hitTest').mockReturnValue({ type: 'element', element: bubble });

        // Simulate Shift-Click
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
            button: 0,
            clientX: 0,
            clientY: 0
        });

        inputHandler.handleMouseDown(event);

        expect(inputHandler.connectionStartElement).toBe(bubble);
        expect(canvas.classList.add).toHaveBeenCalledWith('connecting');
    });

    it('should complete connection on subsequent Click', () => {
        // Setup state: Already connecting from A
        const bubbleA = { id: 1, type: 'bubble', x: 0, y: 0, radiusX: 50, radiusY: 30 };
        const bubbleB = { id: 2, type: 'bubble', x: 100, y: 100, radiusX: 50, radiusY: 30 };
        model.addElement(bubbleA);
        model.addElement(bubbleB);

        inputHandler.connectionStartElement = bubbleA;

        // Mock hit test to return Bubble B for the click
        vi.spyOn(inputHandler, 'hitTest').mockReturnValue({ type: 'element', element: bubbleB });
        vi.spyOn(model, 'addConnection');

        // Simulate Click (No Shift)
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            shiftKey: false, // Normal click
            button: 0,
            clientX: 100,
            clientY: 100
        });

        inputHandler.handleMouseDown(event);

        // Verify connection added
        expect(model.addConnection).toHaveBeenCalledWith(1, 2);
        // Verify reset
        expect(inputHandler.connectionStartElement).toBeNull();
        expect(canvas.classList.remove).toHaveBeenCalledWith('connecting');
    });

    it('should cancel connection on Click background', () => {
        // Setup state: Connecting from A
        const bubbleA = { id: 1, type: 'bubble', x: 0, y: 0 };
        model.addElement(bubbleA);
        inputHandler.connectionStartElement = bubbleA;

        // Mock hit test: None (background)
        vi.spyOn(inputHandler, 'hitTest').mockReturnValue({ type: 'none' });

        // Simulate Click
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: 500,
            clientY: 500
        });

        inputHandler.handleMouseDown(event);

        // Verify NO connection
        expect(model.connections.length).toBe(0);
        // Verify reset
        expect(inputHandler.connectionStartElement).toBeNull();
        expect(canvas.classList.remove).toHaveBeenCalledWith('connecting');
    });
});
