/**
 * @fileoverview Handles Input logic (Mouse/Keyboard).
 * Maps raw DOM events to logical actions on the Model/View.
 */

export class InputHandler {
    /**
     * @param {MindMapModel} model 
     * @param {CanvasRenderer} renderer 
     */
    constructor(model, renderer) {
        this.model = model;
        this.renderer = renderer;
        this.canvas = renderer.canvas;

        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastMousePosition = { x: 0, y: 0 };
        this.draggedElement = null;
        this.resizingElement = null;
        this.resizeHandle = null;

        this.connectionStartElement = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // Prevent default context menu and dispatch custom event
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleContextMenu(e);
        });

        // Global key listener
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.canvas.focus();
        const pos = { x: e.clientX, y: e.clientY };

        // Middle click (Connect)
        if (e.button === 1) {
            this.handleConnectionStart(pos);
            return;
        }

        // Left click (Select/Drag)
        if (e.button === 0) {
            const result = this.hitTest(pos.x, pos.y);

            if (result.type === 'resizeHandle') {
                this.resizingElement = result.element;
                this.resizeHandle = result.handle;
                this.startDrag(pos);
            } else if (result.type === 'element') {
                this.model.selectedElement = result.element;
                this.draggedElement = result.element;
                this.startDrag(pos);
            } else if (result.type === 'connection') {
                this.model.selectedElement = result.connection;
            } else {
                this.model.selectedElement = null; // Deselect
                this.startDrag(pos); // Pan camera
            }

            this.renderer.draw();
        }
    }

    handleConnectionStart(pos) {
        const result = this.hitTest(pos.x, pos.y);
        if (this.connectionStartElement) {
            // Complete connection
            if (result.type === 'element' && result.element.type === 'bubble' && result.element.id !== this.connectionStartElement.id) {
                this.model.addConnection(this.connectionStartElement.id, result.element.id);
            }
            this.connectionStartElement = null;
            this.canvas.classList.remove('connecting');
        } else {
            // Start connection
            if (result.type === 'element' && result.element.type === 'bubble') {
                this.connectionStartElement = result.element;
                this.canvas.classList.add('connecting');
            }
        }
        this.renderer.draw();
    }

    handleMouseMove(e) {
        this.lastMousePosition = { x: e.clientX, y: e.clientY };

        if (this.connectionStartElement) {
            // Draw temp line (ideally handled by renderer using a state flag)
            // For simplicity, we just trigger a redraw and let renderer handle it if we passed the temp state
            // Currently Renderer doesn't support temp line drawing in its public API easily without state injection.
            // Let's implement a 'tempConnection' property on renderer or similar.
            // Simplest: direct context access here or modify render
            this.renderer.draw();

            // Draw temp line overlay manually (cleaner integration later)
            const ctx = this.renderer.ctx;
            const startEl = this.connectionStartElement;
            const worldMouse = this.renderer.screenToWorld(e.clientX, e.clientY);

            ctx.save();
            ctx.scale(this.renderer.cameraZoom, this.renderer.cameraZoom);
            ctx.translate(this.renderer.cameraOffset.x / this.renderer.cameraZoom, this.renderer.cameraOffset.y / this.renderer.cameraZoom);

            ctx.beginPath();
            ctx.moveTo(startEl.x, startEl.y);
            ctx.lineTo(worldMouse.x, worldMouse.y);
            ctx.strokeStyle = '#007bff';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (!this.isDragging) return;

        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;

        if (this.resizingElement) {
            this.handleResize(dx, dy);
        } else if (this.draggedElement) {
            // Move Element
            this.draggedElement.x += dx / this.renderer.cameraZoom;
            this.draggedElement.y += dy / this.renderer.cameraZoom;
        } else {
            // Pan Camera
            this.renderer.cameraOffset.x += dx;
            this.renderer.cameraOffset.y += dy;
        }

        this.dragStart = { x: e.clientX, y: e.clientY };
        this.renderer.draw();
    }

    handleResize(dx, dy) {
        const el = this.resizingElement;
        const worldDx = dx / this.renderer.cameraZoom;
        const worldDy = dy / this.renderer.cameraZoom;

        switch (this.resizeHandle) {
            case 'top-left': el.x += worldDx; el.y += worldDy; el.width -= worldDx; el.height -= worldDy; break;
            // ... handle other cases
        }
        // Simplified for brevity, need full implementation
    }

    handleMouseUp(e) {
        if (this.isDragging && (this.draggedElement || this.resizingElement)) {
            this.model.saveState();
        }
        this.isDragging = false;
        this.draggedElement = null;
        this.resizingElement = null;
        this.resizeHandle = null;
    }

    handleWheel(e) {
        e.preventDefault();
        const sensitivity = 0.001;
        const zoomAmount = e.deltaY * sensitivity;
        const worldBefore = this.renderer.screenToWorld(e.clientX, e.clientY);

        this.renderer.cameraZoom = Math.max(0.1, Math.min(5, this.renderer.cameraZoom - zoomAmount));

        const worldAfter = this.renderer.screenToWorld(e.clientX, e.clientY);
        this.renderer.cameraOffset.x += (worldAfter.x - worldBefore.x) * this.renderer.cameraZoom;
        this.renderer.cameraOffset.y += (worldAfter.y - worldBefore.y) * this.renderer.cameraZoom;

        this.renderer.draw();
    }

    handleDoubleClick(e) {
        const pos = this.renderer.screenToWorld(e.clientX, e.clientY);

        // Check if we clicked on an existing element
        const hit = this.hitTest(e.clientX, e.clientY);

        if (hit.type === 'element' && hit.element.type === 'bubble') {
            // Request Edit
            const event = new CustomEvent('requestEditBubble', { detail: { element: hit.element } });
            document.dispatchEvent(event);
        } else {
            // Request Create
            const event = new CustomEvent('requestCreateBubble', { detail: { x: pos.x, y: pos.y } });
            document.dispatchEvent(event);
        }
    }

    handleContextMenu(e) {
        const pos = this.renderer.screenToWorld(e.clientX, e.clientY);
        const hit = this.hitTest(e.clientX, e.clientY);

        const event = new CustomEvent('requestContextMenu', {
            detail: {
                x: e.pageX, // Document coordinates for absolute positioning
                y: e.pageY,
                worldX: pos.x,
                worldY: pos.y,
                hit: hit
            }
        });
        document.dispatchEvent(event);
    }

    handleKeyDown(e) {
        // Ignore shorts if editing text
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Shortcuts (Ctrl+Z, Delete, etc.)
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            if (e.shiftKey) {
                // Ctrl+Shift+Z = Redo
                this.model.redo();
            } else {
                // Ctrl+Z = Undo
                this.model.undo();
            }
            this.renderer.draw();
            e.preventDefault();
            return;
        }

        if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
            this.model.redo();
            this.renderer.draw();
            e.preventDefault();
            return;
        }

        if (e.key === 'z' && !e.metaKey && !e.ctrlKey) {
            this.renderer.zoomToFit();
        }

        if (e.key === 'b' || e.key === 'B') {
            const event = new CustomEvent('requestCreateBubble', {
                detail: {
                    x: window.innerWidth / 2, // Center of screen, not world yet (UIManager handles converting)
                    y: window.innerHeight / 2
                }
            });
            document.dispatchEvent(event);
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.model.selectedElement) {
                if (this.model.selectedElement.id && !this.model.selectedElement.from) {
                    this.model.removeElement(this.model.selectedElement.id);
                    this.model.selectedElement = null;
                    this.renderer.draw();
                }
            }
        }
    }

    startDrag(pos) {
        this.isDragging = true;
        this.dragStart = pos;
    }

    /**
     * Performs hit testing to find elements/connections at screen coordinates.
     * @param {number} x 
     * @param {number} y 
     * @returns {Object} { type: 'element'|'connection'|'none', element?: Object }
     */
    hitTest(x, y) {
        const worldPos = this.renderer.screenToWorld(x, y);

        // Check elements in reverse Z-order
        for (let i = this.model.elements.length - 1; i >= 0; i--) {
            const el = this.model.elements[i];
            // Simple circle/rect intersection
            if (el.type === 'bubble') {
                const dx = worldPos.x - el.x;
                const dy = worldPos.y - el.y;
                if ((dx * dx) / (el.radiusX * el.radiusX) + (dy * dy) / (el.radiusY * el.radiusY) <= 1) {
                    return { type: 'element', element: el };
                }
            }
            // ... text/image checks ...
        }

        // Check connections
        const threshold = 10 / this.renderer.cameraZoom; // 10px tolerance
        for (let i = this.model.connections.length - 1; i >= 0; i--) {
            const conn = this.model.connections[i];
            const from = this.model.elements.find(e => e.id === conn.from);
            const to = this.model.elements.find(e => e.id === conn.to);
            if (!from || !to) continue;

            // Distance from point to line segment
            const x1 = from.x, y1 = from.y;
            const x2 = to.x, y2 = to.y;
            const x0 = worldPos.x, y0 = worldPos.y;

            const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
            let param = -1;
            if (lenSq !== 0) // Avoid div by zero
                param = ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) / lenSq;

            let xx, yy;
            if (param < 0) { xx = x1; yy = y1; }
            else if (param > 1) { xx = x2; yy = y2; }
            else { xx = x1 + param * (x2 - x1); yy = y1 + param * (y2 - y1); }

            const dx = x0 - xx;
            const dy = y0 - yy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < threshold) {
                return { type: 'connection', connection: conn };
            }
        }

        return { type: 'none' };
    }
}
