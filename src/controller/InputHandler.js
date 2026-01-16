import { FONTS, CONFIG } from '../Constants.js';

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

        this.clipboard = null;
        this.connectionStartElement = null;

        this.setupEventListeners();
    }

    setUIManager(uiManager) {
        this.uiManager = uiManager;
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

        // Left click (Select/Drag or Complete Connection)
        if (e.button === 0) {
            const result = this.hitTest(pos.x, pos.y);

            // If connecting, ANY left click attempts to resolve the connection
            if (this.connectionStartElement) {
                this.handleConnectionStart(pos);
                return;
            }

            // Shift+Click on bubble -> Connect
            if (e.shiftKey && result.type === 'element' && result.element.type === 'bubble') {
                this.handleConnectionStart(pos);
                return;
            }

            if (result.type === 'resizeHandle') {
                this.resizingElement = result.element;
                this.resizeHandle = result.handle;
                this.startDrag(pos);
            } else if (result.type === 'element') {
                // Navigation (Alt + Click)
                if (e.altKey && result.element.link) {
                    let url = result.element.link;
                    if (!url.startsWith('http')) url = 'http://' + url;
                    window.open(url, '_blank');
                    return;
                }

                this.model.selectedElement = result.element;
                this.draggedElement = result.element;
                this.startDrag(pos);
            } else if (result.type === 'connection') {
                // Navigation (Alt + Click)
                if (e.altKey && result.connection.link) {
                    let url = result.connection.link;
                    if (!url.startsWith('http')) url = 'http://' + url;
                    window.open(url, '_blank');
                    return;
                }
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
            // Complete connection or Cancel
            if (result.type === 'element' && result.element.type === 'bubble' && result.element.id !== this.connectionStartElement.id) {
                // Determine weight? Default 1.
                this.model.addConnection(this.connectionStartElement.id, result.element.id);
            }
            // Always clear connection state after a second click (whether successful or not)
            this.connectionStartElement = null;
            this.canvas.classList.remove('connecting');
            this.renderer.setTempConnection(null, 0, 0); // Clear temp line
        } else {
            // Start connection (only if valid bubble)
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
            const worldMouse = this.renderer.screenToWorld(e.clientX, e.clientY);
            this.renderer.setTempConnection(this.connectionStartElement, worldMouse.x, worldMouse.y);
            this.renderer.draw();
            return;
        }

        // Tooltips
        if (this.uiManager) {
            const hit = this.hitTest(e.clientX, e.clientY);
            if (hit.type === 'element' && hit.element.comment) {
                this.uiManager.updateTooltip(e.clientX, e.clientY, hit.element.comment);
            } else if (hit.type === 'connection' && hit.connection.comment) {
                this.uiManager.updateTooltip(e.clientX, e.clientY, hit.connection.comment);
            } else {
                this.uiManager.hideTooltip();
            }
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
    }

    handleResizeShortcut(direction) {
        const selected = this.model.selectedElement;
        if (!selected) return;

        // Bubble or Text Element
        if (selected.x !== undefined) {
            // Font Size (Both Bubble and Text)
            if (selected.fontSize) {
                selected.fontSize = Math.max(8, selected.fontSize + (direction * 2));
                // Update font string safely
                // Ensure we keep the font family if possible, or default to 'Poppins'
                let fontFamily = FONTS.family;
                if (selected.font) {
                    // Try to preserve existing family
                    const match = selected.font.match(/px\s+(.*)$/);
                    if (match && match[1]) fontFamily = match[1];
                }
                selected.font = FONTS.fullString(selected.fontSize, fontFamily);
            }

            // Bubble Specific (Radius)
            // Radius is calculated automatically by CanvasRenderer.drawBubble based on text size
            // So we don't need to manually scale it here.
        }
        // Connection
        else if (selected.from !== undefined) {
            selected.weight = Math.max(1, (selected.weight || 1) + direction);
        }

        this.model.saveState();
        this.renderer.draw();
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

        this.renderer.cameraZoom = Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, this.renderer.cameraZoom - zoomAmount));

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
        } else if (hit.type === 'element' && hit.element.type === 'image' && hit.element.loadError) {
            // Retry loading failed image
            hit.element.loadError = false;
            hit.element.loading = false;
            // Clear from cache to force reload
            this.renderer.imageCache.delete(hit.element.url);
            this.renderer.draw();
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
                } else if (this.model.selectedElement.from) {
                    // It's a connection
                    this.model.removeConnection(this.model.selectedElement.id);
                    this.model.selectedElement = null;
                    this.renderer.draw();
                }
            }
        }

        // Resize Shortcuts (+ / -)
        if (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '_') {
            const isGrow = (e.key === '=' || e.key === '+');
            this.handleResizeShortcut(isGrow ? 1 : -1);
        }

        // Copy / Paste
        if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
            this.handleCopy();
            e.preventDefault();
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === 'v' || e.key === 'V')) {
            this.handlePaste();
            e.preventDefault();
        }
    }

    handleCopy() {
        if (this.model.selectedElement) {
            // Deep copy to avoid reference issues
            this.clipboard = JSON.parse(JSON.stringify(this.model.selectedElement));
        }
    }

    handlePaste() {
        if (this.clipboard) {
            const newElement = JSON.parse(JSON.stringify(this.clipboard));
            // New ID
            newElement.id = Date.now() + Math.random();
            // Offset position
            if (newElement.x !== undefined && newElement.y !== undefined) {
                newElement.x += 20;
                newElement.y += 20;
            }
            // If it's a connection, we probably shouldn't paste it as-is unless we copy endpoints?
            // For now, let's only support ELEMENTS (bubbles, text, images).
            // Connections usually need from/to which might not be relevant if we just copy a connection.
            // Let's restrict to elements with x/y.
            if (newElement.x !== undefined && newElement.y !== undefined) {
                this.model.addElement(newElement);
                this.model.selectedElement = newElement;
                this.renderer.draw();
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
        // Calculate tolerance based on zoom (e.g., 10px screen space)
        const hitThreshold = CONFIG.connectionHitThreshold / this.renderer.cameraZoom;

        return this.model.hitTest(worldPos.x, worldPos.y, hitThreshold);
    }
}
