import { test, expect } from '@playwright/test';

test.describe('Authentication Flow (E2E always-authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // This client-side mock will intercept all calls to the tasks API.
    // It is stateful and will persist for the duration of a single test.
    let mockTasks: any[] = [];

    await page.route('**/api/tasks', async route => {
      const request = route.request();

      if (request.method() === 'DELETE') {
        mockTasks = [];
        return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
      }

      if (request.method() === 'GET') {
        return route.fulfill({ status: 200, body: JSON.stringify(mockTasks) });
      }

      if (request.method() === 'POST') {
        const task = await request.postDataJSON();
        const newTask = { id: `mock-id-${Date.now()}`, ...task };
        mockTasks.push(newTask);
        return route.fulfill({ status: 201, body: JSON.stringify(newTask) });
      }
    });

    // Reset the mock state before each test run.
    await page.request.delete('/api/tasks');
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
