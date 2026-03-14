'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getAcatCatalog,
  getAcatModifications,
  getAcatModels,
} from '@/app/actions/acat';
import {
  Autocomplete,
  AutocompleteItem,
  Checkbox,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { deleteImage, uploadImage } from '@/app/actions/uploads';

type OemNumber = { value: string };
type Compatibility = {
  brand: string;
  model: string;
  years: string;
  engine: string;
};
type Offer = {
  sellerName: string;
  sku: string;
  price: string;
  currency: 'AMD' | 'RUB' | 'USD' | 'EUR';
  stock: string;
  deliveryDays: string;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  isFeatured: boolean;
};
type Media = { url: string };
type Attribute = { key: string; value: string };
type CategoryOption = { id: number; label: string };
type AcatMarkOption = { id: string; name: string; typeId: string };
type AcatModelOption = { id: string; name: string };
type AcatModificationOption = { id: string; name: string };

function getSingleSelectionKey(selection: unknown): string {
  if (!selection || selection === 'all') return '';
  if (selection instanceof Set) {
    const first = selection.values().next().value;
    return first == null ? '' : String(first);
  }
  return '';
}

const emptyCompatibility = (): Compatibility => ({
  brand: '',
  model: '',
  years: '',
  engine: '',
});

const emptyOffer = (): Offer => ({
  sellerName: '',
  sku: '',
  price: '',
  currency: 'AMD',
  stock: '',
  deliveryDays: '',
  condition: 'NEW',
  isFeatured: false,
});

const emptyAttribute = (): Attribute => ({
  key: '',
  value: '',
});

type AdminAddPartFormProps = {
  categories: CategoryOption[];
};

export default function AdminAddPartForm({ categories }: AdminAddPartFormProps) {
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [article, setArticle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [manufacturerCountry, setManufacturerCountry] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [weightKg, setWeightKg] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [isUniversal, setIsUniversal] = useState(false);
  const [minOrderQty, setMinOrderQty] = useState('1');
  const [tags, setTags] = useState('');

  const [oemNumbers, setOemNumbers] = useState<OemNumber[]>([{ value: '' }]);
  const [compatibility, setCompatibility] = useState<Compatibility[]>([
    emptyCompatibility(),
  ]);
  const [offers, setOffers] = useState<Offer[]>([emptyOffer()]);
  const [media, setMedia] = useState<Media[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([emptyAttribute()]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [acatError, setAcatError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [acatLoadingMarks, setAcatLoadingMarks] = useState(false);
  const [acatLoadingModels, setAcatLoadingModels] = useState(false);
  const [acatLoadingModifications, setAcatLoadingModifications] = useState(false);
  const [acatMarks, setAcatMarks] = useState<AcatMarkOption[]>([]);
  const [acatModels, setAcatModels] = useState<AcatModelOption[]>([]);
  const [acatModifications, setAcatModifications] = useState<
    AcatModificationOption[]
  >([]);
  const [acatTypeId, setAcatTypeId] = useState('');
  const [acatMarkId, setAcatMarkId] = useState('');
  const [acatModelId, setAcatModelId] = useState('');
  const [acatModificationId, setAcatModificationId] = useState('');
  const [resultPayload, setResultPayload] = useState<Record<string, unknown> | null>(
    null
  );

  const clearForm = () => {
    setTitle('');
    setBrand('');
    setArticle('');
    setDescription('');
    setCategoryId('');
    setSubcategory('');
    setManufacturerCountry('');
    setWarrantyMonths('12');
    setWeightKg('');
    setDimensions('');
    setIsUniversal(false);
    setMinOrderQty('1');
    setTags('');
    setOemNumbers([{ value: '' }]);
    setCompatibility([emptyCompatibility()]);
    setOffers([emptyOffer()]);
    setMedia([]);
    setAttributes([emptyAttribute()]);
    setSubmitError(null);
    setAcatError(null);
    setAcatTypeId('');
    setAcatMarkId('');
    setAcatModelId('');
    setAcatModificationId('');
    setAcatModels([]);
    setAcatModifications([]);
    setResultPayload(null);
  };

  const selectedCategoryOption = useMemo(
    () => categories.find((item) => String(item.id) === categoryId.trim()),
    [categories, categoryId]
  );

  const selectedAcatMark = useMemo(
    () => acatMarks.find((item) => item.id === acatMarkId),
    [acatMarks, acatMarkId]
  );
  const selectedAcatModel = useMemo(
    () => acatModels.find((item) => item.id === acatModelId),
    [acatModels, acatModelId]
  );
  const selectedAcatModification = useMemo(
    () => acatModifications.find((item) => item.id === acatModificationId),
    [acatModifications, acatModificationId]
  );

  const normalizedTags = useMemo(
    () =>
      tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tags]
  );
  const uploadedMediaCount = useMemo(
    () => media.filter((m) => m.url.trim()).length,
    [media]
  );

  useEffect(() => {
    const categoryLabel = selectedCategoryOption?.label?.toLowerCase() ?? '';
    const segment = categoryLabel.includes('груз')
      ? 'heavy'
      : categoryLabel.includes('мото')
        ? 'moto'
        : categoryLabel.includes('легков')
          ? 'light'
          : undefined;

    let cancelled = false;
    const loadMarks = async () => {
      setAcatError(null);
      setAcatLoadingMarks(true);
      try {
        const data = (await getAcatCatalog(segment)) as any[];
        const marksMap = new Map<string, AcatMarkOption>();

        if (Array.isArray(data)) {
          for (const category of data) {
            const typeId = String(category?.id ?? '');
            const marks = Array.isArray(category?.marks) ? category.marks : [];

            for (const mark of marks) {
              const id = String(mark?.id ?? '');
              const name = String(mark?.name ?? '').trim();
              if (!id || !name || !typeId) continue;
              const key = `${typeId}:${id}`;
              if (!marksMap.has(key)) {
                marksMap.set(key, { id, name, typeId });
              }
            }
          }
        }

        const nextMarks = Array.from(marksMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name, 'ru-RU', { sensitivity: 'base' })
        );

        if (!cancelled) {
          setAcatMarks(nextMarks);
          setAcatMarkId('');
          setAcatTypeId('');
          setAcatModelId('');
          setAcatModels([]);
          setAcatModificationId('');
          setAcatModifications([]);
        }
      } catch {
        if (!cancelled) {
          setAcatError('Не удалось загрузить бренды ACAT.');
          setAcatMarks([]);
        }
      } finally {
        if (!cancelled) setAcatLoadingMarks(false);
      }
    };

    void loadMarks();
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryOption?.label]);

  useEffect(() => {
    if (!acatTypeId || !acatMarkId) {
      setAcatModels([]);
      setAcatModelId('');
      setAcatModifications([]);
      setAcatModificationId('');
      return;
    }

    let cancelled = false;
    const loadModels = async () => {
      setAcatError(null);
      setAcatLoadingModels(true);
      try {
        const data = (await getAcatModels({
          mark: acatMarkId,
          type: acatTypeId,
          lang: 'ru',
        })) as any;
        const models = Array.isArray(data?.models) ? data.models : [];
        const nextModels: AcatModelOption[] = models
          .map((m: any) => ({
            id: String(m?.id ?? ''),
            name: String(m?.name ?? '').trim(),
          }))
          .filter((m: AcatModelOption) => m.id && m.name);

        if (!cancelled) {
          setAcatModels(nextModels);
          setAcatModelId('');
          setAcatModifications([]);
          setAcatModificationId('');
        }
      } catch {
        if (!cancelled) {
          setAcatError('Не удалось загрузить модели ACAT.');
          setAcatModels([]);
        }
      } finally {
        if (!cancelled) setAcatLoadingModels(false);
      }
    };

    void loadModels();
    return () => {
      cancelled = true;
    };
  }, [acatTypeId, acatMarkId]);

  useEffect(() => {
    if (!acatTypeId || !acatMarkId || !acatModelId) {
      setAcatModifications([]);
      setAcatModificationId('');
      return;
    }

    let cancelled = false;
    const loadModifications = async () => {
      setAcatError(null);
      setAcatLoadingModifications(true);
      try {
        const data = (await getAcatModifications({
          type: acatTypeId,
          mark: acatMarkId,
          model: acatModelId,
          lang: 'ru',
        })) as any;
        const modifications = Array.isArray(data?.modifications)
          ? data.modifications
          : [];
        const nextMods: AcatModificationOption[] = modifications
          .map((m: any) => ({
            id: String(m?.id ?? ''),
            name: String(m?.name ?? '').trim(),
          }))
          .filter((m: AcatModificationOption) => m.id && m.name);

        if (!cancelled) {
          setAcatModifications(nextMods);
          setAcatModificationId('');
        }
      } catch {
        if (!cancelled) {
          setAcatError('Не удалось загрузить модификации ACAT.');
          setAcatModifications([]);
        }
      } finally {
        if (!cancelled) setAcatLoadingModifications(false);
      }
    };

    void loadModifications();
    return () => {
      cancelled = true;
    };
  }, [acatTypeId, acatMarkId, acatModelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim() || !article.trim() || !categoryId.trim()) {
      setSubmitError('Заполните обязательные поля: название, артикул, категория.');
      return;
    }

    if (!selectedCategoryOption) {
      setSubmitError('Выберите категорию из списка.');
      return;
    }

    const validOffers = offers.filter((o) => Number(o.price) > 0);
    if (validOffers.length === 0) {
      setSubmitError('Добавьте хотя бы одно предложение с ценой больше 0.');
      return;
    }

    if (uploadedMediaCount < 1) {
      setSubmitError('Добавьте минимум 1 изображение.');
      return;
    }
    if (uploadedMediaCount > 9) {
      setSubmitError('Допустимо максимум 9 изображений.');
      return;
    }

    setSubmitting(true);
    try {
      // Placeholder for real API integration.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const payload = {
        product: {
          title: title.trim(),
          brand: brand.trim(),
          article: article.trim(),
          description: description.trim(),
          categoryId: selectedCategoryOption.id,
          category: selectedCategoryOption.label,
          subcategory: subcategory.trim(),
          acat: acatTypeId && acatMarkId && acatModelId
            ? {
                typeId: acatTypeId,
                markId: acatMarkId,
                markName: selectedAcatMark?.name ?? null,
                modelId: acatModelId,
                modelName: selectedAcatModel?.name ?? null,
                modificationId: acatModificationId || null,
                modificationName: selectedAcatModification?.name ?? null,
              }
            : null,
          manufacturerCountry: manufacturerCountry.trim() || null,
          warrantyMonths: Number(warrantyMonths) || 0,
          weightKg: Number(weightKg) || null,
          dimensions: dimensions.trim() || null,
          isUniversal,
          minOrderQty: Number(minOrderQty) || 1,
          tags: normalizedTags,
        },
        oemNumbers: oemNumbers
          .map((o) => o.value.trim())
          .filter(Boolean),
        compatibility: compatibility.filter(
          (c) => c.brand.trim() || c.model.trim() || c.years.trim() || c.engine.trim()
        ),
        offers: validOffers.map((o) => ({
          sellerName: o.sellerName.trim() || null,
          sku: o.sku.trim() || null,
          price: Number(o.price),
          currency: o.currency,
          stock: Number(o.stock) || 0,
          deliveryDays: Number(o.deliveryDays) || null,
          condition: o.condition,
          isFeatured: o.isFeatured,
        })),
        media: media
          .filter((m) => m.url.trim())
          .map((m) => ({ url: m.url.trim() })),
        attributes: attributes
          .filter((a) => a.key.trim() && a.value.trim())
          .map((a) => ({ key: a.key.trim(), value: a.value.trim() })),
        draftMeta: {
          source: 'admin-form',
          createdAt: new Date().toISOString(),
        },
      };

      setResultPayload(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadMediaFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const availableSlots = Math.max(0, 9 - media.length);
    if (availableSlots <= 0) {
      setSubmitError('Допустимо максимум 9 изображений.');
      return;
    }

    const filesToUpload = fileList.slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      setSubmitError(`Можно загрузить только ${availableSlots} изображений.`);
    } else {
      setSubmitError(null);
    }

    const uploaded: Media[] = [];
    setMediaUploading(true);
    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.set('file', file);
        const result = await uploadImage(formData);
        if (!result.ok) {
          setSubmitError(result.error);
          break;
        }
        uploaded.push({ url: result.path });
      }

      if (uploaded.length > 0) {
        setMedia((prev) => [...prev, ...uploaded]);
      }
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteMediaFile = async (idx: number) => {
    const current = media[idx];
    if (!current) return;

    setSubmitError(null);
    const result = await deleteImage(current.url);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-800">
          Основные данные
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Название *"
            value={title}
            onValueChange={setTitle}
            className="w-full"
          />
          <Input
            label="Бренд"
            value={brand}
            onValueChange={setBrand}
            className="w-full"
          />
          <Input
            label="Артикул *"
            value={article}
            onValueChange={setArticle}
            className="w-full"
          />
          <Select
            label="Категория *"
            selectedKeys={categoryId ? new Set([categoryId]) : new Set([])}
            onSelectionChange={(keys) =>
              setCategoryId(getSingleSelectionKey(keys))
            }
            className="w-full"
          >
            {categories.map((item) => (
              <SelectItem key={String(item.id)}>{item.label}</SelectItem>
            ))}
          </Select>
          <Autocomplete
            label="ACAT: Бренд"
            placeholder={
              acatLoadingMarks
                ? 'Загрузка брендов...'
                : acatMarks.length
                  ? 'Выберите бренд'
                  : 'Нет брендов для выбранной категории'
            }
            selectedKey={
              acatMarkId && acatTypeId ? `${acatTypeId}:${acatMarkId}` : null
            }
            onSelectionChange={(key) => {
              const value = key ? String(key) : '';
              if (!value) {
                setAcatMarkId('');
                setAcatTypeId('');
                setAcatModelId('');
                setAcatModels([]);
                setAcatModificationId('');
                setAcatModifications([]);
                return;
              }

              const [nextTypeId, nextMarkId] = value.split(':');
              const nextMark = acatMarks.find(
                (item) => item.id === nextMarkId && item.typeId === nextTypeId
              );
              setAcatMarkId(nextMarkId ?? '');
              setAcatTypeId(nextTypeId ?? '');
              setAcatModelId('');
              setAcatModels([]);
              setAcatModificationId('');
              setAcatModifications([]);
              if (nextMark?.name) setBrand(nextMark.name);
            }}
            isDisabled={acatLoadingMarks || acatMarks.length === 0}
            isLoading={acatLoadingMarks}
            listboxProps={{ emptyContent: 'Бренды не найдены' }}
            className="w-full"
          >
            {acatMarks.map((item) => (
              <AutocompleteItem key={`${item.typeId}:${item.id}`}>
                {item.name}
              </AutocompleteItem>
            ))}
          </Autocomplete>
          <Autocomplete
            label="ACAT: Модель"
            placeholder={
              !acatMarkId
                ? 'Сначала выберите бренд'
                : acatLoadingModels
                  ? 'Загрузка моделей...'
                  : acatModels.length
                    ? 'Выберите модель'
                    : 'Для бренда нет моделей'
            }
            selectedKey={acatModelId || null}
            onSelectionChange={(key) => {
              setAcatModelId(key ? String(key) : '');
              setAcatModificationId('');
            }}
            isDisabled={!acatMarkId || acatLoadingModels || acatModels.length === 0}
            isLoading={acatLoadingModels}
            listboxProps={{ emptyContent: 'Модели не найдены' }}
            className="w-full"
          >
            {acatModels.map((item) => (
              <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
            ))}
          </Autocomplete>
          <Autocomplete
            label="ACAT: Модификация"
            placeholder={
              !acatModelId
                ? 'Сначала выберите модель'
                : acatLoadingModifications
                  ? 'Загрузка модификаций...'
                  : acatModifications.length
                    ? 'Выберите модификацию (необязательно)'
                    : 'Для модели нет модификаций'
            }
            selectedKey={acatModificationId || null}
            onSelectionChange={(key) => setAcatModificationId(key ? String(key) : '')}
            isDisabled={
              !acatModelId ||
              acatLoadingModifications ||
              acatModifications.length === 0
            }
            isLoading={acatLoadingModifications}
            listboxProps={{ emptyContent: 'Модификации не найдены' }}
            className="w-full"
          >
            {acatModifications.map((item) => (
              <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
            ))}
          </Autocomplete>
          <Input
            label="Страна производства"
            value={manufacturerCountry}
            onValueChange={setManufacturerCountry}
            className="w-full"
          />
          {acatError && (
            <p className="md:col-span-2 text-sm text-amber-600">{acatError}</p>
          )}
          <Input
            label="Гарантия (мес.)"
            type="number"
            min={0}
            value={warrantyMonths}
            onValueChange={setWarrantyMonths}
            className="w-full"
          />
          <Input
            label="Мин. заказ (шт.)"
            type="number"
            min={1}
            value={minOrderQty}
            onValueChange={setMinOrderQty}
            className="w-full"
          />
          <Input
            label="Вес (кг)"
            type="number"
            min={0}
            step="0.01"
            value={weightKg}
            onValueChange={setWeightKg}
            className="w-full"
          />
          <Input
            label="Габариты"
            placeholder="Напр. 30x20x10 см"
            value={dimensions}
            onValueChange={setDimensions}
            className="w-full"
          />
          <Input
            label="Теги (через запятую)"
            value={tags}
            onValueChange={setTags}
            className="md:col-span-2"
          />
          <div className="md:col-span-2 pt-2">
            <Checkbox isSelected={isUniversal} onValueChange={setIsUniversal}>
              Универсальная запчасть
            </Checkbox>
          </div>
          <Textarea
            label="Описание"
            value={description}
            onValueChange={setDescription}
            minRows={4}
            className="md:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">OEM номера</h2>
          <button
            type="button"
            onClick={() => setOemNumbers((prev) => [...prev, { value: '' }])}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            + Добавить OEM
          </button>
        </div>
        <div className="space-y-2">
          {oemNumbers.map((item, idx) => (
            <div key={`oem-${idx}`} className="flex gap-2">
              <Input
                value={item.value}
                onValueChange={(value) =>
                  setOemNumbers((prev) =>
                    prev.map((row, i) =>
                      i === idx ? { ...row, value } : row
                    )
                  )
                }
                placeholder="OEM номер"
                className="w-full"
              />
              {oemNumbers.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setOemNumbers((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="rounded-md border border-zinc-300 px-2 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  Удалить
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">
            Совместимость (авто)
          </h2>
          <button
            type="button"
            onClick={() => setCompatibility((prev) => [...prev, emptyCompatibility()])}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            + Добавить авто
          </button>
        </div>
        <div className="space-y-3">
          {compatibility.map((row, idx) => (
            <div key={`cmp-${idx}`} className="grid gap-2 md:grid-cols-5">
              <Input
                placeholder="Марка"
                value={row.brand}
                onValueChange={(value) =>
                  setCompatibility((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, brand: value } : r
                    )
                  )
                }
              />
              <Input
                placeholder="Модель"
                value={row.model}
                onValueChange={(value) =>
                  setCompatibility((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, model: value } : r
                    )
                  )
                }
              />
              <Input
                placeholder="Годы"
                value={row.years}
                onValueChange={(value) =>
                  setCompatibility((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, years: value } : r
                    )
                  )
                }
              />
              <Input
                placeholder="Двигатель"
                value={row.engine}
                onValueChange={(value) =>
                  setCompatibility((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, engine: value } : r
                    )
                  )
                }
              />
              {compatibility.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCompatibility((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="rounded-md border border-zinc-300 px-2 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  Удалить
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">
            Предложения продавцов
          </h2>
          <button
            type="button"
            onClick={() => setOffers((prev) => [...prev, emptyOffer()])}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            + Добавить предложение
          </button>
        </div>
        <div className="space-y-3">
          {offers.map((offer, idx) => (
            <div key={`offer-${idx}`} className="rounded-lg border border-zinc-200 p-3">
              <div className="grid gap-2 md:grid-cols-4">
                <Input
                  placeholder="Продавец"
                  value={offer.sellerName}
                  onValueChange={(value) =>
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === idx ? { ...o, sellerName: value } : o
                      )
                    )
                  }
                />
                <Input
                  placeholder="SKU"
                  value={offer.sku}
                  onValueChange={(value) =>
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === idx ? { ...o, sku: value } : o
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Цена"
                  value={offer.price}
                  onValueChange={(value) =>
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === idx ? { ...o, price: value } : o
                      )
                    )
                  }
                />
                <Select
                  selectedKeys={new Set([offer.currency])}
                  onSelectionChange={(keys) =>
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === idx
                          ? {
                              ...o,
                              currency: getSingleSelectionKey(keys) as Offer['currency'],
                            }
                          : o
                      )
                    )
                  }
                  className="w-full"
                >
                  <SelectItem key="AMD">AMD</SelectItem>
                  <SelectItem key="RUB">RUB</SelectItem>
                  <SelectItem key="USD">USD</SelectItem>
                  <SelectItem key="EUR">EUR</SelectItem>
                </Select>
                <Input
                  type="number"
                  min={0}
                  placeholder="Наличие"
                  value={offer.stock}
                  onValueChange={(value) =>
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === idx ? { ...o, stock: value } : o
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Дней доставки"
                  value={offer.deliveryDays}
                  onValueChange={(value) =>
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === idx ? { ...o, deliveryDays: value } : o
                      )
                    )
                  }
                />
                <Select
                  selectedKeys={new Set([offer.condition])}
                  onSelectionChange={(keys) =>
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === idx
                          ? {
                              ...o,
                              condition: getSingleSelectionKey(
                                keys
                              ) as Offer['condition'],
                            }
                          : o
                      )
                    )
                  }
                  className="w-full"
                >
                  <SelectItem key="NEW">Новый</SelectItem>
                  <SelectItem key="USED">Б/У</SelectItem>
                  <SelectItem key="REFURBISHED">Восстановленный</SelectItem>
                </Select>
                <div className="flex items-center">
                  <Checkbox
                    isSelected={offer.isFeatured}
                    onValueChange={(value) =>
                      setOffers((prev) =>
                        prev.map((o, i) =>
                          i === idx ? { ...o, isFeatured: value } : o
                        )
                      )
                    }
                  >
                  Featured
                  </Checkbox>
                </div>
              </div>
              {offers.length > 1 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOffers((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    Удалить предложение
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">Медиа</h2>
          <label className="cursor-pointer rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
            Загрузить изображения
            <Input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (!e.target.files?.length) return;
                void handleUploadMediaFiles(e.target.files);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>
        <p className="mb-2 text-xs text-zinc-500">
          Изображений: {uploadedMediaCount}/9 (минимум 1).
        </p>
        {mediaUploading && (
          <p className="mb-2 text-xs text-zinc-500">Загрузка изображений...</p>
        )}
        <div className="space-y-2">
          {media.map((m, idx) => (
            <div key={`media-${idx}`} className="rounded-lg border border-zinc-200 p-3">
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleDeleteMediaFile(idx)}
                  disabled={mediaUploading}
                  className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Удалить файл
                </button>
              </div>

              {m.url && (
                <div className="mt-3">
                  <img
                    src={m.url}
                    alt="media preview"
                    className="max-h-40 rounded-lg border border-zinc-200 object-contain"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">
            Дополнительные атрибуты
          </h2>
          <button
            type="button"
            onClick={() => setAttributes((prev) => [...prev, emptyAttribute()])}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            + Добавить поле
          </button>
        </div>
        <div className="space-y-2">
          {attributes.map((a, idx) => (
            <div key={`attr-${idx}`} className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="Ключ"
                value={a.key}
                onValueChange={(value) =>
                  setAttributes((prev) =>
                    prev.map((row, i) =>
                      i === idx ? { ...row, key: value } : row
                    )
                  )
                }
              />
              <Input
                placeholder="Значение"
                value={a.value}
                onValueChange={(value) =>
                  setAttributes((prev) =>
                    prev.map((row, i) =>
                      i === idx ? { ...row, value } : row
                    )
                  )
                }
                className="md:col-span-2"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? 'Сохранение...' : 'Сохранить запчасть'}
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Очистить форму
          </button>
        </div>
      </div>

      {resultPayload && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-emerald-800">
            Черновик карточки сформирован
          </h3>
          <pre className="max-h-80 overflow-auto rounded-lg bg-white p-3 text-xs text-zinc-700">
            {JSON.stringify(resultPayload, null, 2)}
          </pre>
        </section>
      )}
    </form>
  );
}
