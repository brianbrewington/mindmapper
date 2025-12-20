
import { CONFIG } from '../Constants.js';
import { Modal } from './Modal.js';

/**
 * Manages the Scenes side panel and playback.
 */
export class ScenesPanel {
    constructor(model, renderer, uiManager) {
        this.model = model;
        this.renderer = renderer;
        this.uiManager = uiManager;

        this.isPlaying = false;
        this.playbackTimer = null;
        this.currentSceneIndex = -1;

        this.setupScenesPanel();
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

        const stepBtn = document.getElementById('stepSceneBtn');
        if (stepBtn) {
            stepBtn.addEventListener('click', () => {
                this.stepScene();
            });
        }
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
                // Delegate to UIManager or ContextMenu component through UIManager
                this.uiManager.showContextMenu({
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
                item.classList.add('dragging');
            });

            handle.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                document.querySelectorAll('.scene-item').forEach(el => el.classList.remove('drop-target'));
            });

            // Allow dropping ON the item
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
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
            nameSpan.title = scene.name;

            item.onclick = () => {
                this.uiManager.restoreSceneViewport(scene);
                document.querySelectorAll('.scene-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                this.currentSceneIndex = index; // Update local index
                this.updateSceneButtons();
            };

            // Buttons Container
            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '2px';
            btnContainer.style.marginLeft = 'auto';

            // Stopwatch
            const timeBtn = document.createElement('button');
            timeBtn.textContent = '⏱️';
            const currentSeconds = (scene.duration || CONFIG.defaultSceneDuration) / 1000;
            timeBtn.title = `Delay: ${currentSeconds}s`;
            timeBtn.style.padding = '2px 5px';
            timeBtn.onclick = (e) => {
                e.stopPropagation();
                const duration = prompt('Delay (seconds):', currentSeconds);
                if (duration) {
                    scene.duration = parseFloat(duration) * 1000;
                    this.model.saveState();
                    this.renderScenesList();
                }
            };

            // Pencil
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

            // Trash
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete Scene';
            deleteBtn.style.padding = '2px 5px';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete scene "${scene.name}"?`)) {
                    this.model.removeScene(scene.id);
                    this.renderScenesList();
                }
            };

            btnContainer.appendChild(timeBtn);
            btnContainer.appendChild(renameBtn);
            btnContainer.appendChild(deleteBtn);

            item.appendChild(handle);
            item.appendChild(nameSpan);
            item.appendChild(btnContainer);
            list.appendChild(item);
        });

        this.updateSceneButtons();
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
                    largePlayBtn.textContent = '⏹️';
                    largePlayBtn.title = 'Stop Scenes';
                } else {
                    largePlayBtn.textContent = '▶️';
                    largePlayBtn.title = 'Play Scenes';
                }
            }
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

            if (index >= this.model.scenes.length) index = 0;

            const scene = this.model.scenes[index];
            if (!scene) {
                this.stopPlayback();
                return;
            }

            this.uiManager.restoreSceneViewport(scene);
            this.highlightSceneInList(index);
            this.showSceneOverlay(scene);

            const delay = scene.duration || CONFIG.defaultSceneDuration;
            index = (index + 1) % this.model.scenes.length;

            this.playbackTimer = setTimeout(playNext, delay);
        };

        playNext();
    }

    stepScene() {
        if (this.model.scenes.length === 0) return;
        if (this.isPlaying) this.stopPlayback();

        if (this.currentSceneIndex === undefined) this.currentSceneIndex = -1;
        this.currentSceneIndex = (this.currentSceneIndex + 1) % this.model.scenes.length;

        const scene = this.model.scenes[this.currentSceneIndex];
        this.uiManager.restoreSceneViewport(scene);
        this.highlightSceneInList(this.currentSceneIndex);
        this.showSceneOverlay(scene);
    }

    highlightSceneInList(index) {
        document.querySelectorAll('.scene-item').forEach(el => el.classList.remove('selected'));
        const listItems = document.querySelectorAll('.scene-item');
        if (listItems[index]) listItems[index].classList.add('selected');
    }

    showSceneOverlay(scene) {
        const overlay = document.getElementById('sceneNameOverlay');
        const nameSpan = document.getElementById('currentSceneName');
        if (overlay && nameSpan) {
            nameSpan.textContent = scene.name;
            overlay.style.display = 'block';
            overlay.style.opacity = '1';

            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 300);
            }, 2000);
        }
    }
}
