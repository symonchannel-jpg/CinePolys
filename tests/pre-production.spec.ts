import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';
import fs from 'fs';
import path from 'path';

test.describe('Pre-producción: Casting y Locaciones', () => {
  const dummyPhotoPath = path.join(__dirname, 'temp_dummy_photo.jpg');

  test.beforeAll(() => {
    // Create a tiny dummy image (1x1 pixel JPEG or just any valid bytes to satisfy file input/sharp)
    const base64Jpg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    fs.writeFileSync(dummyPhotoPath, Buffer.from(base64Jpg, 'base64'));
  });

  test.afterAll(() => {
    // Clean up photo file
    if (fs.existsSync(dummyPhotoPath)) {
      fs.unlinkSync(dummyPhotoPath);
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@cinepolis.com', 'admin123');
  });

  test('flujo completo de Casting: crear actor, subir foto, editar y archivar', async ({ page }) => {
    const actorName = `Actor E2E ${Date.now()}`;
    const actorChar = `Personaje E2E ${Date.now()}`;
    
    // 1. Ir a Casting
    await page.goto('/casting');
    await expect(page.locator('h1:has-text("Casting")')).toBeVisible();

    // 2. Abrir diálogo de añadir actor
    await page.locator('button:has-text("Añadir actor")').click();
    
    // Esperar a que el diálogo esté visible
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Añadir actor/actriz")')).toBeVisible();

    // 3. Rellenar Perfil General
    const nameInput = page.locator('div:has(label:has-text("Nombre")) input').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill(actorName);
    await page.locator('div:has(label:has-text("Personaje")) input').first().fill(actorChar);
    await page.locator('div:has(label:has-text("Contacto")) input').first().fill('+54911223344');
    await page.locator('div:has(label:has-text("Notas")) textarea').first().fill('Notas del actor de prueba E2E.');

    // 4. Ir a la pestaña Fotografía
    await page.locator('button:has-text("Siguiente →")').click();

    // 5. Cargar imagen de perfil
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles(dummyPhotoPath);

    // Esperar a que se muestre la previsualización de la imagen
    await expect(page.locator('img[alt="preview"]')).toBeVisible({ timeout: 10000 });

    // 6. Añadir actor y esperar a que termine el post
    await page.locator('button[type="submit"]:has-text("Añadir Actor")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

    // Verificar que el diálogo se cierra y el actor aparece en la lista
    await expect(page.locator(`text=${actorName}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=como ${actorChar}`)).toBeVisible();

    // 7. Editar actor
    const actorCard = page.locator(`div.group:has-text("${actorName}")`).first();
    // Hover en la card para hacer visible los botones de acción
    await actorCard.hover();
    await actorCard.locator('button[title="Editar"]').click();

    // Verificar diálogo de edición
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Editar actor")')).toBeVisible();
    
    const updatedName = `${actorName} Modificado`;
    // Rellenar nuevo nombre
    const editNameInput = page.locator('div:has(label:has-text("Nombre")) input').first();
    await expect(editNameInput).toBeVisible();
    await editNameInput.fill(updatedName);
    
    // Guardar cambios
    await page.locator('button:has-text("Siguiente →")').click();
    await page.locator('button[type="submit"]:has-text("Guardar cambios")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

    // Verificar que el nombre se actualizó
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();

    // 8. Eliminar/Archivar actor
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await actorCard.hover();
    await actorCard.locator('button[title="Eliminar"]').click();
    await expect(page.locator(`text=${updatedName}`)).not.toBeVisible({ timeout: 10000 });

    // Ya no debe estar en la lista
    await expect(page.locator(`text=${updatedName}`)).not.toBeVisible();
  });

  test('flujo completo de Locaciones: crear locación, mapa, imágenes, editar y archivar', async ({ page }) => {
    const locName = `Locación E2E ${Date.now()}`;
    
    // 1. Ir a Locaciones
    await page.goto('/locations');
    await expect(page.locator('h1:has-text("Locaciones")')).toBeVisible();

    // 2. Abrir diálogo de nueva locación
    await page.locator('button:has-text("Nueva locación")').click();
    
    // Esperar a que el diálogo esté visible
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Nueva locación")')).toBeVisible();

    // 3. Rellenar Información General
    const titleInput = page.locator('input[placeholder="Ej: Plaza Central"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(locName);
    await page.locator('input[placeholder="Calle, ciudad..."]').fill('Av. Siempreviva 742');
    await page.locator('textarea[placeholder="Notas sobre la locación..."]').fill('Casa de los Simpsons.');

    // 4. Ir a la pestaña Mapa
    await page.locator('button:has-text("Siguiente →")').click();

    // 5. Verificar que el mapa Leaflet se carga y hacer un click simulado en él para fijar coordenadas
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });
    await mapContainer.click();

    // Verificar que las coordenadas se muestran
    await expect(page.locator('text=Coordenadas:')).toBeVisible();

    // 6. Ir a la pestaña Galería
    await page.locator('button:has-text("Siguiente →")').click();

    // 7. Subir foto de la locación
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles(dummyPhotoPath);

    // Verificar que aparece la miniatura en la galería
    await expect(page.locator('div.group img')).toBeVisible({ timeout: 10000 });

    // 8. Guardar locación y esperar a que termine el post
    await page.locator('button[type="submit"]:has-text("Crear locación")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

    // Verificar que la locación aparece en la lista
    const locCard = page.locator(`div.group:has-text("${locName}")`).first();
    await expect(locCard).toBeVisible();
    await expect(locCard.locator('text=Av. Siempreviva 742')).toBeVisible();

    // 9. Editar locación
    await locCard.hover();
    await locCard.locator('button[title="Editar"]').click();

    // Verificar diálogo de edición
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Editar locación")')).toBeVisible();
    
    const updatedLocName = `${locName} Modificada`;
    const editTitleInput = page.locator('input[placeholder="Ej: Plaza Central"]');
    await expect(editTitleInput).toBeVisible();
    await editTitleInput.fill(updatedLocName);

    // Guardar cambios
    await page.locator('button:has-text("Siguiente →")').click(); // Mapa
    await page.locator('button:has-text("Siguiente →")').click(); // Galería
    await page.locator('button[type="submit"]:has-text("Guardar cambios")').click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

    // Verificar que el nombre se actualizó
    await expect(page.locator(`text=${updatedLocName}`)).toBeVisible();

    // 10. Eliminar/Archivar locación
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await locCard.hover();
    await locCard.locator('button[title="Eliminar"]').click();
    await expect(page.locator(`text=${updatedLocName}`)).not.toBeVisible({ timeout: 10000 });

    // Ya no debe estar en la lista
    await expect(page.locator(`text=${updatedLocName}`)).not.toBeVisible();
  });
});
