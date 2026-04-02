import type { DecorationItem } from './decorations';
import { getDecorationBaseSize } from './decorations';
import type { PaperPreset, PresetParams } from './geometry';
import type { PatternParams } from './paperShapeTypes';
import { clampNum, edgeBiasedSplit } from './paperShapeUtils';

export interface ResolvedPatternConfig {
  patternColor: string;
  patternOpacity: number;
  lineWidth: number;
  lineGap: number;
  gridWidth: number;
  gridGap: number;
  dotSize: number;
  dotGap: number;
  diagonalWidth: number;
  diagonalGap: number;
  waveWidth: number;
  waveGap: number;
  waveAmplitude: number;
}

export interface PerforationGuide {
  axis: 'vertical' | 'horizontal';
  mode: number;
  gap: number;
  dotRadius: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PerforationDot {
  x: number;
  y: number;
  r: number;
}

export type CutoutMaskShape =
  | { kind: 'polygon'; points: string }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number; ry: number };

export interface SafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type CutoutEdge = 'top' | 'right' | 'bottom' | 'left';

const CUTOUT_EDGE_PARAM_KEYS: Record<
  CutoutEdge,
  {
    radius: keyof PresetParams;
    depth: keyof PresetParams;
    offset: keyof PresetParams;
    shape: keyof PresetParams;
  }
> = {
  top: {
    radius: 'cutoutRadiusTop',
    depth: 'cutoutDepthTop',
    offset: 'cutoutOffsetTop',
    shape: 'cutoutShapeTop',
  },
  right: {
    radius: 'cutoutRadiusRight',
    depth: 'cutoutDepthRight',
    offset: 'cutoutOffsetRight',
    shape: 'cutoutShapeRight',
  },
  bottom: {
    radius: 'cutoutRadiusBottom',
    depth: 'cutoutDepthBottom',
    offset: 'cutoutOffsetBottom',
    shape: 'cutoutShapeBottom',
  },
  left: {
    radius: 'cutoutRadiusLeft',
    depth: 'cutoutDepthLeft',
    offset: 'cutoutOffsetLeft',
    shape: 'cutoutShapeLeft',
  },
};

function readCutoutEdgeNumber(
  params: PresetParams | undefined,
  edge: CutoutEdge,
  kind: 'radius' | 'depth' | 'offset',
  fallback: number
): number {
  const key = CUTOUT_EDGE_PARAM_KEYS[edge][kind];
  const localRaw = params?.[key];
  return typeof localRaw === 'number' && Number.isFinite(localRaw) ? localRaw : fallback;
}

function readCutoutEdgeShape(
  params: PresetParams | undefined,
  edge: CutoutEdge,
  fallback: number
): number {
  const key = CUTOUT_EDGE_PARAM_KEYS[edge].shape;
  const localRaw = params?.[key];
  const raw = typeof localRaw === 'number' && Number.isFinite(localRaw) ? localRaw : fallback;
  return Math.max(0, Math.min(2, Math.round(raw)));
}

export function resolvePatternConfig(patternParams?: PatternParams): ResolvedPatternConfig {
  return {
    patternColor: patternParams?.patternColor || 'hsl(25, 12%, 62%)',
    patternOpacity: Math.max(0.08, Math.min(1, patternParams?.patternOpacity ?? 0.42)),
    lineWidth: Math.max(0.2, patternParams?.lineWidth ?? 0.5),
    lineGap: Math.max(8, patternParams?.lineGap ?? 20),
    gridWidth: Math.max(0.2, patternParams?.gridWidth ?? 0.4),
    gridGap: Math.max(8, patternParams?.gridGap ?? 20),
    dotSize: Math.max(0.4, patternParams?.dotSize ?? 1),
    dotGap: Math.max(6, patternParams?.dotGap ?? 16),
    diagonalWidth: Math.max(0.2, patternParams?.diagonalWidth ?? 0.5),
    diagonalGap: Math.max(8, patternParams?.diagonalGap ?? 18),
    waveWidth: Math.max(0.2, patternParams?.waveWidth ?? 0.5),
    waveGap: Math.max(12, patternParams?.waveGap ?? 24),
    waveAmplitude: Math.max(1, patternParams?.waveAmplitude ?? 3),
  };
}

