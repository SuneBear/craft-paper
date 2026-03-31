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
  stampArcDirection?: number;   // 齿边方向: 0朝内(外边平直) 1朝外(默认)
  // coupon
  holeRadius?: number;          // 打孔半径
  notchRadius?: number;         // 缺口半径
  couponDirection?: number;     // 缺口方向: 0上下缺口(竖撕线) 1左右缺口(横撕线)
  couponPosition?: number;      // 缺口/撕线位置偏移
  couponHoleCount?: number;     // 侧边孔数量
  couponHoleSpread?: number;    // 多孔分布范围 (0-1)
  couponHoleOffsetY?: number;   // 侧边孔整体纵向偏移
  couponNotchOffsetX?: number;  // 顶底缺口横向偏移
  // ticket
  cutRadius?: number;           // 切口半径
  ticketCutCount?: number;      // 侧边切口数量
  ticketCutSpread?: number;     // 多切口分布范围 (0-1)
  ticketCutOffsetY?: number;    // 侧边切口整体纵向偏移
  ticketStubSide?: number;      // 票根方向: 0右 1左 2上 3下
  ticketStubWidth?: number;     // 票根宽度
  // coupon + ticket perforation guide
  perforationMode?: number;     // 0=虚线, 1=打孔点
  perforationGap?: number;      // 间距
  perforationDotRadius?: number;// 打孔点半径
  perforationRingWidth?: number;// 内部打孔描边粗细
  perforationRingColor?: string;// 内部打孔描边颜色
  perforationInset?: number;    // 距端点内缩
  perforationOffset?: number;   // 撕线偏移（coupon 为X，ticket 为Y）
  // tag
  cutSize?: number;             // 切角大小
  tagHoleRadius?: number;       // 吊牌孔半径
  // folded
  foldSize?: number;            // 折角大小
  foldCorners?: number;         // 折角角点位掩码: 1左上 2右上 4右下 8左下
  foldColor?: string;           // 折角颜色
  foldOpacity?: number;         // 折角透明度倍率 (0-1)
  // torn
  tearAmplitude?: number;       // 撕裂幅度
  // stitched
  stitchInset?: number;         // 缝线内缩
  stitchCornerRadius?: number;  // 缝线圆角
  stitchWidth?: number;         // 缝线粗细
  stitchColor?: string;         // 缝线颜色
  stitchStyle?: number;         // 缝线样式: 0虚线 1点状 2实线 3点划线
  cornerRadius?: number;        // 圆角大小
  cornerRadiusTL?: number;      // 左上圆角
  cornerRadiusTR?: number;      // 右上圆角
  cornerRadiusBR?: number;      // 右下圆角
  cornerRadiusBL?: number;      // 左下圆角
  cornerShape?: number;         // 角形状: 0round 1scoop 2bevel 3notch 4squircle 5superellipse
  cornerSuperellipse?: number;  // superellipse(k) 指数 (仅 cornerShape=5 生效)
  // scalloped-edge
  scallopRadius?: number;       // 花边半径
  scallopEdge?: number;         // 花边方向: 0四边 1上 2右 3下 4左
  scallopGap?: number;          // 花边间距
  scallopDepth?: number;        // 花边深度
  // receipt
  zigzagHeight?: number;        // 锯齿高度
  zigzagSize?: number;          // 锯齿尺寸（越小越密）
  zigzagEdge?: number;          // 锯齿边方向: 0下 1上 2左 3右
  // cutout (for smooth-edge papers)
  cutoutEdges?: number;         // 裁剪边位掩码: 1上 2右 4下 8左
  cutoutRadius?: number;        // 裁剪半径（宽度）
  cutoutDepth?: number;         // 裁剪深度
  cutoutOffset?: number;        // 裁剪偏移（沿边中心偏移）
  cutoutShape?: number;         // 裁剪形状: 0三角 1圆弧 2圆角矩形
  cutoutAABleed?: number;       // 裁剪抗锯齿余量（mask 外扩）
}

export interface ShapeConfig {
  width: number;
  height: number;
  preset: PaperPreset;
  seed?: number;
  roughness?: number; // 0-1, hand-drawn wobble
  params?: PresetParams;
}

type CornerSlot = 'tl' | 'tr' | 'br' | 'bl';
type CornerShapeKind =
  | 'round'
  | 'scoop'
  | 'bevel'
  | 'notch'
  | 'squircle'
  | 'superellipse';

