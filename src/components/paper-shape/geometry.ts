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
  couponHoleCount?: number;     // 侧边孔数量
  couponHoleSpread?: number;    // 多孔分布范围 (0-1)
  couponHoleOffsetY?: number;   // 侧边孔整体纵向偏移
  couponNotchOffsetX?: number;  // 顶底缺口横向偏移
  // ticket
  cutRadius?: number;           // 切口半径
  ticketCutCount?: number;      // 侧边切口数量
  ticketCutSpread?: number;     // 多切口分布范围 (0-1)
  ticketCutOffsetY?: number;    // 侧边切口整体纵向偏移
  // coupon + ticket perforation guide
  perforationMode?: number;     // 0=虚线, 1=打孔点
  perforationGap?: number;      // 间距
  perforationDotRadius?: number;// 打孔点半径
  perforationInset?: number;    // 距端点内缩
  perforationOffset?: number;   // 撕线偏移（coupon 为X，ticket 为Y）
  // tag
  cutSize?: number;             // 切角大小
  tagHoleRadius?: number;       // 吊牌孔半径
  // folded
  foldSize?: number;            // 折角大小
  foldCorners?: number;         // 折角角点位掩码: 1左上 2右上 4右下 8左下
  // torn
  tearAmplitude?: number;       // 撕裂幅度
  // stitched
  stitchInset?: number;         // 缝线内缩
  cornerRadius?: number;        // 圆角大小
  // scalloped-edge
  scallopRadius?: number;       // 花边半径
  // receipt
  zigzagHeight?: number;        // 锯齿高度
  zigzagEdge?: number;          // 锯齿边方向: 0下 1上 2左 3右
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

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function buildSideCenters(
  h: number,
  cornerRadius: number,
  holeRadius: number,
  countRaw: number | undefined,
  spreadRaw: number | undefined,
  offsetRaw: number | undefined
): number[] {
  const minY = cornerRadius + holeRadius + 2;
  const maxY = h - cornerRadius - holeRadius - 2;
  const available = Math.max(0, maxY - minY);
  if (available <= 0) return [h / 2];

  const maxCount = Math.max(1, Math.floor(available / (holeRadius * 2 + 2)) + 1);
  let count = Math.round(countRaw ?? 1);
  count = clamp(count, 1, maxCount);

  if (count === 1) {
    const center = clamp(h / 2 + (offsetRaw ?? 0), minY, maxY);
    return [center];
  }

  const spread = clamp(spreadRaw ?? 0.68, 0.25, 1);
  const minSpan = (count - 1) * (holeRadius * 2 + 2);
  const span = Math.min(available, Math.max(available * spread, minSpan));
  const center = clamp(h / 2 + (offsetRaw ?? 0), minY + span / 2, maxY - span / 2);
  const start = center - span / 2;
  const step = span / (count - 1);

  return Array.from({ length: count }, (_, i) => start + i * step);
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
  const cornerR = Math.min(perfR * 0.8, Math.min(w, h) * 0.08);
  const innerW = w - margin * 2 - cornerR * 2;
  const innerH = h - margin * 2 - cornerR * 2;

  const countH = Math.max(4, Math.round(innerW / (perfR * 3)));
  const countV = Math.max(3, Math.round(innerH / (perfR * 3)));

  const stepH = innerW / countH;
  const stepV = innerH / countV;

  let path = `M ${margin + cornerR} ${margin}`;

  // Top edge
  for (let i = 0; i < countH; i++) {
    const x1 = margin + cornerR + i * stepH;
    const x2 = x1 + stepH;
    const mid = (x1 + x2) / 2;
    const pr = wobble(perfR, r * 1.2, rng);
    path += ` L ${mid - pr} ${margin}`;
    path += ` A ${pr} ${pr} 0 0 1 ${mid + pr} ${margin}`;
  }
  path += ` L ${w - margin - cornerR} ${margin}`;
  path += ` Q ${w - margin} ${margin} ${w - margin} ${margin + cornerR}`;

  // Right edge
  for (let i = 0; i < countV; i++) {
    const y1 = margin + cornerR + i * stepV;
    const y2 = y1 + stepV;
    const mid = (y1 + y2) / 2;
    const pr = wobble(perfR, r * 1.2, rng);
    path += ` L ${w - margin} ${mid - pr}`;
    path += ` A ${pr} ${pr} 0 0 1 ${w - margin} ${mid + pr}`;
  }
  path += ` L ${w - margin} ${h - margin - cornerR}`;
  path += ` Q ${w - margin} ${h - margin} ${w - margin - cornerR} ${h - margin}`;

  // Bottom edge (right to left)
  for (let i = countH - 1; i >= 0; i--) {
    const x1 = margin + cornerR + i * stepH;
    const x2 = x1 + stepH;
    const mid = (x1 + x2) / 2;
    const pr = wobble(perfR, r * 1.2, rng);
    path += ` L ${mid + pr} ${h - margin}`;
    path += ` A ${pr} ${pr} 0 0 1 ${mid - pr} ${h - margin}`;
  }
  path += ` L ${margin + cornerR} ${h - margin}`;
  path += ` Q ${margin} ${h - margin} ${margin} ${h - margin - cornerR}`;

  // Left edge (bottom to top)
  for (let i = countV - 1; i >= 0; i--) {
    const y1 = margin + cornerR + i * stepV;
    const y2 = y1 + stepV;
    const mid = (y1 + y2) / 2;
    const pr = wobble(perfR, r * 1.2, rng);
    path += ` L ${margin} ${mid + pr}`;
    path += ` A ${pr} ${pr} 0 0 1 ${margin} ${mid - pr}`;
  }
  path += ` L ${margin} ${margin + cornerR}`;
  path += ` Q ${margin} ${margin} ${margin + cornerR} ${margin}`;

  return `${path} Z`;
}

function couponPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const holeR = p.holeRadius ?? Math.min(w, h) * 0.1;
  const notchR = p.notchRadius ?? Math.min(w, h) * 0.06;
  const cr = p.cornerRadius ?? 14;
  const notchOffsetX = p.couponNotchOffsetX ?? 0;
  const notchCenter = clamp(w / 2 + notchOffsetX, cr + notchR + 2, w - cr - notchR - 2);
  const sideCenters = buildSideCenters(h, cr, holeR, p.couponHoleCount, p.couponHoleSpread, p.couponHoleOffsetY);

  let path = `M ${cr} 0`;
  path += ` L ${notchCenter - notchR} 0`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${notchCenter + notchR} 0`;
  path += ` L ${w - cr} 0 Q ${w} 0 ${w} ${cr}`;

  for (const cy of sideCenters) {
    path += ` L ${w} ${cy - holeR}`;
    path += ` A ${holeR} ${holeR} 0 0 0 ${w} ${cy + holeR}`;
  }
  path += ` L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h}`;

  path += ` L ${notchCenter + notchR} ${h}`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${notchCenter - notchR} ${h}`;
  path += ` L ${cr} ${h} Q 0 ${h} 0 ${h - cr}`;

  for (let i = sideCenters.length - 1; i >= 0; i--) {
    const cy = sideCenters[i];
    path += ` L 0 ${cy + holeR}`;
    path += ` A ${holeR} ${holeR} 0 0 0 0 ${cy - holeR}`;
  }
  path += ` L 0 ${cr} Q 0 0 ${cr} 0`;

  path += ' Z';
  return path;
}

function ticketPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const cutR = p.cutRadius ?? Math.min(w, h) * 0.11;
  const cr = p.cornerRadius ?? 10;
  const sideCenters = buildSideCenters(h, cr, cutR, p.ticketCutCount, p.ticketCutSpread, p.ticketCutOffsetY);

  let path = `M ${cr} 0 L ${w - cr} 0 Q ${w} 0 ${w} ${cr}`;

  for (const cy of sideCenters) {
    path += ` L ${w} ${cy - cutR}`;
    path += ` A ${cutR} ${cutR} 0 0 0 ${w} ${cy + cutR}`;
  }
  path += ` L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h}`;

  path += ` L ${cr} ${h} Q 0 ${h} 0 ${h - cr}`;

  for (let i = sideCenters.length - 1; i >= 0; i--) {
    const cy = sideCenters[i];
    path += ` L 0 ${cy + cutR}`;
    path += ` A ${cutR} ${cutR} 0 0 0 0 ${cy - cutR}`;
  }
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
  const fs = clamp(p.foldSize ?? Math.min(w, h) * 0.18, 6, Math.min(w, h) * 0.42);
  const mask = Math.round(p.foldCorners ?? 2) || 2;
  const tl = (mask & 1) !== 0;
  const tr = (mask & 2) !== 0;
  const br = (mask & 4) !== 0;
  const bl = (mask & 8) !== 0;

  const topLeftX = tl ? fs : 0;
  const topRightX = tr ? w - fs : w;
  const rightTopY = tr ? fs : 0;
  const rightBottomY = br ? h - fs : h;
  const bottomRightX = br ? w - fs : w;
  const bottomLeftX = bl ? fs : 0;
  const leftBottomY = bl ? h - fs : h;
  const leftTopY = tl ? fs : 0;

  let path = `M ${topLeftX} 0`;
  path += ` L ${topRightX} 0`;
  path += tr ? ` L ${w} ${rightTopY}` : ` L ${w} 0`;
  path += ` L ${w} ${rightBottomY}`;
  path += br ? ` L ${bottomRightX} ${h}` : ` L ${w} ${h}`;
  path += ` L ${bottomLeftX} ${h}`;
  path += bl ? ` L 0 ${leftBottomY}` : ` L 0 ${h}`;
  path += ` L 0 ${leftTopY}`;
  path += tl ? ` L ${topLeftX} 0` : ` L 0 0`;
  path += ' Z';
  return path;
}

