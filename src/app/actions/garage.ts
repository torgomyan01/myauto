'use server';

import { getAuthSession } from '@/lib/auth-server';
import axios from 'axios';
import { prisma } from '@/lib/prisma';

export interface GarageCarItem {
  id: number;
  vin: string;
  brand: string | null;
  model: string | null;
  year: string | null;
  image?: string | null;
  typeId?: string | null;
  markId?: string | null;
  modelId?: string | null;
  modificationId?: string | null;
}

export async function getGarageList(): Promise<{ cars: GarageCarItem[] }> {
  const session = await getAuthSession();

  if (!session?.user || !(session.user as { id?: string }).id) {
    throw new Error('Необходима авторизация');
  }

  const userId = Number((session.user as { id: string }).id);

  const cars = await prisma.garageCar.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    cars: cars.map((c) => ({
      id: c.id,
      vin: c.vin,
      brand: c.brand,
      model: c.model,
      year: c.year,
      image: c.image ?? null,
      typeId: c.type ?? null,
      markId: c.markId ?? null,
      modelId: c.modelId ?? null,
      modificationId: c.modificationId ?? null,
    })),
  };
}

export async function addGarageCar(vin: string): Promise<{ message: string; car: GarageCarItem }> {
  const session = await getAuthSession();

  if (!session?.user || !(session.user as { id?: string }).id) {
    throw new Error('Необходима авторизация');
  }

  const rawVin = String(vin ?? '').trim();
  if (!rawVin) {
    throw new Error('VIN не может быть пустым');
  }

  const userId = Number((session.user as { id: string }).id);

  const existing = await prisma.garageCar.findFirst({
    where: { userId, vin: rawVin },
  });

  if (existing) {
    throw new Error('Этот автомобиль уже есть в вашем гараже');
  }

  let carFromVin: any = null;

  try {
    const acatRes = await axios.get(
      'https://acat.online/api2/catalogs/search',
      {
        headers: {
          Authorization: process.env.ACAT_API_KEY || '',
        },
        params: { text: rawVin, lang: 'ru' },
      }
    );
    const data = acatRes.data ?? {};
    const vins: any[] = Array.isArray(data.vins) ? data.vins : [];
    carFromVin = vins[0] ?? null;
  } catch (e) {
    console.error('ACAT VIN search for garage error', e);
  }

  const params: any[] = Array.isArray(carFromVin?.parameters)
    ? carFromVin.parameters
    : [];
  const yearParam = params.find((p: any) => p.key === 'year');
  const carNameParam = params.find((p: any) => p.key === 'car_name');

  const created = await prisma.garageCar.create({
    data: {
      userId,
      vin: rawVin,
      brand: carFromVin?.markName ?? carFromVin?.mark ?? null,
      model:
        carNameParam?.value ?? carFromVin?.modelName ?? 'Неизвестная модель',
      year: yearParam?.value ?? null,
      type: carFromVin?.type ?? null,
      markId: carFromVin?.mark ?? null,
      modelId: carFromVin?.model ?? null,
      modificationId: carFromVin?.modification ?? null,
      criteria: carFromVin?.criteria ?? null,
      criteria64: carFromVin?.criteria64 ?? null,
      image: carFromVin?.image ?? null,
    },
  });

  return {
    message: 'Автомобиль добавлен в гараж',
    car: {
      id: created.id,
      vin: created.vin,
      brand: created.brand,
      model: created.model,
      year: created.year,
      image: created.image ?? null,
    },
  };
}

export async function deleteGarageCar(id: number): Promise<{ message: string }> {
  const session = await getAuthSession();

  if (!session?.user || !(session.user as { id?: string }).id) {
    throw new Error('Необходима авторизация');
  }

  const carId = Number(id);
  if (!carId || Number.isNaN(carId)) {
    throw new Error('Некорректный идентификатор автомобиля');
  }

  const userId = Number((session.user as { id: string }).id);

  const existing = await prisma.garageCar.findFirst({
    where: { id: carId, userId },
  });

  if (!existing) {
    throw new Error('Автомобиль не найден в вашем гараже');
  }

  await prisma.garageCar.delete({
    where: { id: carId },
  });

  return { message: 'Автомобиль удалён из гаража' };
}
