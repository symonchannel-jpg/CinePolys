import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Autenticación y Registro', () => {
  test('corta la carga y valida login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('incorrecto@cinepolis.com');
    await page.locator('input[type="password"]').fill('falsa123');
    await page.locator('button[type="submit"]').click();
    
    // We should still be on login page, with some error toast or message
    await expect(page).toHaveURL(/\/login/);
  });

  test('flujo de registro y aprobación de administrador', async ({ page }) => {
    const testEmail = `crew_${Date.now()}@cinepolis.com`;
    const testName = `Crew E2E ${Date.now()}`;

    // 1. Ir a /register y registrar usuario
    await page.goto('/register');
    await page.locator('#name').fill(testName);
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill('clave123');
    await page.locator('#confirm').fill('clave123');
    await page.locator('button[type="submit"]').click();

    // Validar mensaje de solicitud enviada
    await expect(page.locator('text=Solicitud enviada')).toBeVisible();

    // 2. Intentar loguear con cuenta pendiente (debe fallar)
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill('clave123');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=aprobada')).toBeVisible(); // Muestra "Tu cuenta aún no ha sido aprobada..."

    // 3. Entrar como Admin, ir a /admin/users y aprobar al usuario
    await loginAs(page, 'admin@cinepolis.com', 'admin123');
    await page.goto('/admin/users');
    
    // Buscar la tarjeta del usuario pendiente
    const userCard = page.locator(`div:has-text("${testEmail}")`).first();
    await expect(userCard).toBeVisible();

    // Seleccionar aprobar como "Crew"
    await userCard.locator('button:has-text("Aprobar como...")').click();
    await page.locator('[data-slot="select-item"]:has-text("Crew")').click();

    // Verificar que el usuario pasa a la lista de Miembros activos
    const activeCard = page.locator(`div:has-text("${testEmail}")`).first();
    await expect(activeCard.locator('span:has-text("Crew")')).toBeVisible({ timeout: 10000 });

    // Hacer logout
    await page.goto('/dashboard');
    // Al final del sidebar o botón, hacemos logout o simplemente limpiamos las cookies
    await page.context().clearCookies();

    // 4. Iniciar sesión con el usuario aprobado
    await loginAs(page, testEmail, 'clave123');
    // Debería redirigir al home/dashboard satisfactoriamente
    await expect(page).toHaveURL(/\/dashboard|^\/$/);
  });
});
