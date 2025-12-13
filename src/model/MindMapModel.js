/**
 * @fileoverview Core Data Model for the MindMap.
 * Manages the state of elements (nodes) and connections (edges).
 * This class should be pure logic and have no dependency on the DOM or Canvas.
 */

export class MindMapModel {
    constructor() {
        /** @type {Array<Object>} List of all elements (bubbles, text, images) */
        this.elements = [];

        /** @type {Array<Object>} List of all connections between bubbles */
        this.connections = [];

        /** @type {Array<Object>} List of saved scenes (viewports) */
        this.scenes = [];

        /** @type {Array<Object>} History stack for Undo */
        this.history = [];

        /** @type {number} Current index in history stack */
        this.historyIndex = -1;

        /** @type {boolean} Flag indicating if there are unsaved changes */
        this.hasUnsavedChanges = false;

        // Save initial state
        this.saveState();
    }

    /**
     * Adds a new element to the model.
     * @param {Object} element - The element object to add.
     */
    addElement(element) {
        // Ensure ID
        if (!element.id) element.id = Date.now() + Math.random();
        this.elements.push(element);
        this.saveState();
    }

    /**
     * Removes an element by ID.
     * also removes associated connections.
     * @param {string|number} id - The ID of the element to remove.
     */
    removeElement(id) {
        this.elements = this.elements.filter(el => el.id !== id);
        this.connections = this.connections.filter(conn => conn.from !== id && conn.to !== id);
        this.saveState();
    }

    /**
     * Adds a connection between two nodes.
     * @param {string|number} fromId 
     * @param {string|number} toId 
     */
    addConnection(fromId, toId) {
        // Check duplicates
        const exists = this.connections.some(c =>
            (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
        );
        if (!exists) {
            this.connections.push({
                id: Date.now() + Math.random(),
                from: fromId,
                to: toId,
                weight: 1
            });
            this.saveState();
        }
    }

    /**
     * Removes a connection by ID.
     * @param {string|number} id 
     */
    removeConnection(id) {
        this.connections = this.connections.filter(c => c.id !== id);
        this.saveState();
    }

    /**
     * Saves the current state to the history stack for Undo/Redo.
     */
    saveState() {
        // Remove future history if any
        this.history = this.history.slice(0, this.historyIndex + 1);

        const currentState = {
            elements: JSON.parse(JSON.stringify(this.elements)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            scenes: JSON.parse(JSON.stringify(this.scenes))
        };

        this.history.push(currentState);
        this.historyIndex++;
        this.hasUnsavedChanges = true;
    }

    /**
     * Reverts to the previous state.
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    /**
     * Re-applies the next state.
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    /**
     * Restores the model from a state object.
     * @param {Object} state 
     */
    /**
     * Restores the model from a state object.
     * @param {Object} state 
     * @param {boolean} pushToHistory - Whether to save this restored state to history (default false for simple restores, true for loads)
     */
    restoreState(state, pushToHistory = false) {
        if (!state) return;
        this.elements = JSON.parse(JSON.stringify(state.elements));
        this.connections = JSON.parse(JSON.stringify(state.connections));
        if (state.scenes) {
            this.scenes = JSON.parse(JSON.stringify(state.scenes));
        }
        if (pushToHistory) {
            this.saveState();
        }
    }

    /**
     * Clears the entire model.
     */
    clear() {
        this.elements = [];
        this.connections = [];
        this.scenes = [];
        this.history = [];
        this.historyIndex = -1;
        this.hasUnsavedChanges = false;
        // Should we save the empty state? Yes.
        this.saveState();
    }

    /**
     * Adds a new scene.
     * @param {string} name 
     * @param {Object} viewport - Optional {zoom, offset}
     */
    addScene(name, viewport = null) {
        const scene = {
            id: Date.now(),
            name: name,
            elements: JSON.parse(JSON.stringify(this.elements)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            viewport: viewport ? JSON.parse(JSON.stringify(viewport)) : null
        };
        this.scenes.push(scene);
        this.saveState();
    }

    /**
     * Exports current map to GEXF format.
     * @returns {string} XML string
     */
    toGEXF() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">\n';
        xml += '  <graph mode="static" defaultedgetype="directed">\n';
        xml += '    <nodes>\n';
        this.elements.forEach(el => {
            if (el.type === 'bubble') {
                xml += `      <node id="${el.id}" label="${el.text.replace(/"/g, '&quot;')}">\n`;
                // Add visual attributes if needed
                xml += `      </node>\n`;
            }
        });
        xml += '    </nodes>\n';
        xml += '    <edges>\n';
        this.connections.forEach(conn => {
            xml += `      <edge id="${conn.id}" source="${conn.from}" target="${conn.to}" />\n`;
        });
        xml += '    </edges>\n';
        xml += '  </graph>\n';
        xml += '</gexf>';
        return xml;
    }

    /* (IDEA) 2025-12-12
     * Summary: Spatial Indexing (Quadtree)
     * Improvement: For large mindmaps (1000+ nodes), finding elements by click (hit testing)
     * iterates the entire array. Implementing a Quadtree would reduce complexity from O(N) to O(logN).
     * Test Plan: Generate 10,000 nodes, benchmark hit-test performance before/after.
     * Benefit: Smoother interaction on massive maps.
     */
}
