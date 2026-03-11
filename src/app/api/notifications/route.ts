import { NextResponse } from 'next/server';
import {
  getMyNotifications,
  markMyNotificationRead,
  markMyNotificationsReadAll,
} from '@/app/actions/notifications';

export async function GET() {
  const notifications = await getMyNotifications();

  return NextResponse.json({
    notifications,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));

  try {
    if (body?.all) {
      await markMyNotificationsReadAll();
      return NextResponse.json({ ok: true });
    }

    const id = Number(body?.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await markMyNotificationRead(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

