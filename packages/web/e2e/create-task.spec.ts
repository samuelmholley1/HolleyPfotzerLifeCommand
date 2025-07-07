import { test, expect } from '@playwright/test';
import { mockTaskApi } from './mocks/task-api-mock';

test.describe('Create Task (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await mockTaskApi(page);
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
