/**
 * PaperShape Geometry Engine
 * Generates SVG paths for various paper-craft shapes with hand-drawn feel.
 */

export type PaperPreset =
  | 'stamp'
  | 'coupon'
  | 'ticket'
  | 'tag'
  | 'folded'
  | 'torn'
  | 'stitched'
  | 'scalloped-edge'
  | 'receipt'
  | 'basic-paper';

/** Per-preset tunable parameters (all optional, sensible defaults applied) */
export interface PresetParams {
  // stamp
  perforationRadius?: number;   // 齿孔半径 (default: auto based on size)
  // coupon
  holeRadius?: number;          // 打孔半径
  notchRadius?: number;         // 缺口半径
  // ticket
  cutRadius?: number;           // 切口半径
  // tag
  cutSize?: number;             // 切角大小
  tagHoleRadius?: number;       // 吊牌孔半径
  // folded
  foldSize?: number;            // 折角大小
  // torn
  tearAmplitude?: number;       // 撕裂幅度
  // stitched
  stitchInset?: number;         // 缝线内缩
  cornerRadius?: number;        // 圆角大小
  // scalloped-edge
  scallopRadius?: number;       // 花边半径
  // receipt
  zigzagHeight?: number;        // 锯齿高度
}

export interface ShapeConfig {
  width: number;
  height: number;
  preset: PaperPreset;
  seed?: number;
  roughness?: number; // 0-1, hand-drawn wobble
  params?: PresetParams;
}

// Simple seeded random
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function wobble(val: number, amount: number, rng: () => number): number {
  return val + (rng() - 0.5) * amount * 2;
}

export function generatePath(config: ShapeConfig): string {
  const { width: w, height: h, preset, seed = 42, roughness = 0.3, params = {} } = config;
  const rng = seededRandom(seed);
  const r = roughness;

  switch (preset) {
    case 'stamp':
      return stampPath(w, h, rng, r, params);
    case 'coupon':
      return couponPath(w, h, rng, r, params);
    case 'ticket':
      return ticketPath(w, h, rng, r, params);
    case 'tag':
      return tagPath(w, h, rng, r, params);
    case 'folded':
      return foldedPath(w, h, rng, r, params);
    case 'torn':
      return tornPath(w, h, rng, r, params);
    case 'stitched':
      return stitchedPath(w, h, rng, r, params);
    case 'scalloped-edge':
      return scallopedPath(w, h, rng, r, params);
    case 'receipt':
      return receiptPath(w, h, rng, r, params);
    case 'basic-paper':
    default:
      return basicPaperPath(w, h, rng, r, params);
  }
}

function stampPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const margin = Math.min(w, h) * 0.08;
  const perfR = p.perforationRadius ?? Math.min(w, h) * 0.04;
  const innerW = w - margin * 2;
  const innerH = h - margin * 2;

  const countH = Math.max(4, Math.round(innerW / (perfR * 3)));
  const countV = Math.max(3, Math.round(innerH / (perfR * 3)));

  const stepH = innerW / countH;
  const stepV = innerH / countV;

  let path = `M ${margin} ${margin}`;

  // Top edge
  for (let i = 0; i < countH; i++) {
    const x1 = margin + i * stepH;
    const x2 = x1 + stepH;
    const mid = (x1 + x2) / 2;
    const pr = wobble(perfR, r * 1.5, rng);
    path += ` L ${mid - pr} ${margin}`;
    path += ` A ${pr} ${pr} 0 0 1 ${mid + pr} ${margin}`;
  }
  path += ` L ${w - margin} ${margin}`;

  // Right edge
  for (let i = 0; i < countV; i++) {
    const y1 = margin + i * stepV;
    const y2 = y1 + stepV;
    const mid = (y1 + y2) / 2;
    const pr = wobble(perfR, r * 1.5, rng);
    path += ` L ${w - margin} ${mid - pr}`;
    path += ` A ${pr} ${pr} 0 0 1 ${w - margin} ${mid + pr}`;
  }
  path += ` L ${w - margin} ${h - margin}`;

  // Bottom edge (right to left)
  for (let i = countH - 1; i >= 0; i--) {
    const x1 = margin + i * stepH;
    const x2 = x1 + stepH;
    const mid = (x1 + x2) / 2;
    const pr = wobble(perfR, r * 1.5, rng);
    path += ` L ${mid + pr} ${h - margin}`;
    path += ` A ${pr} ${pr} 0 0 1 ${mid - pr} ${h - margin}`;
  }
  path += ` L ${margin} ${h - margin}`;

  // Left edge (bottom to top)
  for (let i = countV - 1; i >= 0; i--) {
    const y1 = margin + i * stepV;
    const y2 = y1 + stepV;
    const mid = (y1 + y2) / 2;
    const pr = wobble(perfR, r * 1.5, rng);
    path += ` L ${margin} ${mid + pr}`;
    path += ` A ${pr} ${pr} 0 0 1 ${margin} ${mid - pr}`;
  }

  path += ' Z';
  return path;
}

function couponPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const holeR = p.holeRadius ?? Math.min(w, h) * 0.1;
  const notchR = p.notchRadius ?? Math.min(w, h) * 0.06;
  const cr = p.cornerRadius ?? 14;

  let path = `M ${cr} 0`;
  const topMid = w / 2;
  path += ` L ${topMid - notchR} 0`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${topMid + notchR} 0`;
  path += ` L ${w - cr} 0 Q ${w} 0 ${w} ${cr}`;

  const rightHoleY = h / 2;
  path += ` L ${w} ${rightHoleY - holeR}`;
  path += ` A ${holeR} ${holeR} 0 0 0 ${w} ${rightHoleY + holeR}`;
  path += ` L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h}`;

  path += ` L ${topMid + notchR} ${h}`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${topMid - notchR} ${h}`;
  path += ` L ${cr} ${h} Q 0 ${h} 0 ${h - cr}`;

  const leftHoleY = h / 2;
  path += ` L 0 ${leftHoleY + holeR}`;
  path += ` A ${holeR} ${holeR} 0 0 0 0 ${leftHoleY - holeR}`;
  path += ` L 0 ${cr} Q 0 0 ${cr} 0`;

  path += ' Z';
  return path;
}

function ticketPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const cutR = p.cutRadius ?? Math.min(w, h) * 0.11;
  const cr = p.cornerRadius ?? 10;

  let path = `M ${cr} 0 L ${w - cr} 0 Q ${w} 0 ${w} ${cr}`;

  const cutY = h / 2;
  path += ` L ${w} ${cutY - cutR}`;
  path += ` A ${cutR} ${cutR} 0 0 0 ${w} ${cutY + cutR}`;
  path += ` L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h}`;

  path += ` L ${cr} ${h} Q 0 ${h} 0 ${h - cr}`;

  path += ` L 0 ${cutY + cutR}`;
  path += ` A ${cutR} ${cutR} 0 0 0 0 ${cutY - cutR}`;
  path += ` L 0 ${cr} Q 0 0 ${cr} 0`;

  path += ' Z';
  return path;
}

function tagPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  // Classic gift-tag shape: pointed top, rounded bottom corners
  const pointH = p.cutSize ?? h * 0.2; // height of the pointed top triangle
  const cr = p.cornerRadius ?? Math.min(w, h) * 0.08; // bottom corner radius
  const midX = w / 2;

  let path = `M ${midX} 0`; // top point
  path += ` L ${w} ${pointH}`; // right slope
  path += ` L ${w} ${h - cr}`; // right side down
  path += ` Q ${w} ${h} ${w - cr} ${h}`; // bottom-right rounded corner
  path += ` L ${cr} ${h}`; // bottom edge
  path += ` Q 0 ${h} 0 ${h - cr}`; // bottom-left rounded corner
  path += ` L 0 ${pointH}`; // left side up
  path += ` Z`; // back to top point
  return path;
}

export function getTagHole(w: number, h: number, params?: PresetParams): { cx: number; cy: number; r: number } {
  const pointH = params?.cutSize ?? h * 0.2;
  const hr = params?.tagHoleRadius ?? Math.min(w, h) * 0.04;
  return {
    cx: w / 2,
    cy: pointH * 0.7,
    r: hr,
  };
}

function foldedPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const fs = p.foldSize ?? Math.min(w, h) * 0.18;
  return `M 0 0 L ${w - fs} 0 L ${w} ${fs} L ${w} ${h} L 0 ${h} Z`;
}

export function getFoldTriangle(w: number, h: number, params?: PresetParams): string {
  const fs = params?.foldSize ?? Math.min(w, h) * 0.18;
  return `M ${w - fs} 0 L ${w} ${fs} L ${w - fs} ${fs} Z`;
}

function tornPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const amp = p.tearAmplitude ?? 6;
  const points: string[] = [];
  points.push(`M 0 0 L ${w} 0 L ${w} ${h}`);

  const steps = Math.max(12, Math.round(w / 15));
  const stepW = w / steps;
  for (let i = steps; i >= 0; i--) {
    const x = i * stepW;
    const tearAmp = wobble(amp, r * 8, rng);
    const y = h + tearAmp;
    points.push(`L ${x} ${y}`);
  }

  points.push('Z');
  return points.join(' ');
}

function stitchedPath(w: number, h: number, _rng: () => number, _r: number, p: PresetParams): string {
  const cr = p.cornerRadius ?? 12;
  return `M ${cr} 0 L ${w - cr} 0 Q ${w} 0 ${w} ${cr} L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h} L ${cr} ${h} Q 0 ${h} 0 ${h - cr} L 0 ${cr} Q 0 0 ${cr} 0 Z`;
}

export function getStitchPath(w: number, h: number, params?: PresetParams): string {
  const inset = params?.stitchInset ?? 8;
  const cr = 6;
  const i = inset;
  return `M ${i + cr} ${i} L ${w - i - cr} ${i} Q ${w - i} ${i} ${w - i} ${i + cr} L ${w - i} ${h - i - cr} Q ${w - i} ${h - i} ${w - i - cr} ${h - i} L ${i + cr} ${h - i} Q ${i} ${h - i} ${i} ${h - i - cr} L ${i} ${i + cr} Q ${i} ${i} ${i + cr} ${i} Z`;
}

function scallopedPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const sr = p.scallopRadius ?? 12;
  const points: string[] = [];

  const countH = Math.max(4, Math.round(w / (sr * 2.2)));
  const countV = Math.max(3, Math.round(h / (sr * 2.2)));
  const stepH = w / countH;
  const stepV = h / countV;

  points.push(`M 0 0`);

  for (let i = 0; i < countH; i++) {
    const x1 = i * stepH;
    const x2 = (i + 1) * stepH;
    const mid = (x1 + x2) / 2;
    const d = wobble(sr * 0.7, r * 2, rng);
    points.push(`Q ${mid} ${-d} ${x2} 0`);
  }

  for (let i = 0; i < countV; i++) {
    const y1 = i * stepV;
    const y2 = (i + 1) * stepV;
    const mid = (y1 + y2) / 2;
    const d = wobble(sr * 0.7, r * 2, rng);
    points.push(`Q ${w + d} ${mid} ${w} ${y2}`);
  }

  for (let i = countH; i > 0; i--) {
    const x1 = i * stepH;
    const x2 = (i - 1) * stepH;
    const mid = (x1 + x2) / 2;
    const d = wobble(sr * 0.7, r * 2, rng);
    points.push(`Q ${mid} ${h + d} ${x2} ${h}`);
  }

  for (let i = countV; i > 0; i--) {
    const y1 = i * stepV;
    const y2 = (i - 1) * stepV;
    const mid = (y1 + y2) / 2;
    const d = wobble(sr * 0.7, r * 2, rng);
    points.push(`Q ${-d} ${mid} 0 ${y2}`);
  }

  points.push('Z');
  return points.join(' ');
}

function receiptPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const zigH = p.zigzagHeight ?? 8;
  const steps = Math.max(8, Math.round(w / 12));
  const stepW = w / steps;

  let path = `M 0 0 L ${w} 0 L ${w} ${h}`;

  for (let i = steps; i >= 0; i--) {
    const x = i * stepW;
    const peak = i % 2 === 0 ? h + zigH : h;
    path += ` L ${x} ${wobble(peak, r * 3, rng)}`;
  }

  path += ' Z';
  return path;
}

function basicPaperPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const cr = p.cornerRadius ?? 6;
  const w1 = wobble(0, r * 2, rng);
  const w2 = wobble(0, r * 2, rng);
  return `M ${cr + w1} 0 L ${w - cr + w2} 0 Q ${w} 0 ${w} ${cr} L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h} L ${cr} ${h} Q 0 ${h} 0 ${h - cr} L 0 ${cr} Q 0 0 ${cr + w1} 0 Z`;
}

// Generate dash pattern for stitch lines
export function generateStitchDashes(pathLength: number, dashLen: number = 8, gapLen: number = 6): string {
  return `${dashLen} ${gapLen}`;
}

/** Default preset params with labels for UI */
export const presetParamsDefs: Record<PaperPreset, { key: keyof PresetParams; label: string; min: number; max: number; step: number; defaultVal: (w: number, h: number) => number }[]> = {
  stamp: [
    { key: 'perforationRadius', label: '齿孔大小', min: 2, max: 20, step: 0.5, defaultVal: (w, h) => Math.min(w, h) * 0.04 },
  ],
  coupon: [
    { key: 'holeRadius', label: '打孔半径', min: 5, max: 40, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.1 },
    { key: 'notchRadius', label: '缺口半径', min: 3, max: 25, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.06 },
  ],
  ticket: [
    { key: 'cutRadius', label: '切口半径', min: 5, max: 35, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.11 },
    { key: 'cornerRadius', label: '圆角', min: 0, max: 30, step: 1, defaultVal: () => 10 },
  ],
  tag: [
    { key: 'cutSize', label: '尖顶高度', min: 10, max: 100, step: 1, defaultVal: (_w, h) => h * 0.2 },
    { key: 'tagHoleRadius', label: '孔径', min: 2, max: 15, step: 0.5, defaultVal: (w, h) => Math.min(w, h) * 0.04 },
    { key: 'cornerRadius', label: '底部圆角', min: 0, max: 30, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.08 },
  ],
  folded: [
    { key: 'foldSize', label: '折角大小', min: 10, max: 80, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.18 },
  ],
  torn: [
    { key: 'tearAmplitude', label: '撕裂幅度', min: 1, max: 20, step: 0.5, defaultVal: () => 6 },
  ],
  stitched: [
    { key: 'stitchInset', label: '缝线内缩', min: 3, max: 20, step: 1, defaultVal: () => 8 },
    { key: 'cornerRadius', label: '圆角', min: 0, max: 30, step: 1, defaultVal: () => 12 },
  ],
  'scalloped-edge': [
    { key: 'scallopRadius', label: '花边大小', min: 5, max: 30, step: 1, defaultVal: () => 12 },
  ],
  receipt: [
    { key: 'zigzagHeight', label: '锯齿高度', min: 2, max: 20, step: 1, defaultVal: () => 8 },
  ],
  'basic-paper': [
    { key: 'cornerRadius', label: '圆角', min: 0, max: 30, step: 1, defaultVal: () => 6 },
  ],
};

// Preset display info
export const presetInfo: Record<PaperPreset, { label: string; emoji: string; description: string }> = {
  stamp: { label: '邮票', emoji: '📮', description: '四边连续齿边，经典邮票形态' },
  coupon: { label: '优惠券', emoji: '🎟️', description: '左右半圆打孔 + 顶部中缺口' },
  ticket: { label: '门票', emoji: '🎫', description: '票根切口，清晰的撕线语义' },
  tag: { label: '吊牌', emoji: '🏷️', description: '异形切角 + 单孔位挂绳' },
  folded: { label: '折角', emoji: '📄', description: '单角折角，带双层阴影' },
  torn: { label: '撕纸', emoji: '📃', description: '不规则撕裂边缘' },
  stitched: { label: '缝线', emoji: '🧵', description: '平稳主体 + 内圈缝线边框' },
  'scalloped-edge': { label: '花边', emoji: '🌸', description: '扇贝花边连续边框' },
  receipt: { label: '小票', emoji: '🧾', description: '顶部平直 + 底边锯齿' },
  'basic-paper': { label: '基础纸张', emoji: '📝', description: '轻微手感的基础纸张' },
};
