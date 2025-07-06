import { test, expect } from '@playwright/test';

test('create a task when pre-authenticated', async ({ page }) => {
  // 1. Go to the home route
  await page.goto('/');

  // 2. Fill in the task and submit
  await page.getByTestId('task-input').fill('Buy groceries');
  // Click the real button label you see in the UI:
  await page.getByTestId('task-create-button').click();

  // ↓ pause here so you can see the live DOM
  await page.pause();

  // 3. Assert it shows up in the list
  await expect(page.getByText('Buy groceries')).toBeVisible();
}, { timeout: 10000 });
