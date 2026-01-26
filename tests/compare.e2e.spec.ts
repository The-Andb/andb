import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe.skip('Compare View', () => {
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

  test('should display comparison grid', async () => {
    // Navigate to Compare page
    await window.click('aside >> text=Compare');
    await expect(window.locator('text=Compare')).toBeVisible();

    // Verify comparison grid structure
    await expect(window.locator('text=Source')).toBeVisible();
    await expect(window.locator('text=Target')).toBeVisible();
  });

  test('should show diff indicators', async () => {
    // Select a pair (assuming demo data)
    const pairSelector = window.locator('select', { hasText: 'DEV to STAGE' });
    await pairSelector.selectOption({ index: 0 });

    // Run comparison
    await window.click('button >> text=Compare');

    // Wait for results
    await expect(window.locator('.diff-indicator')).toBeVisible({ timeout: 30000 });
  });

  test('should navigate to DDL diff view', async () => {
    // Click on a diff row
    await window.click('.diff-row >> nth=0');

    // Verify DDL diff view opens
    await expect(window.locator('text=Differences')).toBeVisible();
    await expect(window.locator('pre')).toBeVisible(); // DDL code block
  });
});
