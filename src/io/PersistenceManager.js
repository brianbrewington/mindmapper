import { Modal } from '../view/Modal.js';
import { Loading } from '../view/Loading.js';
import { LocalStorageProvider } from './storage/LocalStorageProvider.js';
import { DriveStorageProvider } from './storage/DriveStorageProvider.js';
import { ThemeManager } from '../Constants.js';

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

        // Initialize storage providers
        const fileInput = document.getElementById('loadFile');
        this.providers = {
            local: new LocalStorageProvider({ fileInput }),
            drive: new DriveStorageProvider()
        };

        // Default to local storage
        this.activeProvider = this.providers.local;
    }

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

    /**
     * Prompts user to choose storage location and saves the mindmap.
     */
    async saveJSON() {
        const choice = await Modal.showStorageChoice();
        if (!choice) return; // User cancelled

        const provider = this.providers[choice];
        const data = {
            elements: this.model.elements,
            connections: this.model.connections,
            scenes: this.model.scenes,
            version: '1.0',
            theme: ThemeManager.getTheme()
        };

        try {
            Loading.show('Saving...');
            await provider.save('mindmap.json', JSON.stringify(data, null, 2), 'application/json');
        } catch (e) {
            console.error('Save failed:', e);
            alert('Failed to save file: ' + e.message);
        } finally {
            Loading.hide();
        }
    }

    /**
     * Prompts user to choose storage location and loads a mindmap.
     */
    async loadJSON() {
        const choice = await Modal.showStorageChoice();
        if (!choice) return; // User cancelled

        const provider = this.providers[choice];
        try {
            Loading.show('Loading...');
            const jsonString = await provider.load();
            this.loadFromJSONString(jsonString);
        } catch (e) {
            if (e !== 'No file selected' && e !== 'Cancelled') { // Ignore cancellation
                console.error('Load failed:', e);
                alert('Failed to load file: ' + e.message);
            }
        } finally {
            Loading.hide();
        }
    }

    /**
     * Creates a new empty mindmap after confirmation.
     */
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

            if (data.theme) {
                ThemeManager.setTheme(data.theme);
            }

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

    /**
     * Creates a self-contained HTML bundle ("Quine").
     * Reads the current page's HTML, injects the current model data into it,
     * and triggers a download of the new HTML file.
     */
    createBundle() {
        Loading.show('Creating bundle...');
        
        try {
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

            // Also hide the loading indicator itself before capturing
            const loader = document.getElementById('loadingIndicator');
            const loaderWasVisible = loader && loader.style.display !== 'none';
            if (loader) loader.style.display = 'none';

            if (overlayBackup) {
                overlayBackup.remove();
            }

            const htmlContent = document.documentElement.outerHTML;

            // Restore overlay
            if (overlayBackup && overlayParent) {
                overlayParent.appendChild(overlayBackup);
            }

            const bundleHTML = PersistenceManager.generateBundleHTML(htmlContent, data);
            // Always use local provider for bundle downloads
            this.providers.local.save(`mindmap_bundle_${new Date().toISOString().slice(0, 10)}.html`, bundleHTML, 'text/html');
        } finally {
            Loading.hide();
        }
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
