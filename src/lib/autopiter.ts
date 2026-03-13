'use server';

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { env } from 'process';

const AUTOPITER_BASE_URL =
  env.AUTOPITER_BASE_URL ?? 'https://service.autopiter.ru/v2/price';
const AUTOPITER_USER_ID = env.AUTOPITER_USER_ID;
const AUTOPITER_API_KEY = env.AUTOPITER_API_KEY;

if (!AUTOPITER_USER_ID || !AUTOPITER_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Autopiter] AUTOPITER_USER_ID or AUTOPITER_API_KEY is not configured'
  );
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// Простой in-memory кеш для AuthCoocies, чтобы не авторизовываться на каждый запрос.
// Куки долгоживущая (Save=true), поэтому храним её условно 12 часов или до рестарта процесса.
let cachedAuthCookie: string | undefined;
let cachedAuthCookieExpiresAt: number | undefined;
const AUTH_COOKIE_TTL_MS = 12 * 60 * 60 * 1000; // 12 часов

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function callAutopiterSoap(
  bodyInnerXml: string,
  cookie?: string,
  soapAction?: string
): Promise<{ xml: string; cookies?: string[] }> {
  const envelope = `
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${bodyInnerXml}
  </soap:Body>
</soap:Envelope>`;

  const headers: Record<string, string> = {
    'Content-Type': 'text/xml; charset=utf-8',
    ...(cookie ? { Cookie: cookie } : {}),
  };

  if (soapAction) {
    headers.SOAPAction = `"${soapAction}"`;
  }

  const res = await axios.post(AUTOPITER_BASE_URL, envelope, {
    headers,
    responseType: 'text',
    // SOAP сервис всегда должен вызываться напрямую, без кэша
    validateStatus: () => true,
  });

  const xml: string = res.data;
  const cookies = res.headers['set-cookie'] as string[] | undefined;

  return { xml, cookies };
}

async function authorize(): Promise<string | undefined> {
  if (!AUTOPITER_USER_ID || !AUTOPITER_API_KEY) return undefined;

  // Если у нас уже есть не протухшая кука — переиспользуем.
  if (
    cachedAuthCookie &&
    cachedAuthCookieExpiresAt &&
    Date.now() < cachedAuthCookieExpiresAt
  ) {
    return cachedAuthCookie;
  }

  const body = `
<Authorization xmlns="http://www.autopiter.ru/">
  <UserID>${escapeXml(AUTOPITER_USER_ID)}</UserID>
  <Password>${escapeXml(AUTOPITER_API_KEY)}</Password>
  <Save>true</Save>
</Authorization>`;

  const { xml, cookies } = await callAutopiterSoap(
    body,
    undefined,
    'http://www.autopiter.ru/Authorization'
  );

  try {
    const doc = parser.parse(xml);
    const envelope =
      doc['soap:Envelope'] ??
      doc['Envelope'] ??
      doc['soapenv:Envelope'] ??
      doc['S:Envelope'] ??
      doc['s:Envelope'] ??
      doc.Envelope;
    const bodyNode =
      envelope?.['soap:Body'] ??
      envelope?.Body ??
      envelope?.['soapenv:Body'] ??
      envelope?.['S:Body'] ??
      envelope?.['s:Body'] ??
      null;

    const fault = bodyNode?.['soap:Fault'] ?? bodyNode?.Fault;
    if (fault) {
      // eslint-disable-next-line no-console
      console.error('[Autopiter] Authorization SOAP fault:', fault);
      return undefined;
    }

    const responseKey = Object.keys(bodyNode || {}).find((k) =>
      k.endsWith('AuthorizationResponse')
    );
    const responseNode = responseKey ? bodyNode[responseKey] : null;
    const authResult =
      responseNode?.AuthorizationResult ??
      responseNode?.['AuthorizationResult'];

    if (authResult === false || authResult === 'false') {
      // eslint-disable-next-line no-console
      console.error('[Autopiter] AuthorizationResult=false', responseNode);
      return undefined;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Autopiter] Failed to parse Authorization response', e, xml);
  }

  // Если авторизация не вернула cookie, залогируем XML для отладки
  if (!cookies || cookies.length === 0) {
    // eslint-disable-next-line no-console
    console.error('[Autopiter] Authorization: no Set-Cookie header', xml);
    return undefined;
  }

  // В ответе может быть несколько Set-Cookie с AuthCoocies.
  // Берём последнее значение AuthCoocies=... (как в браузере/клиенте).
  let authCookie: string | undefined;
  for (const c of cookies) {
    const match = c.match(/AuthCoocies=[^;]+/);
    if (match?.[0]) {
      authCookie = match[0].trim();
    }
  }

  if (!authCookie) {
    // eslint-disable-next-line no-console
    console.error(
      '[Autopiter] Failed to parse AuthCoocies from Set-Cookie',
      cookies
    );
    return undefined;
  }

  // Кешируем куку в памяти
  cachedAuthCookie = authCookie;
  cachedAuthCookieExpiresAt = Date.now() + AUTH_COOKIE_TTL_MS;

  return authCookie;
}

