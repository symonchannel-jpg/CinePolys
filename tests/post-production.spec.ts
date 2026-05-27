import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Post-producción: VFX Shot Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@cinepolis.com', 'admin123');
  });

  test('flujo de ciclo de vida completo de un plano VFX: crear, filtrar, editar inline y archivar', async ({ page }) => {
    const shotId = `SH_${Date.now()}`;
    
    // 1. Ir a Post-Producción Hub
    await page.goto('/vfx-tracking');
    await expect(page.locator('h1:has-text("Post-Producción Hub")')).toBeVisible();

    // 2. Cambiar a la pestaña de Efectos VFX
    await page.locator('button:has-text("Efectos VFX")').click();
    await expect(page.locator('h2:has-text("Listado de Planos de Efectos Visuales")')).toBeVisible();

    // 3. Crear nuevo plano VFX
    await page.locator('button:has-text("Nuevo Plano VFX")').click();
    
    // Esperar a que el diálogo de creación de plano VFX esté visible
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Crear plano VFX")')).toBeVisible();

    // Rellenar formulario
    await page.locator('input[placeholder="SC01_SH010"]').fill(shotId);
    await page.locator('textarea[placeholder="Descripción del plano..."]').fill('Una nave espacial cruzando la pantalla en E2E.');
    
    // Cambiar complejidad a "Alta"
    // Click en el select de complejidad (por defecto debería mostrar "Media" o similar)
    await page.locator('button:has-text("Media")').first().click();
    await page.locator('div[role="option"]:has-text("Alta")').click();

    // Cambiar estado a "En Progreso"
    // El select de estado inicialmente mostrará "Pendiente"
    await page.locator('button:has-text("Pendiente")').first().click();
    await page.locator('div[role="option"]:has-text("En Progreso")').click();

    await page.locator('textarea[placeholder="Notas adicionales..."]').fill('Notas del tracker E2E.');

    // Enviar formulario y esperar a que termine el post
    await page.locator('button[type="submit"]:has-text("Crear Plano")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

    // 4. Verificar que aparece en la tabla
    const shotRow = page.locator(`tr:has-text("${shotId}")`).first();
    await expect(shotRow).toBeVisible();
    await expect(shotRow.locator('text=Alta')).toBeVisible();
    await expect(shotRow.locator('text=En Progreso')).toBeVisible();

    // 5. Probar filtros
    // Buscar por ID
    await page.locator('input[placeholder="Buscar por Shot ID..."]').fill(shotId);
    await expect(shotRow).toBeVisible();

    // Limpiar filtro escribiendo algo que no existe
    await page.locator('input[placeholder="Buscar por Shot ID..."]').fill('INEXISTENTE_SHOT_ID');
    await expect(shotRow).not.toBeVisible();

    // Volver a limpiar
    await page.locator('input[placeholder="Buscar por Shot ID..."]').fill('');
    await expect(shotRow).toBeVisible();

    // 6. Editar inline el estado a Aprobado
    await shotRow.locator('button:has-text("Editar")').click();
    
    // El select en la celda se vuelve interactivo.
    // Hacemos click en el select de la celda de la tabla que muestra "En Progreso"
    await shotRow.locator('button:has-text("En Progreso")').click();
    await page.locator('div[role="option"]:has-text("Aprobado")').click();

    // Guardar cambios inline
    await shotRow.locator('button:has-text("Guardar")').click();
    await expect(shotRow.locator('text=Aprobado')).toBeVisible({ timeout: 10000 });

    // Verificar que el estado cambió a Aprobado
    await expect(shotRow.locator('text=Aprobado')).toBeVisible();

    // 7. Archivar/Eliminar plano VFX
    // No requiere Dialog confirm porque usa archiveVfx.mutate directamente
    await shotRow.locator('button.hover\\:text-destructive').click();
    await expect(page.locator(`tr:has-text("${shotId}")`)).not.toBeVisible({ timeout: 10000 });

    // Ya no debe estar en la lista
    await expect(page.locator(`tr:has-text("${shotId}")`)).not.toBeVisible();
  });
});
