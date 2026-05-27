import { test, expect } from '@playwright/test';

/**
 * E2E Sanity Test Suite
 * 
 * Estos tests verifican que la aplicación carga correctamente
 * sin hacer mutaciones a la base de datos ni crear datos.
 * 
 * Son 100% seguros: solo lectura, sin logins, sin cambios.
 */

test.describe('CinePolys E2E Sanity Checks', () => {
  
  test('login page renders with correct elements', async ({ page }) => {
    await page.goto('/login');
    
    // Verify page title
    await expect(page).toHaveTitle(/CinePolys/i);
    
    // Verify login form elements exist (using id selectors)
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Entrar');
  });
  
  test('dashboard redirects unauthenticated users', async ({ page }) => {
    // Clear cookies to ensure unauthenticated state
    await page.context().clearCookies();
    
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
  
  test('root path redirects to login', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login or show login page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login$/);
  });
  
});