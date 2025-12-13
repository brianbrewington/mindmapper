import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasRenderer } from './CanvasRenderer.js';
import { MindMapModel } from '../model/MindMapModel.js';

describe('CanvasRenderer Rendering', () => {
    let model;
    let canvas;
    let ctx;
    let renderer;

    beforeEach(() => {
        model = new MindMapModel();
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        ctx = {
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
            ellipse: vi.fn(),
            fillText: vi.fn(),
            strokeRect: vi.fn(),
            fillRect: vi.fn(),
            measureText: vi.fn((text) => ({ width: text.length * 10 })), // Mock: 10px per char
        };

        canvas.getContext = vi.fn(() => ctx);

        renderer = new CanvasRenderer(canvas, model);
    });

    it('should scale bubble to fit long text', () => {
        const longText = 'This is a very long string that should overflow default size';
        // Mock measurement: 60 chars * 10 = 600px width.
        // Default radiusX is usually 50 (width 100).

        const element = {
            type: 'bubble',
            id: 1,
            x: 0,
            y: 0,
            text: longText,
            radiusX: 50, // Default
            radiusY: 30, // Default
            fontSize: 16,
            font: 'Arial'
        };

        model.addElement(element);

        // Render
        renderer.draw();

        // Capture the ellipse call
        // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
        const ellipseCalls = ctx.ellipse.mock.calls;
        expect(ellipseCalls.length).toBeGreaterThan(0);

        const [x, y, radiusX, radiusY] = ellipseCalls[0];

        // Expected width is ~ half of text width (since radius) + padding.
        // Text width = 600. Radius should be > 300.
        expect(radiusX).toBeGreaterThan(300);

        // Also verify radiusY grew if we had multiple lines? 
        // For this test, single line is fine, but let's assume it should at least fit height.
    });

    it('should shrink bubble when text becomes narrower', () => {
        // Setup: Bubble with long text
        const element = {
            type: 'bubble', id: 2, x: 0, y: 0,
            text: 'Long text line that makes bubble wide',
            radiusX: 50, radiusY: 30, fontSize: 16
        };
        model.addElement(element);
        renderer.draw();

        const widthWide = element.radiusX;

        // Change text to multiline (narrower)
        element.text = 'Long text line\nthat makes\nbubble wide';
        renderer.draw();

        const widthNarrow = element.radiusX;

        // Assert shrinking
        expect(widthNarrow).toBeLessThan(widthWide);
    });
});
