import { test, expect } from '@playwright/test';

test('User can create a task and see it in the list', async ({ page }) => {
  await page.goto('/');

  // Wait for initial tasks to load to ensure form is ready
  await expect(page.getByText("Alice's Task")).toBeVisible();

  // Create a new task
  await page.getByPlaceholder('Task title').fill('My New Verified Task');
  await page.getByRole('button', { name: 'Create Task' }).click();

  // Assert that the new task appears in the list
  await expect(page.getByText('My New Verified Task')).toBeVisible();
});
