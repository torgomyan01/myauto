import { NextRequest, NextResponse } from 'next/server';

const ACAT_BASE = 'https://acat.online/api2';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  const mark = searchParams.get('mark');
  const model = searchParams.get('model');
  const modification = searchParams.get('modification') ?? 'null';
  const parentGroup = searchParams.get('parentGroup') ?? 'null';
  const group = searchParams.get('group') ?? 'null';

  if (!type || !mark || !model) {
    return NextResponse.json(
      { message: 'Параметры type, mark и model обязательны' },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    type,
    mark,
    model,
    modification,
    parentGroup,
    group,
  });

  const acatUrl = `${ACAT_BASE}/catalogs/scheme?${params.toString()}`;
  const apiKey = process.env.ACAT_API_KEY || '';

  try {
    const res = await fetch(acatUrl, {
      headers: {
        Authorization: apiKey,
        Accept: 'image/png',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: 'Схема недоступна' },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('ACAT scheme error', error);
    return NextResponse.json(
      { message: 'Ошибка загрузки схемы' },
      { status: 500 }
    );
  }
}
