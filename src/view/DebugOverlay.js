/**
 * @fileoverview A simple debug overlay to show real-time model statistics.
 * Helps verify if data is loaded even if rendering fails.
 */

export class DebugOverlay {
    constructor(model) {
        this.model = model;
        this.overlay = document.createElement('div');

        // Styles
        Object.assign(this.overlay.style, {
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#0f0',
            fontFamily: 'monospace',
            padding: '10px',
            borderRadius: '5px',
            zIndex: '9999',
            pointerEvents: 'none',
            fontSize: '12px'
        });

        document.body.appendChild(this.overlay);

        // Update loop
        this.startUpdating();
    }

    startUpdating() {
        const update = () => {
            const elCount = this.model.elements.length;
            const connCount = this.model.connections.length;
            const sceneCount = this.model.scenes.length;
            const historyIdx = this.model.historyIndex;

            this.overlay.textContent = `Elements: ${elCount} | Connections: ${connCount} | Scenes: ${sceneCount} | History: ${historyIdx}`;

            requestAnimationFrame(update);
        };
        update();
    }
}
