'use server';

import axios from 'axios';

const ACAT_BASE = 'https://acat.online/api2';
const getHeaders = () => ({
  Authorization: process.env.ACAT_API_KEY || '',
});

/** ACAT segment: light = легковые + мото, heavy = грузовые + автобусы + спецтехника + двигатели, moto = только мототехника */
const SEGMENT_CATEGORY_IDS: Record<string, string[]> = {
  light: ['CARS_NATIVE', 'CARS_FOREIGN', 'MOTORCYCLE'],
  heavy: ['TRUCKS_NATIVE', 'TRUCKS_FOREIGN', 'BUS', 'ENGINE'],
  moto: ['MOTORCYCLE'],
};

/** Match category by id (e.g. CARS_NATIVE) or by name (Легковые, Грузовые, Мототехника, etc.) */
function categoryMatchesSegment(category: any, segment: string): boolean {
  const ids = SEGMENT_CATEGORY_IDS[segment];
  if (!ids) return true;
  const id = category?.id ?? category?.type ?? '';
  const name = String(category?.name ?? '').toLowerCase();
  if (id && ids.some((allowed) => String(id).toUpperCase().includes(allowed)))
    return true;
  if (segment === 'light')
    return name.includes('легков') || name.includes('мототехника');
  if (segment === 'heavy')
    return (
      name.includes('груз') ||
      name.includes('автобус') ||
      name.includes('спецтехник') ||
      name.includes('двигател')
    );
  if (segment === 'moto') return name.includes('мототехника');
  return true;
}

export async function getAcatCatalog(segment?: string): Promise<unknown> {
  const response = await axios.get(`${ACAT_BASE}/catalogs?lang=ru`, {
    headers: getHeaders(),
  });
  const data = response.data;
  if (!segment || !Array.isArray(data)) return data;
  return (data as any[]).filter((cat) => categoryMatchesSegment(cat, segment));
}

export async function getAcatModels(params: {
  mark: string;
  type?: string;
  lang?: string;
}): Promise<unknown> {
  const { mark, type: typeParam, lang = 'ru' } = params;

  if (!mark) {
    throw new Error('Параметр mark обязателен');
  }

  let type = typeParam;

  if (!type) {
    try {
      const catalogsResponse = await axios.get(`${ACAT_BASE}/catalogs`, {
        headers: getHeaders(),
        params: { lang },
      });
      const catalogs: any[] = Array.isArray(catalogsResponse.data)
        ? catalogsResponse.data
        : [];
      for (const category of catalogs) {
        if (Array.isArray(category?.marks)) {
          const hasMark = category.marks.some(
            (m: any) => String(m.id) === String(mark)
          );
          if (hasMark) {
            type = String(category.id);
            break;
          }
        }
      }
    } catch (e) {
      console.error('Failed to detect type from catalogs', e);
    }
  }

  if (!type) {
    throw new Error('Не удалось определить тип для заданной марки');
  }

  const response = await axios.get(`${ACAT_BASE}/catalogs/models`, {
    headers: getHeaders(),
    params: { mark, type, lang },
  });
  return response.data;
}

/** GET /catalogs/modifications — модификации модели. Параметры: type *, mark *, model * (page? — если поддерживается API). */
export async function getAcatModifications(params: {
  type: string;
  mark: string;
  model: string;
  lang?: string;
  page?: number;
}): Promise<unknown> {
  const { type, mark, model, page } = params;

  if (!type || !mark || !model) {
    throw new Error('Параметры type, mark и model обязательны');
  }

  const requestParams: Record<string, string | number> = {
    type,
    mark,
    model,
  };
  if (page != null) requestParams.page = page;

  const response = await axios.get(`${ACAT_BASE}/catalogs/modifications`, {
    headers: getHeaders(),
    params: requestParams,
  });

  return response.data;
}

export async function getAcatGroups(params: {
  type: string;
  mark: string;
  model: string;
  modification?: string;
  group?: string;
  criteria?: string;
  criteria64?: string;
  lang?: string;
}): Promise<unknown> {
  const {
    type,
    mark,
    model,
    modification = '',
    group,
    criteria,
    criteria64,
    lang = 'ru',
  } = params;

  if (!type || !mark || !model) {
    throw new Error('Параметры type, mark и model обязательны');
  }

  const requestParams: Record<string, string> = {
    type,
    mark,
    model,
    modification,
    lang,
  };
  if (group) requestParams.group = group;
  if (criteria) requestParams.criteria = criteria;
  if (criteria64) requestParams.criteria64 = criteria64;

  const response = await axios.get(`${ACAT_BASE}/catalogs/groups`, {
    headers: getHeaders(),
    params: requestParams,
  });
  return response.data;
}

export async function getAcatParts(params: {
  type: string;
  mark: string;
  model: string;
  group: string;
  modification?: string | null;
  parentGroup?: string | null;
  criteria?: string;
  criteria64?: string;
  lang?: string;
}): Promise<unknown> {
  const {
    type,
    mark,
    model,
    group,
    modification = 'null',
    parentGroup = 'null',
    criteria,
    criteria64,
    lang = 'ru',
  } = params;

  if (!type || !mark || !model || !group) {
    throw new Error('Параметры type, mark, model и group обязательны');
  }

  const requestParams: Record<string, string> = {
    type,
    mark,
    model,
    group,
    modification: modification === null ? 'null' : modification,
    parentGroup: parentGroup === null ? 'null' : parentGroup,
    lang,
  };
  if (criteria) requestParams.criteria = criteria;
  if (criteria64) requestParams.criteria64 = criteria64;

  try {
    const response = await axios.get(`${ACAT_BASE}/catalogs/parts`, {
      headers: getHeaders(),
      params: requestParams,
    });
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? '';
    if (typeof msg === 'string' && msg.includes('список запчастей пуст')) {
      throw new Error('PARTS_LIST_EMPTY');
    }
    throw err;
  }
}
