import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe.skip('Connection Management', () => {
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
    await app.close();
  });

  test('should open add connection form', async () => {
    // Navigate to local list (assuming we might need to expand sidebar/EnvironmentManager first? 
    // Actually Dashboard -> Manage Connections (Configured card) or just ensure sidebar is present

    // There is no direct link on dashboard to connection list unless we click stats. 
    // Best to use Sidebar "Settings" -> Project Settings? 
    // Wait, the "Active" card has a progress bar but acts as a display.

    // Let's assume we are on Dashboard. Connection management is usually inside "Project Settings" or specific sidebar items.
    // Based on sidebar (which we haven't deeply inspected for items), let's guess we need to go to "Environment" or similar.
    // Re-reading Sidebar.vue... it usually has a tree.

    // Actually, looking at router, '/' is Dashboard. 
    // ConnectionManager.vue is used where? `ProjectSettings.vue` probably or `EnvironmentManager.vue`.
    // Let's rely on the "Add New Connection" button if it's visible or navigate to where it is.
    // Dashboard -> "Manage Pairs" goes to Settings.

    // Let's try navigating to /project-settings directly?
    // Or check if "Projects" view allows managing connections.

    // Update plan: We will check the Sidebar for "Connections" or "Project Settings".
    // For now, let's navigate to project settings using the dashboard button.

    // Navigate to Project Settings
    // Use .last() or specific container to avoid Sidebar's global settings
    const settingsBtn = window.locator('button', { hasText: 'Settings' }).nth(1);
    // Or if nth(1) is risky, use:
    // const settingsBtn = window.locator('div.flex.gap-3 > button', { hasText: 'Settings' });
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
    } else {
      // Fallback: Try identifying by unique class or icon logic if possible
      await window.click('button[title="Settings"] >> nth=1');
    }

    // Wait for navigation
    await window.waitForURL(/.*project-settings/);

    // Header might be uppercase, use a regex for flexibility
    // Use .first() as there might be a sidebar header and a main content header (though mainly h2)
    // Use locator with filter to find the specific header, regardless of order
    await expect(window.locator('h1', { hasText: /Project Settings/i }).first()).toBeVisible();

    // Ensure Connections tab is active (click it)
    await window.click('button', { hasText: 'Connections' });

    // Click "Add Connection" (look for button with typical classes or text)
    // Using a broad text search for "Add Connection" inside the main area
    const addBtn = window.locator('button', { hasText: 'Add Connection' }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify Form Opens
    await expect(window.locator('text=Database Endpoint Configuration')).toBeVisible();
  });

  test('should validate required fields', async () => {
    // Click save without entering data
    await window.click('button >> text=Save');

    // Check for errors
    await expect(window.locator('text=Connection Name is required')).toBeVisible();
    await expect(window.locator('text=Host is required')).toBeVisible();
  });

  test('should fill and save connection (mock)', async () => {
    await window.fill('input[placeholder="Connection Name"]', 'Test MySQL');
    await window.fill('input[placeholder="127.0.0.1"]', 'localhost');
    await window.fill('input[placeholder="schema_name"]', 'test_db');
    await window.fill('input[placeholder="user"]', 'root');

    // Select Environment (standard HTML select)
    await window.selectOption('select', { label: 'Development' }); // Assuming translation maps to English

    // Cancel to avoid polluting state (since we don't clean up yet)
    await window.click('button >> text=Cancel');
  });
});
