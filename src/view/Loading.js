/**
 * @fileoverview Loading overlay utility for async operations.
 */

export class Loading {
    static show(message = 'Loading...') {
        let loader = document.getElementById('loadingIndicator');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loadingIndicator';
            document.body.appendChild(loader);
        }
        
        // Add spinner and message
        loader.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        
        loader.style.display = 'flex';
    }

    static hide() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Wraps an async operation with loading indicator.
     * @param {Promise} promise - The async operation
     * @param {string} message - Loading message to display
     * @returns {Promise} - The result of the async operation
     */
    static async wrap(promise, message = 'Loading...') {
        try {
            this.show(message);
            return await promise;
        } finally {
            this.hide();
        }
    }
}
