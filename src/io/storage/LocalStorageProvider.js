import { StorageProvider } from './StorageProvider.js';

export class LocalStorageProvider extends StorageProvider {
    /**
     * @param {Object} options
     * @param {HTMLElement} [options.fileInput] - The file input element for loading.
     */
    constructor(options = {}) {
        super();
        this.fileInput = options.fileInput;
    }

    async save(fileName, content, contentType) {
        // Trigger browser download
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
        return Promise.resolve();
    }

    async load() {
        return new Promise((resolve, reject) => {
            if (!this.fileInput) {
                // If no input provided, we can't really load "locally" without user interaction 
                // initiated by the browser's file picker which needs an input.
                // Or we can dynamically create one.
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';

                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        reject('No file selected');
                        return;
                    }
                    this._readFile(file).then(resolve).catch(reject);
                };
                input.click();
            } else {
                // If using an existing input, this flow is different because the *event* triggers it.
                // However, to match the abstracted "load()" interface which returns a Promise:
                // We might need to handle the event externally or wrap it.

                // For this implementation, we'll assume the caller wants to trigger the picker NOW.
                // If fileInput exists, click it.

                // Note: The caller might have already bound an event listener. 
                // This is where abstraction gets tricky with DOM events.
                // Let's assume we create a temp input for purely programmatic load,
                // OR we strictly wrap the "read file" logic.

                // User requirement: "The only difference is where the json came from".
                // So load() should return the JSON string.

                this.fileInput.click();
                // We can't await the user selection easily here without a one-time listener.

                const onFileSelect = (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        // Cancel logic?
                        return;
                    }
                    this._readFile(file).then(resolve).catch(reject);
                    this.fileInput.removeEventListener('change', onFileSelect);
                    this.fileInput.value = ''; // Reset
                };
                this.fileInput.addEventListener('change', onFileSelect);
            }
        });
    }

    _readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
}
