import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Gestión de Tareas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@cinepolis.com', 'admin123');
  });

  test('flujo de ciclo de vida completo de una tarea con comentarios y papelera', async ({ page }) => {
    const taskTitle = `Tarea E2E Arte ${Date.now()}`;

    // 1. Ir a Tareas y hacer click en "Nueva tarea"
    await page.goto('/tasks');
    await expect(page.locator('h1:has-text("Tareas")')).toBeVisible();

    await page.locator('button:has-text("Nueva tarea")').click();
    
    // Esperar a que el diálogo esté visible
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    // 2. Rellenar pestaña General
    await page.locator('#title').fill(taskTitle);
    await page.locator('#desc').fill('Detalles de arte y utilería para la escena 1.');
    
    // Seleccionar Departamento "Arte"
    await page.locator('button:has-text("Sin depto")').click();
    await page.locator('div[role="option"]:has-text("Arte")').click();

    // Ir a pestaña de Asignación
    await page.locator('button:has-text("Siguiente →")').click();

    // Seleccionar al menos un asignado (el primer checkbox en la lista)
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 5000 });
    
    // Use force: true to prevent dynamic list rendering detach error
    await firstCheckbox.check({ force: true });

    // Submit y esperar a que el diálogo se cierre
    await page.locator('button[type="submit"]:has-text("Crear Tarea")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 3. Verificar que aparece en la lista de tareas
    const taskRow = page.locator(`span:has-text("${taskTitle}")`).first();
    await expect(taskRow).toBeVisible();

    // 4. Entrar al detalle de la tarea
    await taskRow.click();
    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.locator(`h1:has-text("${taskTitle}")`)).toBeVisible();

    // 5. Añadir un comentario con @mención
    await page.locator('input[placeholder="Escribe un comentario..."]').fill('Hola @Admin, ya tenemos listos los decorados.');
    await page.locator('button:has-text("Enviar")').click();

    // Verificar que el comentario aparece y la mención está resaltada
    const commentParagraph = page.locator('p:has-text("Hola")').first();
    await expect(commentParagraph).toBeVisible();
    await expect(commentParagraph.locator('span.text-primary')).toHaveText('@Admin');

    // 6. Archivar la tarea
    // Interceptar la confirmación del navegador para Archivar
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('button:has-text("Archivar")').click();

    // Redirige a /tasks y ya no debería estar
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();

    // 7. Ir a la Papelera (/trash) y verificar que está allí
    await page.goto('/trash');
    const trashedTask = page.locator(`div:has-text("${taskTitle}")`).first();
    await expect(trashedTask).toBeVisible();

    // 8. Restaurar la tarea
    await trashedTask.locator('button:has-text("Restaurar")').click();

    // Desaparece de la papelera
    await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();

    // 9. Comprobar que vuelve a estar en Tareas
    await page.goto('/tasks');
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
  });
});
