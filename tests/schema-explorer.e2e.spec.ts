import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe.skip('Schema Explorer', () => {
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

  test('should navigate tree structure', async () => {
    // Navigate to Schema Explorer via sidebar connection click
    await window.click('aside >> text=DEV'); // Click a connection

    // Verify schema tree loads
    await expect(window.locator('text=Tables')).toBeVisible({ timeout: 15000 });

    // Expand Tables node
    await window.click('text=Tables');

    // Verify at least one table is visible (from demo data)
    await expect(window.locator('.tree-node >> text=users').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display DDL code view', async () => {
    // Click on a table to view DDL
    await window.click('.tree-node >> text=users');

    // Verify DDL viewer opens with CREATE TABLE statement
    await expect(window.locator('pre >> text=CREATE TABLE')).toBeVisible({ timeout: 10000 });
  });

  test('should support search filtering', async () => {
    // Find and use search input
    const searchInput = window.locator('input[placeholder*="Search"]');
    await searchInput.fill('users');

    // Verify filtered results
    await expect(window.locator('.tree-node >> text=users')).toBeVisible();
    await expect(window.locator('.tree-node >> text=products')).not.toBeVisible();
  });
});
