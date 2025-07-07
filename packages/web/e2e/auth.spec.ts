import { test, expect } from '@playwright/test';

test.describe('Authentication Flow (E2E always-authenticated)', () => {
  let mockTasks: any[] = [];

  test.beforeEach(async ({ page, request }) => {
    // Clear server-side mockTasks
    await request.delete('/api/tasks');
  });

  test('should show TaskForm and allow task creation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('task-input')).toBeVisible();

    await page.getByTestId('task-input').fill('E2E Auth Test Task');
    await page.getByTestId('task-create-button').click();
    // Assert that the new task appears in the list, waiting for the DOM to update.
    await expect(page.getByText('E2E Auth Test Task'), 'The new task should be visible after creation').toBeVisible();
  });
});