export function resolvePerforationGuide(
  preset: PaperPreset,
  presetParams: PresetParams | undefined,
  width: number,
  height: number
): PerforationGuide | null {
  const gap = Math.max(2, presetParams?.perforationGap ?? 10);
  const inset = Math.max(0, presetParams?.perforationInset ?? 7);
  const dotRadius = Math.max(0.5, presetParams?.perforationDotRadius ?? 1.6);
  const mode = Math.round(presetParams?.perforationMode ?? 0);

  if (preset === 'coupon') {
    const notchR = presetParams?.notchRadius ?? Math.min(width, height) * 0.06;
    const notchOffset = presetParams?.couponPosition ?? presetParams?.couponNotchOffsetX ?? 0;
    const x = edgeBiasedSplit(width, presetParams?.perforationOffset ?? notchOffset, 0.2);
    const y1 = notchR + inset;
    const y2 = height - notchR - inset;
    if (y2 <= y1) return null;
    return {
      axis: 'vertical',
      mode,
      gap,
      dotRadius,
      x1: x,
      y1,
      x2: x,
      y2,
    };
  }

  if (preset === 'ticket') {
    const cutR = presetParams?.cutRadius ?? Math.min(width, height) * 0.11;
    const cutOffsetY = presetParams?.ticketCutOffsetY ?? -Math.min(14, height * 0.08);
    const y = Math.max(
      cutR + inset + 2,
      Math.min(height - cutR - inset - 2, height / 2 + cutOffsetY)
    );
    const x1 = cutR + inset;
    const x2 = width - cutR - inset;
    if (x2 <= x1) return null;
    return {
      axis: 'horizontal',
      mode,
      gap,
      dotRadius,
      x1,
      y1: y,
      x2,
      y2: y,
    };
  }

  return null;
}

export function resolvePerforationDots(perforationGuide: PerforationGuide | null): PerforationDot[] {
  if (!perforationGuide || perforationGuide.mode !== 1) return [];
  const length = perforationGuide.axis === 'vertical'
    ? Math.abs(perforationGuide.y2 - perforationGuide.y1)
    : Math.abs(perforationGuide.x2 - perforationGuide.x1);
  const steps = Math.max(1, Math.floor(length / perforationGuide.gap));
  const points: PerforationDot[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: perforationGuide.x1 + (perforationGuide.x2 - perforationGuide.x1) * t,
      y: perforationGuide.y1 + (perforationGuide.y2 - perforationGuide.y1) * t,
      r: perforationGuide.dotRadius,
    });
  }
  return points;
}

