import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe('Dashboard View', () => {
  let app: any;
  let window: any;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: ['.', '--headless'],
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    // Ensure we are on dashboard
    await window.click('aside >> text=Dashboard').catch(() => { }); // Attempt to navigate if not there
  });

  test.afterAll(async () => {
    await app.close();
  });

  test('should display key specific stats cards', async () => {
    // Check for "Active" connections card
    const activeCard = window.locator('text=ACTIVE');
    await expect(activeCard).toBeVisible();

    // Check for "Configured" environments card
    const envCard = window.locator('text=CONFIGURED');
    await expect(envCard).toBeVisible();
  });

  test('should have quick action buttons', async () => {
    // Start with a wait to ensure hydration/translation
    const quickActions = window.locator('text=Switch');
    await expect(quickActions).toBeVisible();

    const switchBtn = window.locator('button', { hasText: 'Switch' });
    await expect(switchBtn).toBeVisible();

    const settingsBtn = window.locator('button', { hasText: 'Settings' }).first();
    await expect(settingsBtn).toBeVisible();
  });

  test('should show operations feed', async () => {
    const feed = window.locator('text=OPERATIONAL FEED');
    await expect(feed).toBeVisible();
  });
});
