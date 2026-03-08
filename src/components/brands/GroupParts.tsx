'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
} from '@heroui/react';
import { ROUTES } from '@/constants/routes';
import { getAcatParts } from '@/app/actions/acat';
import SchemeWithLabelsOverlay from './SchemeWithLabelsOverlay';

interface CoordinatePoint {
  x: number;
  y: number;
}

interface Coordinate {
  top: CoordinatePoint;
  bottom: CoordinatePoint;
  width: number;
  height: number;
}

interface Label {
  id: string;
  number: string;
  name: string;
  coordinate: Coordinate;
}

interface PartNumber {
  id: string;
  number: string;
  name: string;
  description?: string;
  labelId: string;
  groupId: string;
}

interface PartsResponse {
  type: { id: string; name: string };
  mark: { id: string; name: string; image?: string };
  model: { id: string; name: string; years?: string; image?: string };
  modification: {
    id: string;
    name: string;
    description?: string;
  };
  group: {
    id: string;
    parentId?: string;
    name: string;
    description?: string;
    image?: string;
  };
  prev?: any;
  next?: any;
  image?: string;
  labels: Label[];
  numbers: PartNumber[];
}

interface GroupPartsProps {
  type: string;
  mark: string;
  modelId: string;
  modificationId: string;
  parentGroup: string;
  groupId: string;
}

const emptyPartsResponse = (
  type: string,
  mark: string,
  model: string,
  modification: string,
  parentGroup: string,
  group: string
): PartsResponse => ({
  type: { id: type, name: type },
  mark: { id: mark, name: mark },
  model: { id: model, name: model },
  modification: {
    id: modification,
    name: modification,
  },
  group: {
    id: group,
    parentId: parentGroup,
    name: group,
    description: '',
    image: '',
  },
  prev: null,
  next: null,
  image: '',
  labels: [],
  numbers: [],
});

async function getParts(
  type: string,
  mark: string,
  model: string,
  modification: string,
  parentGroup: string,
  group: string
): Promise<PartsResponse> {
  try {
    const data = await getAcatParts({
      type,
      mark,
      model,
      group,
      modification: modification || null,
      parentGroup: parentGroup || null,
    });
    return data as PartsResponse;
  } catch (error) {
    if (error instanceof Error && error.message === 'PARTS_LIST_EMPTY') {
      return emptyPartsResponse(
        type,
        mark,
        model,
        modification,
        parentGroup,
        group
      );
    }
    throw error;
  }
}

