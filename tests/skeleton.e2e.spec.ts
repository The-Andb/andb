import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test('verify app skeleton', async () => {
  // Launch Electron app using the dist-electron entry point
  const app = await electron.launch({
    args: ['.'],
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' } // Ensure prod mode to load from dist
  });

  const window = await app.firstWindow();

  console.log(`Window URL: ${window.url()}`);
  await window.screenshot({ path: 'skeleton-debug.png' });

  await window.waitForLoadState('domcontentloaded');

  // Verify Window Title (Wait for it to be non-empty)
  await expect.poll(async () => window.title()).toContain('The Andb');

  // Verify Main App Container
  // Verify Main App Container (Target specific class to avoid duplicate ID issues with mount container)
  const appContainer = window.locator('#app.h-screen');
  await expect(appContainer).toBeVisible();

  // Verify Sidebar
  const sidebar = window.locator('aside');
  await expect(sidebar).toBeVisible();

  // Verify basic structure classes
  await expect(sidebar).toHaveClass(/bg-white/);
  await expect(sidebar).toHaveClass(/border-r/);

  await app.close();
});
