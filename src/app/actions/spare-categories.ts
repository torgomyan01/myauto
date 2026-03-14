'use server';

import { prisma } from '@/lib/prisma';
import { DEFAULT_SPARE_CATEGORIES } from '@/lib/spare-categories';

export async function seedDefaultSpareCategories() {
  for (const item of DEFAULT_SPARE_CATEGORIES) {
    await prisma.spareCategory.upsert({
      where: { label: item.label },
      update: {
        href: item.href,
        image: item.image,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        label: item.label,
        href: item.href,
        image: item.image,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }
}

export async function getSpareCategories() {
  const select = {
    label: true,
    href: true,
    image: true,
    sortOrder: true,
  } as const;

  const categories = await prisma.spareCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select,
  });

  if (categories.length > 0) return categories;

  await seedDefaultSpareCategories();

  return prisma.spareCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select,
  });
}

export async function getSpareCategoryOptions() {
  const categories = await prisma.spareCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      label: true,
    },
  });

  if (categories.length > 0) return categories;

  await seedDefaultSpareCategories();

  return prisma.spareCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      label: true,
    },
  });
}
