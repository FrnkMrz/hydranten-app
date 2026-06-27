
import { test, expect } from '@playwright/test';

test.describe('Map & GPS Features', () => {

    test.beforeEach(async ({ context }) => {
        // Grant geolocation permission
        await context.grantPermissions(['geolocation']);
    });

    test('Loads map at user location and fetches hydrants', async ({ page }) => {
        // 1. Mock Geolocation (Munich Center)
        await page.context().setGeolocation({ latitude: 48.137154, longitude: 11.576124 });

        // 2. Mock Overpass API Response
        await page.route('**/interpreter', async route => {
            const request = route.request();
            const postData = request.postData();

            // console.log('Intercepted Overpass Request:', postData); // Debugging

            // Verify we are querying for hydrants (emergency=fire_hydrant or similar)
            if (postData && (postData.includes('emergency') || postData.includes('fire_hydrant'))) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        elements: [
                            {
                                type: 'node',
                                id: 12345,
                                lat: 48.137154,
                                lon: 11.576124,
                                tags: { emergency: 'fire_hydrant', 'fire_hydrant:type': 'underground' }
                            }
                        ]
                    })
                });
            } else {
                await route.continue();
            }
        });

        // 3. Open App
        await page.goto('/');

        // 4. Verify Map Loads (Leaflet container exists)
        const map = page.locator('#intro-map');
        await expect(map).toBeVisible();

        // 5. Verify "Locate Me" works or map centers
        // The app auto-centers on load if permission is granted. 
        // We wait for the marker to appear in the DOM.
        // Leaflet markers are usually images with class 'leaflet-marker-icon'
        // Our hydrants use the custom Leaflet icon class from intro-view.js.

        // Wait for the hydrant marker to appear
        const hydrantMarker = page.locator('.hydrant-custom-icon');
        await expect(hydrantMarker).toBeVisible({ timeout: 10000 });

        // Optional: Click it to ensure interaction works
        await hydrantMarker.click();

        // After click, it might change style or trigger edit mode if implemented
        // For now, just ensuring it's there and clickable is enough for this test.
    });

    test('Blocks capture flow if GPS is denied', async ({ page, context }) => {
        // 1. Deny Permissions
        await context.clearPermissions();

        await page.addInitScript(() => {
            navigator.geolocation.getCurrentPosition = (success, error) => {
                error({ code: 1, message: 'User denied Geolocation' });
            };
            navigator.geolocation.watchPosition = (success, error) => {
                error({ code: 1, message: 'User denied Geolocation' });
                return 1;
            };
        });

        await page.route('**/interpreter', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ elements: [] })
            });
        });

        await page.goto('/');

        await page.locator('#start-btn').click();
        const captureBtn = page.locator('#capture-btn');
        await expect(captureBtn).toBeVisible();
        await captureBtn.click();

        await expect(
            page.getByText(/Location could not be determined|Standort konnte nicht ermittelt/)
        ).toBeVisible();
        await expect(page.locator('#submit-img-btn')).toHaveCount(0);
    });
});
