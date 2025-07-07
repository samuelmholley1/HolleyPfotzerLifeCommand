// packages/web/e2e/mocks/task-api-mock.ts
import { Page } from '@playwright/test';

/**
 * Sets up a stateful client-side mock for the /api/tasks endpoint.
 * This helper should be called in the beforeEach block of E2E tests.
 */
export async function mockTaskApi(page: Page) {
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
}