// Совпадает с форматом ответа FindCatalog (SearchCatalogModel)
export interface AutopiterCatalogItem {
  ArticleId: number;
  CatalogName: string;
  Name: string;
  Number: string | number;
  SalesRating: number;
}

export interface AutopiterPriceItem {
  DetailUid: string;
  SellerId: number;
  Number: string;
  ShotNumber: string;
  CatalogName: string;
  Name: string;
  NumberOfAvailable: number | null;
  NumberChange: string;
  MinNumberOfSales: number | null;
  SalePrice: number;
  NumberOfDaysSupply: number | null;
  DeliveryDate: string;
  IsDimension: boolean;
  Region: string;
  RealTimeInProc: number | null;
  SuccessfulOrdersProcent: number | null;
  TypeRefusal: number | null;
  IsExpress: boolean;
  IsSearchNum: boolean;
  SalesRating: number | null;
  NameStatus: string;
  StoreType: number | null;
  IsToday: boolean;
  CurrencyName: string;
  IsReliableSupplier: boolean;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
}

function extractPriceModelsFromNode(node: unknown): Record<string, unknown>[] {
  const collected: Record<string, unknown>[] = [];

  const walk = (value: unknown) => {
    if (value == null) return;

    if (typeof value === 'string') {
      const trimmed = decodeXmlEntities(value).trim();
      if (!trimmed) return;
      if (trimmed.startsWith('<')) {
        try {
          walk(parser.parse(trimmed));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Autopiter] Failed to parse nested price XML', e);
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => walk(v));
      return;
    }

    if (typeof value !== 'object') return;

    const obj = value as Record<string, unknown>;

    const textValue = obj['#text'];
    if (
      typeof textValue === 'string' &&
      decodeXmlEntities(textValue).trim().startsWith('<')
    ) {
      try {
        walk(parser.parse(decodeXmlEntities(textValue)));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[Autopiter] Failed to parse #text price XML', e);
      }
    }

    for (const [key, child] of Object.entries(obj)) {
      const lower = key.toLowerCase();

      if (
        lower.includes('pricesearchmodel') ||
        lower.includes('basepriceforclient')
      ) {
        if (Array.isArray(child)) {
          child.forEach((item) => {
            if (item && typeof item === 'object') {
              collected.push(item as Record<string, unknown>);
            }
          });
        } else if (child && typeof child === 'object') {
          collected.push(child as Record<string, unknown>);
        }
      }

      if (
        lower.includes('dataset') ||
        lower.includes('diffgram') ||
        lower.includes('newdataset') ||
        lower === 'table'
      ) {
        walk(child);
        continue;
      }

      if (child && typeof child === 'object') {
        walk(child);
      }
    }
  };

  walk(node);
  return collected;
}

