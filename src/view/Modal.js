/**
 * @fileoverview Generic Modal for replacing blocking alerts/confirms/prompts.
 */

import { COLORS, FONTS } from '../Constants.js';

export class Modal {
    static init() {
        if (document.getElementById('genericModal')) return;

        const modal = document.createElement('div');
        modal.id = 'genericModal';
        modal.className = 'modal-overlay'; // Use shared class

        const content = document.createElement('div');
        content.className = 'modal-content'; // Use shared class
        // Keep layout styles but remove colors
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.gap = '15px';
        content.style.width = '300px';

        const message = document.createElement('div');
        message.id = 'genericModalMessage';
        message.style.fontSize = '14px';

        const input = document.createElement('input');
        input.id = 'genericModalInput';
        input.type = 'text';
        // Input needs to adapt to theme too, or be neutral
        input.style.padding = '8px';
        input.style.border = '1px solid var(--border-color)';
        input.style.borderRadius = '4px';
        input.style.fontSize = '14px';
        input.style.display = 'none';
        input.style.backgroundColor = 'var(--bg-color)';
        input.style.color = 'var(--text-color)';

        const buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.justifyContent = 'flex-end';
        buttons.style.gap = '10px';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.id = 'genericModalCancel';
        // Button styling is handled by global button CSS now

        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.id = 'genericModalOK';
        okBtn.style.backgroundColor = COLORS.primary || '#007AFF';
        okBtn.style.color = 'white';
        okBtn.style.border = 'none';

        buttons.appendChild(cancelBtn);
        buttons.appendChild(okBtn);

        content.appendChild(message);
        content.appendChild(input);
        content.appendChild(buttons);
        modal.appendChild(content);

        document.body.appendChild(modal);
    }

    /**
     * Shows a confirmation modal.
     * @param {string} text 
     * @returns {Promise<boolean>}
     */
    static showConfirm(text) {
        this.init();
        return new Promise((resolve) => {
            const modal = document.getElementById('genericModal');
            const msg = document.getElementById('genericModalMessage');
            const input = document.getElementById('genericModalInput');
            const okBtn = document.getElementById('genericModalOK');
            const cancelBtn = document.getElementById('genericModalCancel');

            msg.textContent = text;
            input.style.display = 'none';
            okBtn.textContent = 'OK';
            modal.style.display = 'flex';

            const cleanup = () => {
                modal.style.display = 'none';
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                // Remove keyboard listener
                document.removeEventListener('keydown', handleKey);
            };

            const handleKey = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    resolve(true);
                    cleanup();
                } else if (e.key === 'Escape') {
                    resolve(false);
                    cleanup();
                }
            };
            document.addEventListener('keydown', handleKey);

            okBtn.onclick = () => {
                resolve(true);
                cleanup();
            };

            cancelBtn.onclick = () => {
                resolve(false);
                cleanup();
            };

            okBtn.focus();
        });
    }

    /**
     * Shows a prompt modal.
     * @param {string} text 
     * @param {string} defaultValue 
     * @returns {Promise<string|null>}
     */
    static showPrompt(text, defaultValue = '') {
        this.init();
        return new Promise((resolve) => {
            const modal = document.getElementById('genericModal');
            const msg = document.getElementById('genericModalMessage');
            const input = document.getElementById('genericModalInput');
            const okBtn = document.getElementById('genericModalOK');
            const cancelBtn = document.getElementById('genericModalCancel');

            msg.textContent = text;
            input.value = defaultValue;
            input.style.display = 'block';
            okBtn.textContent = 'OK';
            modal.style.display = 'flex';
            input.focus();
            input.select();

            const cleanup = () => {
                modal.style.display = 'none';
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                document.removeEventListener('keydown', handleKey);
            };

            const handleKey = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    resolve(input.value);
                    cleanup();
                } else if (e.key === 'Escape') {
                    resolve(null);
                    cleanup();
                }
            };
            document.addEventListener('keydown', handleKey);

            okBtn.onclick = () => {
                resolve(input.value);
                cleanup();
            };

            cancelBtn.onclick = () => {
                resolve(null);
                cleanup();
            };
        });
    }

    /**
     * Shows an alert modal.
     * @param {string} text 
     * @returns {Promise<void>}
     */
    static showAlert(text) {
        this.init();
        return new Promise((resolve) => {
            const modal = document.getElementById('genericModal');
            const msg = document.getElementById('genericModalMessage');
            const input = document.getElementById('genericModalInput');
            const okBtn = document.getElementById('genericModalOK');
            const cancelBtn = document.getElementById('genericModalCancel');

            msg.textContent = text;
            input.style.display = 'none';
            okBtn.textContent = 'OK';
            cancelBtn.style.display = 'none';
            modal.style.display = 'flex';

            const cleanup = () => {
                modal.style.display = 'none';
                cancelBtn.style.display = 'block';
                okBtn.onclick = null;
                document.removeEventListener('keydown', handleKey);
            };

            const handleKey = (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    resolve();
                    cleanup();
                }
            };
            document.addEventListener('keydown', handleKey);

            okBtn.onclick = () => {
                resolve();
                cleanup();
            };

            okBtn.focus();
        });
    }
}