export function getFoldTriangle(w: number, h: number, params?: PresetParams): string {
  const first = getFoldTriangles(w, h, params)[0];
  return first ?? '';
}

export function getFoldTriangles(w: number, h: number, params?: PresetParams): string[] {
  const fs = clamp(params?.foldSize ?? Math.min(w, h) * 0.18, 6, Math.min(w, h) * 0.42);
  const mask = Math.round(params?.foldCorners ?? 2) || 2;
  const triangles: string[] = [];

  if (mask & 1) triangles.push(`M ${fs} 0 L 0 ${fs} L ${fs} ${fs} Z`);
  if (mask & 2) triangles.push(`M ${w - fs} 0 L ${w} ${fs} L ${w - fs} ${fs} Z`);
  if (mask & 4) triangles.push(`M ${w} ${h - fs} L ${w - fs} ${h} L ${w - fs} ${h - fs} Z`);
  if (mask & 8) triangles.push(`M ${fs} ${h} L 0 ${h - fs} L ${fs} ${h - fs} Z`);

  return triangles;
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
    { key: 'couponHoleCount', label: '侧边孔数量', min: 1, max: 5, step: 1, defaultVal: () => 1 },
    { key: 'couponHoleSpread', label: '孔分布范围', min: 0.3, max: 1, step: 0.05, defaultVal: () => 0.68 },
    { key: 'couponHoleOffsetY', label: '孔位纵向偏移', min: -80, max: 80, step: 1, defaultVal: () => 0 },
    { key: 'couponNotchOffsetX', label: '中缝横向偏移', min: -120, max: 120, step: 1, defaultVal: () => 0 },
    { key: 'perforationMode', label: '撕线模式(0虚线/1打孔)', min: 0, max: 1, step: 1, defaultVal: () => 0 },
    { key: 'perforationGap', label: '撕线间距', min: 4, max: 24, step: 1, defaultVal: () => 10 },
    { key: 'perforationDotRadius', label: '打孔点半径', min: 0.8, max: 4, step: 0.1, defaultVal: () => 1.6 },
    { key: 'perforationInset', label: '撕线内缩', min: 2, max: 30, step: 1, defaultVal: () => 7 },
    { key: 'perforationOffset', label: '撕线偏移', min: -120, max: 120, step: 1, defaultVal: () => 0 },
  ],
  ticket: [
    { key: 'cutRadius', label: '切口半径', min: 5, max: 35, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.11 },
    { key: 'cornerRadius', label: '圆角', min: 0, max: 30, step: 1, defaultVal: () => 10 },
    { key: 'ticketCutCount', label: '侧边切口数量', min: 1, max: 5, step: 1, defaultVal: () => 1 },
    { key: 'ticketCutSpread', label: '切口分布范围', min: 0.3, max: 1, step: 0.05, defaultVal: () => 0.68 },
    { key: 'ticketCutOffsetY', label: '切口纵向偏移', min: -80, max: 80, step: 1, defaultVal: () => 0 },
    { key: 'perforationMode', label: '撕线模式(0虚线/1打孔)', min: 0, max: 1, step: 1, defaultVal: () => 0 },
    { key: 'perforationGap', label: '撕线间距', min: 4, max: 24, step: 1, defaultVal: () => 10 },
    { key: 'perforationDotRadius', label: '打孔点半径', min: 0.8, max: 4, step: 0.1, defaultVal: () => 1.6 },
    { key: 'perforationInset', label: '撕线内缩', min: 2, max: 30, step: 1, defaultVal: () => 7 },
    { key: 'perforationOffset', label: '撕线偏移', min: -120, max: 120, step: 1, defaultVal: () => 0 },
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
  coupon: { label: '优惠券', emoji: '🎟️', description: '左右半圆打孔 + 中轴撕线' },
  ticket: { label: '门票', emoji: '🎫', description: '票根切口 + 横向撕线语义' },
  tag: { label: '吊牌', emoji: '🏷️', description: '异形切角 + 单孔位挂绳' },
  folded: { label: '折角', emoji: '📄', description: '单角折角，带双层阴影' },
  torn: { label: '撕纸', emoji: '📃', description: '不规则撕裂边缘' },
  stitched: { label: '缝线', emoji: '🧵', description: '平稳主体 + 内圈缝线边框' },
  'scalloped-edge': { label: '花边', emoji: '🌸', description: '扇贝花边连续边框' },
  receipt: { label: '小票', emoji: '🧾', description: '顶部平直 + 底边锯齿' },
  'basic-paper': { label: '基础纸张', emoji: '📝', description: '轻微手感的基础纸张' },
};
