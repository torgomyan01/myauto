'use server';

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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function callAutopiterSoap(
  bodyInnerXml: string,
  cookie?: string,
  soapAction?: string
): Promise<{ xml: string; cookie?: string }> {
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

  const res = await fetch(AUTOPITER_BASE_URL, {
    method: 'POST',
    headers,
    body: envelope,
    cache: 'no-store',
  });

  const xml = await res.text();
  const setCookie = res.headers.get('set-cookie') ?? undefined;

  return { xml, cookie: setCookie };
}

async function authorize(): Promise<string | undefined> {
  if (!AUTOPITER_USER_ID || !AUTOPITER_API_KEY) return undefined;

  const body = `
<Authorization xmlns="http://www.autopiter.ru/">
  <UserID>${escapeXml(AUTOPITER_USER_ID)}</UserID>
  <Password>${escapeXml(AUTOPITER_API_KEY)}</Password>
  <Save>true</Save>
</Authorization>`;

  const { xml, cookie: setCookie } = await callAutopiterSoap(
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
  if (!setCookie) {
    // eslint-disable-next-line no-console
    console.error('[Autopiter] Authorization: no Set-Cookie header', xml);
    return undefined;
  }

  // В заголовке Set-Cookie обычно приходит что-то вроде:
  // AuthCoocies=XXX; path=/; HttpOnly
  // Для заголовка Cookie нужно вытащить именно AuthCoocies=...
  const match = setCookie.match(/AuthCoocies=[^;]+/);
  const firstCookie = match?.[0]?.trim();

  if (!firstCookie) {
    // eslint-disable-next-line no-console
    console.error(
      '[Autopiter] Failed to parse AuthCoocies from Set-Cookie',
      setCookie
    );
    return undefined;
  }

  return firstCookie;
}

export interface AutopiterCatalogItem {
  articleId: number;
  catalogId: number;
  catalogName: string;
  name: string;
  number: string;
  salesRating: number;
}

export async function searchAutopiterByNumber(
  number: string
): Promise<AutopiterCatalogItem[]> {
  if (!number.trim()) return [];

  const cookie = await authorize();

  const body = `
<FindCatalog xmlns="http://www.autopiter.ru/">
  <Number>${escapeXml(number.trim())}</Number>
</FindCatalog>`;

  const { xml } = await callAutopiterSoap(
    body,
    cookie,
    'http://www.autopiter.ru/FindCatalog'
  );

  try {
    const doc = parser.parse(xml);

    console.log(doc);

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

    // Узнаём узел FindCatalogResponse/Result независимо от префиксов
    const bodyKeys = Object.keys(responseBody);
    const responseKey =
      bodyKeys.find((k) => k.endsWith('FindCatalogResponse')) ??
      bodyKeys.find((k) => k.endsWith('FindCatalogResult'));

    const responseNode = responseKey
      ? (responseBody as any)[responseKey]
      : responseBody;

    let resultNode =
      responseNode?.FindCatalogResult ??
      responseNode?.['FindCatalogResult'] ??
      responseNode;

    if (
      resultNode &&
      typeof resultNode === 'object' &&
      !Array.isArray(resultNode)
    ) {
      const innerKeys = Object.keys(resultNode);
      const innerResultKey = innerKeys.find((k) =>
        k.endsWith('FindCatalogResult')
      );
      if (innerResultKey) {
        resultNode = resultNode[innerResultKey];
      }
    }

    if (!resultNode) {
      // eslint-disable-next-line no-console
      console.error(
        '[Autopiter] FindCatalog result node not found',
        Object.keys(responseBody || {})
      );
      return [];
    }

    // Автопитер часто возвращает список в виде { SearchCatalogModel: [...] } или просто массив
    let itemsRaw =
      (resultNode as any)['SearchCatalogModel'] ??
      (resultNode as any)['SearchCatalog'] ??
      resultNode;

    if (itemsRaw && !Array.isArray(itemsRaw) && typeof itemsRaw === 'object') {
      const resultKeys = Object.keys(itemsRaw);
      const modelKey = resultKeys.find((k) =>
        k.toLowerCase().includes('searchcatalog')
      );
      if (modelKey) {
        itemsRaw = itemsRaw[modelKey];
      }
    }

    console.log(itemsRaw, 5555555555555);

    const array = Array.isArray(itemsRaw)
      ? itemsRaw
      : itemsRaw
        ? [itemsRaw]
        : [];

    const mapped: AutopiterCatalogItem[] = array
      .map((item: any) => {
        const articleId = Number(item.ArticleId ?? item.articleId ?? item.id);
        const catalogId = Number(
          item.CatalogId ?? item.catalogId ?? item.idCatalog
        );
        const catalogName =
          String(item.CatalogName ?? item.catalogName ?? item.Name ?? '') || '';
        const name = String(item.Name ?? item.NameDetail ?? '') || '';
        const num = String(item.Number ?? item.ShortNumber ?? '') || '';
        const salesRating = Number(item.SalesRating ?? 0);

        if (!articleId || !catalogId || !num || !name) {
          return null;
        }

        return {
          articleId,
          catalogId,
          catalogName,
          name,
          number: num,
          salesRating: Number.isFinite(salesRating) ? salesRating : 0,
        };
      })
      .filter(Boolean) as AutopiterCatalogItem[];

    return mapped;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Autopiter] Failed to parse FindCatalog response', e);
    return [];
  }
}
