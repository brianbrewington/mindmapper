const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    // Check if puppeteer is installed
    try {
        require.resolve('puppeteer');
    } catch (e) {
        console.error('Puppeteer not found. Please install: npm install puppeteer');
        process.exit(1);
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport size for the screenshot
    await page.setViewport({ width: 1200, height: 800 });

    const url = 'http://localhost:5173';

    console.log(`Navigating to ${url}...`);
    try {
        await page.goto(url, { waitUntil: 'networkidle0' });
    } catch (e) {
        console.error('Could not connect to localhost:5173. Make sure "npm run dev" is running.');
        await browser.close();
        process.exit(1);
    }

    // Wait for canvas
    await page.waitForSelector('#canvas');

    console.log('Loading demo_mindmap.json...');

    // Evaluate in browser context to load data
    await page.evaluate(async () => {
        try {
            const response = await fetch('/demo_mindmap.json');
            if (!response.ok) throw new Error('Failed to fetch demo map');
            const data = await response.json();

            if (window.app && window.app.model) {
                window.app.model.restoreState(data);
                window.app.renderer.draw();
                console.log('Demo map loaded.');

                // Expand Scenes Panel
                const scenesPanel = document.getElementById('scenesPanel');
                if (scenesPanel && scenesPanel.classList.contains('collapsed')) {
                    // If it starts collapsed, toggle it. 
                    // Or check button. 
                }
                // Actually, let's just ensure it's open.
                // The implementation uses toggle on button click.
                // Let's toggle it via button if needed, or direct class manipulation.

                // Assuming it starts collapsed or open? 
                // Let's just find the toggle button and click it if the panel 'collapsed' class is present?
                // Wait, in main.css it seems it might be collapsed by default or not.
                // Let's just force remove 'collapsed' class to be safe.
                if (scenesPanel) scenesPanel.classList.remove('collapsed');

            } else {
                console.error('window.app not found');
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Wait for rendering update
    await new Promise(r => setTimeout(r, 1000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: path.resolve(__dirname, '../screenshot.png') });

    console.log('Screenshot saved to screenshot.png');
    await browser.close();
})();
