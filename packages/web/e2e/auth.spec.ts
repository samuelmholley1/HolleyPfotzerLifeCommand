import { test, expect } from '@playwright/test';
import { mockTaskApi } from '../mocks/task-api-mock';

test.describe('Authentication Flow (E2E always-authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockTaskApi(page);
  });

  test('should show TaskForm and allow task creation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('task-input')).toBeVisible();

    await page.getByTestId('task-input').fill('E2E Auth Test Task');
    await page.getByTestId('task-create-button').click();
    // Assert that the new task appears in the list, waiting for the DOM to update.
    await expect(
      page.getByText('E2E Auth Test Task'),
      'The new task should be visible after creation',
    ).toBeVisible();
  });
});
