'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import {
  getGarageList,
  addGarageCar,
  deleteGarageCar,
  type GarageCarItem,
} from '@/app/actions/garage';

export default function GarageDropdown() {
  const router = useRouter();
  const [garageVin, setGarageVin] = useState('');
  const [garageLoading, setGarageLoading] = useState(false);
  const [garageMessage, setGarageMessage] = useState<string | null>(null);
  const [garageListLoading, setGarageListLoading] = useState(false);
  const [garageListError, setGarageListError] = useState<string | null>(null);
  const [garageCars, setGarageCars] = useState<GarageCarItem[]>([]);

  const loadGarage = async () => {
    try {
      setGarageListLoading(true);
      setGarageListError(null);
      const { cars } = await getGarageList();
      setGarageCars(cars);
    } catch (error: unknown) {
      console.error('Garage list error', error);
      setGarageListError(
        error instanceof Error
          ? error.message
          : 'Не удалось загрузить гараж. Попробуйте позже.'
      );
    } finally {
      setGarageListLoading(false);
    }
  };

  useEffect(() => {
    void loadGarage();
  }, []);

  const handleAdd = async () => {
    const vin = garageVin.trim();
    if (!vin) return;

    try {
      setGarageLoading(true);
      setGarageMessage(null);
      await addGarageCar(vin);
      setGarageMessage('Автомобиль добавлен в гараж.');
      setGarageVin('');
      await loadGarage();
    } catch (error: unknown) {
      console.error('Garage add error', error);
      setGarageMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось добавить автомобиль. Попробуйте позже.'
      );
    } finally {
      setGarageLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setGarageLoading(true);
      setGarageMessage(null);
      await deleteGarageCar(id);
      await loadGarage();
    } catch (error: unknown) {
      console.error('Garage delete error', error);
      setGarageMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось удалить автомобиль из гаража.'
      );
    } finally {
      setGarageLoading(false);
    }
  };

  return (
    <div className="space-y-3 text-left text-[11px] text-slate-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-900">Мой гараж</span>
        {garageListLoading && (
          <span className="text-[10px] text-slate-500">Обновляем...</span>
        )}
      </div>

      {garageListError && (
        <div className="rounded-xl border border-red-100 bg-red-50/80 px-2 py-1.5 text-[10px] text-red-600 shadow-sm">
          {garageListError}
        </div>
      )}

      {garageCars.length > 0 ? (
        <div className="space-y-1.5 py-2">
          {garageCars.slice(-3).map((car) => {
            const canGoToGroups =
              car.typeId &&
              car.markId &&
              car.modelId &&
              car.modificationId;
            const groupsUrl = canGoToGroups
              ? `${ROUTES.BRAND_MODEL_GROUPS}?type=${encodeURIComponent(car.typeId!)}&mark=${encodeURIComponent(car.markId!)}&model=${encodeURIComponent(car.modelId!)}&modification=${encodeURIComponent(car.modificationId!)}&name=${encodeURIComponent(car.model ?? '')}`
              : null;
            return (
              <div
                key={car.id}
                className="group flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/95 px-2.5 py-2 text-[11px] shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-px hover:border-[#E21321]/50 hover:shadow-[0_10px_28px_rgba(15,23,42,0.18)]"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none"
                  onClick={() => {
                    if (groupsUrl) router.push(groupsUrl);
                  }}
                  disabled={!groupsUrl}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900/90 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-50 shadow-sm">
                    {car.image ? (
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
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[11px] font-semibold text-slate-900 group-hover:text-[#E21321]">
                      {car.brand && car.model
                        ? `${car.brand} ${car.model}`
                        : car.model || car.brand || 'Автомобиль'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-[2px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {car.vin}
                      </span>
                      {car.year && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-[2px]">
                          Год: {car.year}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[10px] text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(car.id);
                  }}
                  aria-label="Удалить из гаража"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {garageCars.length > 3 && (
            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
              <span>Всего в гараже: {garageCars.length}</span>
              <Link
                href={ROUTES.GARAGE}
                className="font-medium text-[#E21321] hover:underline"
              >
                Все автомобили
              </Link>
            </div>
          )}
        </div>
      ) : !garageListLoading ? (
        <p className="rounded-2xl bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500">
          В гараже пока нет автомобилей. Добавьте первый по VIN.
        </p>
      ) : null}

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-900/90 px-2.5 py-2.5 text-[11px] text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.8)]">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <b className="text-[11px] font-semibold text-white">
            Добавить автомобиль по VIN
          </b>
          <span className="text-[9px] uppercase tracking-[0.14em] text-slate-400">
            17 символов
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Например, WBAVBXXXXXXX"
              value={garageVin}
              onChange={(e) => setGarageVin(e.target.value.toUpperCase())}
              className="h-8 w-full rounded-md border border-slate-600 bg-slate-900 px-2 text-[11px] uppercase tracking-[0.08em] text-slate-50 outline-none placeholder:text-slate-500 focus:border-[#E21321] focus:ring-1 focus:ring-[#E21321]/70"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[#E21321] px-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#c41020] disabled:cursor-not-allowed disabled:bg-slate-500/60"
            disabled={garageLoading || !garageVin.trim()}
            onClick={handleAdd}
          >
            {garageLoading ? '...' : 'OK'}
          </button>
        </div>
        {garageMessage && (
          <span className="mt-1.5 block text-[10px] text-slate-300">
            {garageMessage}
          </span>
        )}
      </div>
    </div>
  );
}
