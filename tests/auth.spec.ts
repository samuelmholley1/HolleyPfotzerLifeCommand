import { test, expect } from '@playwright/test';

// Before running this test, ensure your Next.js development server is active (`yarn dev`).
// Ensure that your playwright.config.ts has a 'baseURL' configured, e.g., 'http://localhost:3000'.
// If not, you may need to explicitly use await page.goto('http://localhost:3000'); instead of page.goto('/');

test.describe('Authentication Flow', () => {
  test('should allow a user to sign in and sign out (manual, headed mode)', async ({ page }) => {
    // Navigate to the base URL of the application.
    // Assumes 'baseURL' is set in playwright.config.ts.
    await page.goto('/');

    // Check if we are already signed in. If a 'Sign Out' button is visible, click it to start clean.
    const signOutButtonInitial = page.getByRole('button', { name: /Sign Out/i });
    if (await signOutButtonInitial.isVisible()) {
      console.log('Already signed in. Logging out to ensure clean state for sign-in test.');
      await signOutButtonInitial.click();
      await expect(page.getByRole('button', { name: /Sign In with Google/i })).toBeVisible();
    }

    // 1. Verify "Sign In with Google" button is visible
    const signInButton = page.getByRole('button', { name: /Sign In with Google/i });
    await expect(signInButton).toBeVisible();
    console.log('Sign In with Google button is visible.');

    // 2. Click the "Sign In with Google" button.
    // This will initiate the authentication flow, which for Google OAuth typically involves
    // a redirect to Google, then back to the application upon success.
    // Playwright will follow these redirects.
    await signInButton.click();
    console.log('Clicked Sign In with Google button.');

    // 3. Expect to see the "Sign Out" button after successful authentication.
    // We set a generous timeout for the authentication process to complete.
    const signOutButton = page.getByRole('button', { name: /Sign Out/i });
    await expect(signOutButton).toBeVisible({ timeout: 15000 }); // 15 seconds to allow for auth redirect
    console.log('Sign Out button is visible, indicating successful sign-in.');

    // 4. Verify "Sign In" button is no longer visible after successful login
    await expect(signInButton).not.toBeVisible();
    console.log('Sign In button is no longer visible.');

    // 5. Test sign out functionality
    await signOutButton.click();
    console.log('Clicked Sign Out button.');

    // 6. After signing out, "Sign In" button should be visible again, and "Sign Out" should be gone.
    await expect(signInButton).toBeVisible();
    await expect(signOutButton).not.toBeVisible();
    console.log('Successfully signed out. Sign In button visible again.');

    console.log('Authentication test completed successfully.');
  });

  test('should show authenticated state using storageState', async ({ page, context }) => {
    // This test assumes storageState is loaded (see playwright.config.ts)
    await page.goto('/');
    // Should see the Sign Out button immediately if authenticated
    const signOutButton = page.getByRole('button', { name: /Sign Out/i });
    await expect(signOutButton).toBeVisible();
    // Optionally, test post-auth flows (e.g., create a task)
  });
});
