/**
 * @fileoverview Google Drive API Integration.
 * Handles Auth, File Picker, and Saving.
 */

// Placeholder keys - User must replace these
const API_KEY = 'YOUR_API_KEY';
const CLIENT_ID = 'YOUR_CLIENT_ID';

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export class DriveClient {
    constructor() {
        this.tokenClient = null;
        this.accessToken = null;
        this.isInitialized = false;

        // Ensure scripts are loaded? 
        // We assume index.html loads them or we dynamically load them.
        // For robustness, let's dynamic load if missing.
    }

    /**
     * loads the Google API scripts dynamically if not present.
     */
    async loadScripts() {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
            return;
        }

        const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });

        await Promise.all([
            loadScript('https://apis.google.com/js/api.js'),
            loadScript('https://accounts.google.com/gsi/client')
        ]);
    }

    /**
     * Initializes the gapi client.
     */
    async init() {
        if (this.isInitialized) return;
        await this.loadScripts();

        await new Promise((resolve) => gapi.load('client:picker', resolve));

        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        });

        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    this.accessToken = tokenResponse.access_token;
                }
            },
        });

        this.isInitialized = true;
    }

    /**
     * Requests auth token if needed.
     */
    async authenticate() {
        if (!this.isInitialized) await this.init();

        return new Promise((resolve, reject) => {
            if (this.accessToken) {
                // Verify validity? simpler to just return or try/catch.
                // gapi.client.setToken? 
                resolve(this.accessToken);
                return;
            }

            // Override callback for this specific request
            this.tokenClient.callback = (resp) => {
                if (resp.error) reject(resp);
                this.accessToken = resp.access_token;
                resolve(this.accessToken);
            };

            this.tokenClient.requestAccessToken({ prompt: '' });
        });
    }

    /**
     * Saves content to Drive.
     * @param {string} fileName 
     * @param {string} content (JSON string)
     */
    async saveFile(fileName, content) {
        await this.authenticate();

        // Check if file exists? For now, always create new or we need to track ID.
        // To replace "Save", usually we want to update if we opened it.
        // But for "Simple App", creating a new file is safer (Save As).
        // Let's implement CREATE only for now as per MVP.

        const fileContent = content;
        const file = new Blob([fileContent], { type: 'application/json' });
        const metadata = {
            'name': fileName,
            'mimeType': 'application/json',
        };

        const accessToken = this.accessToken;
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form,
        });

        const data = await response.json();
        console.log('Saved file:', data);
        return data;
    }

    /**
     * Opens Picker to load file.
     * @returns {Promise<string>} File content
     */
    async loadFile() {
        await this.authenticate();

        return new Promise((resolve, reject) => {
            const pickerCallback = async (data) => {
                if (data.action === google.picker.Action.PICKED) {
                    const fileId = data.docs[0].id;
                    const content = await this.readFileContent(fileId);
                    resolve(content);
                } else if (data.action === google.picker.Action.CANCEL) {
                    reject('Cancelled');
                }
            };

            const view = new google.picker.View(google.picker.ViewId.DOCS);
            view.setMimeTypes('application/json');

            const picker = new google.picker.PickerBuilder()
                .setDeveloperKey(API_KEY)
                .setAppId(CLIENT_ID)
                .setOAuthToken(this.accessToken)
                .addView(view)
                .setCallback(pickerCallback)
                .build();

            picker.setVisible(true);
        });
    }

    async readFileContent(fileId) {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return response.body;
    }
}

export const driveClient = new DriveClient();
