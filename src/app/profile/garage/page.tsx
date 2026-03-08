import MainTemplate from '@/components/layout/main-template/MainTemplate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

async function getGarageCars(userId: number) {
  return prisma.garageCar.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function GaragePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  const userId = Number((session.user as any).id);

  const cars = await getGarageCars(userId);

  return (
    <MainTemplate>
      <div className="wrapper py-8 mt-10!">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Мой гараж</h1>
            <p className="text-sm text-slate-500">
              Все автомобили, которые вы добавили по VIN.
            </p>
          </div>
        </div>

        {cars.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            В гараже пока нет автомобилей. Добавьте первый через иконку гаража в
            шапке сайта.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <div
                key={car.id}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-3 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-[2px] hover:border-[#E21321]/50 hover:shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900/90 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-50 shadow-sm">
                  {car.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={car.image}
                      alt={
                        car.brand && car.model
                          ? `${car.brand} ${car.model}`
                          : car.model || car.brand || 'Автомобиль'
                      }
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span>VIN</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-[#E21321]">
                      {car.brand && car.model
                        ? `${car.brand} ${car.model}`
                        : car.model || car.brand || 'Автомобиль'}
                    </span>
                    {car.year && (
                      <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-[2px] text-[11px] text-slate-600">
                        {car.year}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-[2px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {car.vin}
                    </span>
                    {car.markId && car.modelId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-[2px] text-slate-500">
                        ID: {car.markId} / {car.modelId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainTemplate>
  );
}
