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

        /** @type {Object} Event listeners */
        this.listeners = {};

        // Save initial state
        this.saveState();

        /** @type {string} Default color for new bubbles */
        this.defaultColor = '#87CEEB';
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, payload) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(payload));
        }
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
        this.emit('historyChange', { index: this.historyIndex, length: this.history.length });
    }

    /**
     * Reverts to the previous state.
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.emit('historyChange', { index: this.historyIndex, length: this.history.length });
        }
    }

    /**
     * Re-applies the next state.
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.emit('historyChange', { index: this.historyIndex, length: this.history.length });
        }
    }

    /**
     * Restores the model from a state object.
     * @param {Object} state 
     */
    /**
     * Restores the model from a state object.
     * @param {Object} state - The state object containing elements, connection, and scene data.
     * @param {boolean} [pushToHistory=false] - Whether to save this restored state to history (default false).
     */
    restoreState(state, pushToHistory = false) {
        if (!state) return;
        if (state.elements) this.elements = JSON.parse(JSON.stringify(state.elements));
        if (state.connections) this.connections = JSON.parse(JSON.stringify(state.connections));
        if (state.scenes) {
            this.scenes = JSON.parse(JSON.stringify(state.scenes));
        }

        // Validate
        console.log(`Model state now: ${this.elements.length} elements.`);

        if (pushToHistory) {
            this.saveState();
        }
        console.groupEnd();
    }

    /**
     * Clears the entire model.
     */
    clear() {
        console.group('[MindMapModel] clear() called');
        console.trace(); // Who called me?
        this.elements = [];
        this.connections = [];
        this.scenes = [];
        this.history = [];
        this.historyIndex = -1;
        this.hasUnsavedChanges = false;
        // Should we save the empty state? Yes.
        this.saveState();
        console.groupEnd();
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
            // elements: JSON.parse(JSON.stringify(this.elements)), // No longer snapshotting data
            // connections: JSON.parse(JSON.stringify(this.connections)),
            viewport: viewport ? JSON.parse(JSON.stringify(viewport)) : null
        };
        this.scenes.push(scene);
        this.saveState();
    }

    /**
     * Removes a scene by ID.
     * @param {number} id 
     */
    removeScene(id) {
        this.scenes = this.scenes.filter(s => s.id !== id);
        this.saveState();
    }

    /**
     * Restores the model to a scene's viewpoint.
     * Note: This method currently only prepares the scene data. The actual camera movement
     * is handled by the UIManager/Renderer when they detect the scene change or via direct viewport application.
     * @param {Object} scene - The scene object to restore.
     */
    restoreScene(scene) {
        if (!scene) return;
        // Viewport restoration is handled by the consumer (UIManager/Renderer)
        // because the Model does not maintain camera state directly.
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

    /**
     * Updates an element's properties.
     * @param {string|number} id - Element ID.
     * @param {Object} props - Properties to update.
     */
    updateElement(id, props) {
        const el = this.elements.find(e => e.id === id);
        if (el) {
            Object.assign(el, props);
            this.saveState();
        }
    }

    /**
     * Updates a connection's properties.
     * @param {string|number} id - Connection ID.
     * @param {Object} props - Properties to update.
     */
    updateConnection(id, props) {
        const conn = this.connections.find(c => c.id === id);
        if (conn) {
            Object.assign(conn, props);
            this.saveState();
        }
    }

    /**
     * Sets the default color for new bubbles.
     * @param {string} color 
     */
    setDefaultColor(color) {
        this.defaultColor = color;
    }

    /**
     * Reorders a scene from one index to another.
     * @param {number} fromIndex 
     * @param {number} toIndex 
     */
    reorderScene(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.scenes.length || toIndex < 0 || toIndex >= this.scenes.length) {
            return;
        }

        // Remove from old position
        const [movedScene] = this.scenes.splice(fromIndex, 1);

        // Insert at new position
        this.scenes.splice(toIndex, 0, movedScene);

        this.saveState();
    }


    /**
     * Checks if a point (x,y) hits any element or connection.
     * @param {number} x World X coordinate
     * @param {number} y World Y coordinate
     * @param {number} tolerance Threshold for connection hits (default 10)
     * @returns {Object} Hit result { type, element/connection }
     */
    hitTest(x, y, tolerance = 10) {
        // Check elements in reverse Z-order (top to bottom)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];

            // Bubble Hit Test: Ellipsis
            if (el.type === 'bubble') {
                const dx = x - el.x;
                const dy = y - el.y;
                // Avoid divide by zero if radius is somehow 0 (though unlikely)
                const rx = el.radiusX || 1;
                const ry = el.radiusY || 1;
                if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
                    return { type: 'element', element: el };
                }
            }
            // Text/Image Hit Test: Rectangle
            else if (el.type === 'text' || el.type === 'image') {
                const w = el.width || 50;
                const h = el.height || 20;
                if (
                    x >= el.x &&
                    x <= el.x + w &&
                    y >= el.y &&
                    y <= el.y + h
                ) {
                    return { type: 'element', element: el };
                }
            }
        }

        // Check connections
        // Note: tolerance logic should be passed in scaled by zoom if needed
        for (let i = this.connections.length - 1; i >= 0; i--) {
            const conn = this.connections[i];
            const from = this.elements.find(e => e.id === conn.from);
            const to = this.elements.find(e => e.id === conn.to);

            if (!from || !to) continue;

            const x1 = from.x, y1 = from.y;
            const x2 = to.x, y2 = to.y;
            // Point to Line Segment Distance
            const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
            let param = -1;

            if (lenSq !== 0) {
                param = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lenSq;
            }

            let xx, yy;
            if (param < 0) { xx = x1; yy = y1; }
            else if (param > 1) { xx = x2; yy = y2; }
            else { xx = x1 + param * (x2 - x1); yy = y1 + param * (y2 - y1); }

            const dx = x - xx;
            const dy = y - yy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < tolerance) {
                return { type: 'connection', connection: conn };
            }
        }

        return { type: 'none' };
    }
}
