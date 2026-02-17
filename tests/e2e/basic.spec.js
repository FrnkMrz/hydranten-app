
import { test, expect } from '@playwright/test';
// Don't import source files directly in E2E tests if they use browser globals at top-level
// import { t } from '../../src/services/i18n.js';

test('App loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Hydranten Jäger/);

    // Check main button exists (using data-testid or text)
    // Since we rely on i18n, we might need to check for the startup button class or ID
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
});
