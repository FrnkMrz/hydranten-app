
import { test, expect } from '@playwright/test';

test.describe('Create Hydrant Flow', () => {

    test.beforeEach(async ({ context }) => {
        // 1. Grant Permissions (Geolocation & Camera)
        await context.grantPermissions(['geolocation', 'camera']);
    });

    test('Create a new hydrant (Happy Path)', async ({ page }) => {
        // --- MOCKS ---

        // 1. Geolocation
        await page.context().setGeolocation({ latitude: 48.137154, longitude: 11.576124 });

        // 2. Auth (Seed LocalStorage)
        await page.addInitScript(() => {
            localStorage.setItem('osm-auth', JSON.stringify({
                access_token: 'mock_token',
                expires_at: Date.now() + 3600000,
                token_type: 'Bearer'
            }));
            localStorage.setItem('osm_user_name', 'PlaywrightUser');
        });

        // 3. Mock OSM API

        // 3a. Nominatim (Reverse Geocode)
        await page.route('**/nominatim.openstreetmap.org/reverse*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    display_name: 'Marienplatz, München',
                    address: { road: 'Marienplatz', city: 'München', postcode: '80331' }
                })
            });
        });

        // 3b. Create Changeset (PUT /api/0.6/changeset/create)
        await page.route('**/api/0.6/changeset/create', async route => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({ status: 200, body: '123456' }); // Return Changelog ID
            } else {
                await route.continue();
            }
        });

        // 3c. Create Node (PUT /api/0.6/node/create)
        await page.route('**/api/0.6/node/create', async route => {
            if (route.request().method() === 'PUT') {
                // Verify payload tags if needed, but for now just success
                await route.fulfill({ status: 200, body: '987654321' }); // Return Node ID
            } else {
                await route.continue();
            }
        });

        // 3d. Close Changeset (PUT /api/0.6/changeset/*/close)
        await page.route('**/api/0.6/changeset/*/close', async route => {
            await route.fulfill({ status: 200 });
        });

        // 3e. Overpass (Prevent errors on load)
        await page.route('**/interpreter', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ elements: [] }) });
        });


        // --- ACTION ---

        // 1. Load App
        await page.goto('/');

        // 2. Click Start (if visible, dependent on auto-start logic but usually "Starten" is there)
        const startBtn = page.locator('#start-btn');
        await expect(startBtn).toBeVisible();
        await startBtn.click();

        // 3. Wait for Camera View
        const captureBtn = page.locator('#capture-btn');
        await expect(captureBtn).toBeVisible();

        // Wait for video or error to ensure init is done
        // In CI, we expect error usually, but let's be flexible
        await Promise.race([
            page.locator('#camera-feed').waitFor({ state: 'visible' }).catch(() => { }),
            page.locator('#camera-error').waitFor({ state: 'visible' }).catch(() => { })
        ]);

        // Short delay to ensure event listeners are attached
        await page.waitForTimeout(1000);

        // 4. Capture Photo (Click Shutter)
        await captureBtn.click();

        // 5. Wait for Confirm View (Form)
        // Main.js shows a spinner "Locating Position..." first. 
        // We wait for the form buttons to be visible, which means processing is done.
        const undergroundBtn = page.locator('button[data-value="underground"]');
        await expect(undergroundBtn).toBeVisible({ timeout: 20000 }); // Give it time to fake-locate

        // 6. Fill Form
        // The form uses custom buttons for type selection, not a visible <select>
        // We need to click the button with data-value="underground"
        // (undergroundBtn is already defined and waited for above)
        await undergroundBtn.click();

        // Select Position: Sidewalk (also custom buttons likely? let's check form.js)
        // form.js: const posBtns = element.querySelectorAll('.pos-option-btn');
        // yes, they are buttons too.
        // Assuming there is a button with data-value="sidewalk"
        const sidewalkBtn = page.locator('button[data-value="sidewalk"]');
        // If not visible, we might need to scroll or it's a different UI. 
        // But let's assume standard layout.
        if (await sidewalkBtn.isVisible()) {
            await sidewalkBtn.click();
        } else {
            // Fallback to select if it somehow exists or just skip if optional
            console.log("Sidewalk button not found, skipping position select");
        }

        // Diameter is a text input
        await page.fill('#hydrant-diameter', '100');

        // 7. Submit
        const submitBtn = page.locator('#submit-img-btn');
        await submitBtn.click();

        // 8. Verify Upload Process
        // The overlay appears with "Warten auf Upload..."
        // Then verification of success -> "Erfolg! ✅" (or similar in overlay)

        // Check for success message in log overlay FIRST
        // The confirm view calls osm.createHydrant which logs "Node Created: ..."
        // Use a more specific selector for the overlay to avoid strict mode violations
        // The overlay has z-50 and is a direct child usually, or contains specific text.
        const logContent = page.locator('.z-50 .text-sm.font-mono');
        // Or better, just wait for the success text directly
        const successMsg = page.locator('text=Node Created: 987654321');
        await expect(successMsg).toBeVisible({ timeout: 20000 });

        // Then it should close and return to intro
        // "Done" button might appear if we mocked it that way, but let's see main.js logic:
        // onClose: (result) => { if (result) showIntro(); }
        // The overlay might auto-close or require a click if I didn't mock it to auto-close?
        // Wait, main.js says:
        /*
        showProcessOverlay(..., {
              onClose: (result) => {
                if (result) showIntro(); // Success -> Intro
        */

        // If the overlay shows "Done" button (which happens if success), we might need to click it in the test?
        // Let's check overlay.js logic or main.js logic again. 
        // In main.js: 
        /*
          if (result) {
            content += `<button id="overlay-close-btn" ...>Fertig</button>`;
          }
        */
        // So yes, we probably need to click "Fertig" or "Done" to trigger onClose!

        const closeBtn = page.locator('#overlay-close-btn');
        if (await closeBtn.isVisible()) {
            await closeBtn.click();
        } else {
            // Maybe it auto-closed?
        }

        // eventual return to Intro
        await expect(startBtn).toBeVisible({ timeout: 10000 });
    });

});
