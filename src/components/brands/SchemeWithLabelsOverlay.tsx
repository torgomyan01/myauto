'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface LabelCoordinate {
  top: CoordinatePoint;
  bottom: CoordinatePoint;
  width: number;
  height: number;
}

export interface SchemeLabel {
  id: string;
  number: string;
  name: string;
  coordinate: LabelCoordinate;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
/** Հարթ, կենտրոնացված zoom — աստիճանական (exponential) զգայունություն */
const ZOOM_SENSITIVITY = 0.002;
const LABEL_FILL = 'rgba(226, 19, 33, 0.1)';
const LABEL_BORDER = 'rgba(226, 19, 33, 0.4)';
const LABEL_HOVER = 'rgba(226, 19, 33, 0.2)';
const LABEL_HIGHLIGHT_FILL = 'rgba(226, 19, 33, 0.3)';
const LABEL_HIGHLIGHT_BORDER = 'rgb(226, 19, 33)';
/** Շարժում այս արժեքից փոքր = click, մեծ = drag (label click չի կանչվի) */
const CLICK_VS_DRAG_THRESHOLD_PX = 6;

interface SchemeWithLabelsOverlayProps {
  imageUrl: string;
  alt: string;
  labels: SchemeLabel[];
  onLabelClick?: (labelId: string) => void;
  highlightedLabelId?: string | null;
}

interface LabelRect {
  label: SchemeLabel;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Canvas-based scheme with zoom, pan and clickable labels.
 * Կոորդինատները API-ից նկարի պիքսելներով են (image space).
 */
export default function SchemeWithLabelsOverlay({
  imageUrl,
  alt,
  labels,
  onLabelClick,
  highlightedLabelId,
}: SchemeWithLabelsOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const pointerDownStartRef = useRef({ x: 0, y: 0 });
  const labelRectsRef = useRef<LabelRect[]>([]);
  const hoveredLabelIdRef = useRef<string | null>(null);
  const isPanningRef = useRef(false);
  const pendingLabelIdRef = useRef<string | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const measureContainer = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const w = Math.floor(width);
    const h = Math.floor(height);
    setContainerSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

  useEffect(() => {
    measureContainer();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureContainer);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureContainer]);

