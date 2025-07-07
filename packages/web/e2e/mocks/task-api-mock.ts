// packages/web/e2e/mocks/task-api-mock.ts
import { Page } from '@playwright/test';

export async function mockTaskApi(page: Page) {
  // This state is scoped to a single test file.
  let mockTasks: any[] = [];

  await page.route('**/api/tasks**', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTasks),
      });
    }

    if (request.method() === 'POST') {
      const task = await request.postDataJSON();
      const newTask = { id: `mock-id-${Date.now()}`, ...task, status: 'pending' };
      mockTasks.push(newTask);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newTask),
      });
    }
  });
}
