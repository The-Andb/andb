import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe.skip('Settings', () => {
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
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test('should toggle dark/light theme', async () => {
    // Navigate to Settings
    await window.click('aside >> text=Settings');
    await expect(window.locator('text=Settings')).toBeVisible();

    // Find theme toggle
    const themeToggle = window.locator('button[title*="Theme"]');

    // Get initial state
    const initialClass = await window.locator('html').getAttribute('class');
    const wasDark = initialClass?.includes('dark');

    // Toggle theme
    await themeToggle.click();

    // Verify theme changed
    const newClass = await window.locator('html').getAttribute('class');
    const isNowDark = newClass?.includes('dark');

    expect(wasDark).not.toBe(isNowDark);
  });

  test('should change font size profile', async () => {
    // Navigate to Settings if not already there
    await window.click('aside >> text=Settings');

    // Find font size selector
    const fontSizeSelect = window.locator('select', { hasText: 'Font Size' });

    // Change to Large
    await fontSizeSelect.selectOption('large');

    // Verify some element reflects the change (e.g., increased base size)
    // This is a rough check; actual verification would need CSS inspection
    await expect(fontSizeSelect).toHaveValue('large');
  });
});
