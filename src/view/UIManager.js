/**
 * @fileoverview Manages UI elements outside the canvas (Toolbar, Panels, Dialogs).
 */

import { COLORS, FONTS, CONFIG, ThemeManager } from '../Constants.js';
// CONFIG is used for minZoom in animateToSceneViewport
import { Modal } from './Modal.js';
import { ToolbarHelper } from './ToolbarHelper.js';
import { ScenesPanel } from './ScenesPanel.js';
import { ContextMenu } from './ContextMenu.js';

export class UIManager {
    constructor(model, renderer, inputHandler) {
        this.model = model;
        this.renderer = renderer;
        this.inputHandler = inputHandler;

        this.toolbar = new ToolbarHelper(model, renderer, this);
        this.scenesPanel = new ScenesPanel(model, renderer, this);
        this.contextMenu = new ContextMenu(model, renderer, this);

        this.setupCommentModal();
        this.setupThemeToggle();
        this.setupGlobalEvents();

        // Listen to Model changes
        if (this.model.on) {
            this.model.on('historyChange', () => this.toolbar.updateUndoRedoButtons());
        }
        this.toolbar.updateUndoRedoButtons(); // Initial check

        this.setupTooltip();
        this.commentTarget = null;
    }

    setupTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'ui-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            display: none;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            max-width: 200px;
            word-wrap: break-word;
        `;
        document.body.appendChild(this.tooltip);
    }

    updateTooltip(x, y, text) {
        if (!this.tooltip) return;
        this.tooltip.textContent = text;
        this.tooltip.style.left = (x + 10) + 'px';
        this.tooltip.style.top = (y + 10) + 'px';
        this.tooltip.style.display = 'block';
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.style.display = 'none';
    }

    // Proxy methods for ToolbarHelper
    updateUndoRedoButtons() {
        this.toolbar.updateUndoRedoButtons();
    }

    // Proxy properties for ContextMenu (used by tests)
    get currentContextHit() {
        return this.contextMenu.currentContextHit;
    }

    // Proxy method for ScenesPanel
    renderScenesList() {
        this.scenesPanel.renderScenesList();
    }

    // Proxy method for ScenesPanel (used by PersistenceManager)
    stopPlayback() {
        this.scenesPanel.stopPlayback();
    }

    // Proxy for stepScene (used by tests)
    stepScene() {
        this.scenesPanel.stepScene();
    }

    // Proxy for playScenes (used by tests)
    playScenes() {
        this.scenesPanel.playScenes();
    }

    // Proxy for setupScenesPanel (used by tests, though constructor calls it)
    setupScenesPanel() {
        this.scenesPanel.setupScenesPanel();
    }

    // Proxy method for ContextMenu
    showContextMenu(detail) {
        this.contextMenu.show(detail);
    }

    hideContextMenu() {
        this.contextMenu.hide();
    }

    setupCommentModal() {
        const modal = document.getElementById('commentModal');
        const display = document.getElementById('commentDisplay');
        const input = document.getElementById('commentEditInput');
        const editBtn = document.getElementById('editCommentBtn');
        const saveBtn = document.getElementById('saveCommentBtn');

        // Edit Mode
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                display.style.display = 'none';
                input.style.display = 'block';
                const target = this.commentTarget || this.model.selectedElement;
                input.value = target ? (target.comment || '') : '';
                input.focus();
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
            });
        }

        // Save
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newComment = input.value;
                const target = this.commentTarget || this.model.selectedElement;

                if (target) {
                    if (target.type === 'connection' || target.from) {
                        // Check if model supports connection updates, else fallback or add method
                        if (this.model.updateConnection) {
                            this.model.updateConnection(target.id, { comment: newComment });
                        } else {
                            // Fallback if method missing (though we added it)
                            Object.assign(target, { comment: newComment });
                            this.model.saveState();
                        }
                    } else {
                        this.model.updateElement(target.id, { comment: newComment });
                    }

                    // Visual feedback updates
                    this.renderer.draw();
                }

                display.textContent = newComment;
                display.style.display = 'block';
                input.style.display = 'none';
                saveBtn.style.display = 'none';
                editBtn.style.display = 'inline-block';
            });
        }
    }


    setupThemeToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const current = ThemeManager.getTheme();
            const next = current === 'light' ? 'dark' : 'light';
            ThemeManager.setTheme(next);
            // Icon update handled by theme listener in main/setupTheme or here?
            // Let's do it here for button specific UI
            toggleBtn.textContent = next === 'light' ? '🌙' : '☀️';
            toggleBtn.title = next === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        });

        // Init icon
        const current = ThemeManager.getTheme();
        toggleBtn.textContent = current === 'light' ? '🌙' : '☀️';
    }

    setupGlobalEvents() {
        document.addEventListener('requestCreateBubble', (e) => {
            const { x, y } = e.detail;
            this.showInputAt(x, y);
        });

        document.addEventListener('requestEditBubble', (e) => {
            const { element } = e.detail;
            this.showInputAt(element.x, element.y, element.text, element);
        });

        document.addEventListener('requestEditText', (e) => {
            const { element } = e.detail;
            this.showInputAt(element.x, element.y, element.text, element, 'text');
        });

        document.addEventListener('requestContextMenu', (e) => {
            this.showContextMenu(e.detail);
        });

        // Hide context menu on global click
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    showInputAt(worldX, worldY, initialText = '', editingElement = null, type = 'bubble') {
        const input = document.getElementById('textInput');
        // Convert world to screen for positioning
        const screenPos = this.renderer.worldToScreen(worldX, worldY);

        input.style.display = 'block';
        input.style.left = `${screenPos.x}px`;
        input.style.top = `${screenPos.y}px`;
        input.value = initialText || '';
        input.focus();

        // One-time event listeners for this input session
        const cleanup = () => {
            input.style.display = 'none';
            input.onblur = null;
            input.onkeydown = null;
        };

        const commit = () => {
            const text = input.value.trim();
            if (text) {
                if (editingElement) {
                    editingElement.text = text;
                    // Trigger redraw
                    this.renderer.draw();
                } else {
                    const newElement = {
                        id: Date.now(), x: worldX, y: worldY, text: text,
                        fontSize: 16, font: '16px Lexend, sans-serif' // Shared defaults
                    };

                    if (type === 'bubble') {
                        Object.assign(newElement, {
                            type: 'bubble',
                            radiusX: 50, radiusY: 30, // Default, will auto-size
                            color: this.model.defaultColor || COLORS.defaultBubble
                        });
                    } else if (type === 'text') {
                        Object.assign(newElement, {
                            type: 'text'
                        });
                    }

                    this.model.addElement(newElement);
                    this.renderer.draw();
                }
            }
            cleanup();
        };

        // If we duplicate listeners, it causes bugs. 
        // This method overwrites them (onblur = ...) which is safe.
        input.onblur = commit;

        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                commit();
            }
            if (e.key === 'Escape') {
                cleanup();
            }
        };
    }

    /**
     * Zooms the camera to fit all elements in the view.
     */
    zoomExtents() {
        if (this.renderer && this.renderer.zoomToFit) {
            this.renderer.zoomToFit();
        }
    }

    /**
     * Helper to restore a scene's viewport to the renderer (instant, no animation).
     * @param {Object} scene 
     */
    restoreSceneViewport(scene) {
        if (!scene) return;
        if (scene.viewport && this.renderer) {
            this.renderer.cameraZoom = scene.viewport.zoom;
            this.renderer.cameraOffset = { ...scene.viewport.offset };
        }
        if (this.renderer) {
            this.renderer.draw();
        }
    }

    /**
     * Animates the camera to a scene's viewport with smooth easing.
     * @param {Object} scene - The scene to animate to.
     * @param {number} duration - Animation duration in ms (default 1500).
     * @returns {Promise<void>} Resolves when animation completes or is cancelled.
     */
    animateToSceneViewport(scene, duration = 1500) {
        if (!scene || !scene.viewport || !this.renderer) {
            return Promise.resolve();
        }

        // Cancel any existing animation
        if (this.currentAnimationCancel) {
            this.currentAnimationCancel();
            this.currentAnimationCancel = null;
        }

        return new Promise((resolve) => {
            const startZoom = this.renderer.cameraZoom;
            const startOffset = { ...this.renderer.cameraOffset };
            const targetZoom = scene.viewport.zoom;
            const targetOffset = scene.viewport.offset;
            const startTime = performance.now();
            let cancelled = false;

            this.currentAnimationCancel = () => {
                cancelled = true;
                resolve();
            };

            const animate = (currentTime) => {
                if (cancelled) return;

                const elapsed = currentTime - startTime;
                let progress = Math.min(elapsed / duration, 1);

                // Cubic ease-in-out for smooth acceleration/deceleration
                const eased = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                // Interpolate offset
                this.renderer.cameraOffset.x = startOffset.x + (targetOffset.x - startOffset.x) * eased;
                this.renderer.cameraOffset.y = startOffset.y + (targetOffset.y - startOffset.y) * eased;

                // Interpolate zoom with "whoosh" effect (slight squeeze in the middle)
                const interpolatedZoom = startZoom + (targetZoom - startZoom) * eased;
                const whooshFactor = 1 - 0.3 * (4 * progress * (1 - progress));
                this.renderer.cameraZoom = interpolatedZoom * whooshFactor;

                // Enforce minimum zoom
                if (this.renderer.cameraZoom < CONFIG.minZoom) {
                    this.renderer.cameraZoom = CONFIG.minZoom;
                }

                this.renderer.draw();

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure we land exactly on target
                    this.renderer.cameraZoom = targetZoom;
                    this.renderer.cameraOffset = { ...targetOffset };
                    this.renderer.draw();
                    this.currentAnimationCancel = null;
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }
}
