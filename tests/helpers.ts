import { Page, expect } from '@playwright/test';

/**
 * Logs in a user programmatically by filling out the login form.
 */
export async function loginAs(page: Page, email: string, password = 'admin123') {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  
  // Wait for the URL to contain /dashboard
  await expect(page).toHaveURL(/\/dashboard|^\/$/);
}