export function resolveCutoutMaskShapes(
  presetParams: PresetParams | undefined,
  strokeWidth: number,
  width: number,
  height: number
): CutoutMaskShape[] {
  const edgeMask = Math.max(0, Math.round(presetParams?.cutoutEdges ?? 0));
  if (edgeMask === 0) return [];

  const clampN = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const maxCutR = Math.min(width, height) * 0.24;
  const globalCutR = Math.max(3, Math.min(maxCutR, presetParams?.cutoutRadius ?? Math.min(width, height) * 0.07));
  const maxCutDepth = Math.min(width, height) * 0.3;
  const globalCutDepth = Math.max(1.5, Math.min(maxCutDepth, presetParams?.cutoutDepth ?? globalCutR * 0.85));
  const globalCutOffset = presetParams?.cutoutOffset ?? 0;
  const globalCutShape = Math.max(0, Math.min(2, Math.round(presetParams?.cutoutShape ?? 0)));
  const explicitBleed = typeof presetParams?.cutoutAABleed === 'number'
    ? Math.max(0, Math.min(4, presetParams.cutoutAABleed))
    : undefined;

  const readEdgeWobble = (edge: CutoutEdge) => {
    if (edge === 'top') return Math.max(0, presetParams?.edgeWobbleTop ?? presetParams?.edgeWobble ?? 0);
    if (edge === 'right') return Math.max(0, presetParams?.edgeWobbleRight ?? presetParams?.edgeWobble ?? 0);
    if (edge === 'bottom') return Math.max(0, presetParams?.edgeWobbleBottom ?? presetParams?.edgeWobble ?? 0);
    return Math.max(0, presetParams?.edgeWobbleLeft ?? presetParams?.edgeWobble ?? 0);
  };

  const defaultBleedForShape = (shape: number, edge: CutoutEdge) => {
    const base = shape === 0
      ? Math.max(0.8, strokeWidth * 0.85 + 0.35)
      : Math.max(0.5, strokeWidth * 0.55 + 0.18);
    const wobbleCompensation = Math.min(2.6, readEdgeWobble(edge) * 0.42);
    return base + wobbleCompensation;
  };

  const shapes: CutoutMaskShape[] = [];

  const addTop = () => {
    const cutShape = readCutoutEdgeShape(presetParams, 'top', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'top', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'top', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'top', 'offset', globalCutOffset);
    const bleed = explicitBleed !== undefined
      ? Math.max(explicitBleed, defaultBleedForShape(cutShape, 'top'))
      : defaultBleedForShape(cutShape, 'top');
    const edgeWobble = readEdgeWobble('top');
    const maskR = cutR + bleed;
    const maskDepth = cutDepth + bleed;
    const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
    const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
    const outer = bleed + 0.4 + Math.min(2.2, edgeWobble * 0.35);
    const topCx = clampN(width / 2 + cutOffset, maskR + 2, width - maskR - 2);
    if (cutShape === 1) {
      shapes.push({ kind: 'ellipse', cx: topCx, cy: 0, rx: maskR, ry: maskDepth });
    } else if (cutShape === 2) {
      shapes.push({ kind: 'rect', x: topCx - maskR, y: -outer, width: maskR * 2, height: maskDepth + outer, rx: rr, ry: rr });
    } else {
      const apexX = clampN(topCx + cutSkew, topCx - maskR + 1, topCx + maskR - 1);
      shapes.push({ kind: 'polygon', points: `${topCx - maskR},${-outer} ${topCx + maskR},${-outer} ${apexX},${maskDepth}` });
    }
  };

  const addRight = () => {
    const cutShape = readCutoutEdgeShape(presetParams, 'right', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'right', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'right', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'right', 'offset', globalCutOffset);
    const bleed = explicitBleed !== undefined
      ? Math.max(explicitBleed, defaultBleedForShape(cutShape, 'right'))
      : defaultBleedForShape(cutShape, 'right');
    const edgeWobble = readEdgeWobble('right');
    const maskR = cutR + bleed;
    const maskDepth = cutDepth + bleed;
    const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
    const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
    const outer = bleed + 0.4 + Math.min(2.2, edgeWobble * 0.35);
    const rightCy = clampN(height / 2 + cutOffset, maskR + 2, height - maskR - 2);
    if (cutShape === 1) {
      shapes.push({ kind: 'ellipse', cx: width, cy: rightCy, rx: maskDepth, ry: maskR });
    } else if (cutShape === 2) {
      shapes.push({ kind: 'rect', x: width - maskDepth, y: rightCy - maskR, width: maskDepth + outer, height: maskR * 2, rx: rr, ry: rr });
    } else {
      const apexY = clampN(rightCy + cutSkew, rightCy - maskR + 1, rightCy + maskR - 1);
      shapes.push({ kind: 'polygon', points: `${width + outer},${rightCy - maskR} ${width + outer},${rightCy + maskR} ${width - maskDepth},${apexY}` });
    }
  };

  const addBottom = () => {
    const cutShape = readCutoutEdgeShape(presetParams, 'bottom', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'bottom', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'bottom', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'bottom', 'offset', globalCutOffset);
    const bleed = explicitBleed !== undefined
      ? Math.max(explicitBleed, defaultBleedForShape(cutShape, 'bottom'))
      : defaultBleedForShape(cutShape, 'bottom');
    const edgeWobble = readEdgeWobble('bottom');
    const maskR = cutR + bleed;
    const maskDepth = cutDepth + bleed;
    const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
    const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
    const outer = bleed + 0.4 + Math.min(2.2, edgeWobble * 0.35);
    const bottomCx = clampN(width / 2 + cutOffset, maskR + 2, width - maskR - 2);
    if (cutShape === 1) {
      shapes.push({ kind: 'ellipse', cx: bottomCx, cy: height, rx: maskR, ry: maskDepth });
    } else if (cutShape === 2) {
      shapes.push({ kind: 'rect', x: bottomCx - maskR, y: height - maskDepth, width: maskR * 2, height: maskDepth + outer, rx: rr, ry: rr });
    } else {
      const apexX = clampN(bottomCx - cutSkew, bottomCx - maskR + 1, bottomCx + maskR - 1);
      shapes.push({ kind: 'polygon', points: `${bottomCx + maskR},${height + outer} ${bottomCx - maskR},${height + outer} ${apexX},${height - maskDepth}` });
    }
  };

  const addLeft = () => {
    const cutShape = readCutoutEdgeShape(presetParams, 'left', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'left', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'left', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'left', 'offset', globalCutOffset);
    const bleed = explicitBleed !== undefined
      ? Math.max(explicitBleed, defaultBleedForShape(cutShape, 'left'))
      : defaultBleedForShape(cutShape, 'left');
    const edgeWobble = readEdgeWobble('left');
    const maskR = cutR + bleed;
    const maskDepth = cutDepth + bleed;
    const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
    const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
    const outer = bleed + 0.4 + Math.min(2.2, edgeWobble * 0.35);
    const leftCy = clampN(height / 2 + cutOffset, maskR + 2, height - maskR - 2);
    if (cutShape === 1) {
      shapes.push({ kind: 'ellipse', cx: 0, cy: leftCy, rx: maskDepth, ry: maskR });
    } else if (cutShape === 2) {
      shapes.push({ kind: 'rect', x: -outer, y: leftCy - maskR, width: maskDepth + outer, height: maskR * 2, rx: rr, ry: rr });
    } else {
      const apexY = clampN(leftCy - cutSkew, leftCy - maskR + 1, leftCy + maskR - 1);
      shapes.push({ kind: 'polygon', points: `${-outer},${leftCy + maskR} ${-outer},${leftCy - maskR} ${maskDepth},${apexY}` });
    }
  };

  if (edgeMask & 1) addTop();
  if (edgeMask & 2) addRight();
  if (edgeMask & 4) addBottom();
  if (edgeMask & 8) addLeft();
  return shapes;
}

