import { test, expect } from '@playwright/test';

test('sign in and create task', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).click();
  // ⬆ replace with real auth flow (or bypass if using Supabase cookie)

  await page.getByPlaceholder('Add a task').fill('Buy groceries');
  await page.getByRole('button', { name: /add/i }).click();

  await expect(page.getByText('Buy groceries')).toBeVisible();
});
