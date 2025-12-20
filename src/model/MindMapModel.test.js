import { describe, it, expect, beforeEach } from 'vitest';
import { MindMapModel } from './MindMapModel.js';

describe('MindMapModel', () => {
    let model;

    beforeEach(() => {
        model = new MindMapModel();
    });

    it('should start empty', () => {
        expect(model.elements).toHaveLength(0);
        expect(model.connections).toHaveLength(0);
    });

    it('should add an element', () => {
        model.addElement({ text: 'Hello' });
        expect(model.elements).toHaveLength(1);
        expect(model.elements[0].text).toBe('Hello');
        expect(model.elements[0].id).toBeDefined();
    });

    it('should remove an element', () => {
        const el = { id: '123', text: 'To Delete' };
        model.addElement(el);
        model.removeElement('123');
        expect(model.elements).toHaveLength(0);
    });

    it('should add a connection', () => {
        model.addElement({ id: 1, text: 'A' });
        model.addElement({ id: 2, text: 'B' });
        model.addConnection(1, 2);
        expect(model.connections).toHaveLength(1);
        expect(model.connections[0].from).toBe(1);
        expect(model.connections[0].to).toBe(2);
    });

    it('should prevent duplicate connections', () => {
        model.addElement({ id: 1, text: 'A' });
        model.addElement({ id: 2, text: 'B' });
        model.addConnection(1, 2);
        model.addConnection(2, 1); // Reverse
        model.addConnection(1, 2); // Duplicate
        expect(model.connections).toHaveLength(1);
    });

    it('should remove connections when an element is removed', () => {
        model.addElement({ id: 1, text: 'A' });
        model.addElement({ id: 2, text: 'B' });
        model.addConnection(1, 2);

        model.removeElement(1);
        expect(model.elements).toHaveLength(1);
        expect(model.connections).toHaveLength(0);
    });

    it('should manage undo/redo history', () => {
        // Initial state (length 1 due to constructor save)
        expect(model.history.length).toBe(1);

        model.addElement({ id: 1, text: 'Step 1' });

        // Save state happens automatically in addElement
        expect(model.history.length).toBe(2);

        model.addElement({ id: 2, text: 'Step 2' });
        expect(model.history.length).toBe(3);

        // Undo (back to Step 1)
        model.undo();
        expect(model.elements).toHaveLength(1);
        expect(model.elements[0].text).toBe('Step 1');

        // Undo again (back to empty)
        model.undo();
        expect(model.elements).toHaveLength(0);

        // Redo (back to Step 1)
        model.redo();
        expect(model.elements).toHaveLength(1);

        // Redo (back to Step 2)
        model.redo();
        expect(model.elements).toHaveLength(2);
    });

    it('should correctly hit-test bubbles', () => {
        model.addElement({
            id: 1, type: 'bubble',
            x: 100, y: 100,
            radiusX: 50, radiusY: 30
        });

        // Center hit
        let result = model.hitTest(100, 100);
        expect(result.type).toBe('element');
        expect(result.element.id).toBe(1);

        // Edge hit (approx)
        result = model.hitTest(149, 100);
        expect(result.type).toBe('element');

        // Miss
        result = model.hitTest(200, 200);
        expect(result.type).toBe('none');
    });

    it('should correctly hit-test connections', () => {
        model.addElement({ id: 1, type: 'bubble', x: 0, y: 0, radiusX: 10, radiusY: 10 });
        model.addElement({ id: 2, type: 'bubble', x: 100, y: 0, radiusX: 10, radiusY: 10 });
        model.addConnection(1, 2);

        // On the line
        let result = model.hitTest(50, 0, 10);
        expect(result.type).toBe('connection');

        // Near the line (within tolerance)
        result = model.hitTest(50, 5, 10);
        expect(result.type).toBe('connection');

        // Far from line
        result = model.hitTest(50, 20, 10);
        expect(result.type).toBe('none');
    });
});
