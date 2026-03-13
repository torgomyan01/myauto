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

export async function searchAutopiterByNumber(
  number: string
): Promise<AutopiterCatalogItem[]> {
  if (!number.trim()) return [];

  const cookie = await authorize();

  console.log(number);

  // FindCatalog по спецификации (см. https://service.autopiter.ru/v2/price?op=FindCatalog):
  // единственный входной параметр — <Number>. Если в тексте есть русские слова,
  // сервис сам делает полнотекстовый поиск по названию.
  const raw = number.trim();
  const body = `
<FindCatalog xmlns="http://www.autopiter.ru/">
  <Number>${escapeXml(raw)}</Number>
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
      return [];
    }

    // Жёстко маппим к форме SearchCatalogModel:
    return itemsArray.map((item: any) => ({
      ArticleId: Number(item.ArticleId),
      CatalogName: String(item.CatalogName ?? ''),
      Name: String(item.Name ?? ''),
      Number: item.Number,
      SalesRating: Number(item.SalesRating ?? 0),
    }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Autopiter] Failed to parse FindCatalog response', e);
    return [];
  }
}
