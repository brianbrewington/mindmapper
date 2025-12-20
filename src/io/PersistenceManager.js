/**
 * @fileoverview Handles Persistence (Save/Load/Bundle).
 * Contains the logic for the "Quine" bundle creation.
 */

import { Modal } from '../view/Modal.js';

export class PersistenceManager {
    /**
     * @param {MindMapModel} model - The data model.
     * @param {CanvasRenderer} renderer - The canvas renderer.
     * @param {UIManager} uiManager - The UI manager.
     */
    constructor(model, renderer, uiManager) {
        this.model = model;
        this.renderer = renderer;
        this.uiManager = uiManager;

        this.setupHandlers();
    }

    /**
     * Sets up DOM event listeners for save/load operations.
     */
    setupHandlers() {
        document.getElementById('saveBtn').addEventListener('click', () => this.saveJSON());
        document.getElementById('loadBtn').addEventListener('click', () => {
            const btn = document.getElementById('loadBtn');
            const originalTitle = btn.title;
            btn.title = ''; // Clear title to remove tooltip immediately
            btn.blur();     // Remove focus

            // Restore title after a delay (long enough for dialog logic)
            setTimeout(() => {
                btn.title = originalTitle;
            }, 500);

            // Open dialog with slight delay to ensure UI updates first
            setTimeout(() => {
                document.getElementById('loadFile').click();
            }, 50);
        });
        document.getElementById('loadFile').addEventListener('change', (e) => this.loadJSON(e));
        document.getElementById('bundleBtn').addEventListener('click', () => this.createBundle());
        document.getElementById('newBtn').addEventListener('click', async () => this.newMap());
    }

    /**
     * Loads embedded data if present (from the bundle).
     */
    /**
     * Loads embedded data if present (from the bundle).
     */
    loadEmbeddedData() {
        if (typeof window.embeddedDataEncoded !== 'undefined') {
            try {
                // Decode: Base64 -> URI Component -> String
                const jsonString = decodeURIComponent(escape(atob(window.embeddedDataEncoded)));
                console.log(`[Bundle] Decoded ${jsonString.length} chars of data.`);
                this.loadFromJSONString(jsonString);
                console.log('Embedded data loaded.');
            } catch (e) {
                console.error('Error loading embedded data:', e);
            }
        }
    }

    saveJSON() {
        const data = {
            elements: this.model.elements,
            connections: this.model.connections,
            scenes: this.model.scenes,
            version: '1.0'
        };
        this.downloadFile(JSON.stringify(data, null, 2), 'mindmap.json', 'application/json');
    }

    async newMap() {
        if (await Modal.showConfirm('Start new mind map? Unsaved changes will be lost.')) {
            const emptyState = {
                elements: [],
                connections: [],
                scenes: [],
                version: '1.0'
            };
            this.loadFromJSONString(JSON.stringify(emptyState));
        }
    }

    /**
     * Core loading logic.
     * Parses JSON string and restores state.
     * @param {string} jsonString 
     */
    loadFromJSONString(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.model.restoreState(data, true);

            if (this.uiManager && this.uiManager.renderScenesList) {
                this.uiManager.renderScenesList();
            }

            // Ensure content is visible
            if (this.uiManager && this.uiManager.zoomExtents) {
                this.uiManager.zoomExtents();
            } else if (this.renderer) {
                this.renderer.draw();
            }
        } catch (err) {
            console.error('Failed to load JSON:', err);
            alert('Invalid file');
        }
    }

    loadJSON(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.loadFromJSONString(ev.target.result);
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    /**
     * Creates a self-contained HTML bundle ("Quine").
     * Reads the current page's HTML, injects the current model data into it,
     * and triggers a download of the new HTML file.
     */
    createBundle() {
        console.log('Creating bundle...');
        const data = {
            elements: this.model.elements,
            connections: this.model.connections,
            scenes: this.model.scenes,
            version: '1.0',
            timestamp: new Date().toISOString()
        };

        // Clean up DOM before capturing
        // Remove DebugOverlay if present
        const overlays = document.querySelectorAll('div[style*="position: fixed"][style*="bottom: 10px"]');
        const overlayParent = overlays.length > 0 ? overlays[0].parentNode : null;
        const overlayBackup = overlays.length > 0 ? overlays[0] : null;

        if (overlayBackup) {
            overlayBackup.remove();
        }

        const htmlContent = document.documentElement.outerHTML;

        // Restore overlay
        if (overlayBackup && overlayParent) {
            overlayParent.appendChild(overlayBackup);
        }

        const bundleHTML = PersistenceManager.generateBundleHTML(htmlContent, data);
        this.downloadFile(bundleHTML, `mindmap_bundle_${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
    }

    downloadFile(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    /**
     * Injects the data into the HTML as a script tag.
     * @param {string} originalHtml 
     * @param {Object} data 
     * @returns {string} The HTML with data injected.
     */
    static generateBundleHTML(originalHtml, data) {
        const dataString = JSON.stringify(data);
        console.log(`[Bundle] Serializing ${data.elements.length} elements, ${data.connections.length} connections, ${data.scenes.length} scenes.`);

        // Encode: String -> URI Component -> Base64
        const encodedData = btoa(unescape(encodeURIComponent(dataString)));

        // Prepare the injection script with a specific ID for easy replacement
        // We use a robust ID to find this block later regardless of content changes.
        const scriptId = 'mindmap-data';
        const scriptContent = `window.embeddedDataEncoded = '${encodedData}';`;
        // Break the closing script tag to prevent HTML parser from terminating the script block early if this code is inlined.
        // Break the closing script tag to prevent HTML parser from terminating the script block early if this code is inlined.
        // We use decodeURIComponent('%3C') ('<') to prevent minifiers from combining the strings back into a literal closing script tag
        const closingTag = decodeURIComponent('%3C') + '/script>';
        const scriptTag = `<script id="${scriptId}">${scriptContent}${closingTag}`;

        let html = originalHtml;

        // Regex to find existing script tag by ID
        // matches the script tag with our specific ID
        // We use decodeURIComponent to prevent minifiers from creating a literal '<' that the regex would match.
        // This prevents the "Self-Eating Regex" bug where the regex matches its own definition in the bundled code.
        const regex = new RegExp(decodeURIComponent('%3Cscript id="mindmap-data">') + '[\\s\\S]*?' + decodeURIComponent('%3C/script>'));

        if (regex.test(html)) {
            console.log('[Bundle] Found existing embedded data script. Replacing...');
            html = html.replace(regex, scriptTag);
        } else {
            console.log('[Bundle] No existing data script found. Injecting new script tag.');
            // First time bundling: Inject into HEAD
            // First time bundling: Inject into HEAD
            const headEndIndex = html.lastIndexOf('</head>');
            if (headEndIndex !== -1) {
                // We use lastIndexOf because literal '</head>' strings might appear inside the minified JS/CSS logic
                // appearing earlier in the file. We want the REAL closing tag, which is consistently at the end of the head block.
                html = html.substring(0, headEndIndex) + scriptTag + html.substring(headEndIndex);
            } else {
                // Fallback: Prepend to HTML
                html = scriptTag + html;
            }
        }
        return html;
    }
}

