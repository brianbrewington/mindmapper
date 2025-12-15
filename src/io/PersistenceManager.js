/**
 * @fileoverview Handles Persistence (Save/Load/Bundle).
 * Contains the logic for the "Quine" bundle creation.
 */

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
        document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('loadFile').click());
        document.getElementById('loadFile').addEventListener('change', (e) => this.loadJSON(e));
        document.getElementById('bundleBtn').addEventListener('click', () => this.createBundle());
    }

    /**
     * Loads embedded data if present (from the bundle).
     */
    loadEmbeddedData() {
        // In the bundled file, 'embeddedDataEncoded' is injected as a global variable.
        // We need to access it safely.
        if (typeof window.embeddedDataEncoded !== 'undefined') {
            try {
                const decodedData = decodeURIComponent(escape(atob(window.embeddedDataEncoded)));
                const data = JSON.parse(decodedData);
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

    loadJSON(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                this.model.restoreState(data, true);
                if (this.uiManager && this.uiManager.renderScenesList) {
                    this.uiManager.renderScenesList();
                }
                this.renderer.draw();
            } catch (err) {
                alert('Invalid file');
            }
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

        // 1. Serialize Data
        const data = {
            elements: this.model.elements,
            connections: this.model.connections,
            scenes: this.model.scenes,
            timestamp: new Date().toISOString()
        };


        // 2. Get Current page HTML
        // In dev mode, we might not have a single file. 
        // But in the BUILT version (which is what the user distributes), 
        // document.documentElement.outerHTML contains the inlined app.


        // 3. Inject Persistence Logic Variable
        // We look for a placeholder or just inject it at the top of the script
        // For providing the "Quine" nature, we can simply inject/replace the variable definition.
        // In the built file, we expect: `window.embeddedDataEncoded = '...';` or similar.

        // Strategy: Look for the specific marker we output in our build or main.js
        // Or just append a script tag at the end if it's the first time?
        // Actually, to make it robust:
        // We should inject a script tag defining the variable right before the main logic runs.

        // 3. Generate HTML
        const html = PersistenceManager.generateBundleHTML(document.documentElement.outerHTML, data);

        this.downloadFile(html, `mindmap_bundle_${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Pure helper to generate the HTML bundle string.
     * @param {string} originalHtml 
     * @param {Object} data 
     * @returns {string} The new HTML with embedded data.
     */
    static generateBundleHTML(originalHtml, data) {
        const dataString = JSON.stringify(data);
        const encodedData = btoa(unescape(encodeURIComponent(dataString)));

        let html = originalHtml;
        // Simple Regex replacement if the variable exists
        if (html.includes('const embeddedDataEncoded =')) {
            html = html.replace(/const embeddedDataEncoded = '[^']*';/, `const embeddedDataEncoded = '${encodedData}';`);
        } else {
            // Check for window.embeddedDataEncoded injection style (legacy or manual)
            // Or our preferred method: const embeddedDataEncoded = '...'; in main.js
            // But main.js is a module, so globals are tricky.
            // Best bet: Inject a script tag in HEAD.

            // Removing old style injection if present to prevent duplicates (rudimentary check)
            // (omitted for simplicity, assuming clean state or standard injection)

            const injection = `<script>window.embeddedDataEncoded = '${encodedData}';</script>`;
            if (html.includes('</head>')) {
                html = html.replace('</head>', `${injection}</head>`);
            } else {
                html = injection + html;
            }
        }
        return html;
    }
}

