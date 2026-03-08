'use server';

import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { getAuthSession } from '@/lib/auth-server';

const UPLOADS_DIR = 'uploads';
const UPLOADS_API_PREFIX = '/api/uploads';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function getUploadSubdir(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${month}-${year}`;
}

/** Директория на диске: проект/uploads/MM-YYYY/ (корень проекта, не public) */
function getUploadDir(): string {
  return path.join(process.cwd(), UPLOADS_DIR, getUploadSubdir());
}

/** URL для сохранения в БД и отображения: /api/uploads/1-2026/filename.ext */
function getPublicPath(filename: string): string {
  return `${UPLOADS_API_PREFIX}/${getUploadSubdir()}/${filename}`;
}

/**
 * Загрузка изображения. Сохраняет в uploads/MM-YYYY/ (корень проекта)
 * @param formData FormData с полем 'file' (File)
 * @returns Путь для БД: /api/uploads/1-2026/filename.ext (раздача через API)
 */
export async function uploadImage(
  formData: FormData
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: 'Необходима авторизация' };
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'Файл не выбран' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Допустимы только изображения (JPG, PNG, GIF, WebP)' };
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, error: 'Размер файла не более 5 МБ' };
  }

  const ext = path.extname(file.name) || '.jpg';
  const safeExt = /^\.(jpe?g|png|gif|webp)$/i.test(ext) ? ext : '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;

  try {
    const dir = getUploadDir();
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    const publicPath = getPublicPath(filename);
    return { ok: true, path: publicPath };
  } catch (err) {
    console.error('Upload error:', err);
    return { ok: false, error: 'Ошибка сохранения файла' };
  }
}

/**
 * Удаление изображения по пути (/api/uploads/1-2026/filename.ext)
 */
export async function deleteImage(
  publicPath: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: 'Необходима авторизация' };
  }

  let relativePath: string;
  if (publicPath.startsWith(`${UPLOADS_API_PREFIX}/`)) {
    relativePath = path.join(UPLOADS_DIR, publicPath.slice(UPLOADS_API_PREFIX.length + 1));
  } else if (publicPath.startsWith(`/${UPLOADS_DIR}/`)) {
    relativePath = publicPath.slice(1);
  } else {
    return { ok: false, error: 'Недопустимый путь' };
  }

  const fullPath = path.join(process.cwd(), relativePath);

  try {
    await unlink(fullPath);
    return { ok: true };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ok: true };
    }
    console.error('Delete image error:', err);
    return { ok: false, error: 'Ошибка удаления файла' };
  }
}
