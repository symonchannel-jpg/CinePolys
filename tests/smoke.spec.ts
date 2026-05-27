import { test, expect } from '@playwright/test';

// Basic smoke test - verifies app loads and login page exists
test.describe('CinePolys E2E', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login or show login page
    const title = await page.title();
    expect(title).toMatch(/Cine|Login/i);
  });
});
