/**
 * @fileoverview Generic Modal for replacing blocking alerts/confirms/prompts.
 */

import { COLORS, FONTS } from '../Constants.js';

export class Modal {
    static init() {
        if (document.getElementById('genericModal')) return;

        const modal = document.createElement('div');
        modal.id = 'genericModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            justify-content: center;
            align-items: center;
            font-family: 'Poppins', sans-serif;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;

        const message = document.createElement('div');
        message.id = 'genericModalMessage';
        message.style.fontSize = '14px';

        const input = document.createElement('input');
        input.id = 'genericModalInput';
        input.type = 'text';
        input.style.cssText = `
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            display: none;
        `;

        const buttons = document.createElement('div');
        buttons.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.id = 'genericModalCancel';
        cancelBtn.style.cssText = `
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
        `;

        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.id = 'genericModalOK';
        okBtn.style.cssText = `
            padding: 6px 12px;
            border: none;
            background: ${COLORS.primary || '#007AFF'};
            color: white;
            border-radius: 4px;
            cursor: pointer;
        `;

        buttons.appendChild(cancelBtn);
        buttons.appendChild(okBtn);

        content.appendChild(message);
        content.appendChild(input);
        content.appendChild(buttons);
        modal.appendChild(content);

        document.body.appendChild(modal);

        // Hover effects
        okBtn.onmouseover = () => okBtn.style.opacity = '0.9';
        okBtn.onmouseout = () => okBtn.style.opacity = '1';
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#f5f5f5';
        cancelBtn.onmouseout = () => cancelBtn.style.background = 'white';
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
