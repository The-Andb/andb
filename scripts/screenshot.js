const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

async function capture() {
    await app.whenReady();
    const win = new BrowserWindow({
        width: 1920,
        height: 1200,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const views = [
        { name: 'dashboard', url: 'http://localhost:5173/' },
        { name: 'schema', url: 'http://localhost:5173/#/schema' },
        { name: 'compare', url: 'http://localhost:5173/#/compare' },
        { name: 'history', url: 'http://localhost:5173/#/history' },
        { name: 'settings', url: 'http://localhost:5173/#/settings' }
    ];

    const toDay = new Date();
    const theDay = toDay.toISOString().split('T')[0];
    const outDir = path.join(__dirname, '../../andb-landing/public/screenshots/', theDay);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log('Starting screenshot capture...');

    // Initial load to initialize origin for localStorage
    try {
        await win.loadURL('http://localhost:5173/');
        await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
        console.error("Initial load failed:", err);
    }

    const modes = [
        { suffix: '', theme: 'dark' },
        { suffix: '-light', theme: 'light' }
    ];

    win.webContents.on('console-message', (event, level, message) => {
        // Filter out some noise if needed
        // console.log('Browser Console:', message); 
    });

    for (const mode of modes) {
        console.log(`\n--- Switching to ${mode.theme.toUpperCase()} mode ---`);

        // Set theme in localStorage
        await win.webContents.executeJavaScript(`
        localStorage.setItem('andb-ui-settings', JSON.stringify({
            theme: '${mode.theme}',
            language: 'en',
            timezone: 'UTC'
        }));
    `);

        for (const view of views) {
            try {
                console.log(`Navigating to ${view.name}...`);
                await win.loadURL(view.url);
                win.webContents.setZoomFactor(0.85);

                console.log(`Loaded ${view.url}, waiting for render...`);
                // Wait for connection to settle and animations
                await new Promise(r => setTimeout(r, 4000));

                // Ensure theme is applied (backup safety)
                await win.webContents.executeJavaScript(`
            try {
                // FORCE THEME & BACKGROUNDS
                if ('${mode.theme}' === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.body.style.backgroundColor = '#ffffff';
                } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    
                    // Deep Dark Mode for Screenshots (Fix "Gray Cast")
                    const deepDark = '#020617'; // Slate-950/Near Black
                    document.body.style.backgroundColor = deepDark;
                    
                    // Force #app and main containers to be deep dark
                    const app = document.getElementById('app');
                    if(app) app.style.backgroundColor = deepDark;

                    // Inject Style to override generic gray backgrounds in Dark Mode
                    const style = document.createElement('style');
                    style.textContent = \`
                        .dark .bg-gray-900 { background-color: \${deepDark} !important; }
                        .dark .bg-gray-950 { background-color: #000000 !important; }
                    \`;
                    document.head.appendChild(style);
                }
                
                // HIDE OVERLAYS (Visual cleaning)
                // Filter all elements, hide if fixed and high z-index (modals, notifications)
                const all = document.querySelectorAll('*');
                for (let el of all) {
                    const css = window.getComputedStyle(el);
                    if (css.position === 'fixed' && parseInt(css.zIndex) > 30) {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                    }
                }
                
                // Ensure #app opacity is full
                const appMain = document.getElementById('app');
                if (appMain) {
                    appMain.style.opacity = '1';
                    appMain.style.filter = 'none';
                }

            } catch(e) { console.error('Screenshot prep error:', e); }
        `);
                // Small wait after forced class update if needed
                await new Promise(r => setTimeout(r, 500));

                console.log('Taking screenshot...');
                const img = await win.capturePage();
                const filePath = path.join(outDir, `${view.name}${mode.suffix}.png`);
                fs.writeFileSync(filePath, img.toPNG());
                console.log(`Captured ${view.name}${mode.suffix} to ${filePath} `);
            } catch (e) {
                console.error(`Failed to capture ${view.name}: `, e);
            }
        }
    }

    app.quit();
}

capture();
