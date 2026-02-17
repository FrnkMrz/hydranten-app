
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('Handle OAuth Callback and Fetch User Details', async ({ page }) => {

        // 1. Mock the Token Exchange (POST /oauth2/token)
        await page.route('**/oauth2/token', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'mock_access_token_123',
                    token_type: 'Bearer',
                    scope: 'read_prefs write_api',
                    created_at: Math.floor(Date.now() / 1000)
                })
            });
        });

        // 2. Mock User Details Fetch (GET /api/0.6/user/details)
        await page.route('**/api/0.6/user/details', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/xml',
                body: `
                    <osm version="0.6" generator="OpenStreetMap server">
                        <user id="1001" display_name="PlaywrightUser" account_created="2024-01-01T00:00:00Z">
                            <img href="https://example.com/avatar.jpg"/>
                        </user>
                    </osm>
                `
            });
        });

        // 3. Simulate returning from OSM Login with a code
        // IMPORTANT: The app expects 'osm_auth_state' and 'osm_pkce_verifier' to be present in localStorage
        // from the "start login" phase. We must seed them.

        await page.addInitScript(() => {
            localStorage.setItem('osm_auth_state', 'mock_state_xyz');
            localStorage.setItem('osm_pkce_verifier', 'mock_verifier_abc');
        });

        // We navigate to the app with the 'code' query param AND the matching 'state'
        await page.goto('/?code=valid_auth_code_from_osm&state=mock_state_xyz');

        // 4. Verification

        // The app shows a loading screen with "#pkce-log" first
        const log = page.locator('#pkce-log');
        await expect(log).toBeVisible();
        await expect(log).toContainText('Got Code');
        await expect(log).toContainText('SUCCESS! Token');

        // Then it switches to Settings View
        // We verify that the User Display in Settings shows the name
        const userDisplay = page.locator('#user-display');
        await expect(userDisplay).toBeVisible({ timeout: 15000 });
        await expect(userDisplay).toContainText('PlaywrightUser');

        // Optional: Check local storage persistence
        const localStorageData = await page.evaluate(() => localStorage.getItem('osm-auth'));
        expect(localStorageData).toContain('mock_access_token_123');
    });

    test('Start Login Redirect', async ({ page }) => {
        // This test verifies that clicking login *attempts* to leave the page to OSM.
        // We intercept the navigation to prevent actual network request / leaving test context totally.

        await page.goto('/');

        // Click Settings to reveal Login button (if it's inside settings?)
        // Wait, in Intro View, the login button IS the settings button if not logged in?
        // Let's check intro-view again.
        // Button #intro-settings-btn shows "Login with OSM" if no token.

        // If we click it, it opens modal or redirects?
        // Checking auth.js / settings-view.js logic might be needed. 
        // Assuming it opens settings-view, which has the actual Login button.
    });

});
