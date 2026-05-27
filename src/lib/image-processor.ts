import sharp from "sharp"
import { mkdir, unlink } from "fs/promises"
import path from "path"

export interface ImageSizes {
  thumbnail: string
  medium: string
  original: string
}

const THUMBNAIL_SIZE = 150
const MEDIUM_SIZE = 800
const THUMBNAIL_QUALITY = 70
const MEDIUM_QUALITY = 80

export async function processImageUpload(
  file: File,
  uploadDir: string,
  baseName: string
): Promise<ImageSizes> {
  await mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = "jpg"

  const thumbPath = path.join(uploadDir, `${baseName}_thumb.${ext}`)
  const medPath = path.join(uploadDir, `${baseName}_med.${ext}`)
  const origPath = path.join(uploadDir, `${baseName}.${ext}`)

  await Promise.all([
    sharp(buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover", position: "center" })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toFile(thumbPath),

    sharp(buffer)
      .resize(MEDIUM_SIZE, MEDIUM_SIZE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: MEDIUM_QUALITY })
      .toFile(medPath),

    sharp(buffer)
      .jpeg({ quality: 90 })
      .toFile(origPath),
  ])

  return {
    thumbnail: thumbPath,
    medium: medPath,
    original: origPath,
  }
}

export function getPublicPaths(dirName: string, baseName: string): ImageSizes {
  return {
    thumbnail: `/uploads/${dirName}/${baseName}_thumb.jpg`,
    medium: `/uploads/${dirName}/${baseName}_med.jpg`,
    original: `/uploads/${dirName}/${baseName}.jpg`,
  }
}

export async function deleteImageFiles(filePath: string) {
  const dir = path.dirname(filePath)
  const base = path.basename(filePath, path.extname(filePath))
  const baseName = base.replace(/_thumb$|_med$/, "")

  const filesToDelete = [
    path.join(dir, `${baseName}_thumb.jpg`),
    path.join(dir, `${baseName}_med.jpg`),
    path.join(dir, `${baseName}.jpg`),
    filePath,
  ]

  for (const file of filesToDelete) {
    try {
      await unlink(file)
    } catch {
      // File may not exist, ignore
    }
  }
}
