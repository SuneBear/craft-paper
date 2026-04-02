import type { PaperContentPadding } from './paperShapeTypes';

export const PAPER_COLORS: Record<string, string> = {
  cream: 'hsl(48, 88%, 89%)',
  cloud: 'hsl(52, 72%, 94%)',
  pink: 'hsl(342, 84%, 86%)',
  apricot: 'hsl(28, 90%, 84%)',
  peach: 'hsl(16, 92%, 82%)',
  mint: 'hsl(152, 64%, 84%)',
  sky: 'hsl(204, 86%, 86%)',
  lavender: 'hsl(268, 72%, 87%)',
};

export const DEFAULT_CANVAS_PADDING = 0;

export interface ResolvedContentPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function clampNum(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveContentPadding(value: PaperContentPadding): ResolvedContentPadding {
  if (typeof value === 'number') {
    const n = Math.max(0, value);
    return { top: n, right: n, bottom: n, left: n };
  }
  const all = Math.max(0, value.all ?? 0);
  const x = Math.max(0, value.x ?? all);
  const y = Math.max(0, value.y ?? all);
  return {
    top: Math.max(0, value.top ?? y),
    right: Math.max(0, value.right ?? x),
    bottom: Math.max(0, value.bottom ?? y),
    left: Math.max(0, value.left ?? x),
  };
}

function parseHexColor(input: string): { r: number; g: number; b: number } | null {
  const s = input.trim();
  const short = s.match(/^#([0-9a-fA-F]{3})$/);
  if (short) {
    const [r, g, b] = short[1].split('').map((ch) => parseInt(ch + ch, 16));
    return { r, g, b };
  }
  const full = s.match(/^#([0-9a-fA-F]{6})$/);
  if (!full) return null;
  const hex = full[1];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function parseHslColor(input: string): { h: number; s: number; l: number } | null {
  const s = input.trim();
  const match = s.match(/^hsla?\(\s*([+-]?\d*\.?\d+)(?:deg)?(?:\s*,\s*|\s+)([+-]?\d*\.?\d+)%(?:\s*,\s*|\s+)([+-]?\d*\.?\d+)%/i);
  if (!match) return null;
  return {
    h: Number(match[1]),
    s: clampNum(Number(match[2]), 0, 100),
    l: clampNum(Number(match[3]), 0, 100),
  };
}

export function derivePaperShadowColor(fillColor: string, fallback: string): string {
  const parsedHsl = parseHslColor(fillColor);
  if (parsedHsl) {
    const h = ((parsedHsl.h % 360) + 360) % 360;
    const s = clampNum(parsedHsl.s * 0.9, 6, 100);
    const l = clampNum(parsedHsl.l - 40, 0, 100);
    return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  }
  const parsedHex = parseHexColor(fillColor);
  if (parsedHex) {
    const hsl = rgbToHsl(parsedHex.r, parsedHex.g, parsedHex.b);
    const s = clampNum(hsl.s * 0.9, 6, 100);
    const l = clampNum(hsl.l - 40, 0, 100);
    return `hsl(${hsl.h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  }
  return fallback;
}

export function edgeBiasedSplit(length: number, offsetRaw: number, edgeRatioRaw: number = 0.2): number {
  const edgeRatio = Math.max(0.14, Math.min(0.45, edgeRatioRaw));
  const side = offsetRaw < 0 ? -1 : 1;
  const anchor = side < 0 ? length * edgeRatio : length * (1 - edgeRatio);
  const clampedOffset = Math.max(-length * 0.25, Math.min(length * 0.25, offsetRaw));
  const drift = clampedOffset * 0.35;
  return anchor + drift;
}