export function resolveCutoutStrokePaths(
  presetParams: PresetParams | undefined,
  width: number,
  height: number
): string[] {
  const edgeMask = Math.max(0, Math.round(presetParams?.cutoutEdges ?? 0));
  if (edgeMask === 0) return [];

  const clampN = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const maxCutR = Math.min(width, height) * 0.24;
  const globalCutR = Math.max(3, Math.min(maxCutR, presetParams?.cutoutRadius ?? Math.min(width, height) * 0.07));
  const maxCutDepth = Math.min(width, height) * 0.3;
  const globalCutDepth = Math.max(1.5, Math.min(maxCutDepth, presetParams?.cutoutDepth ?? globalCutR * 0.85));
  const globalCutOffset = presetParams?.cutoutOffset ?? 0;
  const globalCutShape = Math.max(0, Math.min(2, Math.round(presetParams?.cutoutShape ?? 0)));
  const paths: string[] = [];

  if (edgeMask & 1) {
    const cutShape = readCutoutEdgeShape(presetParams, 'top', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'top', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'top', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'top', 'offset', globalCutOffset);
    const cutSkew = clampN(cutR * 0.42, 1, cutR * 0.78);
    const rr = clampN(Math.min(cutR * 0.45, cutDepth * 0.55), 0.8, Math.min(cutR - 0.4, cutDepth - 0.4));
    const topCx = clampN(width / 2 + cutOffset, cutR + 2, width - cutR - 2);
    if (cutShape === 1) {
      paths.push(`M ${topCx - cutR} 0 A ${cutR} ${cutDepth} 0 0 0 ${topCx + cutR} 0`);
    } else if (cutShape === 2) {
      paths.push(
        `M ${topCx - cutR} 0 L ${topCx - cutR} ${cutDepth - rr} `
        + `Q ${topCx - cutR} ${cutDepth} ${topCx - cutR + rr} ${cutDepth} `
        + `L ${topCx + cutR - rr} ${cutDepth} `
        + `Q ${topCx + cutR} ${cutDepth} ${topCx + cutR} ${cutDepth - rr} `
        + `L ${topCx + cutR} 0`
      );
    } else {
      const apexX = clampN(topCx + cutSkew, topCx - cutR + 1, topCx + cutR - 1);
      paths.push(`M ${topCx - cutR} 0 L ${apexX} ${cutDepth} L ${topCx + cutR} 0`);
    }
  }

  if (edgeMask & 2) {
    const cutShape = readCutoutEdgeShape(presetParams, 'right', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'right', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'right', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'right', 'offset', globalCutOffset);
    const cutSkew = clampN(cutR * 0.42, 1, cutR * 0.78);
    const rr = clampN(Math.min(cutR * 0.45, cutDepth * 0.55), 0.8, Math.min(cutR - 0.4, cutDepth - 0.4));
    const rightCy = clampN(height / 2 + cutOffset, cutR + 2, height - cutR - 2);
    if (cutShape === 1) {
      paths.push(`M ${width} ${rightCy - cutR} A ${cutDepth} ${cutR} 0 0 0 ${width} ${rightCy + cutR}`);
    } else if (cutShape === 2) {
      paths.push(
        `M ${width} ${rightCy - cutR} L ${width - cutDepth + rr} ${rightCy - cutR} `
        + `Q ${width - cutDepth} ${rightCy - cutR} ${width - cutDepth} ${rightCy - cutR + rr} `
        + `L ${width - cutDepth} ${rightCy + cutR - rr} `
        + `Q ${width - cutDepth} ${rightCy + cutR} ${width - cutDepth + rr} ${rightCy + cutR} `
        + `L ${width} ${rightCy + cutR}`
      );
    } else {
      const apexY = clampN(rightCy + cutSkew, rightCy - cutR + 1, rightCy + cutR - 1);
      paths.push(`M ${width} ${rightCy - cutR} L ${width - cutDepth} ${apexY} L ${width} ${rightCy + cutR}`);
    }
  }

  if (edgeMask & 4) {
    const cutShape = readCutoutEdgeShape(presetParams, 'bottom', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'bottom', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'bottom', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'bottom', 'offset', globalCutOffset);
    const cutSkew = clampN(cutR * 0.42, 1, cutR * 0.78);
    const rr = clampN(Math.min(cutR * 0.45, cutDepth * 0.55), 0.8, Math.min(cutR - 0.4, cutDepth - 0.4));
    const bottomCx = clampN(width / 2 + cutOffset, cutR + 2, width - cutR - 2);
    if (cutShape === 1) {
      paths.push(`M ${bottomCx + cutR} ${height} A ${cutR} ${cutDepth} 0 0 0 ${bottomCx - cutR} ${height}`);
    } else if (cutShape === 2) {
      paths.push(
        `M ${bottomCx + cutR} ${height} L ${bottomCx + cutR} ${height - cutDepth + rr} `
        + `Q ${bottomCx + cutR} ${height - cutDepth} ${bottomCx + cutR - rr} ${height - cutDepth} `
        + `L ${bottomCx - cutR + rr} ${height - cutDepth} `
        + `Q ${bottomCx - cutR} ${height - cutDepth} ${bottomCx - cutR} ${height - cutDepth + rr} `
        + `L ${bottomCx - cutR} ${height}`
      );
    } else {
      const apexX = clampN(bottomCx - cutSkew, bottomCx - cutR + 1, bottomCx + cutR - 1);
      paths.push(`M ${bottomCx + cutR} ${height} L ${apexX} ${height - cutDepth} L ${bottomCx - cutR} ${height}`);
    }
  }

  if (edgeMask & 8) {
    const cutShape = readCutoutEdgeShape(presetParams, 'left', globalCutShape);
    const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'left', 'radius', globalCutR)));
    const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'left', 'depth', globalCutDepth)));
    const cutOffset = readCutoutEdgeNumber(presetParams, 'left', 'offset', globalCutOffset);
    const cutSkew = clampN(cutR * 0.42, 1, cutR * 0.78);
    const rr = clampN(Math.min(cutR * 0.45, cutDepth * 0.55), 0.8, Math.min(cutR - 0.4, cutDepth - 0.4));
    const leftCy = clampN(height / 2 + cutOffset, cutR + 2, height - cutR - 2);
    if (cutShape === 1) {
      paths.push(`M 0 ${leftCy + cutR} A ${cutDepth} ${cutR} 0 0 0 0 ${leftCy - cutR}`);
    } else if (cutShape === 2) {
      paths.push(
        `M 0 ${leftCy + cutR} L ${cutDepth - rr} ${leftCy + cutR} `
        + `Q ${cutDepth} ${leftCy + cutR} ${cutDepth} ${leftCy + cutR - rr} `
        + `L ${cutDepth} ${leftCy - cutR + rr} `
        + `Q ${cutDepth} ${leftCy - cutR} ${cutDepth - rr} ${leftCy - cutR} `
        + `L 0 ${leftCy - cutR}`
      );
    } else {
      const apexY = clampN(leftCy - cutSkew, leftCy - cutR + 1, leftCy + cutR - 1);
      paths.push(`M 0 ${leftCy + cutR} L ${cutDepth} ${apexY} L 0 ${leftCy - cutR}`);
    }
  }

  return paths;
}

