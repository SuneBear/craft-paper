/**
 * Decoration types and data for PaperShape decorations.
 * Supports: staples, washi tape, and stickers.
 */

export type DecorationType = 'staple' | 'washi-tape' | 'sticker';
export type WashiTapePlacement = 'left-corner' | 'top-center' | 'right-corner';

export interface DecorationTransform {
  x: number;
  y: number;
  rotation: number; // degrees
  scale: number;
}

export interface DecorationItem {
  id: string;
  type: DecorationType;
  variant: string;
  transform: DecorationTransform;
}

export function getDecorationBaseSize(type: DecorationType): { w: number; h: number } {
  if (type === 'washi-tape') return { w: 80, h: 22 };
  if (type === 'staple') return { w: 28, h: 10 };
  return { w: 24, h: 24 };
}

function resizeAxisWithEdgeAnchor(
  start: number,
  elementSize: number,
  fromSize: number,
  toSize: number
): number {
  const left = start;
  const right = fromSize - (start + elementSize);
  const edgeBand = Math.max(elementSize * 0.9, fromSize * 0.2);

  if (right <= edgeBand && right < left) {
    return toSize - elementSize - right;
  }
  if (left <= edgeBand && left <= right) {
    return left;
  }

  const fromSafe = Math.max(1, fromSize);
  return (start / fromSafe) * toSize;
}

export function resizeDecorationsForCanvas(
  decorations: DecorationItem[],
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number
): DecorationItem[] {
  if (
    fromWidth <= 0
    || fromHeight <= 0
    || toWidth <= 0
    || toHeight <= 0
    || (fromWidth === toWidth && fromHeight === toHeight)
  ) {
    return decorations;
  }

  return decorations.map((deco) => {
    const { w: baseW, h: baseH } = getDecorationBaseSize(deco.type);
    const visualW = baseW * deco.transform.scale;
    const visualH = baseH * deco.transform.scale;
    const nextX = resizeAxisWithEdgeAnchor(deco.transform.x, visualW, fromWidth, toWidth);
    const nextY = resizeAxisWithEdgeAnchor(deco.transform.y, visualH, fromHeight, toHeight);

    if (nextX === deco.transform.x && nextY === deco.transform.y) {
      return deco;
    }

    return {
      ...deco,
      transform: {
        ...deco.transform,
        x: nextX,
        y: nextY,
      },
    };
  });
}

export function getWashiTapePlacementTransform(
  width: number,
  _height: number,
  placement: WashiTapePlacement
): DecorationTransform {
  const tapeW = 80;
  const tapeH = 22;
  const insetX = Math.max(8, width * 0.08);
  const centerOnTopBorderY = -tapeH / 2;
  if (placement === 'left-corner') {
    return {
      x: insetX,
      y: centerOnTopBorderY,
      rotation: -12,
      scale: 1,
    };
  }
  if (placement === 'right-corner') {
    return {
      x: Math.max(4, width - tapeW - insetX),
      y: centerOnTopBorderY,
      rotation: 12,
      scale: 1,
    };
  }
  return {
    x: Math.max(4, width / 2 - tapeW / 2),
    y: centerOnTopBorderY,
    rotation: -3,
    scale: 1,
  };
}

// ─── Staple variants ───
export const stapleVariants = [
  { key: 'silver', label: '银色', color: 'hsl(0, 0%, 72%)', highlight: 'hsl(0, 0%, 88%)' },
  { key: 'gold', label: '金色', color: 'hsl(43, 55%, 62%)', highlight: 'hsl(43, 55%, 78%)' },
  { key: 'rose-gold', label: '玫瑰金', color: 'hsl(12, 45%, 68%)', highlight: 'hsl(12, 45%, 82%)' },
] as const;

// ─── Washi tape variants ───
export const washiTapeVariants = [
  { key: 'stripe-pink', label: '粉色条纹', bg: 'hsl(346, 86%, 78%)', pattern: 'stripes', accent: 'hsl(344, 74%, 62%)' },
  { key: 'dots-mint', label: '薄荷圆点', bg: 'hsl(154, 62%, 74%)', pattern: 'dots', accent: 'hsl(152, 58%, 56%)' },
  { key: 'stars-yellow', label: '黄色星星', bg: 'hsl(48, 94%, 76%)', pattern: 'stars', accent: 'hsl(42, 82%, 56%)' },
  { key: 'plain-lavender', label: '薰衣草纯色', bg: 'hsl(268, 72%, 79%)', pattern: 'plain', accent: 'hsl(266, 62%, 63%)' },
  { key: 'check-sky', label: '天蓝格子', bg: 'hsl(204, 84%, 78%)', pattern: 'check', accent: 'hsl(202, 74%, 60%)' },
] as const;

// ─── Sticker variants ───
export const stickerVariants = [
  { key: 'star', label: '星星', emoji: '⭐' },
  { key: 'heart', label: '爱心', emoji: '❤️' },
  { key: 'cat', label: '猫咪', emoji: '🐱' },
  { key: 'flower', label: '小花', emoji: '🌸' },
  { key: 'sparkle', label: '闪闪', emoji: '✨' },
  { key: 'bunny', label: '兔兔', emoji: '🐰' },
  { key: 'leaf', label: '叶子', emoji: '🍃' },
  { key: 'ribbon', label: '蝴蝶结', emoji: '🎀' },
] as const;

export function createDecoration(
  type: DecorationType,
  variant: string,
  x: number,
  y: number,
  transformOverrides?: Partial<DecorationTransform>
): DecorationItem {
  return {
    id: `${type}-${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    variant,
    transform: { x, y, rotation: 0, scale: 1, ...transformOverrides },
  };
}

export const decorationCatalog: { type: DecorationType; label: string; emoji: string; variants: readonly { key: string; label: string }[] }[] = [
  { type: 'washi-tape', label: '胶带', emoji: '🎀', variants: washiTapeVariants },
  { type: 'staple', label: '订书钉', emoji: '📎', variants: stapleVariants },
  { type: 'sticker', label: '贴纸', emoji: '⭐', variants: stickerVariants },
];
