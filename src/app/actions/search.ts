'use server';

import axios from 'axios';

export type SearchQueryKind = 'vin' | 'oem' | 'name';

export interface SearchPartResult {
  id: string;
  number: string;
  name: string;
  brand?: string;
}

export interface VinParameter {
  key: string;
  name: string;
  value: string;
  sortOrder?: number;
}

export interface SearchCarResult {
  id: string;
  vin?: string;
  brand?: string;
  model: string;
  years?: string;
  typeId?: string;
  markId?: string;
  modelId?: string;
  modificationId?: string;
  modificationName?: string;
  criteria?: string;
  criteria64?: string;
  /** Полные данные с API для отображения на фронте */
  description?: string;
  image?: string;
  modelName?: string;
  parameters?: VinParameter[];
  criteriaURI?: string;
  groupsTreeAvailable?: boolean;
  optionCodes?: string[];
}

export interface SearchResult {
  query: string;
  kind: SearchQueryKind;
  parts: SearchPartResult[];
  cars: SearchCarResult[];
}

function classifyQuery(raw: string): SearchQueryKind {
  const q = raw.trim();
  const upper = q.toUpperCase();
  const alnum = upper.replace(/[^A-Z0-9]/g, '');

  if (alnum.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(alnum)) {
    return 'vin';
  }
  if (/^(?=.*\d)[A-Z0-9\-\/\s]{2,25}$/.test(upper)) {
    return 'oem';
  }
  return 'name';
}

export async function searchCatalog(queryInput: string): Promise<SearchResult> {
  const query = String(queryInput ?? '').trim();

  if (!query) {
    return { query: '', kind: 'name', parts: [], cars: [] };
  }

  let parts: SearchPartResult[] = [];
  let cars: SearchCarResult[] = [];
  let kind: SearchQueryKind = 'name';
  let vins: any[] = [];
  let marks: any[] = [];

  try {
    const searchRes = await axios.get(
      'https://acat.online/api2/catalogs/search',
      {
        headers: {
          Authorization: process.env.ACAT_API_KEY || '',
        },
        params: { text: query, lang: 'ru' },
      }
    );
    const data = searchRes.data ?? {};
    vins = Array.isArray(data.vins) ? data.vins : [];
    marks = Array.isArray(data.marks) ? data.marks : [];
  } catch (e) {
    console.error('ACAT /catalogs/search error', e);
  }

  if (vins.length > 0 || marks.length > 0) {
    kind = 'vin';
    const carsFromVins: SearchCarResult[] = vins.map(
      (v: any, index: number) => {
        const params: any[] = Array.isArray(v.parameters) ? v.parameters : [];
        const yearParam = params.find((p: any) => p.key === 'year');
        const carNameParam = params.find((p: any) => p.key === 'car_name');
        const modificationName =
          carNameParam?.value ?? v.description ?? v.modelName ?? '';
        return {
          id: `${v.criteria ?? 'vin'}-${index}`,
          vin: v.criteria ?? undefined,
          brand: v.markName ?? v.mark ?? undefined,
          model: String(
            carNameParam?.value ?? v.modelName ?? 'Неизвестная модель'
          ),
          years: yearParam?.value ?? undefined,
          typeId: v.type ?? undefined,
          markId: v.mark ?? undefined,
          modelId: v.model ?? undefined,
          modificationId: v.modification ?? undefined,
          modificationName: modificationName || undefined,
          criteria: v.criteria ?? undefined,
          criteria64: v.criteria64 ?? undefined,
          description: v.description ?? undefined,
          image: v.image ?? undefined,
          modelName: v.modelName ?? undefined,
          parameters: Array.isArray(v.parameters)
            ? v.parameters.map((p: any) => ({
                key: p.key ?? '',
                name: p.name ?? '',
                value: p.value ?? '',
                sortOrder: p.sortOrder,
              }))
            : undefined,
          criteriaURI: v.criteriaURI ?? undefined,
          groupsTreeAvailable: v.groupsTreeAvailable ?? undefined,
          optionCodes: Array.isArray(v.optionCodes) ? v.optionCodes : undefined,
        };
      }
    );
    const carsFromMarks: SearchCarResult[] = marks.map(
      (m: any, index: number) => ({
        id: `${m.model?.id ?? 'mark'}-${index}`,
        brand: m.mark?.name ?? undefined,
        model: String(m.model?.name ?? 'Неизвестная модель'),
        years: m.model?.years ?? undefined,
        typeId: m.type?.id ?? undefined,
        markId: m.mark?.id ?? undefined,
        modelId: m.model?.id ?? undefined,
      })
    );
    cars = [...carsFromVins, ...carsFromMarks];
  } else {
    kind = classifyQuery(query);
    try {
      const partsRes = await axios.get(
        'https://acat.online/api2/catalogs/searchParts2',
        {
          headers: {
            Authorization: process.env.ACAT_API_KEY || '',
          },
          params: { q: query, lang: 'ru' },
        }
      );
      const raw = partsRes.data;
      const items: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : [];
      parts = items.slice(0, 20).map((item: any, index: number) => ({
        id: String(item.id ?? index),
        number: String(item.number ?? item.code ?? query),
        name: String(item.name ?? item.description ?? ''),
        brand: item.mark?.name ?? item.brand ?? undefined,
      }));
    } catch (e) {
      console.error('ACAT /catalogs/searchParts2 error', e);
    }
  }

  return { query, kind, parts, cars };
}
