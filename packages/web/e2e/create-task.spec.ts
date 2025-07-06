import { test, expect } from '@playwright/test';

test('User can create a task and see it in the list', async ({ page }) => {
  await page.goto('/');

  // Assert TaskForm is visible
  await expect(page.getByTestId('task-input')).toBeVisible();
  await expect(page.getByTestId('task-create-button')).toBeVisible();

  // Immediately fill and submit the new task
  await page.getByTestId('task-input').fill('My New Verified Task');
  await page.getByTestId('task-create-button').click();

  // Assert that the new task appears in the list
  await expect(page.getByText('My New Verified Task')).toBeVisible();
});
