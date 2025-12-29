import { CONFIG } from './config.js';

export class DriveClient {
    constructor() {
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.gisInited = false;
        this.accessToken = null;
        this.listeners = [];
    }

    onAuthChange(callback) {
        this.listeners.push(callback);
    }

    notifyAuthChange(isAuthenticated) {
        this.listeners.forEach(cb => cb(isAuthenticated));
    }

    /**
     * Loads the Google Identity Services and GAPI scripts.
     * Use this during app initialization.
     */
    init() {
        // Load GAPI
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.onload = () => {
            gapi.load('client', this.initGapiClient.bind(this));
        };
        document.body.appendChild(gapiScript);

        // Load GIS
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.onload = this.initGisClient.bind(this);
        document.body.appendChild(gisScript);
    }

    async initGapiClient() {
        try {
            await gapi.client.init({
                apiKey: CONFIG.GOOGLE.API_KEY,
                discoveryDocs: CONFIG.GOOGLE.DISCOVERY_DOCS,
            });
            this.gapiInited = true;
            console.log('GAPI initialized');
        } catch (err) {
            console.error('Error initializing GAPI', err);
        }
    }

    initGisClient() {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.GOOGLE.CLIENT_ID,
            scope: CONFIG.GOOGLE.SCOPES,
            callback: (tokenResponse) => {
                this.accessToken = tokenResponse.access_token;
                console.log('Drive Access Token received');
            },
        });
        this.gisInited = true;
        console.log('GIS initialized');
    }

    /**
     * Requests authorization token if needed.
     */
    async ensureAuth() {
        if (!this.accessToken) {
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
        return this.accessToken;
    }

    /**
     * Saves file content to Google Drive.
     * Uses multipart upload for metadata + content.
     * @param {string} fileName 
     * @param {string} content 
     */
    async saveFile(fileName, content) {
        await this.ensureAuth();

        const metadata = {
            name: fileName,
            mimeType: 'application/json',
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + this.accessToken }),
            body: form,
        });

        if (!response.ok) {
            throw new Error('Drive API Save Failed: ' + response.statusText);
        }

        const json = await response.json();
        console.log('File saved to Drive, ID:', json.id);
        return json;
    }

    /**
     * Opens Google Picker to select a JSON file.
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

    loadPickerLib() {
        return new Promise((resolve) => {
            gapi.load('picker', { callback: resolve });
        });
    }

    async downloadFile(fileId) {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return response.body;
    }
}

// Export singleton
export const driveClient = new DriveClient();
