import React, { useMemo, useId, useRef, useCallback, useEffect, useState } from 'react';
import Moveable from 'react-moveable';
import { generatePath, getTagHole, getFoldTriangles, getStitchPath, generateStitchDashes } from './geometry';
import type { PaperPreset, ShapeConfig, PresetParams } from './geometry';
import type { DecorationItem, DecorationTransform } from './decorations';
import { DraggableDecoration } from './DraggableDecoration';
import { cn } from '@/lib/utils';

export type PaperPatternType = 'lines' | 'grid' | 'dots' | 'diagonal' | 'waves' | 'none';

export interface PatternParams {
  patternColor?: string;
  patternOpacity?: number;
  lineWidth?: number;
  lineGap?: number;
  gridWidth?: number;
  gridGap?: number;
  dotSize?: number;
  dotGap?: number;
  diagonalWidth?: number;
  diagonalGap?: number;
  waveWidth?: number;
  waveGap?: number;
  waveAmplitude?: number;
}

export interface PaperShapeProps {
  preset?: PaperPreset;
  width?: number;
  height?: number;
  seed?: number;
  roughness?: number;
  paperColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  showPattern?: boolean;
  patternType?: PaperPatternType;
  patternParams?: PatternParams;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  presetParams?: PresetParams;
  contentPadding?: number;
  decorations?: DecorationItem[];
  onDecorationChange?: (id: string, transform: DecorationTransform) => void;
  onDecorationRemove?: (id: string) => void;
  interactiveDecorations?: boolean;
  contentInteractive?: boolean;
}

const PAPER_COLORS: Record<string, string> = {
  cream: 'hsl(48, 88%, 89%)',
  cloud: 'hsl(52, 72%, 94%)',
  pink: 'hsl(342, 84%, 86%)',
  apricot: 'hsl(28, 90%, 84%)',
  peach: 'hsl(16, 92%, 82%)',
  mint: 'hsl(152, 64%, 84%)',
  sky: 'hsl(204, 86%, 86%)',
  lavender: 'hsl(268, 72%, 87%)',
};

const ACCENT_COLORS = [
  'hsl(12, 60%, 68%)',
  'hsl(160, 30%, 70%)',
  'hsl(210, 45%, 72%)',
  'hsl(270, 30%, 76%)',
  'hsl(30, 65%, 68%)',
];