interface CornerStyle {
  kind: CornerShapeKind;
  k: number;
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

function edgeBiasedSplit(length: number, offsetRaw: number, edgeRatioRaw: number = 0.2): number {
  const edgeRatio = clamp(edgeRatioRaw, 0.14, 0.32);
  const side = offsetRaw < 0 ? -1 : 1;
  const anchor = side < 0 ? length * edgeRatio : length * (1 - edgeRatio);
  const clampedOffset = clamp(offsetRaw, -length * 0.25, length * 0.25);
  const drift = clampedOffset * 0.35;
  return anchor + drift;
}

function getCornerRadii(w: number, h: number, p: PresetParams, defaultRadius: number) {
  const maxR = Math.min(w, h) * 0.5;
  const base = clamp(p.cornerRadius ?? defaultRadius, 0, maxR);
  let tl = clamp(p.cornerRadiusTL ?? base, 0, maxR);
  let tr = clamp(p.cornerRadiusTR ?? base, 0, maxR);
  let br = clamp(p.cornerRadiusBR ?? base, 0, maxR);
  let bl = clamp(p.cornerRadiusBL ?? base, 0, maxR);

  const fitPair = (a: number, b: number, limit: number): [number, number] => {
    const sum = a + b;
    if (sum <= limit || sum <= 0) return [a, b];
    const k = limit / sum;
    return [a * k, b * k];
  };

  [tl, tr] = fitPair(tl, tr, w);
  [bl, br] = fitPair(bl, br, w);
  [tl, bl] = fitPair(tl, bl, h);
  [tr, br] = fitPair(tr, br, h);

  return { tl, tr, br, bl };
}

function getCornerStyle(p: PresetParams): CornerStyle {
  const code = Math.max(0, Math.min(5, Math.round(p.cornerShape ?? 0)));
  const kind: CornerShapeKind =
    code === 1 ? 'scoop' :
    code === 2 ? 'bevel' :
    code === 3 ? 'notch' :
    code === 4 ? 'squircle' :
    code === 5 ? 'superellipse' :
    'round';
  const k = kind === 'round' ? 1
    : kind === 'scoop' ? -1
    : kind === 'bevel' ? 0
    : kind === 'notch' ? -99
    : kind === 'squircle' ? 2
    : clamp(p.cornerSuperellipse ?? 1, -4, 4);
  return { kind, k };
}

function cornerVertex(slot: CornerSlot, w: number, h: number): { x: number; y: number } {
  if (slot === 'tr') return { x: w, y: 0 };
  if (slot === 'br') return { x: w, y: h };
  if (slot === 'bl') return { x: 0, y: h };
  return { x: 0, y: 0 };
}

function cornerEndPoint(slot: CornerSlot, r: number, w: number, h: number): { x: number; y: number } {
  if (slot === 'tr') return { x: w, y: r };
  if (slot === 'br') return { x: w - r, y: h };
  if (slot === 'bl') return { x: 0, y: h - r };
  return { x: r, y: 0 };
}

function cornerNotchPoint(slot: CornerSlot, r: number, w: number, h: number): { x: number; y: number } {
  if (slot === 'tr') return { x: w - r, y: r };
  if (slot === 'br') return { x: w - r, y: h - r };
  if (slot === 'bl') return { x: r, y: h - r };
  return { x: r, y: r };
}

function cornerPoint(slot: CornerSlot, t: number, q: number, r: number, w: number, h: number): { x: number; y: number } {
  if (slot === 'tr') return { x: w - r + t * r, y: q * r };
  if (slot === 'br') return { x: w - q * r, y: h - r + t * r };
  if (slot === 'bl') return { x: r - t * r, y: h - q * r };
  return { x: q * r, y: r - t * r };
}

function cornerProgress(t: number, exponent: number, concave: boolean): number {
  const p = Math.max(1, exponent);
  if (concave) {
    const base = Math.max(0, 1 - Math.pow(1 - t, p));
    return Math.pow(base, 1 / p);
  }
  const base = Math.max(0, 1 - Math.pow(t, p));
  return 1 - Math.pow(base, 1 / p);
}

function buildCornerPathSegment(
  slot: CornerSlot,
  radius: number,
  style: CornerStyle,
  w: number,
  h: number,
): string {
  if (radius <= 0.001) {
    const v = cornerVertex(slot, w, h);
    return ` L ${v.x} ${v.y}`;
  }

  const r = radius;
  const end = cornerEndPoint(slot, r, w, h);
  if (style.kind === 'bevel') {
    return ` L ${end.x} ${end.y}`;
  }
  if (style.kind === 'notch') {
    const notch = cornerNotchPoint(slot, r, w, h);
    return ` L ${notch.x} ${notch.y} L ${end.x} ${end.y}`;
  }

  const absK = Math.abs(style.k);
  if (absK <= 0.0001) {
    return ` L ${end.x} ${end.y}`;
  }
  const concave = style.k < 0;
  const exponent = Math.min(2048, Math.pow(2, absK));
  const steps = Math.max(6, Math.min(30, Math.round(r / 2.4)));
  let segment = '';
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const q = cornerProgress(t, exponent, concave);
    const pt = cornerPoint(slot, t, q, r, w, h);
    segment += ` L ${Number(pt.x.toFixed(3))} ${Number(pt.y.toFixed(3))}`;
  }
  return segment;
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
  const inward = Math.round(p.stampArcDirection ?? 1) === 0;
  const arcSweep = inward ? 1 : 0;
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
    path += ` A ${pr} ${pr} 0 0 ${arcSweep} ${mid + pr} ${margin}`;
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
    path += ` A ${pr} ${pr} 0 0 ${arcSweep} ${w - margin} ${mid + pr}`;
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
    path += ` A ${pr} ${pr} 0 0 ${arcSweep} ${mid - pr} ${h - margin}`;
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
    path += ` A ${pr} ${pr} 0 0 ${arcSweep} ${margin} ${mid - pr}`;
  }
  path += ` L ${margin} ${margin + cornerR}`;
  path += ` Q ${margin} ${margin} ${margin + cornerR} ${margin}`;

  return `${path} Z`;
}

function couponPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const holeR = p.holeRadius ?? Math.min(w, h) * 0.1;
  const notchR = p.notchRadius ?? Math.min(w, h) * 0.06;
  const { tl, tr, br, bl } = getCornerRadii(w, h, p, 14);
  const cornerStyle = getCornerStyle(p);
  const direction = Math.round(p.couponDirection ?? 0);
  const position = p.couponPosition ?? p.couponNotchOffsetX ?? p.perforationOffset ?? 0;

  if (direction === 1) {
    const notchCenterY = clamp(
      edgeBiasedSplit(h, position, 0.2),
      Math.max(tr, br) + notchR + 2,
      h - Math.max(tr, br) - notchR - 2
    );
    const edgeCenters = buildSideCenters(w, Math.max(tl, tr, br, bl), holeR, p.couponHoleCount, p.couponHoleSpread, p.couponHoleOffsetY);

    let path = `M ${tl} 0`;
    for (const cx of edgeCenters) {
      path += ` L ${cx - holeR} 0`;
      path += ` A ${holeR} ${holeR} 0 0 0 ${cx + holeR} 0`;
    }
    path += ` L ${w - tr} 0`;
    path += buildCornerPathSegment('tr', tr, cornerStyle, w, h);
    path += ` L ${w} ${notchCenterY - notchR}`;
    path += ` A ${notchR} ${notchR} 0 0 0 ${w} ${notchCenterY + notchR}`;
    path += ` L ${w} ${h - br}`;
    path += buildCornerPathSegment('br', br, cornerStyle, w, h);

    for (let i = edgeCenters.length - 1; i >= 0; i--) {
      const cx = edgeCenters[i];
      path += ` L ${cx + holeR} ${h}`;
      path += ` A ${holeR} ${holeR} 0 0 0 ${cx - holeR} ${h}`;
    }
    path += ` L ${bl} ${h}`;
    path += buildCornerPathSegment('bl', bl, cornerStyle, w, h);
    path += ` L 0 ${notchCenterY + notchR}`;
    path += ` A ${notchR} ${notchR} 0 0 0 0 ${notchCenterY - notchR}`;
    path += ` L 0 ${tl}`;
    path += buildCornerPathSegment('tl', tl, cornerStyle, w, h);
    path += ' Z';
    return path;
  }

  const notchCenterX = clamp(
    edgeBiasedSplit(w, position, 0.2),
    Math.max(tl, bl) + notchR + 2,
    w - Math.max(tr, br) - notchR - 2
  );
  const sideCenters = buildSideCenters(h, Math.max(tl, tr, br, bl), holeR, p.couponHoleCount, p.couponHoleSpread, p.couponHoleOffsetY);

  let path = `M ${tl} 0`;
  path += ` L ${notchCenterX - notchR} 0`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${notchCenterX + notchR} 0`;
  path += ` L ${w - tr} 0`;
  path += buildCornerPathSegment('tr', tr, cornerStyle, w, h);

  for (const cy of sideCenters) {
    path += ` L ${w} ${cy - holeR}`;
    path += ` A ${holeR} ${holeR} 0 0 0 ${w} ${cy + holeR}`;
  }
  path += ` L ${w} ${h - br}`;
  path += buildCornerPathSegment('br', br, cornerStyle, w, h);

  path += ` L ${notchCenterX + notchR} ${h}`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${notchCenterX - notchR} ${h}`;
  path += ` L ${bl} ${h}`;
  path += buildCornerPathSegment('bl', bl, cornerStyle, w, h);

  for (let i = sideCenters.length - 1; i >= 0; i--) {
    const cy = sideCenters[i];
    path += ` L 0 ${cy + holeR}`;
    path += ` A ${holeR} ${holeR} 0 0 0 0 ${cy - holeR}`;
  }
  path += ` L 0 ${tl}`;
  path += buildCornerPathSegment('tl', tl, cornerStyle, w, h);
  path += ' Z';
  return path;
}

function ticketPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  // Ticket keeps side cutouts only (no top/bottom notch) and a horizontal tear-line semantic.
  const cutR = p.cutRadius ?? Math.min(w, h) * 0.11;
  const { tl, tr, br, bl } = getCornerRadii(w, h, p, 10);
  const cornerStyle = getCornerStyle(p);
  const sideCenters = buildSideCenters(
    h,
    Math.max(tl, tr, br, bl),
    cutR,
    p.ticketCutCount,
    p.ticketCutSpread,
    p.ticketCutOffsetY ?? -Math.min(14, h * 0.08)
  );

  let path = `M ${tl} 0`;
  path += ` L ${w - tr} 0`;
  path += buildCornerPathSegment('tr', tr, cornerStyle, w, h);

  for (const cy of sideCenters) {
    path += ` L ${w} ${cy - cutR}`;
    path += ` A ${cutR} ${cutR} 0 0 0 ${w} ${cy + cutR}`;
  }

  path += ` L ${w} ${h - br}`;
  path += buildCornerPathSegment('br', br, cornerStyle, w, h);
  path += ` L ${bl} ${h}`;
  path += buildCornerPathSegment('bl', bl, cornerStyle, w, h);

  for (let i = sideCenters.length - 1; i >= 0; i--) {
    const cy = sideCenters[i];
    path += ` L 0 ${cy + cutR}`;
    path += ` A ${cutR} ${cutR} 0 0 0 0 ${cy - cutR}`;
  }

  path += ` L 0 ${tl}`;
  path += buildCornerPathSegment('tl', tl, cornerStyle, w, h);
  path += ' Z';
  return path;
}

function tagPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  // Classic gift-tag shape: pointed top, rounded bottom corners
  const pointH = p.cutSize ?? h * 0.2; // height of the pointed top triangle
  const { br, bl } = getCornerRadii(w, h, p, Math.min(w, h) * 0.08);
  const cornerStyle = getCornerStyle(p);
  const midX = w / 2;

  let path = `M ${midX} 0`; // top point
  path += ` L ${w} ${pointH}`; // right slope
  path += ` L ${w} ${h - br}`; // right side down
  path += buildCornerPathSegment('br', br, cornerStyle, w, h);
  path += ` L ${bl} ${h}`; // bottom edge
  path += buildCornerPathSegment('bl', bl, cornerStyle, w, h);
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
  const cr = getCornerRadii(w, h, p, 0);
  const cornerStyle = getCornerStyle(p);
  const rtl = tl ? 0 : cr.tl;
  const rtr = tr ? 0 : cr.tr;
  const rbr = br ? 0 : cr.br;
  const rbl = bl ? 0 : cr.bl;

  let path = `M ${tl ? fs : rtl} 0`;
  path += ` L ${tr ? w - fs : w - rtr} 0`;
  if (tr) {
    path += ` L ${w} ${fs}`;
  } else {
    path += buildCornerPathSegment('tr', rtr, cornerStyle, w, h);
  }

  path += ` L ${br ? w : w} ${br ? h - fs : h - rbr}`;
  if (br) {
    path += ` L ${w - fs} ${h}`;
  } else {
    path += buildCornerPathSegment('br', rbr, cornerStyle, w, h);
  }

  path += ` L ${bl ? fs : rbl} ${h}`;
  if (bl) {
    path += ` L 0 ${h - fs}`;
  } else {
    path += buildCornerPathSegment('bl', rbl, cornerStyle, w, h);
  }

  path += ` L 0 ${tl ? fs : rtl}`;
  if (tl) {
    path += ` L ${fs} 0`;
  } else {
    path += buildCornerPathSegment('tl', rtl, cornerStyle, w, h);
  }

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
  const cr = getCornerRadii(w, h, p, 0);
  const cornerStyle = getCornerStyle(p);
  const rtl = cr.tl;
  const rtr = cr.tr;
  const points: string[] = [];
  points.push(`M ${rtl} 0`);
  points.push(`L ${w - rtr} 0`);
  points.push(buildCornerPathSegment('tr', rtr, cornerStyle, w, h).trim());
  points.push(`L ${w} ${h}`);

  // Roughness controls horizontal fragment density:
  // higher roughness -> more tear points (more碎).
  const rough = clamp(r, 0, 1);
  const baseSteps = Math.max(10, Math.round(w / 18));
  const steps = Math.max(baseSteps, Math.round(baseSteps * (1 + rough * 2.2)));
  const stepW = w / steps;
  // Keep both ends anchored to baseline so side edges connect cleanly.
  for (let i = steps - 1; i >= 1; i--) {
    const x = i * stepW;
    // Tear amplitude controls vertical jaggedness only.
    const tearAmp = wobble(0, amp, rng);
    const y = clamp(h + tearAmp, h - amp, h + amp);
    points.push(`L ${x} ${y}`);
  }
  points.push(`L 0 ${h}`);
  points.push(`L 0 ${rtl}`);
  points.push(buildCornerPathSegment('tl', rtl, cornerStyle, w, h).trim());

  points.push('Z');
  return points.join(' ');
}

