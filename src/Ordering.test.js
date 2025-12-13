import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('UI Layering', () => {
    let css;

    beforeEach(() => {
        // Load CSS to check values
        css = fs.readFileSync(path.resolve(__dirname, 'styles/main.css'), 'utf-8');
    });

    it('Controls should be above Canvas', () => {
        console.log('Checking Controls Z-Index...');
        // We can parse generic regex for #controls and #canvas z-index
        // or just use JSDOM if we inject styles? 
        // JSDOM doesn't compute external CSS efficiently without helper.
        // Let's rely on string parsing for "investigation" proof.

        const canvasZMatch = css.match(/#canvas\s*{[^}]*z-index:\s*(\d+)/i);
        const controlsZMatch = css.match(/#controls\s*{[^}]*z-index:\s*(\d+)/i);

        const canvasZ = canvasZMatch ? parseInt(canvasZMatch[1]) : 0; // Default auto/0
        const controlsZ = controlsZMatch ? parseInt(controlsZMatch[1]) : 0; // Default auto

        console.log(`Canvas Z: ${canvasZ}`);
        console.log(`Controls Z: ${controlsZ}`);

        // This test fails if Controls is not explicitly higher than Canvas (which is 1)
        expect(controlsZ).toBeGreaterThan(canvasZ);
    });

    it('Context Menu should be above Canvas', () => {
        const canvasZMatch = css.match(/#canvas\s*{[^}]*z-index:\s*(\d+)/i);
        const menuZMatch = css.match(/#contextMenu\s*{[^}]*z-index:\s*(\d+)/i);

        const canvasZ = canvasZMatch ? parseInt(canvasZMatch[1]) : 0;
        const menuZ = menuZMatch ? parseInt(menuZMatch[1]) : 0;

        expect(menuZ).toBeGreaterThan(canvasZ);
    });
});