function extractModelsFromNode(node: unknown): AutopiterCatalogItem[] {
  const collected: AutopiterCatalogItem[] = [];

  const walk = (value: unknown) => {
    if (value == null) return;

    if (typeof value === 'string') {
      const trimmed = decodeXmlEntities(value).trim();
      if (!trimmed) return;

      // Иногда FindCatalogResult приходит как XML-строка (DataSet/diffgram).
      if (trimmed.startsWith('<')) {
        try {
          const parsed = parser.parse(trimmed);
          walk(parsed);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Autopiter] Failed to parse nested XML result', e);
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => walk(v));
      return;
    }

    if (typeof value !== 'object') return;

    const obj = value as Record<string, unknown>;

    // Частый кейс: XML лежит в текстовом узле.
    const textValue = obj['#text'];
    if (
      typeof textValue === 'string' &&
      decodeXmlEntities(textValue).trim().startsWith('<')
    ) {
      try {
        const parsed = parser.parse(decodeXmlEntities(textValue));
        walk(parsed);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[Autopiter] Failed to parse #text XML result', e);
      }
    }

    for (const [key, child] of Object.entries(obj)) {
      const lower = key.toLowerCase();

      if (
        lower.includes('searchcatalogmodel') ||
        lower.includes('searchcatalog')
      ) {
        if (Array.isArray(child)) {
          collected.push(...(child as AutopiterCatalogItem[]));
        } else if (child && typeof child === 'object') {
          collected.push(child as AutopiterCatalogItem);
        }
      }

      // Иногда данные приходят как DataSet/diffgram/NewDataSet/Table.
      if (
        lower.includes('dataset') ||
        lower.includes('diffgram') ||
        lower.includes('newdataset') ||
        lower === 'table'
      ) {
        walk(child);
        continue;
      }

      if (child && typeof child === 'object') {
        walk(child);
      }
    }
  };

  walk(node);

  return collected;
}

async function findCatalogByQuery(query: string): Promise<AutopiterCatalogItem[]> {
  const cookie = await authorize();
  const isNameLikeQuery =
    /[А-Яа-яЁё]/.test(query) || (!/\d/.test(query) && query.trim().length > 2);

  if (isNameLikeQuery) {
    // eslint-disable-next-line no-console
    console.log('[Autopiter][FindCatalog][NAME_QUERY] request', { query });
  }

  const body = `
<FindCatalog xmlns="http://www.autopiter.ru/">
  <Number>${escapeXml(query)}</Number>
</FindCatalog>`;

  const { xml } = await callAutopiterSoap(
    body,
    cookie,
    'http://www.autopiter.ru/FindCatalog'
  );


  try {
    const doc = parser.parse(xml);

    // Официальная структура ответа (SOAP 1.1 / 1.2):
    // Envelope -> Body -> FindCatalogResponse -> FindCatalogResult -> SearchCatalogModel[]
    const envelope =
      doc['soap:Envelope'] ??
      doc['Envelope'] ??
      doc['soapenv:Envelope'] ??
      doc['S:Envelope'] ??
      doc['s:Envelope'] ??
      doc.Envelope;

    const responseBody =
      envelope?.['soap:Body'] ??
      envelope?.['Body'] ??
      envelope?.['soapenv:Body'] ??
      envelope?.['S:Body'] ??
      envelope?.['s:Body'] ??
      envelope?.Body ??
      null;

    if (!responseBody) {
      // eslint-disable-next-line no-console
      console.error(
        '[Autopiter] No SOAP Body in response',
        Object.keys(doc || {})
      );
      return [];
    }

    // Узел <FindCatalogResponse xmlns="http://www.autopiter.ru/">
    const responseNode =
      (responseBody as any)['FindCatalogResponse'] ??
      // на всякий случай ищем без строгого имени ключа
      Object.values(responseBody as Record<string, unknown>).find(
        (value: any) =>
          value &&
          typeof value === 'object' &&
          ('FindCatalogResult' in value ||
            'SearchCatalogModel' in value ||
            'SearchCatalog' in value)
      );

    // eslint-disable-next-line no-console
    console.log('[Autopiter][FindCatalog][PARSED_RESPONSE_NODE]', {
      query,
      responseNode,
    });

      

    if (!responseNode) {
      // eslint-disable-next-line no-console
      console.error(
        '[Autopiter] FindCatalogResponse not found in SOAP body',
        Object.keys(responseBody || {})
      );
      return [];
    }

    // Узел <FindCatalogResult>
    const resultNode =
      (responseNode as any)['FindCatalogResult'] ??
      (responseNode as any).FindCatalogResult;

    if (resultNode == null) {
      // eslint-disable-next-line no-console
      console.error(
        '[Autopiter] FindCatalogResult not found in FindCatalogResponse',
        Object.keys(responseNode || {})
      );
      return [];
    }

    // 1) Пытаемся достать модели из самого FindCatalogResult
    // 2) Если пусто — делаем общий проход по всему SOAP документу
    let itemsArray = extractModelsFromNode(resultNode);



    if (itemsArray.length === 0) {
      itemsArray = extractModelsFromNode(doc);
    }
    if (itemsArray.length === 0) {
      if (isNameLikeQuery) {
        // eslint-disable-next-line no-console
        console.log('[Autopiter][FindCatalog][NAME_QUERY] empty', {
          query,
          responseNode,
          xmlPreview: xml.slice(0, 700),
        });
      }
      return [];
    }

    // Жёстко маппим к форме SearchCatalogModel:
    const mapped = itemsArray.map((item: any) => ({
      ArticleId: Number(item.ArticleId),
      CatalogName: String(item.CatalogName ?? ''),
      Name: String(item.Name ?? ''),
      Number: item.Number,
      SalesRating: Number(item.SalesRating ?? 0),
    }));

    if (isNameLikeQuery) {
      // eslint-disable-next-line no-console
      console.log('[Autopiter][FindCatalog][NAME_QUERY] success', {
        query,
        total: mapped.length,
        sample: mapped.slice(0, 5),
      });
    }

    return mapped;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Autopiter] Failed to parse FindCatalog response', e);
    return [];
  }
}

