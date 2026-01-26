import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe.skip('Dump File Operations', () => {
  let app: any;
  let window: any;
  const dumpFilePath = path.join(__dirname, 'assets', 'demo-dump.sql');

  test.beforeAll(async () => {
    // Ensure asset directory and dummy dump exist
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);
    fs.writeFileSync(dumpFilePath, `
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users VALUES (1, 'Alice');
    `);

    app = await electron.launch({
      args: ['.', '--headless'],
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    window = await app.firstWindow();

    // Capture app console logs (fix type)
    window.on('console', (msg: any) => console.log(`APP LOG: ${msg.text()}`));

    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (app) await app.close();
    // Cleanup
    if (fs.existsSync(dumpFilePath)) fs.unlinkSync(dumpFilePath);
  });

  // TODO: Fix selector timing for headless buttons
  // TODO: Fix selector timing for headless buttons
  test('should add a new Dump connection', async () => {
    // Navigate to Project Settings -> Connections
    // (Reusing logic from connection.spec.ts or ensuring we are at a clean state)
    // For specific test isolation, we might assume dashboard launch.

    // Navigate directly to Project Settings with auto-open form
    await window.goto('app://-/index.html#/project-settings?tab=connections&action=new');

    // Verify Form Opens
    await expect(window.locator('text=Add New Connection')).toBeVisible({ timeout: 10000 });
    console.log('Form Header Visible');

    await window.waitForTimeout(1000); // Wait for hydration

    // Fill Form (Name)
    const nameInput = window.locator('div.space-y-2', { hasText: /Connection Name/ }).locator('input').first();
    await nameInput.fill('Demo Dump');
    // Select Type "Dump" (Index 1: MySQL=0, Dump=1)
    const typeSelect = window.locator('div.space-y-2', { hasText: 'Database Type' }).locator('select');
    console.log('Type Select Count:', await typeSelect.count());
    await typeSelect.selectOption({ index: 1 });

    // Verify selection (optional debug)
    console.log('Selected Dump Type');
    console.log('Selected Type Value:', await typeSelect.inputValue());

    // Fill Dump Path (Index 1 of text inputs: Name=0, Host=1)
    const hostInput = window.locator('input[type="text"]').nth(1);
    await hostInput.fill(dumpFilePath);
    console.log('Filled Dump Path');
    console.log('Input 1 Value:', await hostInput.inputValue());

    // Select Environment
    const envSelect = window.locator('div.space-y-2', { hasText: 'Environment' }).locator('select');
    // Using value "DEV" or similar if we know the values, or first option
    // Let's iterate options or just select the first non-empty
    await envSelect.selectOption({ index: 1 }); // Index 0 is "Select", Index 1 is first env
    console.log('Env Select Value:', await envSelect.inputValue());

    const saveBtn = window.locator('button.btn-primary').last(); // Ensure we get the form button if multiple exist
    console.log('Save Button Text:', await saveBtn.innerText());
    console.log('Save Button Disabled:', await saveBtn.isDisabled());
    await saveBtn.click({ force: true });
    console.log('Clicked Save');

    // Check for validation errors
    const errorTexts = await window.locator('.text-red-500').allInnerTexts();
    if (errorTexts.length > 0) {
      console.log('Validation Errors:', errorTexts);
    }

    // Ensure we are in All Connections mode
    const allTab = window.locator('button', { hasText: 'ALL CONNECTIONS' });
    if (await allTab.isVisible()) {
      await allTab.click();
    }

    // Wait for list view to return
    await expect(window.locator('text=ALL CONNECTIONS')).toBeVisible({ timeout: 10000 });
    console.log('List View Returned');

    // Debug logging to console (for capture)
    const rowCount = await window.locator('tr').count();
    console.log(`Row Count: ${rowCount}`);

    const envButtons = window.locator('nav + div button');
    if (await envButtons.count() > 0) {
      console.log(`Env Buttons: ${await envButtons.allInnerTexts()}`);
    } else {
      console.log('No Env Buttons found');
    }

    if (rowCount > 0) {
      console.log(`Rows Text: ${await window.locator('tbody').innerText()}`);
    } else {
      const bodyText = await window.locator('body').innerText();
      console.log('Table empty. Body Text snippet:' + bodyText.substring(0, 500));
      // also check if "All Connections" tab is active??
    }

    // Verify it appears in the list
    await expect(window.locator('text=Demo Dump')).toBeVisible({ timeout: 10000 });
    await expect(window.locator('text=SL')).toBeVisible(); // Or whatever badge Use for Dump? Wait, code said "MY" for mysql by default, Dump might fallback or have special badge? 
    // In ConnectionManager.vue:
    // <span v-else class="text-[10px] font-black">MY</span>
    // ConnectionForm sets type='dump'.
    // ConnectionManager badge logic: 
    // 'bg-blue-100...': !connection.type || connection.type === 'mysql'
    // It doesn't seem to have a specific 'dump' badge style yet in the list, so it might show "MY" or similar default.
    // Actually, let's just check the name.
  });

  test('should show static badge in DDL viewer', async () => {
    // Switch to Schema View to verify "Reload File" and Static indicator?
    // Navigation: Dashboard -> Schema? Or directly click the connection?
    // ConnectionManager doesn't link to Schema View usually.
    // We go to Dashboard or use Sidebar.

    // Close Settings
    // There is no close button validation here, usually navigate back.
    // Or simpler: Click "Dashboard" in Sidebar.
    await window.click('aside >> text=Dashboard');

    // Expand sidebar tree? "Demo Dump" should be there.
    // Sidebar logic: loads connections for current project.
    const dumpNode = window.locator('aside >> text=Demo Dump');
    await expect(dumpNode).toBeVisible();

    // Click it to open Schema View?
    await dumpNode.click();

    // Check for "Static File" indicator in DDL Viewer logic?
    // Need to select a table first "users".
    await dumpNode.locator('..').locator('text=users').click(); // Might need to expand tables?
    // Dump structure in Sidebar: Connection -> Tables (category) -> users
    // Actually DumpDriver returns structure. 

    // Simply check if we can see the DDL content
    await expect(window.locator('text=CREATE TABLE users')).toBeVisible();

    // Verify "Reload File" button exists (it replaced Refresh)
    const reloadBtn = window.locator('button[title="Reload File"]');
    await expect(reloadBtn).toBeVisible();
  });
});