function stitchedPath(w: number, h: number, _rng: () => number, _r: number, p: PresetParams): string {
  return roundedRectPath(w, h, p, 12);
}

export function getStitchPath(w: number, h: number, params?: PresetParams): string {
  const inset = params?.stitchInset ?? 8;
  const maxCr = Math.max(0, Math.min((w - inset * 2) / 2, (h - inset * 2) / 2));
  const cr = clamp(params?.stitchCornerRadius ?? 6, 0, maxCr);
  const i = inset;
  return `M ${i + cr} ${i} L ${w - i - cr} ${i} Q ${w - i} ${i} ${w - i} ${i + cr} L ${w - i} ${h - i - cr} Q ${w - i} ${h - i} ${w - i - cr} ${h - i} L ${i + cr} ${h - i} Q ${i} ${h - i} ${i} ${h - i - cr} L ${i} ${i + cr} Q ${i} ${i} ${i + cr} ${i} Z`;
}

function scallopedPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const sr = p.scallopRadius ?? 12;
  const edge = Math.round(p.scallopEdge ?? 0);
  const spacing = Math.max(8, p.scallopGap ?? sr * 2.2);
  const depthBase = Math.max(1, p.scallopDepth ?? sr * 0.7);
  const points: string[] = [];

  const countH = Math.max(2, Math.round(w / spacing));
  const countV = Math.max(2, Math.round(h / spacing));
  const stepH = w / countH;
  const stepV = h / countV;

  if (edge === 1) {
    points.push('M 0 0');
    for (let i = 0; i < countH; i++) {
      const x1 = i * stepH;
      const x2 = (i + 1) * stepH;
      const mid = (x1 + x2) / 2;
      const d = wobble(depthBase, r * 2, rng);
      points.push(`Q ${mid} ${-d} ${x2} 0`);
    }
    points.push(`L ${w} ${h} L 0 ${h} Z`);
    return points.join(' ');
  }

  if (edge === 2) {
    points.push(`M 0 0 L ${w} 0`);
    for (let i = 0; i < countV; i++) {
      const y1 = i * stepV;
      const y2 = (i + 1) * stepV;
      const mid = (y1 + y2) / 2;
      const d = wobble(depthBase, r * 2, rng);
      points.push(`Q ${w + d} ${mid} ${w} ${y2}`);
    }
    points.push(`L 0 ${h} Z`);
    return points.join(' ');
  }

  if (edge === 3) {
    points.push(`M 0 0 L ${w} 0 L ${w} ${h}`);
    for (let i = countH; i > 0; i--) {
      const x1 = i * stepH;
      const x2 = (i - 1) * stepH;
      const mid = (x1 + x2) / 2;
      const d = wobble(depthBase, r * 2, rng);
      points.push(`Q ${mid} ${h + d} ${x2} ${h}`);
    }
    points.push('Z');
    return points.join(' ');
  }

  if (edge === 4) {
    points.push(`M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h}`);
    for (let i = countV; i > 0; i--) {
      const y1 = i * stepV;
      const y2 = (i - 1) * stepV;
      const mid = (y1 + y2) / 2;
      const d = wobble(depthBase, r * 2, rng);
      points.push(`Q ${-d} ${mid} 0 ${y2}`);
    }
    points.push('Z');
    return points.join(' ');
  }

  points.push(`M 0 0`);

  for (let i = 0; i < countH; i++) {
    const x1 = i * stepH;
    const x2 = (i + 1) * stepH;
    const mid = (x1 + x2) / 2;
    const d = wobble(depthBase, r * 2, rng);
    points.push(`Q ${mid} ${-d} ${x2} 0`);
  }

  for (let i = 0; i < countV; i++) {
    const y1 = i * stepV;
    const y2 = (i + 1) * stepV;
    const mid = (y1 + y2) / 2;
    const d = wobble(depthBase, r * 2, rng);
    points.push(`Q ${w + d} ${mid} ${w} ${y2}`);
  }

  for (let i = countH; i > 0; i--) {
    const x1 = i * stepH;
    const x2 = (i - 1) * stepH;
    const mid = (x1 + x2) / 2;
    const d = wobble(depthBase, r * 2, rng);
    points.push(`Q ${mid} ${h + d} ${x2} ${h}`);
  }

  for (let i = countV; i > 0; i--) {
    const y1 = i * stepV;
    const y2 = (i - 1) * stepV;
    const mid = (y1 + y2) / 2;
    const d = wobble(depthBase, r * 2, rng);
    points.push(`Q ${-d} ${mid} 0 ${y2}`);
  }

  points.push('Z');
  return points.join(' ');
}

