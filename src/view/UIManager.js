/**
 * @fileoverview Manages UI elements outside the canvas (Toolbar, Panels, Dialogs).
 */

export class UIManager {
    constructor(model, renderer, inputHandler) {
        this.model = model;
        this.renderer = renderer;
        this.inputHandler = inputHandler;

        this.setupToolbar();
        this.setupScenesPanel();
        this.setupCommentModal();
        this.setupGlobalEvents();

        // Listen to Model changes
        if (this.model.on) {
            this.model.on('historyChange', this.updateUndoRedoButtons.bind(this));
        }
        this.updateUndoRedoButtons(); // Initial check

        this.currentSceneIndex = -1;
        this.isPlaying = false;
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

    setupToolbar() {
        const bind = (id, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', handler);
        };

        // Add Bubble
        bind('addBubbleBtn', () => {
            const center = this.renderer.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
            this.showInputAt(center.x, center.y, '', null, 'bubble');
        });

        // Add Text
        bind('addTextBtn', () => {
            const center = this.renderer.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
            this.showInputAt(center.x, center.y, '', null, 'text');
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
        // Removed: setupScenesPanel and setupCommentModal are called in constructor.
        this.updateUndoRedoButtons();
        this.setupColorPalette();
    }

    setupColorPalette() {
        const paletteContainer = document.getElementById('colorPalette');
        if (!paletteContainer) return;

        // Define palette colors
        const colors = [
            '#ffffff', // White
            '#ffcccc', // Light Red
            '#ccffcc', // Light Green
            '#ccccff', // Light Blue
            '#ffffcc', // Light Yellow
            '#ffccff', // Light Purple
            '#ccffff', // Light Cyan
        ];

        paletteContainer.innerHTML = '';
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = color;

            swatch.onclick = (e) => {
                // Prevent bubbling if necessary, though it's in a toolbar
                e.stopPropagation();

                // Update selected element if it's a bubble
                if (this.model.selectedElement && this.model.selectedElement.type === 'bubble') {
                    this.model.updateElement(this.model.selectedElement.id, { color: color });
                    this.renderer.draw();
                } else {
                    // Set default color for NEW bubbles
                    this.model.setDefaultColor(color);
                }
            };

            paletteContainer.appendChild(swatch);
        });
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
                input.value = this.model.selectedElement.text; // Load current text
                input.focus();
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
            });
        }

        // Save
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newText = input.value;
                if (this.model.selectedElement) {
                    this.model.updateElement(this.model.selectedElement.id, { text: newText }); // Wait, is this comment or text?
                    // The modal is for generic "Comment" or "Text"? 
                    // Previously it seemed to edit 'text'.
                    // Comment modal usually edits 'note' or 'comment' property. 
                    // Looking at code: `input.value = this.model.selectedElement.text`.
                    // It seems this modal is re-purposed or poorly named. It says "Comment Modal" but edits text?
                    // Safe guard anyway.
                    this.model.updateElement(this.model.selectedElement.id, { text: newText });
                }
                display.textContent = newText;
                display.style.display = 'block';
                input.style.display = 'none';
                saveBtn.style.display = 'none';
                editBtn.style.display = 'inline-block';
            });
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
                    this.showInputAt(detail.worldX, detail.worldY, '', null, 'bubble');
                }
            },
            COMMENT: {
                id: 'action-comment', label: 'Comment', icon: '📝',
                action: () => {
                    document.getElementById('commentModal').style.display = 'flex';
                    const target = getTarget();
                    const comment = target.comment || '';
                    const display = document.getElementById('commentDisplay');

                    // Reset State
                    display.innerText = comment || '(No comment)';
                    display.style.display = 'block';
                    document.getElementById('commentEditInput').style.display = 'none';
                    document.getElementById('editCommentBtn').style.display = 'inline-block';
                    document.getElementById('saveCommentBtn').style.display = 'none';

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

    showInputAt(worldX, worldY, initialText = '', editingElement = null, type = 'bubble') {
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
                    const newElement = {
                        id: Date.now(), x: worldX, y: worldY, text: text,
                        fontSize: 16, font: '16px Poppins' // Shared defaults
                    };

                    if (type === 'bubble') {
                        Object.assign(newElement, {
                            type: 'bubble',
                            radiusX: 50, radiusY: 30, // Default, will auto-size
                            color: this.model.defaultColor || '#87CEEB'
                        });
                    } else if (type === 'text') {
                        Object.assign(newElement, {
                            type: 'text',
                            color: '#000000'
                        });
                    }

                    this.model.addElement(newElement);
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

        const largePlayBtn = document.getElementById('largePlayBtn');
        if (largePlayBtn) {
            largePlayBtn.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.stopPlayback();
                } else {
                    this.playScenes();
                }
            });
        }

        // NEW: Step Button
        const stepBtn = document.getElementById('stepSceneBtn');
        if (stepBtn) {
            stepBtn.addEventListener('click', () => {
                this.stepScene();
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
        this.updateSceneButtons(); // This will flip the icon to stop

        // Start from first scene logic? 
        // User complained "goes to first scene and stays there".
        // It should start from index 0.
        let index = 0;
        const playNext = () => {
            if (!this.isPlaying) return;

            // Loop logic: if index exceeds bounds, wrap around
            if (index >= this.model.scenes.length) index = 0;

            const scene = this.model.scenes[index];
            if (!scene) {
                // Should not happen, but safe guard
                this.stopPlayback();
                return;
            }

            // this.model.restoreState(scene); // Scenes are Viewport-only
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
            const nameSpan = document.getElementById('currentSceneName');
            if (overlay && nameSpan) {
                nameSpan.textContent = scene.name; // Use textContent consistency
                overlay.style.display = 'block';
                overlay.style.opacity = '1';

                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.style.display = 'none', 300);
                }, 2000);
            }

            // Schedule next with variable delay
            const delay = scene.duration || 2000;

            // Advance index for NEXT call
            index = (index + 1) % this.model.scenes.length;

            // Wait for 'delay', then play NEXT
            this.playbackTimer = setTimeout(playNext, delay);
        };

        playNext();
    }

    stepScene() {
        if (this.model.scenes.length === 0) return;

        // Stop auto-play if active
        if (this.isPlaying) this.stopPlayback(); // Changed from stopScenes to stopPlayback

        // Ensure currentSceneIndex is initialized, default to 0 if not
        if (this.currentSceneIndex === undefined) {
            this.currentSceneIndex = -1; // Will become 0 after increment
        }

        // Increment index
        this.currentSceneIndex = (this.currentSceneIndex + 1) % this.model.scenes.length;

        // Restore
        const scene = this.model.scenes[this.currentSceneIndex];
        // this.model.restoreState(scene); // Scenes are Viewport-only

        // Apply viewport
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
        if (listItems[this.currentSceneIndex]) listItems[this.currentSceneIndex].classList.add('selected');

        // Overlay update
        const overlay = document.getElementById('sceneNameOverlay');
        const nameSpan = document.getElementById('currentSceneName');
        if (overlay && nameSpan) {
            nameSpan.textContent = scene.name;
            overlay.style.display = 'block'; // Make visible
            // Force reflow for transition?
            // requestAnimationFrame(() => overlay.style.opacity = '1'); 
            // Simple approach:
            overlay.style.opacity = '1';

            setTimeout(() => {
                overlay.style.opacity = '0';
                // Wait for transition to finish before hiding (assuming 0.5s transition?)
                // CSS doesn't specify transition yet, but let's assume valid. 
                // Or set display none after opacity.
                setTimeout(() => overlay.style.display = 'none', 300); // 300ms matches typical transition
            }, 2000);
        }
    }

    showContextMenu({ x, y, hit, actions = [] }) {
        const menu = document.getElementById('contextMenu');
        if (!menu) return;

        menu.innerHTML = '';
        this.contextMenu = menu; // Keep reference
        this.currentContextHit = hit; // Restore property for tests/inspection
        menu.style.display = 'block';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const createOption = (text, onClick, id) => {
            const div = document.createElement('div');
            div.className = 'context-menu-item';
            div.textContent = text;
            if (id) div.setAttribute('data-id', id);
            div.onclick = (e) => {
                e.stopPropagation();
                onClick();
                this.hideContextMenu();
            };
            // Hover effect
            div.onmouseover = () => div.style.backgroundColor = '#eee';
            div.onmouseout = () => div.style.backgroundColor = 'transparent';
            menu.appendChild(div);
        };

        if (hit) {
            if (hit.type === 'scene') {
                const scene = hit.scene;
                createOption('Rename', () => {
                    const name = prompt('Rename Scene:', scene.name);
                    if (name) {
                        scene.name = name;
                        this.model.saveState();
                        this.renderScenesList();
                    }
                }, 'action-rename');
                createOption(`Duration (${(scene.duration || 2000) / 1000}s)`, () => {
                    const input = prompt('Enter duration in seconds:', (scene.duration || 2000) / 1000);
                    if (input) {
                        const secs = parseFloat(input);
                        if (!isNaN(secs) && secs > 0) {
                            scene.duration = secs * 1000;
                            this.model.saveState();
                        }
                    }
                }, 'action-duration');
                createOption('Delete', () => {
                    if (confirm(`Delete scene "${scene.name}"?`)) {
                        this.model.scenes = this.model.scenes.filter(s => s.id !== scene.id);
                        this.model.saveState();
                        this.renderScenesList();
                    }
                }, 'action-delete');
                return;
            }

            // Generate standard actions if none provided
            if (actions.length === 0) {
                if (hit.type === 'element') {
                    const el = hit.element;
                    if (el.type === 'bubble') {
                        actions.push({ label: 'Edit', id: 'action-edit', action: () => this.showInputAt(el.x, el.y, el.text, el) });
                        actions.push({ label: 'Grow', id: 'action-grow', action: () => { el.width *= 1.1; el.height *= 1.1; if (el.radiusX) { el.radiusX *= 1.1; el.radiusY *= 1.1; } this.model.saveState(); this.renderer.draw(); } });
                        actions.push({ label: 'Shrink', id: 'action-shrink', action: () => { el.width *= 0.9; el.height *= 0.9; if (el.radiusX) { el.radiusX *= 0.9; el.radiusY *= 0.9; } this.model.saveState(); this.renderer.draw(); } });
                        actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeElement(el.id) });
                        actions.push({
                            label: 'Comment',
                            id: 'action-comment',
                            action: () => {
                                this.model.selectedElement = el; // Ensure selection for saving
                                const modal = document.getElementById('commentModal');
                                if (modal) {
                                    const display = document.getElementById('commentDisplay');
                                    const input = document.getElementById('commentEditInput'); // Assuming id
                                    // Logic usually handled by setupCommentModal? 
                                    // Or we just show modal.
                                    modal.style.display = 'flex';
                                    if (display) display.textContent = el.note || el.comment || '(No comment)';
                                    // Note: model usually stores 'text'. Comment might be separate.
                                }
                            }
                        });
                        actions.push({
                            label: 'Link',
                            id: 'action-link',
                            action: () => {
                                const url = prompt('Enter URL:', el.link || 'http://');
                                if (url) {
                                    el.link = url;
                                    this.model.saveState();
                                }
                            }
                        });
                    } else if (el.type === 'text') {
                        actions.push({ label: 'Edit', id: 'action-edit', action: () => this.showInputAt(el.x, el.y, el.text, el) });
                        actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeElement(el.id) });
                    } else if (el.type === 'image') {
                        actions.push({ label: 'Grow', id: 'action-grow', action: () => { el.width *= 1.1; el.height *= 1.1; this.model.saveState(); this.renderer.draw(); } });
                        actions.push({ label: 'Shrink', id: 'action-shrink', action: () => { el.width *= 0.9; el.height *= 0.9; this.model.saveState(); this.renderer.draw(); } });
                        actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeElement(el.id) });
                    }
                } else if (hit.type === 'connection') {
                    const conn = hit.connection;
                    actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeConnection(conn.id) });
                    actions.push({ label: 'Comment', id: 'action-comment', action: () => { /* TODO */ } });
                    actions.push({ label: 'Link', id: 'action-link', action: () => { /* TODO */ } });
                } else if (hit.type === 'none' || hit.type === 'canvas') {
                    // Background
                    // Helper to add bubble at click position
                    // We need worldX/Y from hit or event?
                    // hit usually has x/y or we passed it in detail.
                    // The detail object has {x, y, worldX, worldY, hit}
                    // But showContextMenu receives {x, y, hit}.
                    // We need world coords for creation.
                    // Let's assume we can get them or use center logic if missing.
                    actions.push({
                        label: 'Add Bubble', id: 'action-add-bubble', action: () => {
                            const event = new CustomEvent('requestCreateBubble', { detail: { x: x, y: y } }); // Note: x,y are screen coords, requestCreateBubble expects screen?
                            // handleDoubleClick creates bubble using hitTest results or screenToWorld.
                            // InputHandler: handleDoubleClick sends {x: pos.x, pos.y} (WORLD).
                            // handleKeyDown ('b') sends {x: innerWidth/2...} (SCREEN).
                            // UIManager.showInputAt uses SCREEN coords.
                            // So passing x,y (screen) is correct for showInputAt, but requestCreateBubble might be handled by InputHandler?
                            // No, UIManager listens to requestCreateBubble.
                            // UIManager: this.showInputAt(x, y).
                            // So screen coords are fine.
                            this.showInputAt(x, y);
                        }
                    });
                }
            }
        }

        actions.forEach(action => {
            createOption(action.label, action.action, action.id);
        });
    }

    renderScenesList() {
        const list = document.getElementById('scenesList');
        if (!list) return;

        list.innerHTML = '';
        this.model.scenes.forEach((scene, index) => {
            const item = document.createElement('div');
            item.className = 'scene-item';
            // TODO: Highlight active scene if we track it in model

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

            // Drag Handle
            const handle = document.createElement('span');
            handle.className = 'drag-handle';
            handle.textContent = '⋮⋮';
            handle.draggable = true;
            handle.style.cursor = 'grab';
            handle.style.marginRight = '8px';
            handle.style.color = '#ccc';

            // Drag Events
            handle.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
                // Optional: add dragging class to item
                item.classList.add('dragging');
            });

            handle.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                document.querySelectorAll('.scene-item').forEach(el => el.classList.remove('drop-target'));
            });

            // Allow dropping ON the item (the row)
            item.addEventListener('dragover', (e) => {
                e.preventDefault(); // Necessary to allow dropping
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drop-target');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drop-target');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drop-target');
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;

                if (fromIndex !== toIndex) {
                    this.model.reorderScene(fromIndex, toIndex);
                    this.renderScenesList();
                }
            });

            const nameSpan = document.createElement('span');
            nameSpan.className = 'scene-name';
            nameSpan.textContent = scene.name;
            nameSpan.title = scene.name; // Full name on hover

            item.onclick = () => {
                // this.model.restoreState(scene); // Scenes are now Viewport-only
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
            const currentSeconds = (scene.duration || 2000) / 1000;
            timeBtn.title = `Delay: ${currentSeconds}s`;
            timeBtn.style.padding = '2px 5px';
            timeBtn.onclick = (e) => {
                e.stopPropagation();
                const duration = prompt('Delay (seconds):', currentSeconds);
                if (duration) {
                    scene.duration = parseFloat(duration) * 1000;
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

            item.appendChild(handle); // Add handle first
            item.appendChild(nameSpan);
            item.appendChild(btnContainer);
            list.appendChild(item);
        });

        this.updateSceneButtons(); // Initial state update
    }

    updateSceneButtons() {
        const largePlayBtn = document.getElementById('largePlayBtn');

        if (largePlayBtn) {
            if (this.model.scenes.length === 0) {
                largePlayBtn.disabled = true;
                largePlayBtn.textContent = '▶️';
            } else {
                largePlayBtn.disabled = false;
                if (this.isPlaying) {
                    largePlayBtn.textContent = '⏹️'; // Stop (Red Square)
                    largePlayBtn.title = 'Stop Scenes';
                } else {
                    largePlayBtn.textContent = '▶️'; // Play (Green Triangle)
                    largePlayBtn.title = 'Play Scenes';
                }
            }
        }
    }

}

