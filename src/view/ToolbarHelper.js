import { COLORS, ThemeManager } from '../Constants.js';

/**
 * Manages the top toolbar and color palette.
 */
export class ToolbarHelper {
    /**
     * @param {Object} model 
     * @param {Object} renderer 
     * @param {Object} uiManager 
     */
    constructor(model, renderer, uiManager) {
        this.model = model;
        this.renderer = renderer;
        this.uiManager = uiManager;

        this.setupToolbar();
        this.setupColorPalette();

        ThemeManager.onThemeChange(() => {
            this.setupColorPalette();
        });
    }

    setupToolbar() {
        const bind = (id, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', handler);
        };

        // Add Bubble
        bind('addBubbleBtn', () => {
            const center = this.renderer.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
            this.uiManager.showInputAt(center.x, center.y, '', null, 'bubble');
        });

        // Add Text
        bind('addTextBtn', () => {
            const center = this.renderer.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
            this.uiManager.showInputAt(center.x, center.y, '', null, 'text');
        });

        // Zoom Extents
        bind('zoomExtentsBtn', () => this.uiManager.zoomExtents());

        // Undo/Redo
        bind('undoBtn', () => {
            this.model.undo();
            this.renderer.draw();
        });
        bind('redoBtn', () => {
            this.model.redo();
            this.renderer.draw();
        });

        // Revert Layout (Stub)
        bind('revertLayoutBtn', () => {
            console.log('Revert Layout triggered');
        });

        // Export GEXF
        bind('exportGexfBtn', () => {
            if (this.model.toGEXF) {
                const gexf = this.model.toGEXF();
                if (gexf) {
                    const blob = new Blob([gexf], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mindmap-${Date.now()}.gexf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    console.log('Export GEXF triggered and downloaded');
                }
            } else {
                console.error('toGEXF method missing on model');
            }
        });

        // Help
        bind('helpBtn', () => {
            const modal = document.getElementById('helpModal');
            if (modal) modal.style.display = 'flex';
        });

        // Info/About
        bind('infoBtn', () => {
            const modal = document.getElementById('infoModal');
            if (modal) modal.style.display = 'flex';
        });

        // Close Modal Buttons
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const content = btn.closest('.modal-content');
                if (content && content.parentNode) content.parentNode.style.display = 'none';
            });
        });
    }

    setupColorPalette() {
        const paletteContainer = document.getElementById('colorPalette');
        if (!paletteContainer) return;

        const colors = COLORS.palette;
        paletteContainer.innerHTML = '';

        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = color;

            // Highlight the current default color
            if (this.model.defaultColor === color) {
                swatch.classList.add('selected');
            }

            swatch.onclick = (e) => {
                e.stopPropagation();

                // Remove selection from all swatches
                paletteContainer.querySelectorAll('.color-swatch').forEach(s => {
                    s.classList.remove('selected');
                });
                // Add selection to clicked swatch
                swatch.classList.add('selected');

                // Update selected element if it's a bubble
                if (this.model.selectedElement && this.model.selectedElement.type === 'bubble') {
                    this.model.updateElement(this.model.selectedElement.id, { color: color });
                    this.renderer.draw();
                }
                
                // Always set as default color for NEW bubbles
                this.model.setDefaultColor(color);
            };

            paletteContainer.appendChild(swatch);
        });
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.disabled = this.model.historyIndex <= 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.model.historyIndex >= this.model.history.length - 1;
        }
    }
}
