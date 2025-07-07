import { test, expect } from '@playwright/test';

test.describe('Create Task (E2E)', () => {
  let mockTasks: any[] = [];

  test.beforeEach(async ({ page, request }) => {
    // Clear server-side mockTasks
    await request.delete('/api/e2e-mock/tasks');
  });

  test('User can create a task and see it in the list', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('task-input')).toBeVisible();

    await page.getByTestId('task-input').fill('My New Verified Task');
    await page.getByTestId('task-create-button').click();
    // Assert that the new task appears in the list, waiting for the DOM to update.
    await expect(page.getByText('My New Verified Task'), 'The new task should be visible after creation').toBeVisible();
  });
});