  // Load image
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.alt = alt;
    const onLoad = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    const onError = () => {
      imageRef.current = null;
      setImageError(true);
    };
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    img.src = imageUrl;
    return () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      img.src = '';
      if (imageRef.current === img) imageRef.current = null;
    };
  }, [imageUrl, alt]);

  const getDrawParams = useCallback(() => {
    const img = imageRef.current;
    const cw = containerSize.w;
    const ch = containerSize.h;
    if (!img || !cw || !ch) return null;
    const nw = img.naturalWidth || 1;
    const nh = img.naturalHeight || 1;
    const scale = Math.min(cw / nw, ch / nh);
    const dispW = nw * scale;
    const dispH = nh * scale;
    const offsetX = (cw - dispW) / 2;
    const offsetY = (ch - dispH) / 2;
    return { img, cw, ch, nw, nh, scale, dispW, dispH, offsetX, offsetY };
  }, [containerSize]);

  const computeLabelRects = useCallback((): LabelRect[] => {
    const p = getDrawParams();
    if (!p) return [];
    const { scale, offsetX, offsetY } = p;
    return labels.map((label) => {
      const coord = label.coordinate;
      const x = coord.top?.x ?? 0;
      const y = coord.top?.y ?? 0;
      const w = coord.width ?? Math.max(0, (coord.bottom?.x ?? 0) - x, 12);
      const h = coord.height ?? Math.max(0, (coord.bottom?.y ?? 0) - y, 12);
      return {
        label,
        left: x * scale + offsetX,
        top: y * scale + offsetY,
        width: Math.max(8, w * scale),
        height: Math.max(8, h * scale),
      };
    });
  }, [getDrawParams, labels]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const p = getDrawParams();
    if (!canvas || !p) return;
    const { img, cw, ch, offsetX, offsetY, dispW, dispH } = p;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rects = computeLabelRects();
    labelRectsRef.current = rects;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.floor(cw * dpr);
    const height = Math.floor(ch * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    }
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    const cx = cw / 2;
    const cy = ch / 2;
    ctx.save();
    ctx.translate(cx + pan.x, cy + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);
    ctx.drawImage(img, offsetX, offsetY, dispW, dispH);

    rects.forEach(({ label, left, top, width: w, height: h }) => {
      const isHighlight = highlightedLabelId === label.id;
      const isHover = hoveredLabelIdRef.current === label.id;
      ctx.fillStyle = isHighlight ? LABEL_HIGHLIGHT_FILL : isHover ? LABEL_HOVER : LABEL_FILL;
      ctx.strokeStyle = isHighlight ? LABEL_HIGHLIGHT_BORDER : LABEL_BORDER;
      ctx.lineWidth = isHighlight ? 2 : 1;
      ctx.beginPath();
      ctx.rect(left, top, w, h);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }, [getDrawParams, computeLabelRects, pan, zoom, highlightedLabelId, imageLoaded]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        pendingLabelIdRef.current = null;
        setIsDragging(false);
      }
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const z = zoomRef.current;
      const prevPan = panRef.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * 120 : e.deltaY;
      const factor = Math.exp(-delta * ZOOM_SENSITIVITY);
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
      // Zoom մկնիկի կուրսորի ուղղությամբ — կուրսորի տակի կետը մնում է տեղում
      const scale = newZoom / z;
      setPan({
        x: (cursorX - cx) * (1 - scale) + prevPan.x * scale,
        y: (cursorY - cy) * (1 - scale) + prevPan.y * scale,
      });
      setZoom(newZoom);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const canvasToContent = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const cw = containerSize.w;
      const ch = containerSize.h;
      const cx = cw / 2;
      const cy = ch / 2;
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      const x = (mouseX - cx - pan.x) / zoom + cx;
      const y = (mouseY - cy - pan.y) / zoom + cy;
      return { x, y };
    },
    [containerSize, pan, zoom]
  );

  const findLabelAt = useCallback(
    (clientX: number, clientY: number): SchemeLabel | null => {
      const { x, y } = canvasToContent(clientX, clientY);
      const rects = labelRectsRef.current;
      for (let i = rects.length - 1; i >= 0; i--) {
        const r = rects[i];
        if (x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height) {
          return r.label;
        }
      }
      return null;
    },
    [canvasToContent]
  );

  const findLabelAtRef = useRef(findLabelAt);
  findLabelAtRef.current = findLabelAt;
  const onLabelClickRef = useRef(onLabelClick);
  onLabelClickRef.current = onLabelClick;
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const x = e.clientX;
      const y = e.clientY;
      pointerDownStartRef.current = { x, y };
      lastPointerRef.current = { x, y };
      pendingLabelIdRef.current = findLabelAtRef.current(x, y)?.id ?? null;
      isPanningRef.current = true;
      setIsDragging(true);
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPanningRef.current) {
        const label = findLabelAtRef.current(e.clientX, e.clientY);
        const next = label?.id ?? null;
        if (hoveredLabelIdRef.current !== next) {
          hoveredLabelIdRef.current = next;
          drawRef.current();
        }
        return;
      }
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      const newPan = {
        x: panRef.current.x + dx,
        y: panRef.current.y + dy,
      };
      panRef.current = newPan;
      setPan(newPan);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const start = pointerDownStartRef.current;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      const wasPanning = isPanningRef.current;
      const pendingId = pendingLabelIdRef.current;
      isPanningRef.current = false;
      pendingLabelIdRef.current = null;
      setIsDragging(false);
      el.releasePointerCapture(e.pointerId);
      if (wasPanning && moved < CLICK_VS_DRAG_THRESHOLD_PX && pendingId) {
        onLabelClickRef.current?.(pendingId);
      }
    };

    el.addEventListener('pointerdown', onPointerDown, { passive: false });
    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [imageError]);

  const handlePointerLeave = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setIsDragging(false);
      pendingLabelIdRef.current = null;
    }
    if (hoveredLabelIdRef.current) {
      hoveredLabelIdRef.current = null;
      draw();
    }
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-4/3 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 touch-none"
      style={{ minHeight: 200 }}
    >
      {imageError ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          Схема недоступна
        </div>
      ) : (
        <div
          ref={wrapperRef}
          className="absolute inset-0 touch-none"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full touch-none"
            style={{ display: imageLoaded ? 'block' : 'none', pointerEvents: 'none' }}
            role="img"
            aria-label={alt}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 pointer-events-none">
              Загружаем схему…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
