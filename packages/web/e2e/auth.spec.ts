import { test, expect } from '@playwright/test';

test.describe('Authentication Flow (E2E always-authenticated)', () => {
  test('should show TaskForm and allow task creation', async ({ page }) => {
    await page.goto('/');
    // Assert TaskForm is visible
    await expect(page.getByTestId('task-input')).toBeVisible();
    await expect(page.getByTestId('task-create-button')).toBeVisible();

    // Optionally, create a task and assert it appears
    await page.getByTestId('task-input').fill('E2E Auth Test Task');
    await page.getByTestId('task-create-button').click();
    await expect(page.getByText('E2E Auth Test Task')).toBeVisible();
  });
});
