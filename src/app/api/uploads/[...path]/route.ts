import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

const UPLOADS_DIR = 'uploads';
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp)$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const pathSegments = (await params).path;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filename = pathSegments[pathSegments.length - 1];
  if (!ALLOWED_EXT.test(filename)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const relativePath = path.join(UPLOADS_DIR, ...pathSegments);
  const fullPath = path.join(process.cwd(), relativePath);

  if (!fullPath.startsWith(path.join(process.cwd(), UPLOADS_DIR))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const buffer = await readFile(fullPath);
    const ext = path.extname(filename).toLowerCase();
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const contentType = types[ext] ?? 'application/octet-stream';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw err;
  }
}
