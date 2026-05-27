import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Enlaces Compartidos Públicos de Call Sheets', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@cinepolis.com', 'admin123');
  });

  test('flujo completo de Call Sheet: crear, generar enlace público, acceso sin sesión y revocación', async ({ page, browser }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const scenesText = `Escenas E2E Compartido - Secuencia ${Date.now()}`;
    const notesText = 'Instrucciones de seguridad: Uso obligatorio de casco.';

    // 1. Ir a /dailies
    await page.goto('/dailies');
    await expect(page.locator('h1:has-text("Llamados (Call Sheets)")')).toBeVisible();

    // 2. Crear un nuevo llamado
    await page.locator('button:has-text("Nuevo llamado")').click();
    
    // Esperar a que el diálogo del llamado estructurado esté visible
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Crear llamado estructurado")')).toBeVisible();

    // Rellenar pestaña General
    await page.locator('#formDate').fill(todayStr);
    await page.locator('#crewCall').fill('06:30');
    await page.locator('#shootStart').fill('07:30');
    await page.locator('#wrapTime').fill('19:30');

    // Siguiente a Locación
    await page.locator('button:has-text("Siguiente →")').click();
    await expect(page.locator('#additionalLocation')).toBeVisible();
    await page.locator('#additionalLocation').fill('Set de Efectos Especiales E2E');

    // Siguiente a Casting
    await page.locator('button:has-text("Siguiente →")').click();

    // Siguiente a Plan y Notas
    await page.locator('button:has-text("Siguiente →")').click();
    await expect(page.locator('#scenesText')).toBeVisible();
    await page.locator('#scenesText').fill(scenesText);
    await page.locator('#notesText').fill(notesText);

    // Crear y esperar a que el diálogo desaparezca
    await page.locator('button[type="submit"]:has-text("Crear Llamado")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 3. Verificar que aparece en la lista
    // Buscamos por la fecha formateada en la UI
    const formattedDate = new Date(todayStr).toLocaleDateString("es", { day: "numeric", month: "long" });
    const callSheetCard = page.locator(`div.rounded-lg:has-text("${formattedDate}")`).first();
    await expect(callSheetCard).toBeVisible();

    // Expandir el llamado para verificar contenido en la card
    await callSheetCard.locator('span:has-text("▶")').click();
    await expect(callSheetCard.locator(`text=${scenesText}`)).toBeVisible();
    await expect(callSheetCard.locator(`text=${notesText}`)).toBeVisible();

    // 4. Generar enlace compartido
    await callSheetCard.locator('button:has-text("Compartir")').click();

    // Esperar al modal de Enlace compartido
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Enlace compartido")')).toBeVisible();

    // Obtener la URL del enlace de solo lectura
    const shareInput = page.locator('div[role="dialog"] input[readonly]');
    await expect(shareInput).toBeVisible();
    const shareUrl = await shareInput.inputValue();
    expect(shareUrl).toContain('/share/');

    // 5. Probar el enlace público en un nuevo contexto de navegador independiente (sin sesión de login)
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    
    await publicPage.goto(shareUrl);

    // Verificar que el Call Sheet se visualiza correctamente y no redirige a /login
    await expect(publicPage.locator('h1:has-text("Call Sheet")')).toBeVisible();
    await expect(publicPage.locator(`text=${scenesText}`)).toBeVisible();
    await expect(publicPage.locator(`text=${notesText}`)).toBeVisible();
    await expect(publicPage.locator('text=Crew Call')).toBeVisible();
    await expect(publicPage.locator('text=06:30')).toBeVisible();

    // Cerrar la pestaña pública
    await publicPage.close();
    await publicContext.close();

    // 6. Revocar enlace público
    // Hacer click en Revocar enlace
    await page.locator('button:has-text("Revocar enlace")').click();
    
    // El diálogo debería cerrarse
    await expect(page.locator('h2:has-text("Enlace compartido")')).not.toBeVisible();

    // 7. Validar que la URL pública ahora arroja un error o 404
    const postRevokeContext = await browser.newContext();
    const postRevokePage = await postRevokeContext.newPage();
    
    const response = await postRevokePage.goto(shareUrl);
    
    // Puede devolver un estado 404 (notFound())
    expect(response?.status()).toBe(404);
    
    await postRevokePage.close();
    await postRevokeContext.close();

    // 8. Limpieza/Archivado del llamado
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await callSheetCard.locator('button:has-text("Archivar")').click();

    // Ya no debe estar en la lista
    await expect(page.locator(`div.rounded-lg:has-text("${formattedDate}")`)).not.toBeVisible();
  });
});
