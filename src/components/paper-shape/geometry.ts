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

export interface ShapeConfig {
  width: number;
  height: number;
  preset: PaperPreset;
  seed?: number;
  roughness?: number; // 0-1, hand-drawn wobble
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
  const { width: w, height: h, preset, seed = 42, roughness = 0.3 } = config;
  const rng = seededRandom(seed);
  const r = roughness;

  switch (preset) {
    case 'stamp':
      return stampPath(w, h, rng, r);
    case 'coupon':
      return couponPath(w, h, rng, r);
    case 'ticket':
      return ticketPath(w, h, rng, r);
    case 'tag':
      return tagPath(w, h, rng, r);
    case 'folded':
      return foldedPath(w, h, rng, r);
    case 'torn':
      return tornPath(w, h, rng, r);
    case 'stitched':
      return stitchedPath(w, h, rng, r);
    case 'scalloped-edge':
      return scallopedPath(w, h, rng, r);
    case 'receipt':
      return receiptPath(w, h, rng, r);
    case 'basic-paper':
    default:
      return basicPaperPath(w, h, rng, r);
  }
}

function stampPath(w: number, h: number, rng: () => number, r: number): string {
  const margin = Math.min(w, h) * 0.08;
  const perfR = Math.min(w, h) * 0.025; // semicircle perforation radius
  const innerW = w - margin * 2;
  const innerH = h - margin * 2;

  const countH = Math.max(6, Math.round(innerW / (perfR * 3.2)));
  const countV = Math.max(4, Math.round(innerH / (perfR * 3.2)));

  const stepH = innerW / countH;
  const stepV = innerH / countV;

  let path = `M ${margin} ${margin}`;

  // Top edge - semicircular perforations (left to right)
  for (let i = 0; i < countH; i++) {
    const x1 = margin + i * stepH;
    const x2 = x1 + stepH;
    const mid = (x1 + x2) / 2;
    const pr = wobble(perfR, r * 1.5, rng);
    // line to start of arc, then semicircle outward (upward)
    path += ` L ${mid - pr} ${margin}`;
    path += ` A ${pr} ${pr} 0 0 1 ${mid + pr} ${margin}`;
  }
  path += ` L ${w - margin} ${margin}`;

  // Right edge - semicircular perforations (top to bottom)
  for (let i = 0; i < countV; i++) {
    const y1 = margin + i * stepV;
    const y2 = y1 + stepV;
    const mid = (y1 + y2) / 2;
    const pr = wobble(perfR, r * 1.5, rng);
    path += ` L ${w - margin} ${mid - pr}`;
    path += ` A ${pr} ${pr} 0 0 1 ${w - margin} ${mid + pr}`;
  }
  path += ` L ${w - margin} ${h - margin}`;

  // Bottom edge - semicircular perforations (right to left)
  for (let i = countH - 1; i >= 0; i--) {
    const x1 = margin + i * stepH;
    const x2 = x1 + stepH;
    const mid = (x1 + x2) / 2;
    const pr = wobble(perfR, r * 1.5, rng);
    path += ` L ${mid + pr} ${h - margin}`;
    path += ` A ${pr} ${pr} 0 0 1 ${mid - pr} ${h - margin}`;
  }
  path += ` L ${margin} ${h - margin}`;

  // Left edge - semicircular perforations (bottom to top)
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

function couponPath(w: number, h: number, rng: () => number, r: number): string {
  const holeR = Math.min(w, h) * 0.1;
  const notchR = Math.min(w, h) * 0.06;
  const cr = 14;

  let path = `M ${cr} 0`;
  // Top edge with center notch (concave inward)
  const topMid = w / 2;
  path += ` L ${topMid - notchR} 0`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${topMid + notchR} 0`;
  path += ` L ${w - cr} 0 Q ${w} 0 ${w} ${cr}`;

  // Right edge with semicircle hole (concave inward)
  const rightHoleY = h / 2;
  path += ` L ${w} ${rightHoleY - holeR}`;
  path += ` A ${holeR} ${holeR} 0 0 0 ${w} ${rightHoleY + holeR}`;
  path += ` L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h}`;

  // Bottom edge with center notch
  path += ` L ${topMid + notchR} ${h}`;
  path += ` A ${notchR} ${notchR} 0 0 0 ${topMid - notchR} ${h}`;
  path += ` L ${cr} ${h} Q 0 ${h} 0 ${h - cr}`;

  // Left edge with semicircle hole (concave inward)
  const leftHoleY = h / 2;
  path += ` L 0 ${leftHoleY + holeR}`;
  path += ` A ${holeR} ${holeR} 0 0 0 0 ${leftHoleY - holeR}`;
  path += ` L 0 ${cr} Q 0 0 ${cr} 0`;

  path += ' Z';
  return path;
}

function ticketPath(w: number, h: number, rng: () => number, r: number): string {
  const cutR = Math.min(w, h) * 0.09;
  const cr = 8;
  
  let path = `M ${cr} 0 L ${w - cr} 0 Q ${w} 0 ${w} ${cr}`;
  
  // Right edge with cut
  const cutY = h / 2;
  path += ` L ${w} ${cutY - cutR}`;
  path += ` A ${cutR} ${cutR} 0 0 1 ${w} ${cutY + cutR}`;
  path += ` L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h}`;
  
  // Bottom
  path += ` L ${cr} ${h} Q 0 ${h} 0 ${h - cr}`;
  
  // Left edge with cut
  path += ` L 0 ${cutY + cutR}`;
  path += ` A ${cutR} ${cutR} 0 0 1 0 ${cutY - cutR}`;
  path += ` L 0 ${cr} Q 0 0 ${cr} 0`;
  
  path += ' Z';
  return path;
}

function tagPath(w: number, h: number, rng: () => number, r: number): string {
  const cutSize = Math.min(w, h) * 0.15;
  const holeR = Math.min(w, h) * 0.06;
  const holeCx = w - cutSize * 0.6;
  const holeCy = cutSize * 0.6;
  
  let path = `M 0 0 L ${w - cutSize} 0 L ${w} ${cutSize} L ${w} ${h}`;
  path += ` L 0 ${h} Z`;
  
  // Add hole as a separate circle (will be cut out)
  // We'll handle this in the component with a mask
  return path;
}

export function getTagHole(w: number, h: number): { cx: number; cy: number; r: number } {
  const cutSize = Math.min(w, h) * 0.15;
  return {
    cx: w - cutSize * 0.55,
    cy: cutSize * 0.55,
    r: Math.min(w, h) * 0.05,
  };
}

function foldedPath(w: number, h: number, rng: () => number, r: number): string {
  const foldSize = Math.min(w, h) * 0.18;
  
  let path = `M 0 0 L ${w - foldSize} 0 L ${w} ${foldSize} L ${w} ${h} L 0 ${h} Z`;
  return path;
}

export function getFoldTriangle(w: number, h: number): string {
  const foldSize = Math.min(w, h) * 0.18;
  return `M ${w - foldSize} 0 L ${w} ${foldSize} L ${w - foldSize} ${foldSize} Z`;
}

function tornPath(w: number, h: number, rng: () => number, r: number): string {
  const points: string[] = [];
  points.push(`M 0 0 L ${w} 0 L ${w} ${h}`);
  
  // Torn bottom edge (right to left)
  const steps = Math.max(12, Math.round(w / 15));
  const stepW = w / steps;
  for (let i = steps; i >= 0; i--) {
    const x = i * stepW;
    const tearAmp = wobble(6, r * 8, rng);
    const y = h + tearAmp;
    points.push(`L ${x} ${y}`);
  }
  
  points.push('Z');
  return points.join(' ');
}

function stitchedPath(w: number, h: number, _rng: () => number, _r: number): string {
  const cr = 12;
  return `M ${cr} 0 L ${w - cr} 0 Q ${w} 0 ${w} ${cr} L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h} L ${cr} ${h} Q 0 ${h} 0 ${h - cr} L 0 ${cr} Q 0 0 ${cr} 0 Z`;
}

export function getStitchPath(w: number, h: number, inset: number = 8): string {
  const cr = 6;
  const i = inset;
  return `M ${i + cr} ${i} L ${w - i - cr} ${i} Q ${w - i} ${i} ${w - i} ${i + cr} L ${w - i} ${h - i - cr} Q ${w - i} ${h - i} ${w - i - cr} ${h - i} L ${i + cr} ${h - i} Q ${i} ${h - i} ${i} ${h - i - cr} L ${i} ${i + cr} Q ${i} ${i} ${i + cr} ${i} Z`;
}

function scallopedPath(w: number, h: number, rng: () => number, r: number): string {
  const scallopR = 12;
  const points: string[] = [];
  
  // Top edge scallops
  const countH = Math.max(4, Math.round(w / (scallopR * 2.2)));
  const countV = Math.max(3, Math.round(h / (scallopR * 2.2)));
  const stepH = w / countH;
  const stepV = h / countV;
  
  points.push(`M 0 0`);
  
  for (let i = 0; i < countH; i++) {
    const x1 = i * stepH;
    const x2 = (i + 1) * stepH;
    const mid = (x1 + x2) / 2;
    const d = wobble(scallopR * 0.7, r * 2, rng);
    points.push(`Q ${mid} ${-d} ${x2} 0`);
  }
  
  // Right edge
  for (let i = 0; i < countV; i++) {
    const y1 = i * stepV;
    const y2 = (i + 1) * stepV;
    const mid = (y1 + y2) / 2;
    const d = wobble(scallopR * 0.7, r * 2, rng);
    points.push(`Q ${w + d} ${mid} ${w} ${y2}`);
  }
  
  // Bottom (right to left)
  for (let i = countH; i > 0; i--) {
    const x1 = i * stepH;
    const x2 = (i - 1) * stepH;
    const mid = (x1 + x2) / 2;
    const d = wobble(scallopR * 0.7, r * 2, rng);
    points.push(`Q ${mid} ${h + d} ${x2} ${h}`);
  }
  
  // Left edge
  for (let i = countV; i > 0; i--) {
    const y1 = i * stepV;
    const y2 = (i - 1) * stepV;
    const mid = (y1 + y2) / 2;
    const d = wobble(scallopR * 0.7, r * 2, rng);
    points.push(`Q ${-d} ${mid} 0 ${y2}`);
  }
  
  points.push('Z');
  return points.join(' ');
}

function receiptPath(w: number, h: number, rng: () => number, r: number): string {
  // Flat top, zigzag bottom
  const steps = Math.max(8, Math.round(w / 12));
  const stepW = w / steps;
  const zigH = 8;
  
  let path = `M 0 0 L ${w} 0 L ${w} ${h}`;
  
  for (let i = steps; i >= 0; i--) {
    const x = i * stepW;
    const peak = i % 2 === 0 ? h + zigH : h;
    path += ` L ${x} ${wobble(peak, r * 3, rng)}`;
  }
  
  path += ' Z';
  return path;
}

function basicPaperPath(w: number, h: number, rng: () => number, r: number): string {
  const cr = 6;
  // Slightly wobbly rectangle
  const w1 = wobble(0, r * 2, rng);
  const w2 = wobble(0, r * 2, rng);
  return `M ${cr + w1} 0 L ${w - cr + w2} 0 Q ${w} 0 ${w} ${cr} L ${w} ${h - cr} Q ${w} ${h} ${w - cr} ${h} L ${cr} ${h} Q 0 ${h} 0 ${h - cr} L 0 ${cr} Q 0 0 ${cr + w1} 0 Z`;
}

// Generate dash pattern for stitch lines
export function generateStitchDashes(pathLength: number, dashLen: number = 8, gapLen: number = 6): string {
  return `${dashLen} ${gapLen}`;
}

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