function normalizeForArticleSearch(query: string): string {
  return query.replace(/[\s\-_.\\/]/g, '').toUpperCase();
}

function buildFindCatalogCandidates(query: string): string[] {
  const raw = query.trim();
  if (!raw) return [];


  const collapsedSpaces = raw.replace(/\s+/g, ' ').trim();
  const normalized = normalizeForArticleSearch(raw);
  const hasCyrillic = /[А-Яа-яЁё]/.test(raw);
  const hasDigits = /\d/.test(raw);
  const hasLatin = /[A-Za-z]/.test(raw);
  const looksLikeArticle = !hasCyrillic && (hasDigits || hasLatin);

  const candidates = new Set<string>();
  candidates.add(raw);

  if (collapsedSpaces !== raw) {
    candidates.add(collapsedSpaces);
  }

  // Для номера детали пробуем также "склеенный" вариант без разделителей.
  if (looksLikeArticle && normalized && normalized !== raw) {
    candidates.add(normalized);
  }

  return Array.from(candidates);
}

function dedupeCatalogItems(
  items: AutopiterCatalogItem[]
): AutopiterCatalogItem[] {
  const seen = new Set<string>();
  const unique: AutopiterCatalogItem[] = [];

  for (const item of items) {
    const key = `${item.ArticleId}::${String(item.Number)}::${item.CatalogName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export async function searchAutopiter(
  query: string
): Promise<AutopiterCatalogItem[]> {
  const candidates = buildFindCatalogCandidates(query);
  if (candidates.length === 0) return [];

  const isNameLikeQuery =
    /[А-Яа-яЁё]/.test(query) || (!/\d/.test(query) && query.trim().length > 2);
  if (isNameLikeQuery) {
    // eslint-disable-next-line no-console
    console.log('[Autopiter][Search][NAME_QUERY] candidates', {
      query,
      candidates,
    });
  }

  const settled = await Promise.allSettled(
    candidates.map((candidate) => findCatalogByQuery(candidate))
  );

  const merged: AutopiterCatalogItem[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      merged.push(...result.value);
    } else {
      // eslint-disable-next-line no-console
      console.error('[Autopiter] FindCatalog candidate search failed', result.reason);
    }
  }

  const deduped = dedupeCatalogItems(merged);
 
  return deduped;
}

export async function searchAutopiterByNumber(
  number: string
): Promise<AutopiterCatalogItem[]> {
  // Оставлено для обратной совместимости импорта в текущих местах.
  return searchAutopiter(number);
}

export async function getAutopiterPriceByArticleId(
  articleId: number
): Promise<AutopiterPriceItem[]> {
  if (!Number.isFinite(articleId) || articleId <= 0) return [];

  const cookie = await authorize();

  const body = `
<GetPriceId xmlns="http://www.autopiter.ru/">
  <ArticleId>${articleId}</ArticleId>
</GetPriceId>`;

  const { xml } = await callAutopiterSoap(
    body,
    cookie,
    'http://www.autopiter.ru/GetPriceId'
  );

  try {
    const doc = parser.parse(xml);

    const envelope =
      doc['soap:Envelope'] ??
      doc['Envelope'] ??
      doc['soapenv:Envelope'] ??
      doc['S:Envelope'] ??
      doc['s:Envelope'] ??
      doc.Envelope;

    const responseBody =
      envelope?.['soap:Body'] ??
      envelope?.['Body'] ??
      envelope?.['soapenv:Body'] ??
      envelope?.['S:Body'] ??
      envelope?.['s:Body'] ??
      envelope?.Body ??
      null;

    if (!responseBody) return [];

    const responseNode =
      (responseBody as Record<string, unknown>)['GetPriceIdResponse'] ??
      Object.values(responseBody as Record<string, unknown>).find(
        (value: unknown) =>
          Boolean(value) &&
          typeof value === 'object' &&
          ('GetPriceIdResult' in (value as Record<string, unknown>) ||
            'PriceSearchModel' in (value as Record<string, unknown>) ||
            'BasePriceForClient' in (value as Record<string, unknown>))
      );

    if (!responseNode || typeof responseNode !== 'object') return [];

    const resultNode =
      (responseNode as Record<string, unknown>)['GetPriceIdResult'] ??
      responseNode;

    let items = extractPriceModelsFromNode(resultNode);
    if (items.length === 0) {
      items = extractPriceModelsFromNode(doc);
    }

    if (items.length === 0) return [];

    return items.map((item) => ({
      DetailUid: String(item.DetailUid ?? ''),
      SellerId: Number(item.SellerId ?? -1),
      Number: String(item.Number ?? ''),
      ShotNumber: String(item.ShotNumber ?? ''),
      CatalogName: String(item.CatalogName ?? ''),
      Name: String(item.Name ?? ''),
      NumberOfAvailable: toNumberOrNull(item.NumberOfAvailable),
      NumberChange: String(item.NumberChange ?? ''),
      MinNumberOfSales: toNumberOrNull(item.MinNumberOfSales),
      SalePrice: Number(item.SalePrice ?? 0),
      NumberOfDaysSupply: toNumberOrNull(item.NumberOfDaysSupply),
      DeliveryDate: String(item.DeliveryDate ?? ''),
      IsDimension: toBoolean(item.IsDimension),
      Region: String(item.Region ?? ''),
      RealTimeInProc: toNumberOrNull(item.RealTimeInProc),
      SuccessfulOrdersProcent: toNumberOrNull(item.SuccessfulOrdersProcent),
      TypeRefusal: toNumberOrNull(item.TypeRefusal),
      IsExpress: toBoolean(item.IsExpress),
      IsSearchNum: toBoolean(item.IsSearchNum),
      SalesRating: toNumberOrNull(item.SalesRating),
      NameStatus: String(item.NameStatus ?? ''),
      StoreType: toNumberOrNull(item.StoreType),
      IsToday: toBoolean(item.IsToday),
      CurrencyName: String(item.CurrencyName ?? 'RUB'),
      IsReliableSupplier: toBoolean(item.IsReliableSupplier),
    }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Autopiter] Failed to parse GetPriceId response', e);
    return [];
  }
}
