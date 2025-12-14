/**
 * @fileoverview Handles all Canvas drawing operations.
 * Reads the Model and renders the visual representation.
 */

export class CanvasRenderer {
    /**
     * @param {HTMLCanvasElement} canvas 
     * @param {MindMapModel} model 
     */
    constructor(canvas, model) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.model = model;

        /** @type {Object} Offset for panning */
        this.cameraOffset = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        /** @type {number} Zoom level */
        this.cameraZoom = 1;

        // Config constants
        this.MAX_ZOOM = 5;
        this.MIN_ZOOM = 0.1;

        this.imageCache = new Map();
        this.tempConnection = null;

        // Handle resizing
        window.addEventListener('resize', () => this.draw());
    }

    /**
     * Main draw loop.
     */
    draw() {
        // Reset canvas to full window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const ctx = this.ctx;

        // Apply camera transform
        ctx.save();
        ctx.translate(this.cameraOffset.x, this.cameraOffset.y);
        ctx.scale(this.cameraZoom, this.cameraZoom);

        // Draw Connections
        this.model.connections.forEach(conn => this.drawConnection(conn));

        // Draw Elements
        this.model.elements.forEach(el => this.drawElement(el));

        // Draw Temp Connection Line
        if (this.tempConnection) {
            this.drawTempConnection(this.tempConnection);
        }

        ctx.restore();
    }

    /**
     * Draws a single connection line.
     * @param {Object} conn 
     */
    drawConnection(conn) {
        const from = this.model.elements.find(el => el.id === conn.from);
        const to = this.model.elements.find(el => el.id === conn.to);

        if (!from || !to) return;

        // TODO: Pass selection state explicitly to decouple renderer from model internals
        const isSelected = (this.model.selectedElement && this.model.selectedElement.id === conn.id);

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = isSelected ? '#007bff' : '#999';
        ctx.lineWidth = isSelected ? (conn.weight || 1) + 2 : (conn.weight || 1);
        ctx.stroke();

        // Draw Label
        if (conn.label) {
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            ctx.font = '12px Poppins, sans-serif';
            const textWidth = ctx.measureText(conn.label).width;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20);

            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(conn.label, midX, midY);
        }
    }

    /**
     * Draws a single element (bubble, text, or image).
     * @param {Object} el 
     */
    drawElement(el) {
        const ctx = this.ctx;
        const isSelected = (this.model.selectedElement && this.model.selectedElement.id === el.id);

        ctx.fillStyle = el.color || '#ffffff';
        ctx.strokeStyle = isSelected ? '#007bff' : '#333';
        ctx.lineWidth = isSelected ? 4 : 2;

        if (el.type === 'bubble') {
            this.drawBubble(el, ctx);
        } else if (el.type === 'text') {
            this.drawText(el, ctx, isSelected);
        } else if (el.type === 'image') {
            this.drawImage(el, ctx, isSelected);
        }
    }

    drawBubble(el, ctx) {
        // Calculate required size based on text
        // Fix: Use el.font directly if it looks like a full font string
        // Otherwise fallback to constructing it
        ctx.font = el.font && el.font.includes('px') ? el.font : `${el.fontSize}px ${el.font || 'Poppins'}`;
        const lines = el.text.split('\n');
        let maxWidth = 0;
        lines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
        });

        // Padding settings
        const paddingX = 20;
        const paddingY = 15;
        const lineHeight = el.fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;

        // Determine dimensions (Minimum 50/30, but grow if needed)
        // Ellipse radius is half width/height
        const requiredRadiusX = (maxWidth / 2) + paddingX;
        const requiredRadiusY = (totalTextHeight / 2) + paddingY;

        // Use the larger of standard radius vs required
        // We prefer the model's stored radius (if user resized manually in future), 
        // but for now we assume defaults need to grow.
        // MODIFIED: We force the size to match text content exactly (plus padding)
        // This allows shrinking when text is reduced/broken into lines.
        // Ideally we would track if "manually resized" but for now autosizing is primary.
        // Also adding 5% extra breathing room
        // Also adding 5% extra breathing room
        // Allow shrinking below 50/30 if text is small. Use a smaller absolute min (e.g. 10) to avoid invisibility.
        el.radiusX = Math.max(10, requiredRadiusX * 1.05);
        el.radiusY = Math.max(10, requiredRadiusY * 1.05);

        ctx.beginPath();
        ctx.ellipse(el.x, el.y, el.radiusX, el.radiusY, 0, 0, 2 * Math.PI);
        if (el.color !== 'transparent') ctx.fill();
        ctx.stroke();

        // Text drawing
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Fix: multiline text centering vertically
        const startY = el.y - (totalTextHeight - lineHeight) / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, el.x, startY + index * lineHeight);
        });

        // Indicators
        if (el.comment) this.drawIndicator(el.x + el.radiusX - 10, el.y - el.radiusY + 10, '...', '#007bff');
        if (el.link) this.drawIndicator(el.x + el.radiusX - 10, el.y - el.radiusY + 20, '🔗', '#28a745');
    }

    drawText(el, ctx, isSelected) {
        ctx.font = el.font && el.font.includes('px') ? el.font : `${el.fontSize || 16}px ${el.font || 'Poppins'}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = el.color || '#000'; // Ensure color is set
        ctx.fillText(el.text, el.x, el.y);

        const textWidth = ctx.measureText(el.text).width;
        const textHeight = parseInt(el.font, 10); // A bit hacky but works for simple "16px ..." strings
        el.width = textWidth;
        el.height = textHeight;

        if (isSelected) {
            ctx.strokeStyle = '#007bff'; // Hardcoded selected color
            ctx.strokeRect(el.x - 2, el.y - 2, textWidth + 4, textHeight + 4);
        }
    }

    drawImage(el, ctx, isSelected) {
        // Border if selected
        if (isSelected) {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(el.x, el.y, el.width, el.height);
            ctx.strokeRect(el.x, el.y, el.width, el.height);
            this.drawResizeHandles(el, ctx);
        }

        // Image content
        const img = this.imageCache.get(el.url);
        if (img) {
            try {
                ctx.drawImage(img, el.x, el.y, el.width, el.height);
            } catch (e) {
                this.drawImagePlaceholder(el, ctx);
            }
        } else {
            this.drawImagePlaceholder(el, ctx);
            // Trigger load
            if (!el.loading) {
                el.loading = true;
                this.loadImage(el.url).then(() => {
                    el.loading = false;
                    this.draw();
                }).catch(() => { el.loading = false; });
            }
        }

        // Indicators
        if (el.comment) this.drawIndicator(el.x + el.width - 10, el.y + 10, '...', '#007bff');
        if (el.link && el.link !== el.url) this.drawIndicator(el.x + el.width - 10, el.y + 20, '🔗', '#28a745');
    }

    drawIndicator(x, y, text, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '8px Poppins';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Fix centering
        ctx.fillText(text, x, y);
    }

    drawResizeHandles(el, ctx) {
        const handleSize = 8;
        ctx.fillStyle = '#007bff';
        ctx.fillRect(el.x - handleSize / 2, el.y - handleSize / 2, handleSize, handleSize); // TL
        ctx.fillRect(el.x + el.width - handleSize / 2, el.y - handleSize / 2, handleSize, handleSize); // TR
        ctx.fillRect(el.x - handleSize / 2, el.y + el.height - handleSize / 2, handleSize, handleSize); // BL
        ctx.fillRect(el.x + el.width - handleSize / 2, el.y + el.height - handleSize / 2, handleSize, handleSize); // BR
    }

    drawImagePlaceholder(el, ctx) {
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Poppins';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖼️', el.x + el.width / 2, el.y + el.height / 2 - 10);

        const urlText = el.url.length > 20 ? el.url.substring(0, 20) + '...' : el.url;
        ctx.fillStyle = '#495057';
        ctx.font = '12px Poppins';
        ctx.fillText(urlText, el.x + el.width / 2, el.y + el.height / 2 + 10);
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            if (this.imageCache.has(url)) { resolve(this.imageCache.get(url)); return; }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.imageCache.set(url, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Zooms the camera to fit all content.
     */
    zoomToFit() {
        if (this.model.elements.length === 0) {
            this.cameraZoom = 1;
            this.cameraOffset = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.model.elements.forEach(el => {
            const rX = el.radiusX || el.width / 2 || 0;
            const rY = el.radiusY || el.height / 2 || 0;
            // Use approximate bounding box for bubbles/images
            if (el.x - rX < minX) minX = el.x - rX;
            if (el.x + rX > maxX) maxX = el.x + rX;
            if (el.y - rY < minY) minY = el.y - rY;
            if (el.y + rY > maxY) maxY = el.y + rY;
        });

        // Add padding
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const scaleX = window.innerWidth / width;
        const scaleY = window.innerHeight / height;

        this.cameraZoom = Math.min(Math.min(scaleX, scaleY), 2); // Cap zoom at 2x
        if (this.cameraZoom < 0.1) this.cameraZoom = 0.1;

        // Centering
        this.cameraOffset.x = window.innerWidth / 2 - centerX * this.cameraZoom;
        this.cameraOffset.y = window.innerHeight / 2 - centerY * this.cameraZoom;

        this.draw();
    }

    /**
     * Helper: Convert screen coordinates to world coordinates.
     * @param {number} x 
     * @param {number} y 
     * @returns {Object} {x, y}
     */
    screenToWorld(x, y) {
        return {
            x: (x - this.cameraOffset.x) / this.cameraZoom,
            y: (y - this.cameraOffset.y) / this.cameraZoom
        };
    }

    /**
     * Helper: Convert world coordinates to screen.
     * @param {number} x 
     * @param {number} y 
     * @returns {Object} {x, y}
     */
    worldToScreen(x, y) {
        return {
            x: x * this.cameraZoom + this.cameraOffset.x,
            y: y * this.cameraZoom + this.cameraOffset.y
        };
    }

    /**
     * Sets the temporary connection line state.
     * @param {Object|null} startElement 
     * @param {number} worldX 
     * @param {number} worldY 
     */
    setTempConnection(startElement, worldX, worldY) {
        if (!startElement) {
            this.tempConnection = null;
        } else {
            this.tempConnection = { start: startElement, end: { x: worldX, y: worldY } };
        }
    }

    /**
     * Draws the temporary connection line.
     * @param {Object} temp 
     */
    drawTempConnection(temp) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(temp.start.x, temp.start.y);
        ctx.lineTo(temp.end.x, temp.end.y);
        ctx.strokeStyle = '#007bff';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
    }
}
