import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe.skip('Project Management', () => {
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

  test('should create a new project', async () => {
    // Navigate to Projects page
    await window.click('aside >> text=Projects');
    await expect(window.locator('text=Projects')).toBeVisible();

    // Click "New Project"
    await window.click('button >> text=New Project');

    // Fill project name
    const nameInput = window.locator('input[placeholder*="Project Name"]');
    await nameInput.fill('Test Project E2E');

    // Save
    await window.click('button >> text=Create');

    // Verify new project appears in list
    await expect(window.locator('text=Test Project E2E')).toBeVisible();
  });

  test('should switch projects', async () => {
    // Click on a different project
    await window.click('text=The Base One');

    // Verify project switch (check header or breadcrumb)
    await expect(window.locator('text=The Base One')).toBeVisible();
  });

  test('should delete a project', async () => {
    // Navigate to Projects
    await window.click('aside >> text=Projects');

    // Find the test project and delete it
    const projectCard = window.locator('text=Test Project E2E');
    await projectCard.hover();
    await window.click('button[title="Delete"]');

    // Confirm deletion
    await window.click('button >> text=Confirm');

    // Verify project is removed
    await expect(window.locator('text=Test Project E2E')).not.toBeVisible();
  });
});