export default function GroupParts({
  type,
  mark,
  modelId,
  modificationId,
  parentGroup,
  groupId,
}: GroupPartsProps) {
  const enabled = Boolean(type && mark && modelId && groupId);

  const { data, isLoading } = useQuery({
    queryKey: ['group-parts', type, mark, modelId, modificationId, groupId],
    queryFn: () =>
      getParts(type, mark, modelId, modificationId, parentGroup, groupId),
    enabled,
  });

  const [highlightedLabelId, setHighlightedLabelId] = useState<string | null>(
    null
  );
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const numbers = data?.numbers ?? [];
  const tableItems = useMemo(
    () =>
      numbers.map((num, index) => ({
        ...num,
        key: `row-${index}`,
        rowKey: `row-${index}`,
        index,
      })),
    [numbers]
  );

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;
    const rows = wrapper.querySelectorAll<HTMLTableRowElement>('tr[data-row-index]');
    const highlightBg = 'rgba(226, 19, 33, 0.15)';
    const highlightBorder = '4px solid #E21321';
    rows.forEach((tr) => {
      tr.removeAttribute('data-scheme-row-highlighted');
      tr.style.backgroundColor = '';
      tr.style.borderLeft = '';
      tr.querySelectorAll<HTMLTableCellElement>('td').forEach((td) => {
        td.style.backgroundColor = '';
      });
    });
    if (highlightedLabelId) {
      const idx = numbers.findIndex((n) => n.labelId === highlightedLabelId);
      if (idx >= 0) {
        const row = wrapper.querySelector<HTMLTableRowElement>(`tr[data-row-index="${idx}"]`);
        if (row) {
          row.setAttribute('data-scheme-row-highlighted', 'true');
          row.style.backgroundColor = highlightBg;
          row.style.borderLeft = highlightBorder;
          row.querySelectorAll<HTMLTableCellElement>('td').forEach((td) => {
            td.style.backgroundColor = highlightBg;
          });
        }
      }
    }
  }, [highlightedLabelId, numbers]);

  if (!type || !mark || !modelId || !groupId) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Не заданы параметры группы. Попробуйте выбрать группу из списка.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="mt-6 text-sm text-gray-500">
        Загружаем схему и детали…
      </div>
    );
  }

  const labels = data.labels ?? [];
  const schemeParams = new URLSearchParams({
    type: type,
    mark: mark,
    model: modelId,
    modification: modificationId || 'null',
    parentGroup: parentGroup || 'null',
    group: groupId,
  });
  const imageUrl = `/api/acat/scheme?${schemeParams.toString()}`;

  const handleLabelClick = (labelId: string) => {
    setHighlightedLabelId((prev) => (prev === labelId ? null : labelId));
    const firstIndex = numbers.findIndex((n) => n.labelId === labelId);
    if (firstIndex >= 0 && tableWrapperRef.current) {
      const row = tableWrapperRef.current.querySelector(
        `tr[data-row-index="${firstIndex}"]`
      );
      (row as HTMLElement)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.mark?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.mark.image}
              alt={data.mark.name}
              className="h-10 w-10 rounded-full bg-white border border-gray-200 object-contain p-1"
            />
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Схема и детали
            </h2>
            <p className="mt-0.5 text-xs md:text-sm text-gray-500">
              Модель: {data.model?.name} · Группа:{' '}
              {data.group?.name ?? data.group?.id}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
        {/* Схема с кликабельными метками по координатам */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <SchemeWithLabelsOverlay
            imageUrl={imageUrl}
            alt={data.group?.name ?? 'Схема'}
            labels={labels}
            onLabelClick={handleLabelClick}
            highlightedLabelId={highlightedLabelId}
          />
        </div>

        {/* Таблица номеров — HeroUI Table, фиксированный header */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          {numbers.length === 0 ? (
            <p className="text-sm text-gray-500">
              Для этой группы пока нет номеров деталей.
            </p>
          ) : (
            <div
              ref={tableWrapperRef}
              className="max-h-[600px] overflow-auto"
              data-group-parts-table
            >
              <Table
                aria-label="Номера деталей"
                isHeaderSticky
                classNames={{
                  base: 'max-h-[580px]',
                  wrapper: 'shadow-none',
                }}
              >
                <TableHeader>
                  <TableColumn className="text-[11px] md:text-xs font-medium text-gray-500 bg-white">
                    №
                  </TableColumn>
                  <TableColumn className="text-[11px] md:text-xs font-medium text-gray-500 bg-white">
                    Номер
                  </TableColumn>
                  <TableColumn className="text-[11px] md:text-xs font-medium text-gray-500 bg-white">
                    Наименование
                  </TableColumn>
                  <TableColumn className="text-[11px] md:text-xs font-medium text-gray-500 bg-white">
                    Описание
                  </TableColumn>
                </TableHeader>
                <TableBody items={tableItems}>
                  {(item) => (
                    <TableRow
                      key={item.key}
                      data-row-index={item.index}
                      data-scheme-row-highlighted={
                        highlightedLabelId === item.labelId ? 'true' : undefined
                      }
                    >
                      <TableCell className="text-[11px] md:text-xs text-gray-400 py-2 pr-3 align-top">
                        {highlightedLabelId === item.labelId ? (
                          <span className="inline-flex items-center gap-1 text-[#E21321]" title="Выбрано на схеме">
                            <i className="fa-solid fa-location-dot text-xs" aria-hidden />
                            {item.index + 1}
                          </span>
                        ) : (
                          item.index + 1
                        )}
                      </TableCell>
                      <TableCell
                        className="text-[11px] md:text-xs py-2 pr-3 align-top"
                        width={150}
                      >
                        <Link
                          href={`${ROUTES.SEARCH}?q=${encodeURIComponent(item.number)}`}
                          className="font-mono text-gray-900 hover:text-[#E21321] underline underline-offset-1"
                          title="Нажмите, чтобы найти и посмотреть запчасть"
                        >
                          {item.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-[11px] md:text-xs text-gray-900 py-2 pr-3 align-top">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-[11px] md:text-xs py-2 pr-3 align-top">
                        <Tooltip
                          content={item.description ?? '—'}
                          placement="top"
                          delay={200}
                          closeDelay={0}
                          classNames={{ base: 'max-w-[280px]' }}
                        >
                          <span className="inline-flex cursor-help text-gray-400 hover:text-gray-600 flex-je-c w-full">
                            <i
                              className="fa-solid fa-circle-info text-base"
                              aria-hidden
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
