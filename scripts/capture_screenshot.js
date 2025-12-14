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

    // Assuming the app is built to dist/index.html or served
    // For simplicity, we'll try to load the local index.html with a simple server or file protocol
    // Vite dev server is best if running, but for file protocol:
    const fileUrl = 'file://' + path.resolve(__dirname, '../index.html');

    // Note: Local file loading might have issues with ES modules (CORS).
    // Better to use the vite preview URL if available, or assume user runs this while server is up.
    // Let's try running a quick static serve or assume port 5173.
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

    // Load demo map logic could be injected here or we just take a shot of whatever is default.
    // To ensure demo map is loaded, we can inject JS to load it from the window object if we exposed it,
    // or simulate the file load.

    // Simpler: Just screenshot the default view for now as a "Build" artifact.
    // If the user wants the demo map specifically, we'd need to fetch it in browser context.

    console.log('Taking screenshot...');
    await page.screenshot({ path: path.resolve(__dirname, '../screenshot.png') });

    console.log('Screenshot saved to screenshot.png');
    await browser.close();
})();
