/**
 * @fileoverview Handles all Canvas drawing operations.
 * Reads the Model and renders the visual representation.
 */

import { COLORS, FONTS, CONFIG, ThemeManager } from '../Constants.js';

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

        // Config constants (Now from Constants.js)
        // this.MAX_ZOOM = CONFIG.maxZoom; // Accessed directly
        // this.MIN_ZOOM = CONFIG.minZoom;

        this.imageCache = new Map();
        this.tempConnection = null;

        // Handle resizing
        window.addEventListener('resize', () => this.draw());

        // Handle theme changes
        ThemeManager.onThemeChange(() => this.draw());
    }

    /**
     * Main draw loop.
     */
    draw() {
        // Reset canvas to full window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const ctx = this.ctx;

        // Fill background explicitly because transparent canvas defaults to valid web page bg, 
        // but we want to ensure we control it (especially for export/bundles).
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
        ctx.strokeStyle = isSelected ? COLORS.connectionSelected : COLORS.connectionNormal;
        ctx.lineWidth = isSelected ? (conn.weight || 1) + 2 : (conn.weight || 1);
        ctx.stroke();

        // Draw Label
        if (conn.label) {
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            ctx.font = `12px ${FONTS.fallback}`;
            const textWidth = ctx.measureText(conn.label).width;

            ctx.fillStyle = COLORS.background; // Use theme background for label bg
            ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20);

            ctx.fillStyle = COLORS.defaultText; // Use theme text for label
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

        // Resolve color pair if needed
        const resolvedColor = ThemeManager.resolveColor(el.color);

        ctx.fillStyle = resolvedColor || COLORS.background;
        ctx.strokeStyle = isSelected ? COLORS.selection : COLORS.outline;
        ctx.lineWidth = isSelected ? 4 : 2;

        if (el.type === 'bubble') {
            this.drawBubble(el, ctx);
        } else if (el.type === 'text') {
            this.drawText(el, ctx, isSelected);
        } else if (el.type === 'image') {
            this.drawImage(el, ctx, isSelected);
        }
    }

    /**
     * Draws a bubble element.
     * @param {Object} el - The bubble element to draw.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     */
    drawBubble(el, ctx) {
        // Use el.font directly if it looks like a full font string, otherwise fallback to constructing it
        ctx.font = el.font && el.font.includes('px') ? el.font : FONTS.fullString(el.fontSize, el.font);
        const lines = el.text.split('\n');
        let maxWidth = 0;
        lines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
        });

        // Padding settings
        const paddingX = CONFIG.bubblePaddingX;
        const paddingY = CONFIG.bubblePaddingY;
        const lineHeight = el.fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;

        // Determine dimensions
        const requiredRadiusX = (maxWidth / 2) + paddingX;
        const requiredRadiusY = (totalTextHeight / 2) + paddingY;

        // Force the size to match text content exactly (plus padding) to allow autosizing.
        // Adding 5% extra breathing room.
        // Minimum size set to 10 to avoid visibility issues.
        el.radiusX = Math.max(10, requiredRadiusX * 1.05);
        el.radiusY = Math.max(10, requiredRadiusY * 1.05);

        ctx.beginPath();
        ctx.ellipse(el.x, el.y, el.radiusX, el.radiusY, 0, 0, 2 * Math.PI);
        if (el.color !== 'transparent') ctx.fill();
        ctx.stroke();

        // Text drawing
        // Resolve text color against the bubble color or theme?
        // Usually black on light bubbles, white on dark bubbles.
        // If bubble color is 'light palette', we want black text.
        // If bubble color is 'dark pair', we want white text.
        // Simplest heuristic: if in dark mode, default text is white. 
        // But if the bubble color is explicitly 'white', text should be black?
        // Let's stick to theme default text for now, but really "Text on Bubble" is complex.
        // Assuming current bubbles are pastel, black text works.
        // In dark mode, bubbles are dark saturated, so white text works.
        // So checking ThemeManager.getColor('defaultText') is likely correct.

        ctx.fillStyle = COLORS.defaultText;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Fix: multiline text centering vertically
        const startY = el.y - (totalTextHeight - lineHeight) / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, el.x, startY + index * lineHeight);
        });

        // Indicators
        if (el.comment) this.drawIndicator(el.x + el.radiusX - 10, el.y - el.radiusY + 10, '...', COLORS.commentIndicator);
        if (el.link) this.drawIndicator(el.x + el.radiusX - 10, el.y - el.radiusY + 20, '🔗', COLORS.linkIndicator);
    }

    /**
     * Draws a text element.
     * @param {Object} el - The text element.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {boolean} isSelected - Whether the element is selected.
     */
    drawText(el, ctx, isSelected) {
        ctx.font = el.font && el.font.includes('px') ? el.font : FONTS.fullString(el.fontSize || 16, el.font);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Resolve color
        const resolvedColor = ThemeManager.resolveColor(el.color);
        ctx.fillStyle = resolvedColor || COLORS.defaultText; // Ensure color is set

        ctx.fillText(el.text, el.x, el.y);

        const textWidth = ctx.measureText(el.text).width;
        const textHeight = parseInt(el.font, 10); // A bit hacky but works for simple "16px ..." strings
        el.width = textWidth;
        el.height = textHeight;

        if (isSelected) {
            ctx.strokeStyle = COLORS.selection; // Hardcoded selected color
            ctx.strokeRect(el.x - 2, el.y - 2, textWidth + 4, textHeight + 4);
        }
    }

    /**
     * Draws an image element.
     * @param {Object} el - The image element.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {boolean} isSelected - Whether the element is selected.
     */
    drawImage(el, ctx, isSelected) {
        // Border if selected
        if (isSelected) {
            ctx.fillStyle = COLORS.imageBorder;
            ctx.fillRect(el.x, el.y, el.width, el.height);
            ctx.strokeRect(el.x, el.y, el.width, el.height);
            this.drawResizeHandles(el, ctx);
        }

        // Check for failed images first
        if (el.loadError) {
            this.drawImageError(el, ctx);
        } else {
            // Image content
            const img = this.imageCache.get(el.url);
            if (img) {
                try {
                    ctx.drawImage(img, el.x, el.y, el.width, el.height);
                } catch (e) {
                    this.drawImagePlaceholder(el, ctx);
                }
            } else {
                this.drawImagePlaceholder(el, ctx, el.loading);
                // Trigger load
                if (!el.loading) {
                    el.loading = true;
                    this.loadImage(el.url).then(() => {
                        el.loading = false;
                        el.loadError = false;
                        this.draw();
                    }).catch((err) => {
                        el.loading = false;
                        el.loadError = true;
                        console.error(`Failed to load image: ${el.url}`, err);
                        this.draw();
                    });
                }
            }
        }

        // Indicators
        if (el.comment) this.drawIndicator(el.x + el.width - 10, el.y + 10, '...', COLORS.commentIndicator);
        if (el.link && el.link !== el.url) this.drawIndicator(el.x + el.width - 10, el.y + 20, '🔗', COLORS.linkIndicator);
    }

    drawIndicator(x, y, text, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `8px ${FONTS.fallback}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Fix centering
        ctx.fillText(text, x, y);
    }

    drawResizeHandles(el, ctx) {
        const handleSize = CONFIG.resizeHandleSize;
        ctx.fillStyle = COLORS.resizeHandle;
        ctx.fillRect(el.x - handleSize / 2, el.y - handleSize / 2, handleSize, handleSize); // TL
        ctx.fillRect(el.x + el.width - handleSize / 2, el.y - handleSize / 2, handleSize, handleSize); // TR
        ctx.fillRect(el.x - handleSize / 2, el.y + el.height - handleSize / 2, handleSize, handleSize); // BL
        ctx.fillRect(el.x + el.width - handleSize / 2, el.y + el.height - handleSize / 2, handleSize, handleSize); // BR
    }

    drawImagePlaceholder(el, ctx, isLoading = false) {
        // Background
        ctx.fillStyle = COLORS.imagePlaceholder;
        ctx.fillRect(el.x, el.y, el.width, el.height);
        
        ctx.fillStyle = COLORS.imagePlaceholderText;
        ctx.font = `16px ${FONTS.fallback}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isLoading) {
            ctx.fillText('⏳', el.x + el.width / 2, el.y + el.height / 2 - 10);
            ctx.font = `12px ${FONTS.fallback}`;
            ctx.fillText('Loading...', el.x + el.width / 2, el.y + el.height / 2 + 10);
        } else {
            ctx.fillText('🖼️', el.x + el.width / 2, el.y + el.height / 2 - 10);
            const urlText = el.url.length > 20 ? el.url.substring(0, 20) + '...' : el.url;
            ctx.font = `12px ${FONTS.fallback}`;
            ctx.fillText(urlText, el.x + el.width / 2, el.y + el.height / 2 + 10);
        }
    }

    /**
     * Draws an error state for a failed image load.
     * @param {Object} el - The image element.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     */
    drawImageError(el, ctx) {
        // Error background
        ctx.fillStyle = '#ffebee'; // Light red background
        ctx.fillRect(el.x, el.y, el.width, el.height);
        
        // Error icon and message
        ctx.fillStyle = '#c62828'; // Dark red text
        ctx.font = `20px ${FONTS.fallback}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', el.x + el.width / 2, el.y + el.height / 2 - 15);
        
        ctx.font = `12px ${FONTS.fallback}`;
        ctx.fillText('Image failed to load', el.x + el.width / 2, el.y + el.height / 2 + 5);
        
        // Show truncated URL
        const urlText = el.url.length > 25 ? el.url.substring(0, 25) + '...' : el.url;
        ctx.fillStyle = '#666';
        ctx.font = `10px ${FONTS.fallback}`;
        ctx.fillText(urlText, el.x + el.width / 2, el.y + el.height / 2 + 22);
        
        // Retry hint
        ctx.fillStyle = '#1976d2';
        ctx.fillText('Double-click to retry', el.x + el.width / 2, el.y + el.height / 2 + 38);
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
        const padding = CONFIG.zoomExtentsPadding;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const scaleX = window.innerWidth / width;
        const scaleY = window.innerHeight / height;

        this.cameraZoom = Math.min(Math.min(scaleX, scaleY), 2); // Cap zoom at 2x
        if (this.cameraZoom < CONFIG.minZoom) this.cameraZoom = CONFIG.minZoom;

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
        ctx.strokeStyle = COLORS.connectionSelected;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
    }
}
