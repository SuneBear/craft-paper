/**
 * Decoration types and data for PaperShape decorations.
 * Supports: staples, washi tape, and stickers.
 */

export type DecorationType = 'staple' | 'washi-tape' | 'sticker';

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

// ─── Staple variants ───
export const stapleVariants = [
  { key: 'silver', label: '银色', color: 'hsl(0, 0%, 72%)', highlight: 'hsl(0, 0%, 88%)' },
  { key: 'gold', label: '金色', color: 'hsl(43, 55%, 62%)', highlight: 'hsl(43, 55%, 78%)' },
  { key: 'rose-gold', label: '玫瑰金', color: 'hsl(12, 45%, 68%)', highlight: 'hsl(12, 45%, 82%)' },
] as const;

// ─── Washi tape variants ───
export const washiTapeVariants = [
  { key: 'stripe-pink', label: '粉色条纹', bg: 'hsl(350, 60%, 82%)', pattern: 'stripes', accent: 'hsl(350, 50%, 72%)' },
  { key: 'dots-mint', label: '薄荷圆点', bg: 'hsl(160, 40%, 78%)', pattern: 'dots', accent: 'hsl(160, 35%, 65%)' },
  { key: 'stars-yellow', label: '黄色星星', bg: 'hsl(45, 70%, 80%)', pattern: 'stars', accent: 'hsl(40, 60%, 60%)' },
  { key: 'plain-lavender', label: '薰衣草纯色', bg: 'hsl(270, 35%, 82%)', pattern: 'plain', accent: 'hsl(270, 30%, 70%)' },
  { key: 'check-sky', label: '天蓝格子', bg: 'hsl(210, 50%, 82%)', pattern: 'check', accent: 'hsl(210, 45%, 68%)' },
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

export function createDecoration(type: DecorationType, variant: string, x: number, y: number): DecorationItem {
  return {
    id: `${type}-${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    variant,
    transform: { x, y, rotation: 0, scale: 1 },
  };
}

export const decorationCatalog: { type: DecorationType; label: string; emoji: string; variants: readonly { key: string; label: string }[] }[] = [
  { type: 'staple', label: '订书钉', emoji: '📎', variants: stapleVariants },
  { type: 'washi-tape', label: '胶带', emoji: '🎀', variants: washiTapeVariants },
  { type: 'sticker', label: '贴纸', emoji: '⭐', variants: stickerVariants },
];
