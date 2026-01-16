
import { Modal } from './Modal.js';
import { CONFIG } from '../Constants.js';

export class ContextMenu {
    constructor(model, renderer, uiManager) {
        this.model = model;
        this.renderer = renderer;
        this.uiManager = uiManager; // For callbacks like showInputAt

        this.menuElement = null;
        this.currentContextHit = null;
    }

    getMenuElement() {
        if (!this.menuElement) {
            this.menuElement = document.getElementById('contextMenu');
            if (!this.menuElement) {
                this.menuElement = document.createElement('div');
                this.menuElement.id = 'contextMenu';
                this.menuElement.className = 'context-menu';
                this.menuElement.style.position = 'absolute';
                this.menuElement.style.display = 'none';
                this.menuElement.style.backgroundColor = 'white';
                this.menuElement.style.border = '1px solid #ccc';
                this.menuElement.style.padding = '5px';
                this.menuElement.style.zIndex = '1000';
                this.menuElement.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
                document.body.appendChild(this.menuElement);
            }
        }
        return this.menuElement;
    }

    show({ x, y, hit, actions = [] }) {
        const menu = this.getMenuElement();
        menu.innerHTML = '';
        this.currentContextHit = hit;

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
                this.hide();
            };
            div.onmouseover = () => div.style.backgroundColor = '#eee';
            div.onmouseout = () => div.style.backgroundColor = 'transparent';
            menu.appendChild(div);
        };

        if (hit) {
            if (hit.type === 'scene') {
                this.addSceneActions(hit.scene, createOption);
                return;
            }

            // Standard actions if not passed in
            if (actions.length === 0) {
                this.populateStandardActions(hit, actions, x, y);
            }
        }

        actions.forEach(action => {
            createOption(action.label, action.action, action.id);
        });
    }

    hide() {
        const menu = this.getMenuElement();
        if (menu) menu.style.display = 'none';
    }

    addSceneActions(scene, createOption) {
        createOption('Rename', async () => {
            const name = await Modal.showPrompt('Rename Scene:', scene.name);
            if (name) {
                scene.name = name;
                this.model.saveState();
                // scenesPanel refresh handled via callbacks or state update? 
                // ideally UIManager or ScenesPanel listens to model changes or we explicitly refresh.
                // For now, let's call UIManager to refresh scenes list
                if (this.uiManager.scenesPanel) {
                    this.uiManager.scenesPanel.renderScenesList();
                }
            }
        }, 'action-rename');

        const currentDuration = (scene.duration || CONFIG.defaultSceneDuration) / 1000;
        createOption(`Duration (${currentDuration}s)`, async () => {
            const input = await Modal.showPrompt('Enter duration in seconds:', currentDuration);
            if (input) {
                const secs = parseFloat(input);
                if (!isNaN(secs) && secs > 0) {
                    scene.duration = secs * 1000;
                    this.model.saveState();
                }
            }
        }, 'action-duration');

        createOption('Delete', async () => {
            if (await Modal.showConfirm(`Delete scene "${scene.name}"?`)) {
                this.model.removeScene(scene.id);
                if (this.uiManager.scenesPanel) {
                    this.uiManager.scenesPanel.renderScenesList();
                }
            }
        }, 'action-delete');
    }

    populateStandardActions(hit, actions, x, y) { // x,y are screen coords
        if (hit.type === 'element') {
            const el = hit.element;
            if (el.type === 'bubble') {
                actions.push({ label: 'Edit', id: 'action-edit', action: () => this.uiManager.showInputAt(el.x, el.y, el.text, el) });
                actions.push({
                    label: 'Grow', id: 'action-grow',
                    action: () => {
                        el.fontSize = (el.fontSize || 16) + 2;
                        el.font = `normal ${el.fontSize}px ${el.fontFamily || 'Poppins, sans-serif'}`;
                        this.model.saveState();
                        this.renderer.draw();
                    }
                });
                actions.push({
                    label: 'Shrink', id: 'action-shrink',
                    action: () => {
                        el.fontSize = Math.max(8, (el.fontSize || 16) - 2);
                        el.font = `normal ${el.fontSize}px ${el.fontFamily || 'Poppins, sans-serif'}`;
                        this.model.saveState();
                        this.renderer.draw();
                    }
                });
                actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeElement(el.id) });
                actions.push({
                    label: 'Comment', id: 'action-comment',
                    action: () => this.openCommentModal(el)
                });
                actions.push({
                    label: 'Link', id: 'action-link',
                    action: () => this.addLink(el)
                });
            } else if (el.type === 'text') {
                actions.push({ label: 'Edit', id: 'action-edit', action: () => this.uiManager.showInputAt(el.x, el.y, el.text, el) });
                actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeElement(el.id) });
            } else if (el.type === 'image') {
                actions.push({ label: 'Grow', id: 'action-grow', action: () => { el.width *= 1.1; el.height *= 1.1; this.model.saveState(); this.renderer.draw(); } });
                actions.push({ label: 'Shrink', id: 'action-shrink', action: () => { el.width *= 0.9; el.height *= 0.9; this.model.saveState(); this.renderer.draw(); } });
                actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeElement(el.id) });
                // Images also support comments/links
                actions.push({
                    label: 'Comment', id: 'action-comment',
                    action: () => this.openCommentModal(el)
                });
                actions.push({
                    label: 'Link', id: 'action-link',
                    action: () => this.addLink(el)
                });
            }
        } else if (hit.type === 'connection') {
            const conn = hit.connection;
            actions.push({ label: 'Delete', id: 'action-delete', action: () => this.model.removeConnection(conn.id) });
            actions.push({
                label: 'Grow', id: 'action-grow',
                action: () => {
                    this.updateConnectionWeight(conn, 1);
                }
            });
            actions.push({
                label: 'Shrink', id: 'action-shrink',
                action: () => {
                    this.updateConnectionWeight(conn, -1);
                }
            });
            actions.push({
                label: 'Comment', id: 'action-comment',
                action: () => this.openCommentModal(conn)
            });
            actions.push({
                label: 'Link', id: 'action-link',
                action: () => this.addLink(conn)
            });
        } else if (hit.type === 'none' || hit.type === 'canvas') {
            actions.push({
                label: 'Add Bubble', id: 'action-add-bubble',
                action: () => {
                    this.uiManager.showInputAt(x, y);
                }
            });
        }
    }

    updateConnectionWeight(conn, delta) {
        const newWeight = Math.max(1, (conn.weight || 1) + delta);
        if (this.model.updateConnection) {
            this.model.updateConnection(conn.id, { weight: newWeight });
        } else {
            conn.weight = newWeight;
            this.model.saveState();
        }
        this.renderer.draw();
    }

    openCommentModal(target) {
        // We need to set commentTarget on UIManager so the modal knows what to edit
        this.uiManager.commentTarget = target;
        this.model.selectedElement = target;

        const modal = document.getElementById('commentModal');
        if (modal) {
            const display = document.getElementById('commentDisplay');
            const input = document.getElementById('commentEditInput');
            const editBtn = document.getElementById('editCommentBtn');
            const saveBtn = document.getElementById('saveCommentBtn');

            modal.style.display = 'flex';

            // Go directly to edit mode
            if (display) display.style.display = 'none';
            if (input) {
                input.style.display = 'block';
                input.value = target.comment || '';
                input.focus();
            }
            if (editBtn) editBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'inline-block';
        }
    }

    async addLink(target) {
        const url = await Modal.showPrompt('Enter URL:', target.link || 'http://');
        if (url) {
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (urlPattern.test(url)) {
                if (target.from && this.model.updateConnection) {
                    this.model.updateConnection(target.id, { link: url });
                } else {
                    target.link = url;
                    this.model.saveState();
                }
                this.renderer.draw();
            } else {
                await Modal.showAlert('Invalid URL format. Please enter a valid web address.');
            }
        }
    }
}
