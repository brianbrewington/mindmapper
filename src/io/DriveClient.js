/**
 * @fileoverview Google Drive API Integration.
 * Handles Auth, File Picker, and Saving.
 */

// Configuration - User must replace these with real values for Drive to work
const CONFIG = {
    GOOGLE: {
        CLIENT_ID: 'YOUR_CLIENT_ID_HERE',
        API_KEY: 'YOUR_API_KEY_HERE',
        DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        SCOPES: 'https://www.googleapis.com/auth/drive.file'
    }
};

export class DriveClient {
    constructor() {
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.accessToken = null;
        this.listeners = [];
    }

    /**
     * Registers a callback for auth state changes.
     * @param {Function} callback - Called with (isAuthenticated: boolean)
     */
    onAuthChange(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notifies all listeners of auth state change.
     * @param {boolean} isAuthenticated 
     */
    notifyAuthChange(isAuthenticated) {
        this.listeners.forEach(cb => cb(isAuthenticated));
    }

    /**
     * Initializes Google API scripts dynamically.
     * Call this once on app startup.
     */
    init() {
        // Load GAPI script
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.onload = () => {
            gapi.load('client', this.initGapiClient.bind(this));
        };
        document.body.appendChild(gapiScript);

        // Load GIS (Google Identity Services) script
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.onload = this.initGisClient.bind(this);
        document.body.appendChild(gisScript);
    }

    /**
     * Initializes the GAPI client.
     */
    async initGapiClient() {
        try {
            await gapi.client.init({
                apiKey: CONFIG.GOOGLE.API_KEY,
                discoveryDocs: CONFIG.GOOGLE.DISCOVERY_DOCS
            });
            this.gapiInited = true;
            console.log('GAPI initialized');
        } catch (e) {
            console.error('Error initializing GAPI', e);
        }
    }

    /**
     * Initializes the Google Identity Services token client.
     */
    initGisClient() {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.GOOGLE.CLIENT_ID,
            scope: CONFIG.GOOGLE.SCOPES,
            callback: (resp) => {
                this.accessToken = resp.access_token;
                console.log('Drive Access Token received');
            }
        });
        this.gisInited = true;
        console.log('GIS initialized');
    }

    /**
     * Ensures the user is authenticated, prompting if necessary.
     * @returns {Promise<string>} The access token
     */
    async ensureAuth() {
        if (this.accessToken) {
            return this.accessToken;
        }

        return new Promise((resolve, reject) => {
            this.tokenClient.callback = (resp) => {
                if (resp.error !== undefined) {
                    reject(resp);
                }
                this.accessToken = resp.access_token;
                this.notifyAuthChange(true);
                resolve(this.accessToken);
            };
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    }

    /**
     * Saves content to Google Drive.
     * @param {string} fileName 
     * @param {string} content (JSON string)
     * @returns {Promise<Object>} The created file metadata
     */
    async saveFile(fileName, content) {
        await this.ensureAuth();

        const metadata = {
            name: fileName,
            mimeType: 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + this.accessToken }),
            body: form
        });

        if (!response.ok) {
            throw new Error('Drive API Save Failed: ' + response.statusText);
        }

        const data = await response.json();
        console.log('File saved to Drive, ID:', data.id);
        return data;
    }

    /**
     * Opens Google Picker to select and load a file.
     * @returns {Promise<string>} File content
     */
    async loadFile() {
        await this.ensureAuth();
        await this.loadPickerLib();

        return new Promise((resolve, reject) => {
            const pickerCallback = async (data) => {
                if (data.action === google.picker.Action.PICKED) {
                    const fileId = data.docs[0].id;
                    try {
                        const content = await this.downloadFile(fileId);
                        resolve(content);
                    } catch (e) {
                        reject(e);
                    }
                } else if (data.action === google.picker.Action.CANCEL) {
                    reject('Cancelled');
                }
            };

            const view = new google.picker.View(google.picker.ViewId.DOCS);
            view.setMimeTypes('application/json');

            const picker = new google.picker.PickerBuilder()
                .setDeveloperKey(CONFIG.GOOGLE.API_KEY)
                .setAppId(CONFIG.GOOGLE.CLIENT_ID)
                .setOAuthToken(this.accessToken)
                .addView(view)
                .setCallback(pickerCallback)
                .build();

            picker.setVisible(true);
        });
    }

    /**
     * Loads the Google Picker library.
     * @returns {Promise<void>}
     */
    loadPickerLib() {
        return new Promise((resolve) => {
            gapi.load('picker', { callback: resolve });
        });
    }

    /**
     * Downloads file content from Drive.
     * @param {string} fileId 
     * @returns {Promise<string>} File content
     */
    async downloadFile(fileId) {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.body;
    }
}

// Singleton instance
export const driveClient = new DriveClient();
