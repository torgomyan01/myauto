import { ROUTES } from '@/constants/routes';

export type SpareCategoryItem = {
  label: string;
  href: string;
  image: string;
  sortOrder: number;
};

export const DEFAULT_SPARE_CATEGORIES: SpareCategoryItem[] = [
  {
    label: 'Легковые',
    href: `${ROUTES.BRANDS}?segment=light`,
    image: '/img/spares-img1.png',
    sortOrder: 1,
  },
  {
    label: 'Грузовые',
    href: `${ROUTES.BRANDS}?segment=heavy`,
    image: '/img/spares-img2.png',
    sortOrder: 2,
  },
  {
    label: 'Мототехника',
    href: `${ROUTES.BRANDS}?segment=moto`,
    image: '/img/spares-img3.png',
    sortOrder: 3,
  },
  {
    label: 'Масла',
    href: `${ROUTES.SEARCH}?q=масло&type=parts`,
    image: '/img/spares-img4.png',
    sortOrder: 4,
  },
  {
    label: 'Аксессуары',
    href: `${ROUTES.SEARCH}?q=аксессуары&type=parts`,
    image: '/img/spares-img5.png',
    sortOrder: 5,
  },
];
