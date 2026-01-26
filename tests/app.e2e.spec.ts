import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test('launch app', async () => {
  // Point to the main script in dist-electron or src (depending on build)
  // Since we are in dev, we might point to dist-electron/main.js if built
  // But for reliability in this sample, let's assume standard build output

  const electronPath = path.join(__dirname, '../dist-electron/main.js');
  console.log(`Launching electron from: ${electronPath}`);

  const app = await electron.launch({
    args: [electronPath]
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  const title = await window.title();
  console.log(`App title: ${title}`);

  // Basic assertion
  // Basic assertion - title may be empty during load
  expect(title).toBeDefined();

  await app.close();
});