function clampNum(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

function derivePaperShadowColor(fillColor: string, fallback: string): string {
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

function edgeBiasedSplit(length: number, offsetRaw: number, edgeRatioRaw: number = 0.2): number {
  const edgeRatio = Math.max(0.14, Math.min(0.32, edgeRatioRaw));
  const side = offsetRaw < 0 ? -1 : 1;
  const anchor = side < 0 ? length * edgeRatio : length * (1 - edgeRatio);
  const clampedOffset = Math.max(-length * 0.25, Math.min(length * 0.25, offsetRaw));
  const drift = clampedOffset * 0.35;
  return anchor + drift;
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

export const PaperShape: React.FC<PaperShapeProps> = ({
  preset = 'basic-paper',
  width = 240,
  height = 180,
  seed = 42,
  roughness = 0.3,
  paperColor,
  strokeColor,
  strokeWidth = 1.8,
  showPattern = false,
  patternType = 'none',
  patternParams,
  className,
  children,
  style,
  onClick,
  presetParams,
  contentPadding = 12,
  decorations = [],
  onDecorationChange,
  onDecorationRemove,
  interactiveDecorations = false,
  contentInteractive = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const clipId = `clip-${uid}`;
  const patternId = `pat-${uid}`;
  const maskId = `mask-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);

  const config: ShapeConfig = useMemo(() => ({
    width, height, preset, seed, roughness, params: presetParams,
  }), [width, height, preset, seed, roughness, presetParams]);

  const path = useMemo(() => generatePath(config), [config]);

  const fill = paperColor
    ? (PAPER_COLORS[paperColor] || paperColor)
    : PAPER_COLORS.cream;

  const stroke = strokeColor || 'hsl(24, 36%, 35%)';
  const shadowEnabled = presetParams?.shadowEnabled !== false;
  const shadowOffsetX = clampNum(presetParams?.shadowOffsetX ?? 3, -32, 32);
  const shadowOffsetY = clampNum(presetParams?.shadowOffsetY ?? 3, -32, 32);
  const shadowOpacity = clampNum(presetParams?.shadowOpacity ?? 0.2, 0, 1);
  const manualShadowColor = typeof presetParams?.shadowColor === 'string' ? presetParams.shadowColor.trim() : '';
  const paperShadowColor = manualShadowColor || derivePaperShadowColor(fill, stroke);
  const foldTone = presetParams?.foldColor || stroke;
  const foldOpacity = Math.max(0, Math.min(1, presetParams?.foldOpacity ?? 0.34));
  const patternColor = patternParams?.patternColor || 'hsl(25, 12%, 62%)';
  const patternOpacity = Math.max(0.08, Math.min(1, patternParams?.patternOpacity ?? 0.42));
  const lineWidth = Math.max(0.2, patternParams?.lineWidth ?? 0.5);
  const lineGap = Math.max(8, patternParams?.lineGap ?? 20);
  const gridWidth = Math.max(0.2, patternParams?.gridWidth ?? 0.4);
  const gridGap = Math.max(8, patternParams?.gridGap ?? 20);
  const dotSize = Math.max(0.4, patternParams?.dotSize ?? 1);
  const dotGap = Math.max(6, patternParams?.dotGap ?? 16);
  const diagonalWidth = Math.max(0.2, patternParams?.diagonalWidth ?? 0.5);
  const diagonalGap = Math.max(8, patternParams?.diagonalGap ?? 18);
  const waveWidth = Math.max(0.2, patternParams?.waveWidth ?? 0.5);
  const waveGap = Math.max(12, patternParams?.waveGap ?? 24);
  const waveAmplitude = Math.max(1, patternParams?.waveAmplitude ?? 3);

  const tagHole = preset === 'tag' ? getTagHole(width, height, presetParams) : null;
  const foldTriangles = preset === 'folded' ? getFoldTriangles(width, height, presetParams) : [];
  const stitchPath = preset === 'stitched' ? getStitchPath(width, height, presetParams) : null;
  const stitchStroke = presetParams?.stitchColor || stroke;
  const stitchStrokeWidth = Math.max(0.4, presetParams?.stitchWidth ?? 1.2);
  const stitchStyle = Math.max(0, Math.min(3, Math.round(presetParams?.stitchStyle ?? 0)));
  const stitchDasharray = stitchStyle === 2
    ? undefined
    : stitchStyle === 1
      ? `${Math.max(1, stitchStrokeWidth)} ${Math.max(3.2, stitchStrokeWidth * 2.8)}`
      : stitchStyle === 3
        ? `${Math.max(5, stitchStrokeWidth * 4)} ${Math.max(3, stitchStrokeWidth * 2)} ${Math.max(1.2, stitchStrokeWidth)} ${Math.max(3, stitchStrokeWidth * 2)}`
        : generateStitchDashes(0);
  const perforationGuide = useMemo(() => {
    const gap = Math.max(2, presetParams?.perforationGap ?? 10);
    const inset = Math.max(0, presetParams?.perforationInset ?? 7);
    const offset = presetParams?.perforationOffset ?? 0;
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
        axis: 'vertical' as const,
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
        axis: 'horizontal' as const,
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
  }, [
    preset,
    presetParams?.notchRadius,
    presetParams?.cutRadius,
    presetParams?.perforationGap,
    presetParams?.perforationInset,
    presetParams?.perforationOffset,
    presetParams?.couponNotchOffsetX,
    presetParams?.couponPosition,
    presetParams?.ticketCutOffsetY,
    presetParams?.perforationDotRadius,
    presetParams?.perforationMode,
    width,
    height,
  ]);
  const perforationDots = useMemo(() => {
    if (!perforationGuide || perforationGuide.mode !== 1) return [];
    const length = perforationGuide.axis === 'vertical'
      ? Math.abs(perforationGuide.y2 - perforationGuide.y1)
      : Math.abs(perforationGuide.x2 - perforationGuide.x1);
    const steps = Math.max(1, Math.floor(length / perforationGuide.gap));
    const points: Array<{ x: number; y: number; r: number }> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: perforationGuide.x1 + (perforationGuide.x2 - perforationGuide.x1) * t,
        y: perforationGuide.y1 + (perforationGuide.y2 - perforationGuide.y1) * t,
        r: perforationGuide.dotRadius,
      });
    }
    return points;
  }, [perforationGuide]);
  const shouldPunchPerforation = !!perforationGuide && perforationGuide.mode === 1 && strokeWidth > 0.05;
  const shouldFillPerforation = !!perforationGuide && perforationGuide.mode === 1 && !shouldPunchPerforation;
  const perforationMaskDots = shouldPunchPerforation ? perforationDots : [];
  const perforationRingColor = presetParams?.perforationRingColor || stroke;
  const perforationRingWidth = Math.max(0.1, presetParams?.perforationRingWidth ?? Math.max(0.35, strokeWidth * 0.42));
  const cutoutMaskShapes = useMemo(() => {
    const edgeMask = Math.max(0, Math.round(presetParams?.cutoutEdges ?? 0));
    if (edgeMask === 0) return [] as Array<
      | { kind: 'polygon'; points: string }
      | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
      | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number; ry: number }
    >;

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
    const defaultBleedForShape = (shape: number) => (
      shape === 0
        ? Math.max(0.8, strokeWidth * 0.85 + 0.35)
        : Math.max(0.5, strokeWidth * 0.55 + 0.18)
    );

    const shapes: Array<
      | { kind: 'polygon'; points: string }
      | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
      | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number; ry: number }
    > = [];

    const addTop = () => {
      const cutShape = readCutoutEdgeShape(presetParams, 'top', globalCutShape);
      const cutR = Math.max(3, Math.min(maxCutR, readCutoutEdgeNumber(presetParams, 'top', 'radius', globalCutR)));
      const cutDepth = Math.max(1.5, Math.min(maxCutDepth, readCutoutEdgeNumber(presetParams, 'top', 'depth', globalCutDepth)));
      const cutOffset = readCutoutEdgeNumber(presetParams, 'top', 'offset', globalCutOffset);
      const bleed = explicitBleed ?? defaultBleedForShape(cutShape);
      const maskR = cutR + bleed;
      const maskDepth = cutDepth + bleed;
      const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
      const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
      const outer = bleed + 0.4;
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
      const bleed = explicitBleed ?? defaultBleedForShape(cutShape);
      const maskR = cutR + bleed;
      const maskDepth = cutDepth + bleed;
      const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
      const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
      const outer = bleed + 0.4;
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
      const bleed = explicitBleed ?? defaultBleedForShape(cutShape);
      const maskR = cutR + bleed;
      const maskDepth = cutDepth + bleed;
      const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
      const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
      const outer = bleed + 0.4;
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
      const bleed = explicitBleed ?? defaultBleedForShape(cutShape);
      const maskR = cutR + bleed;
      const maskDepth = cutDepth + bleed;
      const cutSkew = clampN(maskR * 0.42, 1, maskR * 0.78);
      const rr = clampN(Math.min(maskR * 0.45, maskDepth * 0.55), 0.8, Math.min(maskR - 0.4, maskDepth - 0.4));
      const outer = bleed + 0.4;
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
  }, [presetParams, strokeWidth, width, height]);
  const cutoutStrokePaths = useMemo(() => {
    const edgeMask = Math.max(0, Math.round(presetParams?.cutoutEdges ?? 0));
    if (edgeMask === 0) return [] as string[];

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
          `M ${topCx - cutR} 0 L ${topCx - cutR} ${cutDepth - rr} ` +
          `Q ${topCx - cutR} ${cutDepth} ${topCx - cutR + rr} ${cutDepth} ` +
          `L ${topCx + cutR - rr} ${cutDepth} ` +
          `Q ${topCx + cutR} ${cutDepth} ${topCx + cutR} ${cutDepth - rr} ` +
          `L ${topCx + cutR} 0`
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
          `M ${width} ${rightCy - cutR} L ${width - cutDepth + rr} ${rightCy - cutR} ` +
          `Q ${width - cutDepth} ${rightCy - cutR} ${width - cutDepth} ${rightCy - cutR + rr} ` +
          `L ${width - cutDepth} ${rightCy + cutR - rr} ` +
          `Q ${width - cutDepth} ${rightCy + cutR} ${width - cutDepth + rr} ${rightCy + cutR} ` +
          `L ${width} ${rightCy + cutR}`
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
          `M ${bottomCx + cutR} ${height} L ${bottomCx + cutR} ${height - cutDepth + rr} ` +
          `Q ${bottomCx + cutR} ${height - cutDepth} ${bottomCx + cutR - rr} ${height - cutDepth} ` +
          `L ${bottomCx - cutR + rr} ${height - cutDepth} ` +
          `Q ${bottomCx - cutR} ${height - cutDepth} ${bottomCx - cutR} ${height - cutDepth + rr} ` +
          `L ${bottomCx - cutR} ${height}`
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
          `M 0 ${leftCy + cutR} L ${cutDepth - rr} ${leftCy + cutR} ` +
          `Q ${cutDepth} ${leftCy + cutR} ${cutDepth} ${leftCy + cutR - rr} ` +
          `L ${cutDepth} ${leftCy - cutR + rr} ` +
          `Q ${cutDepth} ${leftCy - cutR} ${cutDepth - rr} ${leftCy - cutR} ` +
          `L 0 ${leftCy - cutR}`
        );
      } else {
        const apexY = clampN(leftCy - cutSkew, leftCy - cutR + 1, leftCy + cutR - 1);
        paths.push(`M 0 ${leftCy + cutR} L ${cutDepth} ${apexY} L 0 ${leftCy - cutR}`);
      }
    }

    return paths;
  }, [presetParams, width, height]);
  const hasCutoutMask = !!tagHole || perforationMaskDots.length > 0 || cutoutMaskShapes.length > 0;
  const contentSafeInsets = useMemo(() => {
    const insets = { top: 0, right: 0, bottom: 0, left: 0 };
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
        preset === 'coupon' &&
        perforationGuide.axis === 'vertical' &&
        Math.abs(perforationGuide.x1 - width / 2) < width * 0.2
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
  }, [preset, presetParams, perforationGuide, width, height]);

  const padding = useMemo(() => {
    const basePadding = 16;
    const bleed = 8;
    let needed = basePadding;
    for (const deco of decorations) {
      const baseW = deco.type === 'washi-tape' ? 80 : deco.type === 'staple' ? 28 : 24;
      const baseH = deco.type === 'washi-tape' ? 22 : deco.type === 'staple' ? 10 : 24;
      const w = baseW * deco.transform.scale;
      const h = baseH * deco.transform.scale;
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
  }, [decorations, width, height]);
  const svgW = width + padding * 2;
  const svgH = height + padding * 2;
  const decorationTargetRefs = useRef<Record<string, SVGGElement | null>>({});
  const moveableOriginRef = useRef<DecorationTransform | null>(null);
  const [selectedDecorationId, setSelectedDecorationId] = useState<string | null>(null);
  const [selectedDecorationTarget, setSelectedDecorationTarget] = useState<SVGGElement | null>(null);

  const handleDecoChange = useCallback((id: string, t: DecorationTransform) => {
    onDecorationChange?.(id, t);
  }, [onDecorationChange]);

  const handleDecoRemove = useCallback((id: string) => {
    onDecorationRemove?.(id);
  }, [onDecorationRemove]);

  const registerDecorationTarget = useCallback((id: string, node: SVGGElement | null) => {
    decorationTargetRefs.current[id] = node;
    if (id === selectedDecorationId) {
      setSelectedDecorationTarget(node);
    }
  }, [selectedDecorationId]);

  useEffect(() => {
    if (!selectedDecorationId) return;
    if (!decorations.some((d) => d.id === selectedDecorationId)) {
      setSelectedDecorationId(null);
    }
  }, [decorations, selectedDecorationId]);

  useEffect(() => {
    if (!selectedDecorationId) {
      setSelectedDecorationTarget(null);
      return;
    }
    setSelectedDecorationTarget(decorationTargetRefs.current[selectedDecorationId] ?? null);
  }, [selectedDecorationId, decorations]);

  useEffect(() => {
    const activeIds = new Set(decorations.map((d) => d.id));
    Object.keys(decorationTargetRefs.current).forEach((id) => {
      if (!activeIds.has(id)) delete decorationTargetRefs.current[id];
    });
  }, [decorations]);

  useEffect(() => {
    if (!interactiveDecorations || !selectedDecorationId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        handleDecoRemove(selectedDecorationId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDecoRemove, interactiveDecorations, selectedDecorationId]);

  const selectedDecoration = selectedDecorationId
    ? decorations.find((d) => d.id === selectedDecorationId) ?? null
    : null;

  const handleCanvasPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveDecorations) return;
    const target = event.target;
    if (
      target instanceof Element
      && (
        target.closest('[data-decoration-id]')
        || target.closest('.moveable-control-box')
      )
    ) {
      return;
    }
    setSelectedDecorationId(null);
  }, [interactiveDecorations]);

  return (
    <div
      className={cn('relative inline-block', className)}
      style={{ width: svgW, height: svgH, ...style }}
      onPointerDown={handleCanvasPointerDown}
      onClick={onClick}
    >
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        viewBox={`${-padding} ${-padding} ${svgW} ${svgH}`}
        className="absolute inset-0"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>

          {hasCutoutMask && (
            <mask id={maskId}>
              <rect x={-padding} y={-padding} width={svgW} height={svgH} fill="white" />
              {tagHole && (
                <circle cx={tagHole.cx} cy={tagHole.cy} r={tagHole.r} fill="black" />
              )}
              {perforationMaskDots.map((dot, i) => (
                <circle key={`mask-dot-${i}`} cx={dot.x} cy={dot.y} r={dot.r} fill="black" />
              ))}
              {cutoutMaskShapes.map((shape, i) => (
                shape.kind === 'polygon' ? (
                  <polygon key={`mask-cut-${i}`} points={shape.points} fill="black" />
                ) : shape.kind === 'ellipse' ? (
                  <ellipse key={`mask-cut-${i}`} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill="black" />
                ) : (
                  <rect
                    key={`mask-cut-${i}`}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    rx={shape.rx}
                    ry={shape.ry}
                    fill="black"
                  />
                )
              ))}
            </mask>
          )}

          {showPattern && patternType !== 'none' && (
            <pattern
              id={patternId}
              width={patternType === 'dots' ? dotGap : patternType === 'grid' ? gridGap : patternType === 'diagonal' ? diagonalGap : patternType === 'waves' ? waveGap : lineGap}
              height={patternType === 'dots' ? dotGap : patternType === 'grid' ? gridGap : patternType === 'diagonal' ? diagonalGap : patternType === 'waves' ? waveGap : lineGap}
              patternUnits="userSpaceOnUse"
            >
              {patternType === 'lines' && (
                <line x1="0" y1={lineGap} x2={lineGap} y2={lineGap} stroke={patternColor} strokeWidth={lineWidth} opacity={patternOpacity} />
              )}
              {patternType === 'grid' && (
                <>
                  <line x1="0" y1={gridGap} x2={gridGap} y2={gridGap} stroke={patternColor} strokeWidth={gridWidth} opacity={patternOpacity} />
                  <line x1={gridGap} y1="0" x2={gridGap} y2={gridGap} stroke={patternColor} strokeWidth={gridWidth} opacity={patternOpacity} />
                </>
              )}
              {patternType === 'dots' && (
                <circle cx={dotGap / 2} cy={dotGap / 2} r={dotSize} fill={patternColor} opacity={patternOpacity} />
              )}
              {patternType === 'diagonal' && (
                <line x1="0" y1={diagonalGap} x2={diagonalGap} y2="0" stroke={patternColor} strokeWidth={diagonalWidth} opacity={patternOpacity} />
              )}
              {patternType === 'waves' && (
                <path
                  d={`M 0 ${waveGap / 2} Q ${waveGap / 4} ${waveGap / 2 - waveAmplitude} ${waveGap / 2} ${waveGap / 2} Q ${waveGap * 0.75} ${waveGap / 2 + waveAmplitude} ${waveGap} ${waveGap / 2}`}
                  fill="none"
                  stroke={patternColor}
                  strokeWidth={waveWidth}
                  opacity={patternOpacity}
                />
              )}
            </pattern>
          )}
        </defs>

        {/* Shadow layer */}
        {shadowEnabled && shadowOpacity > 0 && (
          <path
            d={path}
            fill={paperShadowColor}
            opacity={shadowOpacity}
            transform={`translate(${shadowOffsetX}, ${shadowOffsetY})`}
            mask={hasCutoutMask ? `url(#${maskId})` : undefined}
          />
        )}

        {/* Fill layer */}
        <path
          d={path}
          fill={fill}
          mask={hasCutoutMask ? `url(#${maskId})` : undefined}
        />

        {/* Pattern overlay */}
        {showPattern && patternType !== 'none' && (
          <path
            d={path}
            fill={`url(#${patternId})`}
            clipPath={`url(#${clipId})`}
            mask={hasCutoutMask ? `url(#${maskId})` : undefined}
          />
        )}

        {/* Perforation guide for tear/cut semantics */}
        {perforationGuide && (
          perforationGuide.mode !== 1 ? (
            <line
              x1={perforationGuide.x1}
              y1={perforationGuide.y1}
              x2={perforationGuide.x2}
              y2={perforationGuide.y2}
              stroke={stroke}
              strokeWidth={strokeWidth > 0 ? Math.max(1, strokeWidth * 0.75) : 0}
              strokeDasharray={`2.5 ${Math.max(3, perforationGuide.gap)}`}
              strokeLinecap="round"
              opacity="0.5"
              clipPath={`url(#${clipId})`}
            />
          ) : shouldFillPerforation ? (
            <>
              {perforationDots.map((dot, i) => (
                <circle
                  key={`perforation-fill-${i}`}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r}
                  fill={perforationRingColor}
                  opacity="0.34"
                  clipPath={`url(#${clipId})`}
                  mask={hasCutoutMask ? `url(#${maskId})` : undefined}
                />
              ))}
            </>
          ) : null
        )}

        {/* Fold triangle overlay */}
        {foldTriangles.length > 0 && (
          <>
            {foldTriangles.map((d, i) => (
              <g key={`fold-${i}`}>
                <path d={d} fill={foldTone} opacity={foldOpacity} />
                <path d={d} fill={fill} opacity={0.22 * (1 - foldOpacity)} />
                <path d={d} fill={foldTone} opacity={0.12 * (1 - foldOpacity)} />
                <path d={d} fill="none" stroke={foldTone} strokeWidth={strokeWidth * 0.7} opacity={0.35 + 0.3 * foldOpacity} />
              </g>
            ))}
          </>
        )}

        {/* Stroke layer */}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          mask={hasCutoutMask ? `url(#${maskId})` : undefined}
        />
        {cutoutStrokePaths.map((d, i) => (
          <path
            key={`cutout-stroke-${i}`}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth > 0 ? strokeWidth + 0.15 : 0}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Perforation hole rings (tag-hole style) */}
        {shouldPunchPerforation && perforationDots.map((dot, i) => (
          <circle
            key={`perforation-ring-${i}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill="none"
            stroke={perforationRingColor}
            strokeWidth={perforationRingWidth}
            opacity="0.48"
            clipPath={`url(#${clipId})`}
          />
        ))}

        {/* Tag hole ring */}
        {tagHole && (
          <circle
            cx={tagHole.cx}
            cy={tagHole.cy}
            r={tagHole.r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth * 0.8}
          />
        )}

        {/* Stitch line */}
        {stitchPath && (
          <path
            d={stitchPath}
            fill="none"
            stroke={stitchStroke}
            strokeWidth={stitchStrokeWidth}
            strokeDasharray={stitchDasharray}
            opacity="0.5"
            strokeLinecap="round"
          />
        )}

        {/* Decorations layer */}
        {decorations.map((deco) => (
          <DraggableDecoration
            key={deco.id}
            item={deco}
            selected={selectedDecorationId === deco.id}
            onSelect={setSelectedDecorationId}
            interactive={interactiveDecorations}
            registerTarget={registerDecorationTarget}
          />
        ))}
      </svg>

      {interactiveDecorations && selectedDecoration && selectedDecorationTarget && (
        <Moveable
          target={selectedDecorationTarget}
          container={svgRef.current?.parentElement ?? undefined}
          rootContainer={svgRef.current?.parentElement ?? undefined}
          origin={false}
          edge={false}
          draggable={true}
          rotatable={true}
          scalable={true}
          keepRatio={true}
          renderDirections={['nw', 'ne', 'sw', 'se']}
          rotationPosition="top"
          throttleDrag={0}
          throttleRotate={0}
          throttleScale={0}
          onDragStart={() => {
            moveableOriginRef.current = selectedDecoration.transform;
          }}
          onDrag={({ beforeTranslate }) => {
            const origin = moveableOriginRef.current ?? selectedDecoration.transform;
            handleDecoChange(selectedDecoration.id, {
              ...origin,
              x: origin.x + beforeTranslate[0],
              y: origin.y + beforeTranslate[1],
            });
          }}
          onDragEnd={() => {
            moveableOriginRef.current = null;
          }}
          onRotateStart={() => {
            moveableOriginRef.current = selectedDecoration.transform;
          }}
          onRotate={({ beforeRotate }) => {
            const origin = moveableOriginRef.current ?? selectedDecoration.transform;
            handleDecoChange(selectedDecoration.id, {
              ...origin,
              rotation: origin.rotation + beforeRotate,
            });
          }}
          onRotateEnd={() => {
            moveableOriginRef.current = null;
          }}
          onScaleStart={({ set }) => {
            moveableOriginRef.current = selectedDecoration.transform;
            set([selectedDecoration.transform.scale, selectedDecoration.transform.scale]);
          }}
          onScale={({ scale }) => {
            const origin = moveableOriginRef.current ?? selectedDecoration.transform;
            const nextScale = Math.max(0.3, Math.min(3, scale[0]));
            handleDecoChange(selectedDecoration.id, {
              ...origin,
              scale: nextScale,
            });
          }}
          onScaleEnd={() => {
            moveableOriginRef.current = null;
          }}
        />
      )}

      {/* Content overlay */}
      {children && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            paddingTop: `${padding + contentPadding + contentSafeInsets.top}px`,
            paddingRight: `${padding + contentPadding + contentSafeInsets.right}px`,
            paddingBottom: `${padding + contentPadding + contentSafeInsets.bottom}px`,
            paddingLeft: `${padding + contentPadding + contentSafeInsets.left}px`,
            pointerEvents: contentInteractive ? 'auto' : (interactiveDecorations ? 'none' : 'auto'),
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default PaperShape;
