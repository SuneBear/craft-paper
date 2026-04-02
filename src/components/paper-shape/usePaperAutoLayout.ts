import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PaperShapeLayoutMode = 'fixed' | 'content' | 'fill';

interface UsePaperAutoLayoutOptions {
  layoutMode: PaperShapeLayoutMode;
  width: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  fillWidthCompensation?: number;
  widthPaddingCompensation?: number;
  heightPaddingCompensation?: number;
  observeDeps?: unknown[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function usePaperAutoLayout({
  layoutMode,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  fillWidthCompensation = 0,
  widthPaddingCompensation = 0,
  heightPaddingCompensation = 0,
  observeDeps = [],
}: UsePaperAutoLayoutOptions) {
  const hostRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);
  const [contentSize, setContentSize] = useState(() => ({
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }));

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const parent = host.parentElement;

    const update = () => {
      const nextHostWidth = Math.ceil(host.getBoundingClientRect().width);
      setHostWidth((prev) => (Math.abs(prev - nextHostWidth) > 1 ? nextHostWidth : prev));

      if (parent) {
        const nextParentWidth = Math.ceil(parent.getBoundingClientRect().width);
        setParentWidth((prev) => (Math.abs(prev - nextParentWidth) > 1 ? nextParentWidth : prev));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    if (parent) observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const nextWidth = Math.ceil(Math.max(node.scrollWidth, rect.width));
      const nextHeight = Math.ceil(Math.max(node.scrollHeight, rect.height));
      setContentSize((prev) => (
        Math.abs(prev.width - nextWidth) <= 1 && Math.abs(prev.height - nextHeight) <= 1
          ? prev
          : { width: nextWidth, height: nextHeight }
      ));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [layoutMode, ...observeDeps]);

  const widthMin = Math.max(1, Math.min(minWidth, maxWidth));
  const widthMax = Math.max(widthMin, Math.max(minWidth, maxWidth));
  const heightMin = Math.max(1, Math.min(minHeight, maxHeight));
  const heightMax = Math.max(heightMin, Math.max(minHeight, maxHeight));
  const widthCap = parentWidth > 0 ? Math.max(widthMin, Math.min(widthMax, parentWidth)) : widthMax;

  const fillWidth = hostWidth > 0
    ? hostWidth
    : parentWidth > 0
      ? parentWidth
      : width;

  const resolvedWidth = layoutMode === 'fill'
    ? clamp(
      fillWidth - Math.max(0, fillWidthCompensation),
      widthMin,
      Math.max(widthMin, Math.min(widthMax, fillWidth))
    )
    : layoutMode === 'content'
      ? clamp((contentSize.width || width) + Math.max(0, widthPaddingCompensation), widthMin, widthCap)
      : clamp(width, widthMin, widthMax);

  const resolvedHeight = layoutMode === 'fixed'
    ? clamp(height, heightMin, heightMax)
    : clamp((contentSize.height || height) + Math.max(0, heightPaddingCompensation), heightMin, heightMax);

  return {
    hostRef,
    contentRef,
    width: resolvedWidth,
    height: resolvedHeight,
  };
}
