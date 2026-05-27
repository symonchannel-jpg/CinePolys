import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Gestión de Proyectos', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as administrator before each test
    await loginAs(page, 'admin@cinepolis.com', 'admin123');
  });

  test('visualiza proyectos existentes y crea uno nuevo', async ({ page }) => {
    // 1. Verificar pestaña del proyecto por defecto
    const defaultTab = page.locator('div[role="button"]').filter({ hasText: 'Producción Actual' }).first();
    await expect(defaultTab).toBeVisible();

    // 2. Click en botón "Nuevo"
    const newProjectBtn = page.locator('button[title="Crear nuevo proyecto"]');
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();

    // Esperar a que el diálogo esté visible
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    // 3. Rellenar formulario de creación de proyecto
    await page.locator('input[placeholder="Nombre del proyecto"]').fill('Proyecto E2E Test');
    
    // Seleccionar el primer color de preset
    const firstColorBtn = page.locator('div[role="dialog"] button[type="button"]').first();
    await firstColorBtn.click();

    // Click en "Crear"
    await page.locator('button:has-text("Crear")').click();

    // Esperar a que el diálogo se cierre
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 4. Verificar que se ha creado la pestaña
    const newProjectTab = page.locator('div[role="button"]').filter({ hasText: 'Proyecto E2E Test' }).first();
    await expect(newProjectTab).toBeVisible();

    // 5. Seleccionar la pestaña del nuevo proyecto
    await newProjectTab.click();

    // Comprobar que se actualiza el currentProjectId y se mantiene activa
    await expect(newProjectTab).toHaveClass(/bg-background/);
  });
});