function receiptPath(w: number, h: number, rng: () => number, r: number, p: PresetParams): string {
  const zigH = p.zigzagHeight ?? 8;
  const zigSize = clamp(p.zigzagSize ?? 12, 6, 40);
  const edge = Math.round(p.zigzagEdge ?? 0);
  const { tl, tr, br, bl } = getCornerRadii(w, h, p, 0);
  const cornerStyle = getCornerStyle(p);
  let rtl = tl;
  let rtr = tr;
  let rbr = br;
  let rbl = bl;

  // Zigzag edge endpoints stay sharp (no rounded/concave/bevel corners).
  if (edge === 1) { // top
    rtl = 0;
    rtr = 0;
  } else if (edge === 2) { // left
    rtl = 0;
    rbl = 0;
  } else if (edge === 3) { // right
    rtr = 0;
    rbr = 0;
  } else { // bottom (default)
    rbr = 0;
    rbl = 0;
  }

  const topSpan = Math.max(0, w - rtl - rtr);
  const bottomSpan = Math.max(0, w - rbl - rbr);
  const leftSpan = Math.max(0, h - rtl - rbl);
  const rightSpan = Math.max(0, h - rtr - rbr);

  const topSteps = Math.max(3, Math.round(Math.max(1, topSpan) / zigSize));
  const bottomSteps = Math.max(3, Math.round(Math.max(1, bottomSpan) / zigSize));
  const leftSteps = Math.max(3, Math.round(Math.max(1, leftSpan) / zigSize));
  const rightSteps = Math.max(3, Math.round(Math.max(1, rightSpan) / zigSize));

  // zigzag on top edge
  if (edge === 1) {
    let path = `M ${rtl} 0`;
    if (topSpan > 0.001) {
      const step = topSpan / topSteps;
      for (let i = 1; i < topSteps; i++) {
        const x = rtl + i * step;
        const peak = i % 2 === 0 ? 0 : -zigH;
        path += ` L ${x} ${wobble(peak, r * 3, rng)}`;
      }
    }
    path += ` L ${w - rtr} 0`;
    path += buildCornerPathSegment('tr', rtr, cornerStyle, w, h);
    path += ` L ${w} ${h - rbr}`;
    path += buildCornerPathSegment('br', rbr, cornerStyle, w, h);
    path += ` L ${rbl} ${h}`;
    path += buildCornerPathSegment('bl', rbl, cornerStyle, w, h);
    path += ` L 0 ${rtl}`;
    path += buildCornerPathSegment('tl', rtl, cornerStyle, w, h);
    path += ' Z';
    return path;
  }

  // zigzag on left edge
  if (edge === 2) {
    let path = `M ${rtl} 0`;
    path += ` L ${w - rtr} 0`;
    path += buildCornerPathSegment('tr', rtr, cornerStyle, w, h);
    path += ` L ${w} ${h - rbr}`;
    path += buildCornerPathSegment('br', rbr, cornerStyle, w, h);
    path += ` L ${rbl} ${h}`;
    path += buildCornerPathSegment('bl', rbl, cornerStyle, w, h);
    if (leftSpan > 0.001) {
      const step = leftSpan / leftSteps;
      for (let i = 1; i < leftSteps; i++) {
        const y = h - rbl - i * step;
        const peak = i % 2 === 0 ? 0 : -zigH;
        path += ` L ${wobble(peak, r * 3, rng)} ${y}`;
      }
    }
    path += ` L 0 ${rtl}`;
    path += buildCornerPathSegment('tl', rtl, cornerStyle, w, h);
    path += ' Z';
    return path;
  }

  // zigzag on right edge
  if (edge === 3) {
    let path = `M ${rtl} 0`;
    path += ` L ${w - rtr} 0`;
    path += buildCornerPathSegment('tr', rtr, cornerStyle, w, h);
    if (rightSpan > 0.001) {
      const step = rightSpan / rightSteps;
      for (let i = 1; i < rightSteps; i++) {
        const y = rtr + i * step;
        const peak = i % 2 === 0 ? w : w + zigH;
        path += ` L ${wobble(peak, r * 3, rng)} ${y}`;
      }
    }
    path += ` L ${w} ${h - rbr}`;
    path += buildCornerPathSegment('br', rbr, cornerStyle, w, h);
    path += ` L ${rbl} ${h}`;
    path += buildCornerPathSegment('bl', rbl, cornerStyle, w, h);
    path += ` L 0 ${rtl}`;
    path += buildCornerPathSegment('tl', rtl, cornerStyle, w, h);
    path += ' Z';
    return path;
  }

  // default: zigzag on bottom edge
  let path = `M ${rtl} 0`;
  path += ` L ${w - rtr} 0`;
  path += buildCornerPathSegment('tr', rtr, cornerStyle, w, h);
  path += ` L ${w} ${h - rbr}`;
  path += buildCornerPathSegment('br', rbr, cornerStyle, w, h);
  if (bottomSpan > 0.001) {
    const step = bottomSpan / bottomSteps;
    for (let i = 1; i < bottomSteps; i++) {
      const x = w - rbr - i * step;
      const peak = i % 2 === 0 ? h : h + zigH;
      path += ` L ${x} ${wobble(peak, r * 3, rng)}`;
    }
  }
  path += ` L ${rbl} ${h}`;
  path += buildCornerPathSegment('bl', rbl, cornerStyle, w, h);
  path += ` L 0 ${rtl}`;
  path += buildCornerPathSegment('tl', rtl, cornerStyle, w, h);
  path += ' Z';
  return path;
}

