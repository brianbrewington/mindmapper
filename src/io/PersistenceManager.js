/**
 * @fileoverview Handles Persistence (Save/Load/Bundle).
 * Contains the logic for the "Quine" bundle creation.
 */

export class PersistenceManager {
    constructor(model, renderer, uiManager) {
        this.model = model;
        this.renderer = renderer;
        this.uiManager = uiManager;

        this.setupHandlers();
    }

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
     * Creates the self-contained bundle.
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
        const dataString = JSON.stringify(data);
        const encodedData = btoa(unescape(encodeURIComponent(dataString)));

        // 2. Get Current page HTML
        // In dev mode, we might not have a single file. 
        // But in the BUILT version (which is what the user distributes), 
        // document.documentElement.outerHTML contains the inlined app.
        let html = document.documentElement.outerHTML;

        // 3. Inject Persistence Logic Variable
        // We look for a placeholder or just inject it at the top of the script
        // For providing the "Quine" nature, we can simply inject/replace the variable definition.
        // In the built file, we expect: `window.embeddedDataEncoded = '...';` or similar.

        // Strategy: Look for the specific marker we output in our build or main.js
        // Or just append a script tag at the end if it's the first time?
        // Actually, to make it robust:
        // We should inject a script tag defining the variable right before the main logic runs.

        // Simple Regex replacement if the variable exists
        if (html.includes('const embeddedDataEncoded =')) {
            html = html.replace(/const embeddedDataEncoded = '[^']*';/, `const embeddedDataEncoded = '${encodedData}';`);
        } else {
            // If not present (e.g. first separate build), inject it into head or body
            // We can put it in a script block before the main module
            const injection = `<script>window.embeddedDataEncoded = '${encodedData}';</script>`;
            html = html.replace('</head>', `${injection}</head>`);
        }

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
}
