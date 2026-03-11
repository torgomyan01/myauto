import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

const categories = [
  { label: 'Легковые', icon: 'fa-car', href: `${ROUTES.BRANDS}?segment=light` },
  {
    label: 'Грузовые',
    icon: 'fa-truck',
    href: `${ROUTES.BRANDS}?segment=heavy`,
  },
  {
    label: 'Мототехника',
    icon: 'fa-motorcycle',
    href: `${ROUTES.BRANDS}?segment=moto`,
  },
  {
    label: 'Масла',
    icon: 'fa-oil-can',
    href: `${ROUTES.SEARCH}?q=масло&type=parts`,
  },
  {
    label: 'Аксессуары',
    icon: 'fa-puzzle-piece',
    href: `${ROUTES.SEARCH}?q=аксессуары&type=parts`,
  },
];

export default function Spares() {
  return (
    <section className="py-6 md:py-8">
      <div className="wrapper">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <h2 className="text-[20px] font-semibold text-slate-900 md:text-2xl">
              Каталог запчастей
            </h2>
            <div className="mt-2 h-[3px] w-16 rounded-full bg-[#E21321] md:w-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {categories.map((item, index) => (
            <Link
              href={item.href}
              key={item.label}
              className="flex h-[240px] flex-col items-center rounded-2xl bg-white p-5 text-center shadow-[0_0_2px_rgba(0,0,0,0.08),0_2px_24px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_0_2px_rgba(0,0,0,0.08),0_2px_24px_rgba(0,0,0,0.16)] md:h-auto"
            >
              <img
                src={`/img/spares-img${index + 1}.png`}
                alt={item.label}
                className="mb-1 max-h-full max-w-full"
              />
              <span className="mt-auto text-[20px] text-black">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
