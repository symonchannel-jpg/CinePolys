import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';
import fs from 'fs';
import path from 'path';

test.describe('Script Hub & Desglose', () => {
  const testPdfPath = path.join(__dirname, 'temp_dummy_script.pdf');

  test.beforeAll(() => {
    // Create a temporary dummy PDF file for uploading
    fs.writeFileSync(testPdfPath, '%PDF-1.4 ... dummy script file contents ...');
  });

  test.afterAll(() => {
    // Clean up the temporary PDF file
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@cinepolis.com', 'admin123');
  });

  test('sube un guión, crea un elemento de desglose y genera una tarea vinculada', async ({ page }) => {
    const scriptTitle = `Guion E2E ${Date.now()}`;

    // 1. Ir a /scripts y abrir modal de creación
    await page.goto('/scripts');
    await expect(page.locator('h1:has-text("Guiones")')).toBeVisible();

    await page.locator('button:has-text("Nuevo guión")').click();
    // Esperar a que el diálogo esté visible
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    // 2. Rellenar formulario
    await page.locator('input[placeholder="Nombre del guión"]').fill(scriptTitle);
    
    // Subir el archivo PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Click en Subir guión y esperar a que se procese e inserte en la lista
    await page.locator('button[type="submit"]:has-text("Subir guión")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // 3. Verificar que aparece en la lista de guiones
    const scriptCard = page.locator(`button:has-text("${scriptTitle}")`).first();
    await expect(scriptCard).toBeVisible();

    // 4. Entrar al detalle del guión
    await scriptCard.click();
    await expect(page.locator(`h1:has-text("${scriptTitle}")`)).toBeVisible();

    // 5. Ir a la pestaña de Desglose
    await page.locator('button[role="tab"]:has-text("Desglose")').click();

    // 6. Agregar elemento de desglose
    await page.locator('button:has-text("Agregar elemento")').click();
    // Esperar al diálogo del desglose
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    await page.locator('input[placeholder="Nombre"]').fill('Darth Vader');
    
    // Seleccionar categoría Personajes (ya está por defecto o seleccionamos "Personajes")
    await page.locator('button:has-text("Otros")').click();
    await page.locator('div[role="option"]:has-text("Personajes")').click();

    await page.locator('input[placeholder="Escena"]').fill('12');
    await page.locator('input[placeholder="Pág."]').fill('4');

    await page.locator('button:has-text("Siguiente →")').click();
    await page.locator('textarea[placeholder="Descripción..."]').fill('Villano icónico con respiración asistida.');

    await page.locator('button[type="submit"]:has-text("Agregar")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // Verificar que aparece en la tabla de desglose
    const breakdownRow = page.locator('tr:has-text("Darth Vader")');
    await expect(breakdownRow).toBeVisible();

    // 7. Generar una tarea desde el desglose haciendo click en "T"
    const taskBtn = breakdownRow.locator('button[title="Crear tarea"]');
    await expect(taskBtn).toBeVisible();
    await taskBtn.click();

    // 8. Ir a Tareas y verificar que la tarea [Guion] Darth Vader existe
    await page.goto('/tasks');
    await expect(page.locator('text=[Guion] Darth Vader')).toBeVisible();
  });
});
