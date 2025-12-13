/**
 * @fileoverview Manages UI elements outside the canvas (Toolbar, Panels, Dialogs).
 */

export class UIManager {
    constructor(model, renderer, inputHandler) {
        this.model = model;
        this.renderer = renderer;
        this.inputHandler = inputHandler;

        this.setupToolbar();
        this.setupGlobalEvents();
    }

    setupToolbar() {
        const bind = (id, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', handler);
        };

        // Add Bubble
        bind('addBubbleBtn', () => {
            const center = this.renderer.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
            this.showInputAt(center.x, center.y);
        });

        // Add Text
        bind('addTextBtn', () => {
            // ... implementation
        });

        // Zoom Extents
        bind('zoomExtentsBtn', () => {
            // Calculate bounding box and update camera
        });

        // Undo/Redo
        bind('undoBtn', () => {
            this.model.undo();
            this.renderer.draw();
        });
        bind('redoBtn', () => {
            this.model.redo();
            this.renderer.draw();
        });

        // New
        bind('newBtn', () => {
            if (confirm('Start new mind map? Unsaved changes will be lost.')) {
                this.model.elements = [];
                this.model.connections = [];
                this.model.scenes = []; // Clear scenes too
                this.renderer.draw();
            }
        });

        // Auto Layout
        bind('forceLayoutBtn', () => {
            // Placeholder for force layout (requires d3 or custom algo)
            console.log('Auto Layout triggered');
            // this.model.applyLayout(); 
        });

        // Revert Layout
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

        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const content = btn.closest('.modal-content');
                if (content && content.parentNode) content.parentNode.style.display = 'none';
            });
        });

        // Scenes
        // Check if scene buttons exist (might be hidden or missing in some views)
        const addSceneBtn = document.getElementById('addSceneBtn');
        if (addSceneBtn) {
            this.setupScenesPanel();
        }

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

        document.addEventListener('requestContextMenu', (e) => {
            this.showContextMenu(e.detail);
        });

        // Hide context menu on global click
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    setupContextMenu() {
        // Ensure menu exists
        if (!this.contextMenu) {
            this.contextMenu = document.getElementById('contextMenu');
            if (!this.contextMenu) {
                this.contextMenu = document.createElement('div');
                this.contextMenu.id = 'contextMenu';
                this.contextMenu.className = 'context-menu';
                this.contextMenu.style.position = 'absolute';
                this.contextMenu.style.display = 'none';
                this.contextMenu.style.backgroundColor = 'white';
                this.contextMenu.style.border = '1px solid #ccc';
                this.contextMenu.style.padding = '5px';
                this.contextMenu.style.zIndex = '1000';
                this.contextMenu.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
                document.body.appendChild(this.contextMenu);
            }
        }
    }

    showContextMenu(detail) {
        this.setupContextMenu(); // Ensure element exists
        const menu = this.contextMenu;
        this.currentContextHit = detail.hit;
        this.currentContextPos = detail;

        // 1. Define Actions
        const getTarget = () => detail.hit.element || detail.hit.connection;

        const ACTIONS = {
            DELETE: {
                id: 'action-delete', label: 'Delete', icon: '🗑️',
                action: () => {
                    const target = getTarget();
                    if (detail.hit.type === 'connection') {
                        this.model.removeConnection(target.id);
                    } else if (target) {
                        this.model.removeElement(target.id);
                    }
                    this.renderer.draw();
                }
            },
            EDIT: {
                id: 'action-edit', label: 'Edit Text', icon: '✏️',
                action: () => {
                    const el = detail.hit.element;
                    this.showInputAt(el.x, el.y, el.text, el);
                }
            },
            GROW: {
                id: 'action-grow', label: 'Grow', icon: '➕',
                action: () => {
                    const el = detail.hit.element;
                    el.radiusX *= 1.2; el.radiusY *= 1.2;
                    this.renderer.draw();
                }
            },
            SHRINK: {
                id: 'action-shrink', label: 'Shrink', icon: '➖',
                action: () => {
                    const el = detail.hit.element;
                    el.radiusX /= 1.2; el.radiusY /= 1.2;
                    this.renderer.draw();
                }
            },
            ADD_BUBBLE: {
                id: 'action-add-bubble', label: 'Add Bubble Here', icon: '\uD83D\uDCAD',
                action: () => {
                    this.showInputAt(detail.worldX, detail.worldY);
                }
            },
            COMMENT: {
                id: 'action-comment', label: 'Comment', icon: '📝',
                action: () => {
                    document.getElementById('commentModal').style.display = 'flex';
                    const target = getTarget();
                    const comment = target.comment || '';
                    document.getElementById('commentDisplay').innerText = comment || '(No comment)';
                    // We need to know WHICH element/connection we are commenting on.
                    // The modal currently doesn't store the target reference securely.
                    // We should store it on the modal or UIManager
                    this.commentTarget = target;
                }
            },
            LINK: {
                id: 'action-link', label: 'Add Link', icon: '🔗',
                action: () => {
                    const target = getTarget();
                    const url = prompt('Enter URL:', target.link || '');
                    if (url !== null) target.link = url;
                }
            }
        };

        // 2. Resolve Config
        const type = detail.hit.type === 'element' ? detail.hit.element.type : (detail.hit.type || 'canvas');

        let validActions = [];
        if (type === 'bubble') {
            validActions = [ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.GROW, ACTIONS.SHRINK, ACTIONS.COMMENT, ACTIONS.LINK];
        } else if (type === 'image') {
            validActions = [ACTIONS.DELETE, ACTIONS.GROW, ACTIONS.SHRINK, ACTIONS.COMMENT, ACTIONS.LINK];
        } else if (type === 'text') {
            validActions = [ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.COMMENT, ACTIONS.LINK];
        } else if (type === 'connection') {
            validActions = [ACTIONS.DELETE, ACTIONS.COMMENT, ACTIONS.LINK];
        } else {
            // Background / Canvas
            validActions = [ACTIONS.ADD_BUBBLE];
        }

        // 3. Render
        menu.innerHTML = '';
        validActions.forEach(action => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.dataset.id = action.id; // For testing
            item.style.padding = '5px';
            item.style.cursor = 'pointer';
            item.style.display = 'block'; // Always block, logic handled by list presence
            item.textContent = `${action.icon} ${action.label}`;

            item.onclick = (e) => {
                e.stopPropagation();
                action.action();
                this.hideContextMenu();
            };

            // Hover effect
            item.onmouseover = () => item.style.backgroundColor = '#eee';
            item.onmouseout = () => item.style.backgroundColor = 'transparent';

            menu.appendChild(item);
        });

        // 4. Position
        menu.style.left = `${detail.x}px`;
        menu.style.top = `${detail.y}px`;
        menu.style.display = 'block';
    }

    hideContextMenu() {
        if (this.contextMenu) this.contextMenu.style.display = 'none';
        else {
            const el = document.getElementById('contextMenu');
            if (el) el.style.display = 'none';
        }
    }

    showInputAt(worldX, worldY, initialText = '', editingElement = null) {
        const input = document.getElementById('textInput');
        // Convert world to screen for positioning
        const screenPos = this.renderer.worldToScreen(worldX, worldY);

        input.style.display = 'block';
        input.style.left = `${screenPos.x}px`;
        input.style.top = `${screenPos.y}px`;
        input.value = initialText;
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
                    this.model.addElement({
                        type: 'bubble', id: Date.now(), x: worldX, y: worldY, text: text,
                        radiusX: 50, radiusY: 30, color: '#87CEEB', fontSize: 16
                    });
                    this.renderer.draw();
                }
            }
            cleanup();
        };

        input.onblur = commit;

        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                commit();
            }
            if (e.key === 'Escape') {
                cleanup();
            }
            // Shift+Enter allows default behavior (newline) which is what we want
        };
    }

    setupScenesPanel() {
        const toggleBtn = document.getElementById('toggleScenesBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const panel = document.getElementById('scenesPanel');
                if (panel) panel.classList.toggle('collapsed');
            });
        }

        const addBtn = document.getElementById('addSceneBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const name = `Scene ${this.model.scenes.length + 1}`;
                const viewport = {
                    zoom: this.renderer.cameraZoom,
                    offset: this.renderer.cameraOffset
                };
                this.model.addScene(name, viewport);
                this.renderScenesList();
            });
        }

        const playBtn = document.getElementById('playScenesBtn');
        const largePlayBtn = document.getElementById('largePlayBtn');
        const largeStopBtn = document.getElementById('largeStopBtn');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.isPlaying) this.stopPlayback();
                else this.playScenes();
            });
        }

        if (largePlayBtn) largePlayBtn.addEventListener('click', () => this.playScenes());
        if (largeStopBtn) largeStopBtn.addEventListener('click', () => this.stopPlayback());

        // Remove Scene Button
        const removeSceneBtn = document.getElementById('removeSceneBtn');
        if (removeSceneBtn) {
            removeSceneBtn.addEventListener('click', () => {
                const selected = document.querySelector('.scene-item.selected');
                if (selected) {
                    const list = document.getElementById('scenesList');
                    const index = Array.from(list.children).indexOf(selected);
                    if (index >= 0 && index < this.model.scenes.length) {
                        const name = this.model.scenes[index].name;
                        if (confirm(`Delete scene "${name}"?`)) {
                            this.model.scenes.splice(index, 1);
                            this.model.saveState();
                            this.renderScenesList();
                            this.updateSceneButtons();
                        }
                    }
                }
            });
        }
    }

    stopPlayback() {
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
        this.isPlaying = false;
        this.updateSceneButtons();
    }

    playScenes() {
        if (this.model.scenes.length === 0) return;
        this.isPlaying = true;
        this.updateSceneButtons();

        let index = 0;
        const playNext = () => {
            if (!this.isPlaying) return;

            const scene = this.model.scenes[index];
            this.model.restoreState(scene);
            if (scene.viewport && this.renderer) {
                this.renderer.cameraZoom = scene.viewport.zoom;
                this.renderer.cameraOffset = { ...scene.viewport.offset };
                this.renderer.draw();
            } else {
                this.renderer.draw();
            }

            // Highlight in list
            document.querySelectorAll('.scene-item').forEach(el => el.classList.remove('selected'));
            const listItems = document.querySelectorAll('.scene-item');
            if (listItems[index]) listItems[index].classList.add('selected');

            // Show Overlay
            const overlay = document.getElementById('sceneNameOverlay');
            if (overlay) {
                document.getElementById('currentSceneName').innerText = scene.name;
                overlay.style.display = 'block';
                setTimeout(() => { overlay.style.display = 'none'; }, 1000);
            }

            // Schedule next with variable delay
            const delay = scene.duration || 2000;
            index = (index + 1) % this.model.scenes.length;
            this.playbackTimer = setTimeout(playNext, delay);
        };

        playNext();
    }

    renderScenesList() {
        const list = document.getElementById('scenesList');
        if (!list) return;

        list.innerHTML = '';
        this.model.scenes.forEach((scene, index) => {
            const item = document.createElement('div');
            item.className = 'scene-item';

            // Context Menu for Scene
            item.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    hit: { type: 'scene', scene: scene }
                });
            };

            const nameSpan = document.createElement('span');
            nameSpan.className = 'scene-name';
            nameSpan.textContent = scene.name;

            item.onclick = () => {
                this.model.restoreState(scene);
                if (scene.viewport) {
                    this.renderer.cameraZoom = scene.viewport.zoom;
                    this.renderer.cameraOffset = { ...scene.viewport.offset };
                    this.renderer.draw();
                } else {
                    this.renderer.draw();
                }

                document.querySelectorAll('.scene-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedSceneIndex = index;
                this.updateSceneButtons(); // Enable Remove Scene button in panel
            };

            // Buttons Container
            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '2px';
            btnContainer.style.marginLeft = 'auto';

            // Stopwatch (Duration)
            const timeBtn = document.createElement('button');
            timeBtn.textContent = '⏱️';
            timeBtn.title = `Delay: ${scene.duration || 2000}ms`;
            timeBtn.style.padding = '2px 5px';
            timeBtn.onclick = (e) => {
                e.stopPropagation();
                const duration = prompt('Delay (ms):', scene.duration || 2000);
                if (duration) {
                    scene.duration = parseInt(duration, 10);
                    this.model.saveState();
                    this.renderScenesList(); // Re-render to update tooltip
                }
            };

            // Pencil (Rename)
            const renameBtn = document.createElement('button');
            renameBtn.textContent = '✏️';
            renameBtn.title = 'Rename Scene';
            renameBtn.style.padding = '2px 5px';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                const name = prompt('Rename Scene:', scene.name);
                if (name) {
                    scene.name = name;
                    this.model.saveState();
                    this.renderScenesList();
                }
            };

            // Trash (Delete)
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete Scene';
            deleteBtn.style.padding = '2px 5px';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete scene "${scene.name}"?`)) {
                    this.model.scenes.splice(index, 1);
                    this.model.saveState();
                    this.renderScenesList();
                }
            };

            btnContainer.appendChild(timeBtn);
            btnContainer.appendChild(renameBtn);
            btnContainer.appendChild(deleteBtn);

            item.appendChild(nameSpan);
            item.appendChild(btnContainer);
            list.appendChild(item);
        });

        this.updateSceneButtons(); // Initial state update
    }

    updateSceneButtons() {
        const removeBtn = document.getElementById('removeSceneBtn');
        const playBtn = document.getElementById('playScenesBtn');
        const largePlayBtn = document.getElementById('largePlayBtn');
        const largeStopBtn = document.getElementById('largeStopBtn');
        const selected = document.querySelector('.scene-item.selected');

        if (removeBtn) {
            removeBtn.disabled = !selected;
        }

        if (playBtn) {
            // Disable play if no scenes (already handled in startPlayback logic mostly)
            playBtn.disabled = this.model.scenes.length === 0;
        }
    }

    /* (IDEA) 2025-12-12
     * Summary: Non-blocking UI
     * Improvement: Variable prompts (window.prompt) block the main thread.
     * Replace with HTML overlays/modals for a smoother experience.
     * Test Plan: Verify focus management when modal opens/closes.
     */
}