export function resolveContentSafeInsets(
  preset: PaperPreset,
  presetParams: PresetParams | undefined,
  perforationGuide: PerforationGuide | null,
  width: number,
  height: number
): SafeInsets {
  const insets: SafeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

  const reserveBandOnLargerSide = (axis: 'vertical' | 'horizontal', pos: number, halfBand: number) => {
    if (axis === 'vertical') {
      const clampedX = Math.max(0, Math.min(width, pos));
      const leftSpan = Math.max(0, clampedX - halfBand);
      const rightSpan = Math.max(0, width - (clampedX + halfBand));
      if (Math.max(leftSpan, rightSpan) < 96) return;
      if (leftSpan >= rightSpan) {
        insets.right = Math.max(insets.right, width - (clampedX - halfBand));
      } else {
        insets.left = Math.max(insets.left, clampedX + halfBand);
      }
      return;
    }

    const clampedY = Math.max(0, Math.min(height, pos));
    const topSpan = Math.max(0, clampedY - halfBand);
    const bottomSpan = Math.max(0, height - (clampedY + halfBand));
    if (Math.max(topSpan, bottomSpan) < 72) return;
    if (topSpan >= bottomSpan) {
      insets.bottom = Math.max(insets.bottom, height - (clampedY - halfBand));
    } else {
      insets.top = Math.max(insets.top, clampedY + halfBand);
    }
  };

  if (preset === 'coupon') {
    const holeR = Math.max(4, presetParams?.holeRadius ?? Math.min(width, height) * 0.1);
    const notchR = Math.max(3, presetParams?.notchRadius ?? Math.min(width, height) * 0.06);
    const direction = Math.round(presetParams?.couponDirection ?? 0);
    const edgeSafe = Math.max(8, holeR + 4);
    const notchSafe = Math.max(8, notchR + 4);

    if (direction === 1) {
      insets.top = Math.max(insets.top, edgeSafe);
      insets.bottom = Math.max(insets.bottom, edgeSafe);
      insets.left = Math.max(insets.left, notchSafe);
      insets.right = Math.max(insets.right, notchSafe);
    } else {
      insets.left = Math.max(insets.left, edgeSafe);
      insets.right = Math.max(insets.right, edgeSafe);
      insets.top = Math.max(insets.top, notchSafe);
      insets.bottom = Math.max(insets.bottom, notchSafe);
    }
  }

  if (preset === 'ticket') {
    const cutR = Math.max(4, presetParams?.cutRadius ?? Math.min(width, height) * 0.11);
    const edgeSafe = Math.max(8, cutR + 4);
    insets.left = Math.max(insets.left, edgeSafe);
    insets.right = Math.max(insets.right, edgeSafe);
  }

  if (preset === 'stamp') {
    const perfR = clampNum(
      presetParams?.perforationRadius ?? Math.min(width, height) * 0.04,
      2,
      Math.min(width, height) * 0.2
    );
    const inward = Math.round(presetParams?.stampArcDirection ?? 1) === 0;
    const edgeSafe = inward
      ? Math.max(9, perfR * 1.45 + 2.5)
      : Math.max(6.5, perfR * 0.95 + 2);
    insets.top = Math.max(insets.top, edgeSafe);
    insets.right = Math.max(insets.right, edgeSafe);
    insets.bottom = Math.max(insets.bottom, edgeSafe);
    insets.left = Math.max(insets.left, edgeSafe);
  }

  if (perforationGuide) {
    const isCenteredCouponPerforation = (
      preset === 'coupon'
      && perforationGuide.axis === 'vertical'
      && Math.abs(perforationGuide.x1 - width / 2) < width * 0.2
    );
    if (!isCenteredCouponPerforation) {
      const halfBand = Math.max(7, perforationGuide.dotRadius * 2.8 + 3);
      if (preset === 'ticket' && perforationGuide.axis === 'horizontal') {
        const y = Math.max(0, Math.min(height, perforationGuide.y1));
        const topRoom = Math.max(0, y - halfBand);
        const bottomRoom = Math.max(0, height - (y + halfBand));
        if (topRoom >= bottomRoom) {
          insets.bottom = Math.max(insets.bottom, height - (y - halfBand));
        } else {
          insets.top = Math.max(insets.top, y + halfBand);
        }
      } else if (perforationGuide.axis === 'vertical') {
        reserveBandOnLargerSide('vertical', perforationGuide.x1, halfBand);
      } else {
        reserveBandOnLargerSide('horizontal', perforationGuide.y1, halfBand);
      }
    }
  }

  const cutoutEdgeMask = Math.max(0, Math.round(presetParams?.cutoutEdges ?? 0));
  if (cutoutEdgeMask > 0) {
    const cutR = Math.max(3, Math.min(Math.min(width, height) * 0.24, presetParams?.cutoutRadius ?? Math.min(width, height) * 0.07));
    const cutDepth = Math.max(1.5, Math.min(Math.min(width, height) * 0.3, presetParams?.cutoutDepth ?? cutR * 0.85));
    const safe = Math.max(4, cutDepth + 4);
    if (cutoutEdgeMask & 1) insets.top = Math.max(insets.top, safe);
    if (cutoutEdgeMask & 2) insets.right = Math.max(insets.right, safe);
    if (cutoutEdgeMask & 4) insets.bottom = Math.max(insets.bottom, safe);
    if (cutoutEdgeMask & 8) insets.left = Math.max(insets.left, safe);
  }

  return insets;
}

export function resolveDecorationPadding(
  decorations: DecorationItem[],
  resolvedCanvasPadding: number,
  width: number,
  height: number
): number {
  const basePadding = resolvedCanvasPadding;
  const bleed = 8;
  let needed = basePadding;
  for (const deco of decorations) {
    const baseSize = getDecorationBaseSize(deco.type);
    const w = baseSize.w * deco.transform.scale;
    const h = baseSize.h * deco.transform.scale;
    const cx = deco.transform.x + w / 2;
    const cy = deco.transform.y + h / 2;
    const rad = (deco.transform.rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const boxW = cos * w + sin * h;
    const boxH = sin * w + cos * h;
    const minX = cx - boxW / 2;
    const maxX = cx + boxW / 2;
    const minY = cy - boxH / 2;
    const maxY = cy + boxH / 2;
    needed = Math.max(
      needed,
      bleed - minX,
      maxX - width + bleed,
      bleed - minY,
      maxY - height + bleed
    );
  }
  return Math.ceil(needed);
}