function roundedRectPath(w: number, h: number, p: PresetParams, defaultCornerRadius: number): string {
  const { tl, tr, br, bl } = getCornerRadii(w, h, p, defaultCornerRadius);
  const cornerStyle = getCornerStyle(p);
  let path = `M ${tl} 0`;
  path += ` L ${w - tr} 0`;
  path += buildCornerPathSegment('tr', tr, cornerStyle, w, h);
  path += ` L ${w} ${h - br}`;
  path += buildCornerPathSegment('br', br, cornerStyle, w, h);
  path += ` L ${bl} ${h}`;
  path += buildCornerPathSegment('bl', bl, cornerStyle, w, h);
  path += ` L 0 ${tl}`;
  path += buildCornerPathSegment('tl', tl, cornerStyle, w, h);
  path += ' Z';
  return path;
}

function basicPaperPath(w: number, h: number, _rng: () => number, _r: number, p: PresetParams): string {
  return roundedRectPath(w, h, p, 6);
}

// Generate dash pattern for stitch lines
export function generateStitchDashes(pathLength: number, dashLen: number = 8, gapLen: number = 6): string {
  return `${dashLen} ${gapLen}`;
}

/** Default preset params with labels for UI */
export const presetParamsDefs: Record<PaperPreset, { key: keyof PresetParams; label: string; min: number; max: number; step: number; defaultVal: (w: number, h: number) => number }[]> = {
  stamp: [
    { key: 'perforationRadius', label: '齿孔大小', min: 2, max: 20, step: 0.5, defaultVal: (w, h) => Math.min(w, h) * 0.04 },
    { key: 'stampArcDirection', label: '齿边方向(0朝内/1朝外)', min: 0, max: 1, step: 1, defaultVal: () => 1 },
  ],
  coupon: [
    // 上下边缘缺口
    { key: 'notchRadius', label: '上下边缘缺口半径', min: 3, max: 25, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.06 },
    { key: 'couponNotchOffsetX', label: '上下边缘缺口横向偏移', min: -120, max: 120, step: 1, defaultVal: () => 0 },
    // 侧边孔
    { key: 'holeRadius', label: '侧边孔半径', min: 5, max: 40, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.1 },
    { key: 'couponHoleCount', label: '侧边孔数量', min: 1, max: 5, step: 1, defaultVal: () => 1 },
    { key: 'couponHoleSpread', label: '侧边孔分布范围', min: 0.3, max: 1, step: 0.05, defaultVal: () => 0.68 },
    { key: 'couponHoleOffsetY', label: '侧边孔纵向偏移', min: -80, max: 80, step: 1, defaultVal: () => 0 },
    // 中间打孔线
    { key: 'perforationMode', label: '中间打孔模式(0虚线/1圆孔)', min: 0, max: 1, step: 1, defaultVal: () => 0 },
    { key: 'perforationGap', label: '中间打孔间距', min: 4, max: 24, step: 1, defaultVal: () => 10 },
    { key: 'perforationDotRadius', label: '中间打孔点半径', min: 0.8, max: 4, step: 0.1, defaultVal: () => 1.6 },
    { key: 'perforationInset', label: '中间打孔端点内缩', min: 2, max: 30, step: 1, defaultVal: () => 7 },
    { key: 'perforationOffset', label: '中间打孔线横向偏移(边缘微调)', min: -60, max: 60, step: 1, defaultVal: () => 0 },
  ],
  ticket: [
    { key: 'cutRadius', label: '切口半径', min: 5, max: 35, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.11 },
    { key: 'cornerRadius', label: '圆角', min: 0, max: 30, step: 1, defaultVal: () => 10 },
    { key: 'ticketStubWidth', label: '票根宽度', min: 20, max: 120, step: 1, defaultVal: (w, h) => Math.min(w, h) * 0.2 },
    { key: 'ticketCutCount', label: '侧边切口数量', min: 1, max: 5, step: 1, defaultVal: () => 1 },
    { key: 'ticketCutSpread', label: '切口分布范围', min: 0.3, max: 1, step: 0.05, defaultVal: () => 0.68 },
    { key: 'ticketCutOffsetY', label: '切口纵向偏移', min: -80, max: 80, step: 1, defaultVal: (_w, h) => -Math.min(14, h * 0.08) },
    { key: 'perforationMode', label: '中间打孔模式(0虚线/1圆孔)', min: 0, max: 1, step: 1, defaultVal: () => 0 },
    { key: 'perforationGap', label: '中间打孔间距', min: 4, max: 24, step: 1, defaultVal: () => 10 },
    { key: 'perforationDotRadius', label: '中间打孔点半径', min: 0.8, max: 4, step: 0.1, defaultVal: () => 1.6 },
    { key: 'perforationInset', label: '中间打孔端点内缩', min: 2, max: 30, step: 1, defaultVal: () => 7 },
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
    { key: 'stitchCornerRadius', label: '缝线圆角', min: 0, max: 24, step: 0.5, defaultVal: () => 6 },
    { key: 'stitchWidth', label: '缝线粗细', min: 0.6, max: 4, step: 0.1, defaultVal: () => 1.2 },
    { key: 'cornerRadius', label: '圆角', min: 0, max: 30, step: 1, defaultVal: () => 12 },
  ],
  'scalloped-edge': [
    { key: 'scallopEdge', label: '花边方向(0四边/1上/2右/3下/4左)', min: 0, max: 4, step: 1, defaultVal: () => 0 },
    { key: 'scallopGap', label: '花边间距', min: 8, max: 80, step: 1, defaultVal: () => 26 },
    { key: 'scallopDepth', label: '花边深度', min: 1, max: 28, step: 0.5, defaultVal: () => 8.4 },
  ],
  receipt: [
    { key: 'zigzagHeight', label: '锯齿高度', min: 2, max: 20, step: 1, defaultVal: () => 8 },
    { key: 'zigzagSize', label: '锯齿尺寸', min: 6, max: 32, step: 1, defaultVal: () => 12 },
    { key: 'zigzagEdge', label: '锯齿方向(0下/1上/2左/3右)', min: 0, max: 3, step: 1, defaultVal: () => 0 },
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
