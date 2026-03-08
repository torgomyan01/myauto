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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {categories.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className="group relative flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-4 py-6 text-center shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[#E21321]/40 hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)] md:py-8"
            >
              {/* gradient strip */}
              <span
                className="absolute left-3 top-1/2 h-12 w-1 -translate-y-1/2 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(to bottom, #E21321, #ff8a3d)',
                }}
              />

              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[#E21321] ring-1 ring-slate-100/80 transition-all duration-200 group-hover:bg-[#E21321]/5 group-hover:scale-105 md:h-16 md:w-16">
                <i className={`fa-solid ${item.icon} text-2xl md:text-3xl transition-transform duration-200 group-hover:scale-110`} aria-hidden />
              </div>

              <span className="mt-3 text-sm font-semibold text-slate-800 transition-colors group-hover:text-[#E21321] md:text-base">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
